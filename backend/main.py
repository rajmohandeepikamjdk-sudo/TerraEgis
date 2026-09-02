"""
TerrAegis FastAPI Backend
Routes:
  POST /api/analyze                  → Full pipeline: candidates + scores + layers
  GET  /api/sectors/{id}/report      → Dynamic zero-hallucination sector report object
  POST /api/sectors/compare          → Side-by-side comparative matrix of selected sectors
  GET  /api/layers/{name}            → GeoJSON for a specific layer overlay
  GET  /api/health                   → Health check
"""

import time
import math
import asyncio
import requests
from typing import Optional, List

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from gis_data import (
    KNOWN_AREAS,
    resolve_study_area,
    generate_candidate_sites,
    generate_region_layers,
)
from scoring import rank_candidates, AHP_WEIGHTS, PROJECT_LABELS, CRITERION_META
from report_builder import build_sector_report_object

# ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="TerrAegis API",
    description="AI-GIS Driven Government Project Site Suitability & Recommendation System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────────
# REQUEST / RESPONSE MODELS
# ──────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    area: str
    acres: float
    project: str          # e.g. "airport"


class CompareRequest(BaseModel):
    sector_ids: List[str]
    area: str = "Parandur, Kanchipuram"
    acres: float = 5000.0
    project: str = "airport"


# ──────────────────────────────────────────────────────────────
# GeoJSON HELPERS
# ──────────────────────────────────────────────────────────────

def polygon_feature(coords, properties=None):
    return {
        "type": "Feature",
        "geometry": {"type": "Polygon", "coordinates": [coords]},
        "properties": properties or {},
    }


def linestring_feature(coords, properties=None):
    return {
        "type": "Feature",
        "geometry": {"type": "LineString", "coordinates": coords},
        "properties": properties or {},
    }


def point_feature(lon, lat, properties=None):
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
        "properties": properties or {},
    }


def feature_collection(features):
    return {"type": "FeatureCollection", "features": features}


# ──────────────────────────────────────────────────────────────
# LAYER BUILDERS
# ──────────────────────────────────────────────────────────────

def build_roads_geojson():
    features = []
    for r in ROADS:
        features.append(linestring_feature(
            [[c[0], c[1]] for c in r["coords"]],
            {"id": r["id"], "name": r["name"], "type": r["type"]},
        ))
    return feature_collection(features)


def build_villages_geojson():
    features = []
    for v in VILLAGES:
        features.append(point_feature(
            v["lon"], v["lat"],
            {"name": v["name"], "population": v["population"], "type": v["type"]},
        ))
    return feature_collection(features)


def build_water_geojson():
    features = []
    for w in WATER_BODIES:
        if "polygon" in w:
            features.append(polygon_feature(
                w["polygon"],
                {"id": w["id"], "name": w["name"], "type": w["type"]},
            ))
        if "linestring" in w:
            features.append(linestring_feature(
                w["linestring"],
                {"id": w["id"], "name": w["name"], "type": w.get("type", "canal")},
            ))
    return feature_collection(features)


def build_forests_geojson():
    features = [
        polygon_feature(f["polygon"], {"id": f["id"], "name": f["name"], "type": f["type"]})
        for f in FORESTS
    ]
    return feature_collection(features)


def build_wetlands_geojson():
    features = [
        polygon_feature(w["polygon"], {"id": w["id"], "name": w["name"]})
        for w in WETLANDS
    ]
    return feature_collection(features)


def build_flood_zones_geojson():
    features = [
        polygon_feature(f["polygon"], {"id": f["id"], "name": f["name"], "risk": f["risk"]})
        for f in FLOOD_ZONES
    ]
    return feature_collection(features)


def build_wildlife_geojson():
    features = [
        polygon_feature(w["polygon"], {"id": w["id"], "name": w["name"]})
        for w in WILDLIFE_AREAS
    ]
    return feature_collection(features)


def build_candidates_geojson(ranked_candidates):
    features = []
    for c in ranked_candidates:
        features.append(polygon_feature(
            c["polygon"],
            {
                "id": c["id"],
                "name": c["name"],
                "desc": c["desc"],
                "rank": c["rank"],
                "score": c["final_score"],
                "suitability": c["suitability"],
                "color": c["color"],
            },
        ))
    return feature_collection(features)


# ──────────────────────────────────────────────────────────────
# ANALYSIS PIPELINE STEPS
# ──────────────────────────────────────────────────────────────

ANALYSIS_STEPS = [
    "Locating study area boundary",
    "Loading candidate site polygons",
    "Fetching spatial reference layers",
    "Computing population impact (5 km buffer)",
    "Measuring transport connectivity",
    "Analysing flood & disaster zones",
    "Evaluating water resource impact",
    "Checking forest & wildlife overlap",
    "Retrieving land ownership data",
    "Calculating AHP suitability scores",
    "Ranking candidate locations",
    "Generating site explanations",
]


# ──────────────────────────────────────────────────────────────
# ROUTES
# ──────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "TerrAegis API v1.0"}


@app.get("/api/project-types")
def project_types():
    """Return all supported project types and their AHP weights."""
    return {
        "types": [
            {
                "id": k,
                "label": PROJECT_LABELS[k],
                "weights": {
                    c: {"pct": round(w * 100), "label": CRITERION_META[c]["label"]}
                    for c, w in v.items()
                },
            }
            for k, v in AHP_WEIGHTS.items()
        ]
    }


@app.get("/api/study-area")
def study_area():
    """Return study area metadata and bounds."""
    return STUDY_AREA


@app.get("/api/layers/{layer_name}")
def get_layer(layer_name: str):
    """Return a named GIS layer as GeoJSON FeatureCollection."""
    builders = {
        "roads":       build_roads_geojson,
        "villages":    build_villages_geojson,
        "water":       build_water_geojson,
        "forests":     build_forests_geojson,
        "wetlands":    build_wetlands_geojson,
        "flood_zones": build_flood_zones_geojson,
        "wildlife":    build_wildlife_geojson,
    }
    if layer_name not in builders:
        raise HTTPException(
            status_code=404,
            detail=f"Layer '{layer_name}' not found. Available: {list(builders.keys())}",
        )
    return builders[layer_name]()


@app.post("/api/analyze")
def analyze(req: AnalyzeRequest):
    """
    Full analysis pipeline:
      1. Dynamically resolve study area from the requested location
      2. Generate candidate site polygons for that region
      3. Score all candidate sites via AHP
      4. Rank candidates
      5. Build all GeoJSON layers for that region
      6. Return ranked results + layers + explanation
    """
    t_start = time.time()

    # ── 1. Resolve the study area dynamically for ANY input location ──
    study_area = resolve_study_area(req.area)

    area_lower = req.area.lower().strip()
    area_recognized = any(k in area_lower for k in KNOWN_AREAS)

    project_type = req.project.lower().replace(" ", "_")
    if project_type not in AHP_WEIGHTS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown project type '{req.project}'. Supported: {list(AHP_WEIGHTS.keys())}",
        )

    # ── 2. Generate candidate parcels for this specific region ──
    candidate_sites = generate_candidate_sites(study_area, req.acres)

    min_acres = req.acres * 0.90
    eligible = [s for s in candidate_sites if s["area_acres"] >= min_acres]
    if not eligible:
        eligible = candidate_sites

    ranked = rank_candidates(eligible, project_type)
    candidates_geojson = build_candidates_geojson(ranked)
    winner = ranked[0]
    from datetime import datetime
    analysis_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")

    # ── 3. Build region-specific GIS overlay layers ──
    region_layers = generate_region_layers(study_area, ranked)

    # Pre-generate detailed report objects for each candidate
    reports_map = {}
    for c in ranked:
        rep = build_sector_report_object(c["id"], project_type, req.area, req.acres, analysis_timestamp)
        if rep:
            reports_map[c["id"]] = rep

    elapsed_ms = round((time.time() - t_start) * 1000)

    return {
        "analysis_timestamp": analysis_timestamp,
        "area": req.area,
        "project": PROJECT_LABELS.get(project_type, req.project),
        "project_type": project_type,
        "acres_requested": req.acres,
        "area_recognized": area_recognized,
        "candidate_count": len(ranked),
        "analysis_steps": ANALYSIS_STEPS,
        "elapsed_ms": elapsed_ms,
        "candidates": [
            {
                "id": c["id"],
                "name": c["name"],
                "desc": c["desc"],
                "rank": c["rank"],
                "score": c["final_score"],
                "suitability": c["suitability"],
                "color": c["color"],
                "centroid": c["centroid"],
                "area_acres": c["area_acres"],
                "features": c["features"],
                "criterion_scores": c["criterion_scores"],
                "reasons": c["reasons"],
                "contributions": c["contributions"],
                "report": reports_map.get(c["id"]),
            }
            for c in ranked
        ],
        "best": {
            "id": winner["id"],
            "name": winner["name"],
            "score": winner["final_score"],
            "suitability": winner["suitability"],
        },
        "layers": {
            "candidates": candidates_geojson,
            "roads":       region_layers["roads"],
            "villages":    region_layers["villages"],
            "water":       region_layers["water"],
            "forests":     region_layers["forests"],
            "wetlands":    {"type": "FeatureCollection", "features": []},
            "flood_zones": region_layers["flood_zones"],
            "wildlife":    region_layers["wildlife"],
        },
        "ahp_weights": AHP_WEIGHTS[project_type],
        "study_area": study_area,
    }


@app.get("/api/sectors/{sector_id}/report")
def get_sector_report(
    sector_id: str,
    project: str = Query("airport"),
    area: str = Query("Parandur, Kanchipuram"),
    acres: float = Query(5000.0),
):
    """
    Dedicated endpoint returning the dynamic zero-hallucination report for a sector.
    """
    project_type = project.lower().replace(" ", "_")
    report = build_sector_report_object(sector_id.upper(), project_type, area, acres)
    if not report:
        raise HTTPException(
            status_code=404,
            detail=f"Sector '{sector_id}' not found.",
        )
    return report


@app.post("/api/sectors/compare")
def compare_sectors(req: CompareRequest):
    """
    Returns side-by-side comparative report metrics for selected candidate sector IDs.
    """
    project_type = req.project.lower().replace(" ", "_")
    reports = []
    for sid in req.sector_ids:
        rep = build_sector_report_object(sid.upper(), project_type, req.area, req.acres)
        if rep:
            reports.append(rep)

    if not reports:
        raise HTTPException(status_code=400, detail="No valid sector IDs provided.")

    # Sort reports by rank
    reports.sort(key=lambda r: r["rank"])
    winner = reports[0]

    # Generate explicit why rank #1 text based on actual score differentials
    why_winner_text = (
        f"{winner['sectorName']} ranked #1 among compared sectors with a score of {winner['overallScore']}/100. "
        f"Key drivers: {winner['spatialMetrics']['govtLandPct']}% government-owned land availability, "
        f"only {winner['spatialMetrics']['distHighwayKm']} km to highway corridor, "
        f"and {winner['spatialMetrics']['floodZoneOverlapPct']}% flood exposure."
    )

    return {
        "compared_count": len(reports),
        "project": PROJECT_LABELS.get(project_type, req.project),
        "target_region": req.area,
        "acres_requested": req.acres,
        "winner": winner,
        "why_winner": why_winner_text,
        "sectors": reports,
    }


# ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

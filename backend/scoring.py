"""
TerrAegis Scoring Engine
Implements AHP (Analytic Hierarchy Process) for 6 project types.
Converts raw GIS features → 0-10 criterion scores → weighted 0-100 suitability score.
"""

# ──────────────────────────────────────────────────────────────
# AHP WEIGHT MATRICES  (must sum to 1.0 per project type)
# ──────────────────────────────────────────────────────────────

AHP_WEIGHTS = {
    "airport": {
        "population": 0.20,
        "transport":  0.15,
        "disaster":   0.15,
        "water":      0.10,
        "forest":     0.10,
        "wildlife":   0.10,
        "land":       0.10,
        "benefits":   0.05,
        "interproject": 0.05,
    },
    "highway": {
        "transport":  0.20,
        "population": 0.15,
        "land":       0.15,
        "disaster":   0.10,
        "water":      0.10,
        "benefits":   0.10,
        "forest":     0.10,
        "wildlife":   0.05,
        "interproject": 0.05,
    },
    "industrial_park": {
        "land":       0.20,
        "transport":  0.20,
        "benefits":   0.15,
        "population": 0.10,
        "disaster":   0.10,
        "water":      0.10,
        "forest":     0.05,
        "wildlife":   0.05,
        "interproject": 0.05,
    },
    "railway": {
        "transport":  0.20,
        "land":       0.15,
        "population": 0.15,
        "disaster":   0.15,
        "water":      0.10,
        "benefits":   0.10,
        "forest":     0.05,
        "wildlife":   0.05,
        "interproject": 0.05,
    },
    "power_plant": {
        "water":      0.20,
        "disaster":   0.20,
        "transport":  0.15,
        "land":       0.15,
        "population": 0.10,
        "forest":     0.05,
        "wildlife":   0.05,
        "benefits":   0.05,
        "interproject": 0.05,
    },
    "port": {
        "water":      0.25,
        "transport":  0.20,
        "land":       0.15,
        "disaster":   0.10,
        "population": 0.10,
        "benefits":   0.10,
        "forest":     0.05,
        "wildlife":   0.05,
        "interproject": 0.00,
    },
}

# Human-readable project type names
PROJECT_LABELS = {
    "airport":        "Airport",
    "highway":        "Highway",
    "industrial_park": "Industrial Park",
    "railway":        "Railway",
    "power_plant":    "Power Plant",
    "port":           "Port",
}

# Criteria that are INVERTED for port (water proximity = GOOD)
PORT_INVERTED_CRITERIA = {"water"}


# ──────────────────────────────────────────────────────────────
# CRITERION SCORE FUNCTIONS  (return 0.0–10.0)
# ──────────────────────────────────────────────────────────────

def score_population(villages_5km: int) -> float:
    """Fewer villages within 5 km = less displacement = higher suitability."""
    if villages_5km == 0:     return 10.0
    elif villages_5km <= 2:   return 9.0
    elif villages_5km <= 4:   return 8.0
    elif villages_5km <= 6:   return 6.5
    elif villages_5km <= 8:   return 5.0
    else:                     return 3.0


def score_transport(dist_highway_km: float) -> float:
    """Closer to a national/state highway = better connectivity = higher score."""
    if dist_highway_km < 1:   return 10.0
    elif dist_highway_km < 2: return 9.0
    elif dist_highway_km < 5: return 7.5
    elif dist_highway_km < 10: return 6.0
    elif dist_highway_km < 20: return 4.0
    else:                     return 2.0


def score_disaster(flood_pct: float) -> float:
    """Less flood zone overlap = lower disaster risk = higher score."""
    if flood_pct == 0:        return 9.5
    elif flood_pct <= 10:     return 8.0
    elif flood_pct <= 25:     return 6.0
    elif flood_pct <= 50:     return 4.0
    else:                     return 2.0


def score_water(water_overlap_pct: float, dist_water_km: float) -> float:
    """
    Standard (non-port): less water overlap + reasonable buffer from water = safer.
    Port projects override this with score_water_port().
    """
    if water_overlap_pct > 10:   return 2.0
    elif water_overlap_pct > 5:  return 4.0
    elif water_overlap_pct > 0:  return 6.0
    # No overlap — score by proximity (want some buffer from rivers/lakes)
    if dist_water_km > 3:        return 9.0
    elif dist_water_km > 2:      return 8.0
    elif dist_water_km > 1:      return 7.0
    else:                        return 5.0


def score_water_port(water_overlap_pct: float, dist_water_km: float) -> float:
    """For ports: water proximity / overlap is GOOD (port needs a waterway)."""
    if water_overlap_pct > 20:   return 10.0
    elif water_overlap_pct > 10: return 8.0
    elif water_overlap_pct > 0:  return 6.0
    if dist_water_km < 1:        return 5.0
    elif dist_water_km < 3:      return 3.5
    elif dist_water_km < 5:      return 2.0
    else:                        return 1.0


def score_forest(forest_pct: float) -> float:
    """Less forest cleared = lower ecological damage = higher score."""
    if forest_pct < 1:    return 9.5
    elif forest_pct < 5:  return 8.0
    elif forest_pct < 15: return 6.0
    elif forest_pct < 30: return 4.0
    else:                 return 2.0


def score_wildlife(dist_wildlife_km: float) -> float:
    """Further from wildlife sanctuaries/corridors = less impact = higher score."""
    if dist_wildlife_km > 20:  return 10.0
    elif dist_wildlife_km > 10: return 9.0
    elif dist_wildlife_km > 5:  return 7.0
    elif dist_wildlife_km > 2:  return 5.0
    else:                      return 2.0


def score_land(govt_land_pct: float) -> float:
    """More government land = less private acquisition needed = higher score."""
    if govt_land_pct >= 80:   return 9.0
    elif govt_land_pct >= 70: return 8.0
    elif govt_land_pct >= 60: return 7.0
    elif govt_land_pct >= 50: return 6.0
    elif govt_land_pct >= 40: return 5.0
    elif govt_land_pct >= 30: return 3.0
    else:                     return 2.0


def score_benefits(pop_10km: int) -> float:
    """Larger nearby population = more local employment potential."""
    if pop_10km > 100_000:  return 9.5
    elif pop_10km > 50_000: return 8.5
    elif pop_10km > 30_000: return 7.5
    elif pop_10km > 20_000: return 6.5
    elif pop_10km > 10_000: return 5.5
    else:                   return 4.0


def score_interproject(infra_conflicts: int) -> float:
    """Fewer conflicts with existing infrastructure = lower disruption."""
    if infra_conflicts == 0:   return 9.0
    elif infra_conflicts == 1: return 7.0
    elif infra_conflicts == 2: return 5.0
    else:                      return 3.0


# ──────────────────────────────────────────────────────────────
# CRITERION LABEL METADATA
# ──────────────────────────────────────────────────────────────

CRITERION_META = {
    "population":   {"label": "Population Impact",      "icon": "👥"},
    "transport":    {"label": "Transport Connectivity",  "icon": "🛣️"},
    "disaster":     {"label": "Disaster Risk",           "icon": "🌊"},
    "water":        {"label": "Water Resources",         "icon": "💧"},
    "forest":       {"label": "Forest & Ecology",        "icon": "🌿"},
    "wildlife":     {"label": "Wildlife Sensitivity",    "icon": "🦚"},
    "land":         {"label": "Land Ownership",          "icon": "📋"},
    "benefits":     {"label": "Local Benefits",          "icon": "💼"},
    "interproject": {"label": "Inter-project Impact",    "icon": "⚙️"},
}


# ──────────────────────────────────────────────────────────────
# CORE SCORING PIPELINE
# ──────────────────────────────────────────────────────────────

def compute_criterion_scores(features: dict, project_type: str) -> dict:
    """Convert raw GIS features → 0-10 criterion scores."""
    is_port = (project_type == "port")
    water_fn = score_water_port if is_port else score_water

    return {
        "population":   score_population(features["villages_5km"]),
        "transport":    score_transport(features["dist_highway_km"]),
        "disaster":     score_disaster(features["flood_pct"]),
        "water":        water_fn(features["water_overlap_pct"], features["dist_water_km"]),
        "forest":       score_forest(features["forest_pct"]),
        "wildlife":     score_wildlife(features["dist_wildlife_km"]),
        "land":         score_land(features["govt_land_pct"]),
        "benefits":     score_benefits(features["pop_10km"]),
        "interproject": score_interproject(features["infra_conflicts"]),
    }


def compute_ahp_score(criterion_scores: dict, project_type: str) -> float:
    """Apply AHP weights → weighted sum → final 0-100 score."""
    weights = AHP_WEIGHTS.get(project_type, AHP_WEIGHTS["airport"])
    weighted_sum = sum(
        criterion_scores[c] * weights.get(c, 0.0)
        for c in criterion_scores
    )
    return round(weighted_sum * 10, 1)   # 0-10 → 0-100


def suitability_label(score: float) -> str:
    if score >= 85:   return "Highly Suitable"
    elif score >= 75: return "Suitable"
    elif score >= 65: return "Conditionally Suitable"
    elif score >= 55: return "Marginal"
    else:             return "Unsuitable"


def score_color(score: float) -> str:
    if score >= 85:   return "#22c55e"
    elif score >= 75: return "#86efac"
    elif score >= 65: return "#fde047"
    elif score >= 55: return "#fb923c"
    else:             return "#ef4444"


# ──────────────────────────────────────────────────────────────
# REASON GENERATION  (WHY blocks)
# ──────────────────────────────────────────────────────────────

def _flag(score: float, good_threshold=7.5, warn_threshold=5.5) -> str:
    if score >= good_threshold:   return "good"
    elif score >= warn_threshold: return "warn"
    else:                         return "bad"


REASON_TEMPLATES = {
    "population": {
        "good": lambda f: f"{f['villages_5km']} villages within 5 km – low displacement risk",
        "warn": lambda f: f"{f['villages_5km']} villages within 5 km – moderate resettlement expected",
        "bad":  lambda f: f"{f['villages_5km']} villages within 5 km – high community displacement risk",
    },
    "transport": {
        "good": lambda f: f"Highway access: {f['dist_highway_km']:.1f} km to nearest NH/SH",
        "warn": lambda f: f"Moderate highway access: {f['dist_highway_km']:.1f} km to nearest highway",
        "bad":  lambda f: f"Poor connectivity: {f['dist_highway_km']:.1f} km to nearest highway",
    },
    "disaster": {
        "good": lambda f: "No flood zone overlap – low disaster risk",
        "warn": lambda f: f"{f['flood_pct']:.0f}% within flood zone – moderate risk",
        "bad":  lambda f: f"{f['flood_pct']:.0f}% within flood zone – high inundation risk",
    },
    "water": {
        "good": lambda f: (
            f"No water body overlap; nearest at {f['dist_water_km']:.1f} km"
            if f["water_overlap_pct"] == 0 else
            f"{f['water_overlap_pct']:.0f}% water overlap – managed risk"
        ),
        "warn": lambda f: f"{f['water_overlap_pct']:.0f}% water body overlap – drainage engineering needed",
        "bad":  lambda f: f"{f['water_overlap_pct']:.0f}% water body overlap – significant hydrological impact",
    },
    "forest": {
        "good": lambda f: "No reserved forest or protected forest overlap",
        "warn": lambda f: f"{f['forest_pct']:.0f}% forest overlap – partial tree felling required",
        "bad":  lambda f: f"{f['forest_pct']:.0f}% reserved forest overlap – major ecological violation",
    },
    "wildlife": {
        "good": lambda f: f"Wildlife-sensitive area {f['dist_wildlife_km']:.0f} km away – minimal impact",
        "warn": lambda f: f"Wildlife corridor within {f['dist_wildlife_km']:.0f} km – migration study required",
        "bad":  lambda f: f"Wildlife zone only {f['dist_wildlife_km']:.0f} km away – significant ecological risk",
    },
    "land": {
        "good": lambda f: f"{f['govt_land_pct']}% government-owned land – minimal private acquisition",
        "warn": lambda f: f"{f['govt_land_pct']}% govt land ({f['private_land_pct']}% private acquisition needed)",
        "bad":  lambda f: f"Only {f['govt_land_pct']}% govt land – extensive private acquisition required",
    },
    "benefits": {
        "good": lambda f: f"{f['pop_10km']:,} people within 10 km – strong employment potential",
        "warn": lambda f: f"{f['pop_10km']:,} people within 10 km – moderate local benefits",
        "bad":  lambda f: f"Only {f['pop_10km']:,} people within 10 km – limited local employment",
    },
    "interproject": {
        "good": lambda f: "No conflicts with existing road/rail/utility infrastructure",
        "warn": lambda f: f"{f['infra_conflicts']} infrastructure conflict(s) – rerouting possible",
        "bad":  lambda f: f"{f['infra_conflicts']} infrastructure conflicts – significant rerouting required",
    },
}


def generate_reasons(criterion_scores: dict, features: dict) -> list:
    """Generate human-readable reason strings with good/warn/bad flags."""
    reasons = []
    for criterion, score in criterion_scores.items():
        flag = _flag(score)
        template = REASON_TEMPLATES.get(criterion, {}).get(flag)
        if template:
            reasons.append({
                "criterion": criterion,
                "label": CRITERION_META[criterion]["label"],
                "icon":  CRITERION_META[criterion]["icon"],
                "type": flag,
                "score": score,
                "text": template(features),
            })
    # Sort: good first, then warn, then bad
    order = {"good": 0, "warn": 1, "bad": 2}
    reasons.sort(key=lambda r: order[r["type"]])
    return reasons


# ──────────────────────────────────────────────────────────────
# AHP CONTRIBUTION BREAKDOWN  (for explainability chart)
# ──────────────────────────────────────────────────────────────

def compute_contributions(criterion_scores: dict, project_type: str) -> list:
    """Return per-criterion contribution to final score (out of 100)."""
    weights = AHP_WEIGHTS.get(project_type, AHP_WEIGHTS["airport"])
    contribs = []
    for criterion, score in criterion_scores.items():
        w = weights.get(criterion, 0.0)
        contribs.append({
            "criterion": criterion,
            "label": CRITERION_META[criterion]["label"],
            "icon":  CRITERION_META[criterion]["icon"],
            "score": score,
            "weight_pct": round(w * 100),
            "contribution": round(score * w * 10, 2),
        })
    contribs.sort(key=lambda x: -x["contribution"])
    return contribs


# ──────────────────────────────────────────────────────────────
# FULL CANDIDATE SCORING
# ──────────────────────────────────────────────────────────────

def score_candidate(site: dict, project_type: str) -> dict:
    """Score a single candidate site for a given project type."""
    features = site["features"]
    criterion_scores = compute_criterion_scores(features, project_type)
    final_score = compute_ahp_score(criterion_scores, project_type)
    return {
        "id": site["id"],
        "name": site["name"],
        "desc": site["desc"],
        "polygon": site["polygon"],
        "centroid": site["centroid"],
        "area_acres": site["area_acres"],
        "features": features,
        "criterion_scores": criterion_scores,
        "final_score": final_score,
        "suitability": suitability_label(final_score),
        "color": score_color(final_score),
        "reasons": generate_reasons(criterion_scores, features),
        "contributions": compute_contributions(criterion_scores, project_type),
    }


def rank_candidates(sites: list, project_type: str) -> list:
    """Score and rank all candidate sites. Returns sorted list (best first)."""
    scored = [score_candidate(s, project_type) for s in sites]
    scored.sort(key=lambda x: -x["final_score"])
    for i, s in enumerate(scored):
        s["rank"] = i + 1
    return scored

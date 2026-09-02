import sys
import os
import time
import pandas as pd
import streamlit as st
import folium
from streamlit_folium import st_folium

# Add backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from gis_data import (
    KNOWN_AREAS,
    resolve_study_area,
    generate_candidate_sites,
    generate_region_layers,
)
from scoring import rank_candidates, AHP_WEIGHTS, PROJECT_LABELS, CRITERION_META
from report_builder import build_sector_report_object

st.set_page_config(
    page_title="TerrAegis — AI-GIS Site Suitability",
    page_icon="🌍",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.title("🌍 TerrAegis — AI-GIS Project Site Suitability System")
st.caption("Government Infrastructure Decision Support & Multi-Criteria Site Recommendation")

# ── SIDEBAR INPUTS ──
st.sidebar.header("📋 Project Parameters")

area_input = st.sidebar.text_input(
    "Target Location / Region",
    value="Parandur, Kanchipuram",
    help="Enter any location name (e.g. Parandur, Hosur, Ennore, Coimbatore)"
)

acres_input = st.sidebar.number_input(
    "Required Area (Acres)",
    min_value=10.0,
    max_value=50000.0,
    value=5000.0,
    step=500.0
)

project_type_keys = list(AHP_WEIGHTS.keys())
project_type_labels = [PROJECT_LABELS[k] for k in project_type_keys]
project_selected_label = st.sidebar.selectbox(
    "Infrastructure Project Type",
    options=project_type_labels,
    index=0
)

project_type = project_type_keys[project_type_labels.index(project_selected_label)]

st.sidebar.markdown("---")
st.sidebar.subheader("⚖️ AHP Criterion Weights")
for crit, weight in AHP_WEIGHTS[project_type].items():
    meta = CRITERION_META.get(crit, {"label": crit, "icon": "🔹"})
    st.sidebar.write(f"{meta['icon']} **{meta['label']}**: `{int(weight * 100)}%`")

# ── RUN ANALYSIS ──
if st.sidebar.button("⚡ Run Geospatial Suitability Analysis", type="primary", use_container_width=True):
    st.session_state["run_analysis"] = True

# Execute initial analysis automatically or on button click
study_area = resolve_study_area(area_input)
candidate_sites = generate_candidate_sites(study_area, acres_input)
min_acres = acres_input * 0.90
eligible = [s for s in candidate_sites if s["area_acres"] >= min_acres] or candidate_sites
ranked_candidates = rank_candidates(eligible, project_type)
winner = ranked_candidates[0]

region_layers = generate_region_layers(study_area, ranked_candidates)

# ── TOP SUMMARY METRICS ──
col1, col2, col3, col4 = st.columns(4)
with col1:
    st.metric("Top Recommended Site", winner["name"], f"Score: {winner['final_score']}/100")
with col2:
    st.metric("Suitability Rating", winner["suitability"])
with col3:
    st.metric("Total Candidates Evaluated", len(ranked_candidates))
with col4:
    st.metric("Govt Land Share", f"{winner['features']['govt_land_pct']}%")

st.markdown("---")

# ── MAIN LAYOUT: MAP + RANKINGS ──
tab_map, tab_comparison, tab_xai = st.tabs(["🗺️ Geospatial Map View", "📊 Candidate Rankings & Comparison", "🧠 Explainable AI (XAI) Report"])

with tab_map:
    st.subheader("Geospatial Map & Feature Layers")
    
    # Initialize Folium Map centered on study area
    center_lon, center_lat = study_area["center"]
    m = folium.Map(
        location=[center_lat, center_lon],
        zoom_start=study_area.get("zoom", 11),
        tiles="CartoDB dark_matter"
    )
    
    # Render candidate polygons
    for c in ranked_candidates:
        color = c["color"]
        is_best = (c["id"] == winner["id"])
        
        # Convert polygon coords [lon, lat] -> [lat, lon]
        folium_coords = [[pt[1], pt[0]] for pt in c["polygon"]]
        
        tooltip_txt = f"{c['name']} (Rank #{c['rank']} - Score: {c['final_score']})"
        popup_html = f"""
        <div style="font-family:sans-serif; width:200px;">
            <h4>{c['name']}</h4>
            <p><b>Rank:</b> #{c['rank']}</p>
            <p><b>Score:</b> {c['final_score']}/100 ({c['suitability']})</p>
            <p><b>Govt Land:</b> {c['features']['govt_land_pct']}%</p>
            <p><b>Highway:</b> {c['features']['dist_highway_km']} km</p>
        </div>
        """
        
        folium.Polygon(
            locations=folium_coords,
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.5 if is_best else 0.3,
            weight=3 if is_best else 1.5,
            tooltip=tooltip_txt,
            popup=popup_html
        ).add_to(m)

    st_folium(m, width="100%", height=500)

with tab_comparison:
    st.subheader("Candidate Site Comparison Matrix")
    
    df_data = []
    for c in ranked_candidates:
        df_data.append({
            "Rank": f"#{c['rank']}",
            "Sector Name": c["name"],
            "Score": c["final_score"],
            "Suitability": c["suitability"],
            "Govt Land (%)": c["features"]["govt_land_pct"],
            "Dist to Highway (km)": c["features"]["dist_highway_km"],
            "Flood Risk (%)": c["features"]["flood_pct"],
            "Villages within 5km": c["features"]["villages_5km"],
        })
    
    df = pd.DataFrame(df_data)
    st.dataframe(df, use_container_width=True)

with tab_xai:
    st.subheader(f"Explainable AI Decision Breakdown: {winner['name']}")
    
    col_reasons, col_contrib = st.columns(2)
    
    with col_reasons:
        st.write("### 📌 Why this site was selected:")
        for r in winner["reasons"]:
            icon = "✅" if r["type"] == "good" else ("⚠️" if r["type"] == "warn" else "❌")
            st.markdown(f"{icon} **{r['label']}**: {r['text']}")
            
    with col_contrib:
        st.write("### 📈 Criteria Score Breakdown:")
        contrib_df = pd.DataFrame([
            {
                "Criterion": f"{c['icon']} {c['label']}",
                "Score (0-10)": c["score"],
                "Weight (%)": f"{c['weight_pct']}%",
                "Point Contribution": c["contribution"]
            }
            for c in winner["contributions"]
        ])
        st.table(contrib_df)

st.markdown("---")
st.caption("TerrAegis Platform © 2026 — Government GIS Suitability Decision Engine")

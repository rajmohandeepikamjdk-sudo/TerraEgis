# 🌍 TerrAegis — AI-GIS Driven Government Project Site Suitability & Recommendation System

TerrAegis is an intelligent geospatial decision-support platform designed for government infrastructure planners (e.g., airports, highways, industrial parks, railways, power plants, and ports). It analyzes candidate sites against multi-criteria geographic, environmental, social, and infrastructural constraints before capital allocation.

---

## 🚀 Key Features

1. **Multi-Source Geospatial Integration**:
   - **TNGIS** (Tamil Nadu Geographical Information System) datasets for reserve forests, water bodies, and revenue land parcels.
   - **OpenStreetMap (OSM)** for real-time transit networks, major highways, and settlement nodes.
   - **SRTM DEM** hydrological models for flood exposure analysis.

2. **10 Predefined Multi-Criteria Constraints**:
   - 👥 **Population & Settlements** (5 km buffer displacement risk)
   - 🛣️ **Transport Connectivity** (Distance to NH/SH transit corridors)
   - 🌊 **Disaster Risk** (DEM flood zone exposure & drainage slopes)
   - 💧 **Water Resources** (Palar river, reservoirs, irrigation tanks & canal buffers)
   - 🌿 **Forest & Ecology** (Reserve forest & protected scrubland clearances)
   - 🦚 **Wildlife Sensitivity** (Sanctuary & wildlife corridor proximity)
   - 📋 **Land Ownership** (Government vs. private land acquisition percentage)
   - 💼 **Local Socio-economic Benefits** (10 km population employment catchment)
   - ⚙️ **Inter-project Conflicts** (Power line, rail, and infrastructure intersections)

3. **Multi-Criteria AHP Scoring Engine**:
   - Analytic Hierarchy Process matrices customized per project type.
   - Feature normalization from raw spatial measurements to calibrated 0–10 criterion scores.
   - 0–100 overall suitability ranking.

4. **Explainable AI (XAI)**:
   - Identifies the highest-ranked location and clearly explains **WHY** it was chosen.
   - Analyzes why alternative candidate sites lost (e.g., private land acquisition overheads, ecological violations, or flood inundation).
   - Interactive radar fingerprinting and exact point contribution breakdowns.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Leaflet.js, React-Leaflet, Chart.js, React-Chartjs-2
- **UI Design**: Modern Dark Command Center Theme (Outfit & Inter fonts, Glassmorphism, Neon Accents)
- **Backend**: Python, FastAPI, Uvicorn, Shapely, Requests
- **Data Engine**: GeoJSON Spatial Features, AHP Weight Normalizer

---

## ⚡ Quickstart

### 1. Start the FastAPI Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*Backend runs on `http://127.0.0.1:8000`*

### 2. Start the React Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 📊 Demo Walkthrough: Parandur Greenfield Airport

- **Target Region**: Parandur, Kanchipuram
- **Required Land**: 5,000 Acres
- **Project Type**: Airport

### Results:
- **🥇 Sector B (Parandur Heights)**: **87.4 / 100 — Highly Suitable**
  - ✓ 82% government-owned land (minimal private acquisition)
  - ✓ 1.2 km to NH 48 highway
  - ✓ 0% flood zone exposure (88m DEM elevation)
  - ✓ Zero reserve forest & wetland overlap
- **Alternative Comparisons**:
  - *Sector A (69.4)*: ⚠️ 68% fertile farmland, 12.5% water body overlap
  - *Sector D (61.1)*: ❌ 60% Palar river floodplain risk, 12 km from highway


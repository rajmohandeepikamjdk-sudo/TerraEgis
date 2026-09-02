import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import LayerControls from './LayerControls';

// Fix Leaflet default icon issues in bundled react apps
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper component to adjust map size & fly to selected candidate
function MapController({ center, zoom, selectedCandidate }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size after mount to ensure Leaflet renders full canvas
    const timer = setTimeout(() => {
      try {
        if (map) map.invalidateSize();
      } catch (e) {
        console.warn('Map invalidateSize warning:', e);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (!map) return;
    if (selectedCandidate && selectedCandidate.centroid && Array.isArray(selectedCandidate.centroid)) {
      try {
        map.flyTo([selectedCandidate.centroid[1], selectedCandidate.centroid[0]], 12, {
          duration: 1.2,
        });
      } catch (e) {
        console.warn('Map flyTo warning:', e);
      }
    } else if (center && Array.isArray(center)) {
      try {
        map.setView([center[1], center[0]], zoom || 11);
      } catch (e) {
        console.warn('Map setView warning:', e);
      }
    }
  }, [center, zoom, selectedCandidate, map]);

  return null;
}

export default function MapView({
  studyArea,
  candidates = [],
  layers = {},
  selectedCandidate,
  onSelectCandidate,
  activeLayers = {},
  onToggleLayer,
}) {
  const mapCenter = (studyArea && Array.isArray(studyArea.center)) ? studyArea.center : [80.020, 12.820];
  const mapZoom = studyArea?.zoom || 11;
  const safeCandidates = Array.isArray(candidates) ? candidates : [];

  return (
    <div className="map-container-wrapper" style={{ width: '100%', height: '100%', position: 'relative', minHeight: '400px' }}>
      <MapContainer
        center={[mapCenter[1], mapCenter[0]]}
        zoom={mapZoom}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, background: '#f8fafc' }}
      >
        <MapController
          center={mapCenter}
          zoom={mapZoom}
          selectedCandidate={selectedCandidate}
        />

        {/* Standard OSM Light Base Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          opacity={0.95}
        />

        {/* 1. FLOOD ZONES LAYER */}
        {activeLayers.flood_zones && Array.isArray(layers?.flood_zones?.features) && layers.flood_zones.features.map((f, idx) => {
          const ring = f?.geometry?.coordinates?.[0];
          if (!Array.isArray(ring)) return null;
          const coords = ring.map(([lon, lat]) => [lat, lon]);
          return (
            <Polygon
              key={`flood-${idx}`}
              positions={coords}
              pathOptions={{
                color: '#e11d48',
                fillColor: '#e11d48',
                fillOpacity: 0.25,
                weight: 1.5,
                dashArray: '4, 4',
              }}
            >
              <Tooltip sticky>
                <div>
                  <strong>[FLOOD ZONE] {f.properties?.name || 'Flood Zone'}</strong><br />
                  <span style={{ color: '#e11d48', fontWeight: '600' }}>Hazard Risk: {f.properties?.risk || 'Medium'}</span>
                </div>
              </Tooltip>
            </Polygon>
          );
        })}

        {/* 2. WATER BODIES LAYER */}
        {activeLayers.water && Array.isArray(layers?.water?.features) && layers.water.features.map((f, idx) => {
          const geomType = f?.geometry?.type;
          if (geomType === 'Polygon') {
            const ring = f?.geometry?.coordinates?.[0];
            if (!Array.isArray(ring)) return null;
            const coords = ring.map(([lon, lat]) => [lat, lon]);
            return (
              <Polygon
                key={`water-${idx}`}
                positions={coords}
                pathOptions={{
                  color: '#0891b2',
                  fillColor: '#06b6d4',
                  fillOpacity: 0.4,
                  weight: 1.5,
                }}
              >
                <Tooltip sticky>
                  <div>[WATER] {f.properties?.name || 'Water Body'} ({f.properties?.type || 'water'})</div>
                </Tooltip>
              </Polygon>
            );
          } else if (geomType === 'LineString') {
            const rawCoords = f?.geometry?.coordinates;
            if (!Array.isArray(rawCoords)) return null;
            const coords = rawCoords.map(([lon, lat]) => [lat, lon]);
            return (
              <Polyline
                key={`water-line-${idx}`}
                positions={coords}
                pathOptions={{
                  color: '#0891b2',
                  weight: 3,
                  opacity: 0.85,
                }}
              >
                <Tooltip sticky>[CANAL] {f.properties?.name || 'Canal/Stream'}</Tooltip>
              </Polyline>
            );
          }
          return null;
        })}

        {/* 3. FORESTS LAYER */}
        {activeLayers.forests && Array.isArray(layers?.forests?.features) && layers.forests.features.map((f, idx) => {
          const ring = f?.geometry?.coordinates?.[0];
          if (!Array.isArray(ring)) return null;
          const coords = ring.map(([lon, lat]) => [lat, lon]);
          return (
            <Polygon
              key={`forest-${idx}`}
              positions={coords}
              pathOptions={{
                color: '#16a34a',
                fillColor: '#22c55e',
                fillOpacity: 0.35,
                weight: 1.5,
              }}
            >
              <Tooltip sticky>
                <div>[FOREST] {f.properties?.name || 'Forest Area'} ({f.properties?.type || 'forest'})</div>
              </Tooltip>
            </Polygon>
          );
        })}

        {/* 4. WILDLIFE AREAS LAYER */}
        {activeLayers.wildlife && Array.isArray(layers?.wildlife?.features) && layers.wildlife.features.map((f, idx) => {
          const ring = f?.geometry?.coordinates?.[0];
          if (!Array.isArray(ring)) return null;
          const coords = ring.map(([lon, lat]) => [lat, lon]);
          return (
            <Polygon
              key={`wildlife-${idx}`}
              positions={coords}
              pathOptions={{
                color: '#7c3aed',
                fillColor: '#a855f7',
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '6, 6',
              }}
            >
              <Tooltip sticky>
                <div>[WILDLIFE] {f.properties?.name || 'Wildlife Zone'}</div>
              </Tooltip>
            </Polygon>
          );
        })}

        {/* 5. ROAD NETWORK LAYER */}
        {activeLayers.roads && Array.isArray(layers?.roads?.features) && layers.roads.features.map((f, idx) => {
          const rawCoords = f?.geometry?.coordinates;
          if (!Array.isArray(rawCoords)) return null;
          const coords = rawCoords.map(([lon, lat]) => [lat, lon]);
          const isHighway = f.properties?.type === 'national_highway';
          return (
            <Polyline
              key={`road-${idx}`}
              positions={coords}
              pathOptions={{
                color: isHighway ? '#d97706' : '#475569',
                weight: isHighway ? 4 : 2,
                opacity: 0.9,
              }}
            >
              <Tooltip sticky>
                <div>[ROAD] {f.properties?.name || 'Road'}</div>
              </Tooltip>
            </Polyline>
          );
        })}

        {/* 6. VILLAGES LAYER */}
        {activeLayers.villages && Array.isArray(layers?.villages?.features) && layers.villages.features.map((f, idx) => {
          const rawCoords = f?.geometry?.coordinates;
          if (!Array.isArray(rawCoords) || rawCoords.length < 2) return null;
          const [lon, lat] = rawCoords;
          const isTown = f.properties?.type === 'town';
          return (
            <CircleMarker
              key={`village-${idx}`}
              center={[lat, lon]}
              radius={isTown ? 6 : 4}
              pathOptions={{
                color: '#0284c7',
                fillColor: '#38bdf8',
                fillOpacity: 0.9,
                weight: 1.5,
              }}
            >
              <Tooltip sticky>
                <div>
                  <strong>[SETTLEMENT] {f.properties?.name || 'Settlement'}</strong><br />
                  <span style={{ fontSize: '11px', color: '#475569' }}>
                    Type: {f.properties?.type || 'village'} | Pop: {f.properties?.population?.toLocaleString() || 'N/A'}
                  </span>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* 7. CANDIDATE SITES LAYER */}
        {activeLayers.candidates && safeCandidates.map((candidate) => {
          if (!Array.isArray(candidate?.polygon)) return null;
          const coords = candidate.polygon.map(([lon, lat]) => [lat, lon]);
          const isSelected = selectedCandidate?.id === candidate.id;
          const isTopRanked = candidate.rank === 1;

          return (
            <Polygon
              key={`candidate-${candidate.id}`}
              positions={coords}
              pathOptions={{
                color: isSelected ? '#0f172a' : candidate.color || '#059669',
                fillColor: candidate.color || '#059669',
                fillOpacity: isSelected ? 0.65 : 0.4,
                weight: isSelected ? 3.5 : isTopRanked ? 2.5 : 1.5,
                dashArray: isSelected ? undefined : isTopRanked ? '5, 5' : undefined,
              }}
              eventHandlers={{
                click: () => onSelectCandidate && onSelectCandidate(candidate.id),
              }}
            >
              <Tooltip direction="center" permanent={false} opacity={0.95}>
                <div style={{ textAlign: 'center', padding: '4px' }}>
                  <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '12.5px' }}>
                    {candidate.rank === 1 ? '[RANK 1] ' : ''}{candidate.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13.5px', fontWeight: '800', color: candidate.color }}>
                    {candidate.score} / 100
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#475569' }}>
                    {candidate.features?.govt_land_pct}% Govt Land | {candidate.suitability}
                  </div>
                </div>
              </Tooltip>

              <Popup className="custom-popup">
                <div style={{ padding: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ color: '#0f172a' }}>{candidate.name}</strong>
                    <span style={{ color: candidate.color, fontWeight: 'bold' }}>
                      {candidate.score}/100
                    </span>
                  </div>
                  <p style={{ fontSize: '11.5px', margin: '4px 0', color: '#334155' }}>
                    {candidate.desc}
                  </p>
                  <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                    • Govt Land: {candidate.features?.govt_land_pct}%<br />
                    • Highway Dist: {candidate.features?.dist_highway_km} km<br />
                    • Flood Area: {candidate.features?.flood_pct}%
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        })}
      </MapContainer>

      {/* Floating Layer Controls */}
      <LayerControls
        activeLayers={activeLayers}
        onToggleLayer={onToggleLayer}
      />
    </div>
  );
}

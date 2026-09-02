import React from 'react';

const GIS_LAYERS_CONFIG = [
  { id: 'candidates', label: 'Candidate Parcels (~5k Ac)', color: '#059669', default: true },
  { id: 'roads', label: 'Road & Highway Network', color: '#d97706', default: true },
  { id: 'villages', label: 'Settlements & Villages', color: '#0284c7', default: true },
  { id: 'water', label: 'Water Bodies & Rivers', color: '#0891b2', default: true },
  { id: 'flood_zones', label: 'DEM Flood Risk Zones', color: '#e11d48', default: true },
  { id: 'forests', label: 'Reserve Forests', color: '#16a34a', default: false },
  { id: 'wildlife', label: 'Wildlife Corridors', color: '#7c3aed', default: false },
];

export default function LayerControls({ activeLayers, onToggleLayer }) {
  return (
    <div className="layer-controls-overlay">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f172a' }}>
          GIS Map Overlays
        </span>
        <span style={{ fontSize: '9.5px', background: '#f1f5f9', padding: '2px 5px', borderRadius: '3px', color: '#64748b', fontWeight: '600' }}>
          TNGIS / OSM
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {GIS_LAYERS_CONFIG.map((layer) => {
          const isActive = activeLayers[layer.id];
          return (
            <div
              key={layer.id}
              className="layer-control-item"
              onClick={() => onToggleLayer(layer.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span
                  className="layer-color-dot"
                  style={{
                    backgroundColor: layer.color,
                    boxShadow: isActive ? `0 0 6px ${layer.color}` : 'none',
                  }}
                />
                <span style={{ fontSize: '11.5px', color: isActive ? '#0f172a' : '#64748b', fontWeight: isActive ? '600' : '400' }}>
                  {layer.label}
                </span>
              </div>
              <input
                type="checkbox"
                checked={!!isActive}
                onChange={() => {}} // Handled by parent div click
                style={{ cursor: 'pointer', accentColor: '#059669' }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

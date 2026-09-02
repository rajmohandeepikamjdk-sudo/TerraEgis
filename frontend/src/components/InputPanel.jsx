import React, { useState } from 'react';

const PROJECT_OPTIONS = [
  { id: 'airport', label: 'Airport (Greenfield)', desc: 'High emphasis on population clearance, transport access & flood safety' },
  { id: 'highway', label: 'Highway Corridor', desc: 'Focus on terrain slope, transport integration & minimal settlement impact' },
  { id: 'industrial_park', label: 'Industrial Park', desc: 'Prioritizes land ownership, highway proximity & local workforce' },
  { id: 'railway', label: 'Railway Expansion', desc: 'Emphasizes straight corridors, low disaster risk & transit connectivity' },
  { id: 'power_plant', label: 'Power Plant', desc: 'Critical water resource access, disaster buffer & non-residential zones' },
  { id: 'port', label: 'Port & Logistics Terminal', desc: 'Requires waterway access, transport linkage & flood management' },
];

const PRESETS = [
  { label: 'Parandur Airport (5k Ac)', area: 'Parandur, Kanchipuram', acres: 5000, project: 'airport' },
  { label: 'Sriperumbudur Ind. Park', area: 'Sriperumbudur', acres: 3000, project: 'industrial_park' },
  { label: 'Chennai Express Corridor', area: 'Kanchipuram', acres: 2500, project: 'highway' },
];

export default function InputPanel({ onAnalyze, isAnalyzing, projectTypes }) {
  const [area, setArea] = useState('Parandur, Kanchipuram');
  const [acres, setAcres] = useState(5000);
  const [project, setProject] = useState('airport');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!area || !acres || acres <= 0) return;
    onAnalyze(area, acres, project);
  };

  const applyPreset = (preset) => {
    setArea(preset.area);
    setAcres(preset.acres);
    setProject(preset.project);
  };

  const activeProjectMeta = PROJECT_OPTIONS.find(p => p.id === project) || PROJECT_OPTIONS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Quick Presets */}
      <div>
        <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', letterSpacing: '0.5px' }}>
          DEMO PRESETS
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              style={{
                background: '#f1f5f9',
                border: '1px solid var(--border-bento)',
                borderRadius: '5px',
                padding: '4px 8px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-emerald)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-bento)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            <span>Target Region</span>
            <span style={{ fontSize: '10px', color: 'var(--accent-emerald)', fontWeight: '700' }}>TNGIS REGION</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g. Parandur, Kanchipuram"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <span>Required Land</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: '700' }}>
              {Number(acres).toLocaleString()} Acres
            </span>
          </label>
          <input
            type="number"
            className="form-input"
            value={acres}
            onChange={(e) => setAcres(e.target.value)}
            min="100"
            max="50000"
            step="100"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <span>Project Category</span>
          </label>
          <select
            className="form-select"
            value={project}
            onChange={(e) => setProject(e.target.value)}
          >
            {PROJECT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id} style={{ background: '#ffffff', color: '#0f172a' }}>
                {opt.label}
              </option>
            ))}
          </select>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px', lineHeight: '1.3' }}>
            {activeProjectMeta.desc}
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={isAnalyzing}
          style={{ marginTop: '6px' }}
        >
          {isAnalyzing ? (
            <span>Running Analytics...</span>
          ) : (
            <span>RUN GIS ANALYSIS</span>
          )}
        </button>
      </form>

      {/* AHP Model Info Badge */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '9px 11px', fontSize: '11px', color: 'var(--text-secondary)' }}>
        <div style={{ color: 'var(--text-primary)', fontWeight: '700', marginBottom: '3px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.4px' }}>
          Analytic Hierarchy Process (AHP)
        </div>
        <p style={{ fontSize: '11px', lineHeight: '1.3' }}>
          Spatial layers from TNGIS & OSM are normalized across 10 environmental, social, disaster, and transport criteria.
        </p>
      </div>
    </div>
  );
}

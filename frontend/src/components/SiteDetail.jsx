import React, { useState } from 'react';
import ScoreRadar from './ScoreRadar';

export default function SiteDetail({ candidate, isWinner, onClose }) {
  const [activeTab, setActiveTab] = useState('reasons'); // 'reasons' | 'contributions' | 'gis'

  if (!candidate) {
    return (
      <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📍</div>
        <p style={{ fontSize: '14px' }}>Select a candidate sector on the map or ranking list to view its complete multi-criteria GIS evaluation.</p>
      </div>
    );
  }

  const {
    id, name, desc, rank, score, suitability, color,
    features, criterion_scores, reasons, contributions
  } = candidate;

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '16px', position: 'relative', borderLeft: `4px solid ${color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
              </span>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '800' }}>
                {name}
              </h2>
              {isWinner && (
                <span className="brand-badge" style={{ fontSize: '10px' }}>
                  Recommended Site
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {desc}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: '800', color: color }}>
              {score}
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}> /100</span>
            </div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: color, textTransform: 'uppercase' }}>
              {suitability}
            </div>
          </div>
        </div>

        {/* Land Acquisition Ratio Bar */}
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '5px' }}>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>
              🏛️ Govt: {features.govt_land_pct}% ({features.govt_land_acres?.toLocaleString() || Math.round(5000 * features.govt_land_pct/100)} Ac)
            </span>
            <span style={{ color: 'var(--accent-amber)', fontWeight: '600' }}>
              🏘️ Private: {features.private_land_pct}% ({features.private_land_acres?.toLocaleString() || Math.round(5000 * features.private_land_pct/100)} Ac)
            </span>
          </div>
          <div style={{ height: '7px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${features.govt_land_pct}%`, background: 'var(--accent-emerald)', transition: 'width 0.5s ease' }}></div>
            <div style={{ width: `${features.private_land_pct}%`, background: 'var(--accent-amber)', transition: 'width 0.5s ease' }}></div>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="glass-panel" style={{ padding: '14px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.5px' }}>
          Multi-Criteria Scoring Radar
        </div>
        <ScoreRadar
          criterionScores={criterion_scores}
          candidateName={name}
          scoreColor={color}
        />
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
        {[
          { id: 'reasons', label: 'Explainable AI' },
          { id: 'contributions', label: 'AHP Weights' },
          { id: 'gis', label: 'GIS Metrics' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '7px 0',
              fontSize: '12px',
              fontWeight: activeTab === tab.id ? '700' : '500',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
              background: activeTab === tab.id ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Reasons / Explainable AI */}
      {activeTab === 'reasons' && (
        <div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            AI-generated decision rationales based on geographic intersections & constraints:
          </div>
          {reasons && reasons.map((r, idx) => (
            <div key={idx} className={`reason-item reason-${r.type}`}>
              <span style={{ fontSize: '16px', lineHeight: 1 }}>{r.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontWeight: '600', fontSize: '12.5px' }}>{r.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: r.type === 'good' ? 'var(--accent-emerald)' : r.type === 'warn' ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>
                    {r.score}/10
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {r.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: AHP Contributions */}
      {activeTab === 'contributions' && (
        <div className="glass-panel" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Weighted contribution of each criterion to the final suitability score ({score}/100):
          </div>
          {contributions && contributions.map((c, idx) => (
            <div key={idx} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>({c.weight_pct}%)</span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                  +{c.contribution} pts
                </span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${(c.contribution / 20) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald))' }}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: GIS Metrics */}
      {activeTab === 'gis' && (
        <div className="stat-grid">
          <div className="stat-box">
            <div className="stat-label">Highway Distance</div>
            <div className="stat-value" style={{ color: features.dist_highway_km < 2 ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>
              {features.dist_highway_km} km
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Villages (5km Buffer)</div>
            <div className="stat-value">{features.villages_5km} settlements</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Flood Zone Exposure</div>
            <div className="stat-value" style={{ color: features.flood_pct > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
              {features.flood_pct}% area
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Forest Overlap</div>
            <div className="stat-value" style={{ color: features.forest_pct > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
              {features.forest_pct}% area
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Mean DEM Elevation</div>
            <div className="stat-value">{features.elevation_m} meters</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Population (10km)</div>
            <div className="stat-value">{features.pop_10km?.toLocaleString()}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Wildlife Sanctuary Dist.</div>
            <div className="stat-value">{features.dist_wildlife_km} km</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Infra Conflicts</div>
            <div className="stat-value">{features.infra_conflicts} detected</div>
          </div>
        </div>
      )}
    </div>
  );
}

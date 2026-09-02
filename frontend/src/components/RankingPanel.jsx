import React from 'react';

export default function RankingPanel({ candidates, selectedId, onSelectCandidate, projectTitle }) {
  if (!candidates || candidates.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '13px' }}>No candidate analysis available yet. Run the GIS analysis to view ranked locations.</p>
      </div>
    );
  }

  const bestSite = candidates[0];

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🏆</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700' }}>
              Suitability Rankings
            </h2>
          </div>
          <span className="brand-badge">{candidates.length} Sites Analyzed</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Locations ranked via Analytic Hierarchy Process (AHP) multi-criteria weighted scoring.
        </p>
      </div>

      {/* Top Recommendation Highlight Card */}
      {bestSite && (
        <div
          className={`candidate-card ${selectedId === bestSite.id ? 'selected' : ''}`}
          onClick={() => onSelectCandidate(bestSite.id)}
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.08))',
            borderColor: 'rgba(16, 185, 129, 0.5)',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.15)',
          }}
        >
          <div className="card-top">
            <div className="card-rank" style={{ color: '#fff' }}>
              <span>🥇</span>
              <span>{bestSite.name}</span>
              <span style={{ fontSize: '10px', background: 'var(--accent-emerald)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                BEST CHOICE
              </span>
            </div>
            <div className="score-badge" style={{ color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}>
              {bestSite.score} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/ 100</span>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {bestSite.desc}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px' }}>
            <span style={{ color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
              ✓ {bestSite.features.govt_land_pct}% Govt Land
            </span>
            <span style={{ color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
              🛣️ {bestSite.features.dist_highway_km} km to Highway
            </span>
            <span style={{ color: '#fff', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
              🌊 {bestSite.features.flood_pct === 0 ? 'Zero Flood Risk' : `${bestSite.features.flood_pct}% Flood Area`}
            </span>
          </div>
        </div>
      )}

      {/* Other Candidate Cards */}
      <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.5px' }}>
        Alternative Candidate Locations
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {candidates.slice(1).map((candidate) => {
          const isSelected = selectedId === candidate.id;
          const medal = candidate.rank === 2 ? '🥈' : candidate.rank === 3 ? '🥉' : `#${candidate.rank}`;
          
          return (
            <div
              key={candidate.id}
              className={`candidate-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectCandidate(candidate.id)}
            >
              <div className="card-top">
                <div className="card-rank">
                  <span>{medal}</span>
                  <span style={{ color: '#fff' }}>{candidate.name}</span>
                </div>
                <div className="score-badge" style={{ color: candidate.color }}>
                  {candidate.score} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/ 100</span>
                </div>
              </div>
              
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {candidate.desc}
              </div>

              {/* Conflict / Feature Summary Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11px' }}>
                <span style={{ color: candidate.features.govt_land_pct > 60 ? 'var(--accent-emerald)' : 'var(--accent-amber)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                  🏛️ {candidate.features.govt_land_pct}% Govt Land
                </span>
                {candidate.features.flood_pct > 0 && (
                  <span style={{ color: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    ⚠️ {candidate.features.flood_pct}% Flood Zone
                  </span>
                )}
                {candidate.features.forest_pct > 0 && (
                  <span style={{ color: 'var(--accent-amber)', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    🌿 {candidate.features.forest_pct}% Forest
                  </span>
                )}
                {candidate.features.water_overlap_pct > 0 && (
                  <span style={{ color: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                    💧 {candidate.features.water_overlap_pct}% Water Overlap
                  </span>
                )}
                {candidate.features.dist_highway_km > 10 && (
                  <span style={{ color: 'var(--accent-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                    🛣️ {candidate.features.dist_highway_km} km to Highway
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState } from 'react';

export default function CompareSectorsModal({ candidates = [], project, area, acres, onClose }) {
  // Default to selecting the top 3 candidates or all if fewer than 3
  const [selectedIds, setSelectedIds] = useState(
    candidates.slice(0, 3).map(c => c.id)
  );

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? (prev.length > 1 ? prev.filter(x => x !== id) : prev) // keep at least 1 selected
        : [...prev, id]
    );
  };

  const selectedCandidates = candidates
    .filter(c => selectedIds.includes(c.id))
    .sort((a, b) => a.rank - b.rank);

  const winner = selectedCandidates[0];

  // Helper to compute dynamic why-ranked-#1 text from scoring differentials
  const getWinnerAnalysis = () => {
    if (!winner) return null;
    const runnerUp = selectedCandidates[1];
    let diffReasons = [];

    if (runnerUp) {
      const scoreDiff = (winner.score - runnerUp.score).toFixed(1);
      const govtDiff = (winner.features.govt_land_pct - runnerUp.features.govt_land_pct).toFixed(0);
      const hwyDiff = (runnerUp.features.dist_highway_km - winner.features.dist_highway_km).toFixed(1);
      const floodDiff = (runnerUp.features.flood_pct - winner.features.flood_pct).toFixed(0);

      diffReasons.push(
        `Scored ${scoreDiff} points higher than runner-up ${runnerUp.name} (${winner.score} vs ${runnerUp.score}/100)`
      );
      if (winner.features.govt_land_pct > runnerUp.features.govt_land_pct) {
        diffReasons.push(`${govtDiff}% higher government land ownership (${winner.features.govt_land_pct}% vs ${runnerUp.features.govt_land_pct}%), substantially cutting private expropriation risk`);
      }
      if (winner.features.dist_highway_km < runnerUp.features.dist_highway_km) {
        diffReasons.push(`${hwyDiff} km closer to primary highway arterial corridor (${winner.features.dist_highway_km} km vs ${runnerUp.features.dist_highway_km} km)`);
      }
      if (winner.features.flood_pct < runnerUp.features.flood_pct) {
        diffReasons.push(`Zero/lower flood exposure (${winner.features.flood_pct}% vs ${runnerUp.features.flood_pct}% in ${runnerUp.name})`);
      }
    } else {
      diffReasons.push(`Strongest multi-criteria suitability performance (${winner.score}/100) with ${winner.features.govt_land_pct}% government land.`);
    }

    return diffReasons;
  };

  const winnerReasons = getWinnerAnalysis();

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(8px)',
      zIndex: 3000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '960px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#64748b' }}>
              MULTI-SECTOR DECISION SUPPORT
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#0f172a' }}>
              Compare Candidate Sectors ({selectedCandidates.length} Selected)
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#e2e8f0',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            CLOSE
          </button>
        </div>

        {/* Checkbox Selector: ☑ Sector B  ☑ Sector F  ☑ Sector A  ☐ Sector C */}
        <div style={{
          padding: '14px 24px',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
            Select Sectors to Compare:
          </span>
          {candidates.map(c => {
            const isChecked = selectedIds.includes(c.id);
            return (
              <label
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: isChecked ? 'rgba(5, 150, 105, 0.08)' : '#f8fafc',
                  border: `1px solid ${isChecked ? '#059669' : '#cbd5e1'}`,
                  fontWeight: isChecked ? '700' : '500',
                  color: isChecked ? '#0f172a' : '#64748b',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleSelect(c.id)}
                  style={{ accentColor: '#059669', cursor: 'pointer', width: '14px', height: '14px' }}
                />
                <span>{c.name} ({c.score}/100)</span>
              </label>
            );
          })}
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* WHY WINNER RANKED #1 BANNER */}
          {winner && (
            <div style={{ background: 'rgba(5, 150, 105, 0.05)', border: '1px solid rgba(5, 150, 105, 0.25)', borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                WHY {winner.name.toUpperCase()} RANKED #1 AMONG COMPARED SECTORS
              </div>
              <div style={{ fontSize: '13px', color: '#1e293b', lineHeight: '1.5', marginBottom: '8px' }}>
                Based on mathematical AHP multi-criteria weight distribution and verified GIS observations:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#334155' }}>
                {winnerReasons.map((reason, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>
                    <strong>{reason}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Comparative Matrix Table */}
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', width: '220px' }}>CRITERION</th>
                  {selectedCandidates.map(c => (
                    <th key={c.id} style={{ padding: '10px 14px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontWeight: '800', fontSize: '13px' }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: c.color, fontWeight: '700' }}>
                        Rank #{c.rank} • {c.score}/100
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Overall Score', c => `${c.score} / 100`],
                  ['Rank', c => `Rank #${c.rank}`],
                  ['Government Land %', c => `${c.features.govt_land_pct}% (${c.features.govt_land_acres} Ac)`],
                  ['Private Land %', c => `${c.features.private_land_pct}% (${c.features.private_land_acres} Ac)`],
                  ['Highway Distance', c => `${c.features.dist_highway_km} km`],
                  ['Village Count (5km Buffer)', c => `${c.features.villages_5km} settlements`],
                  ['Flood Exposure', c => `${c.features.flood_pct}%`],
                  ['Elevation (DEM)', c => `${c.features.elevation_m} meters`],
                  ['Forest Risk', c => `${c.features.forest_pct}% reserve forest`],
                  ['Water Risk', c => `${c.features.water_overlap_pct}% overlap / ${c.features.dist_water_km} km`],
                  ['Population Impact Score', c => `${c.criterion_scores?.population || 'Data unavailable'} / 10`],
                  ['Transport Score', c => `${c.criterion_scores?.transport || 'Data unavailable'} / 10`],
                  ['Environmental / Forest Score', c => `${c.criterion_scores?.forest || 'Data unavailable'} / 10`],
                ].map(([label, getValue], idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? '#f8fafc' : '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '9px 14px', fontWeight: '700', color: '#475569' }}>{label}</td>
                    {selectedCandidates.map(c => (
                      <td
                        key={c.id}
                        style={{
                          padding: '9px 14px',
                          textAlign: 'center',
                          fontWeight: '600',
                          color: '#0f172a',
                          borderLeft: '1px solid #e2e8f0',
                          background: c.rank === 1 ? 'rgba(5, 150, 105, 0.03)' : 'transparent',
                        }}
                      >
                        {getValue(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import InputPanel from './components/InputPanel';
import MapView from './components/MapView';
import ScoreRadar from './components/ScoreRadar';
import AnalyzingOverlay from './components/AnalyzingOverlay';
import SectorReportModal from './components/SectorReportModal';
import CompareSectorsModal from './components/CompareSectorsModal';
import ReportHistoryModal from './components/ReportHistoryModal';
import { analyzeProject, checkHealth, getProjectTypes } from './api/terraegis';
import { generateSectorReportPDF } from './utils/pdfGenerator';

export default function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [projectTypes, setProjectTypes] = useState([]);
  
  // Modals state
  const [activeReportModal, setActiveReportModal] = useState(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);

  // Layer toggles
  const [activeLayers, setActiveLayers] = useState({
    candidates: true,
    roads: true,
    villages: true,
    water: true,
    flood_zones: true,
    forests: false,
    wildlife: false,
  });

  // Initial load
  useEffect(() => {
    async function init() {
      const health = await checkHealth();
      if (health) setApiConnected(true);

      try {
        const pTypes = await getProjectTypes();
        if (pTypes?.types) setProjectTypes(pTypes.types);
      } catch (err) {
        console.warn('Could not load project types:', err);
      }

      // Load saved report history from localStorage
      try {
        const savedHist = localStorage.getItem('terraegis_report_history');
        if (savedHist) setReportHistory(JSON.parse(savedHist));
      } catch (e) {
        console.warn('Could not parse report history:', e);
      }

      // Run default initial analysis for Parandur Airport
      handleRunAnalysis('Parandur, Kanchipuram', 5000, 'airport', false);
    }
    init();
  }, []);

  const handleRunAnalysis = async (area, acres, project, showOverlay = true) => {
    if (showOverlay) setIsAnalyzing(true);
    try {
      const res = await analyzeProject(area, acres, project);
      setAnalysisResult(res);
      setAnalysisSteps(res.analysis_steps || []);
      
      // Auto-select best candidate (Rank 1)
      if (res.candidates && res.candidates.length > 0) {
        setSelectedCandidateId(res.candidates[0].id);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      alert(`Spatial Analysis Failed: ${err.message}`);
    } finally {
      if (!showOverlay) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleToggleLayer = (layerId) => {
    setActiveLayers(prev => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  const handleOpenSectorReport = (candidate) => {
    if (!candidate || !candidate.report) return;
    const rep = candidate.report;
    setActiveReportModal(rep);

    // Save to history if not already present
    setReportHistory(prev => {
      if (prev.some(r => r.reportId === rep.reportId)) return prev;
      const updated = [rep, ...prev];
      try {
        localStorage.setItem('terraegis_report_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleDownloadBatchPDFs = () => {
    if (!candidates || candidates.length === 0) return;
    candidates.forEach((c, idx) => {
      if (c.report) {
        setTimeout(() => {
          generateSectorReportPDF(c.report);
        }, idx * 400);
      }
    });
  };

  const candidates = analysisResult?.candidates || [];
  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId) || candidates[0];

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">TA</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="brand-title">TerrAegis</h1>
              <span className="brand-badge">Bento AI-GIS System</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '-2px' }}>
              Government Project Site Suitability & Recommendation Engine
            </div>
          </div>
        </div>

        <div className="header-status">
          <button
            onClick={() => setShowHistoryModal(true)}
            style={{
              background: '#f1f5f9',
              border: '1px solid var(--border-bento)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: '700',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            REPORT HISTORY ({reportHistory.length})
          </button>
          
          <button
            onClick={handleDownloadBatchPDFs}
            style={{
              background: '#059669',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: '700',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            DOWNLOAD ALL SECTOR REPORTS (PDF)
          </button>

          <div className="status-pill">
            <span className="pulse-dot"></span>
            <span>Spatial Engine: Active</span>
          </div>
        </div>
      </header>

      {/* Main Bento Grid Workspace */}
      <main className="bento-container">
        {/* TOP ROW: 3 BENTO CELLS */}
        <div className="bento-top-row">
          
          {/* BENTO CELL 1: Parameter Inputs & Controls */}
          <div className="bento-card">
            <div className="bento-header">
              <div className="bento-title-group">
                <span className="bento-title-tag">CTRL</span>
                <span className="bento-title">Project Parameters</span>
              </div>
              <span className="bento-badge">TNGIS Region</span>
            </div>
            <div className="bento-body">
              <InputPanel
                onAnalyze={(area, acres, project) => handleRunAnalysis(area, acres, project, true)}
                isAnalyzing={isAnalyzing}
                projectTypes={projectTypes}
              />
            </div>
          </div>

          {/* BENTO CELL 2: Hero Leaflet Map Container */}
          <div className="bento-card bento-card-map">
            <MapView
              studyArea={analysisResult?.study_area}
              candidates={candidates}
              layers={analysisResult?.layers || {}}
              selectedCandidate={selectedCandidate}
              onSelectCandidate={(id) => setSelectedCandidateId(id)}
              activeLayers={activeLayers}
              onToggleLayer={handleToggleLayer}
            />
          </div>

          {/* BENTO CELL 3: Recommended Location Verdict & Radar */}
          <div className="bento-card">
            <div className="bento-header">
              <div className="bento-title-group">
                <span className="bento-title-tag">RECOMMENDED</span>
                <span className="bento-title">Site Verdict</span>
              </div>
              {selectedCandidate && (
                <span className="bento-badge" style={{ color: selectedCandidate.color, borderColor: selectedCandidate.color }}>
                  {selectedCandidate.suitability}
                </span>
              )}
            </div>

            <div className="bento-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedCandidate ? (
                <>
                  {/* Score Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#0f172a' }}>
                        {selectedCandidate.rank === 1 ? '[RANK 1] ' : ''}{selectedCandidate.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {selectedCandidate.desc}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: '800', color: selectedCandidate.color }}>
                        {selectedCandidate.score}
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/100</span>
                      </div>
                      <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                        Rank #{selectedCandidate.rank}
                      </div>
                    </div>
                  </div>

                  {/* View Full Report Quick Trigger */}
                  <button
                    onClick={() => handleOpenSectorReport(selectedCandidate)}
                    className="btn-primary"
                    style={{ padding: '6px 10px', fontSize: '11.5px' }}
                  >
                    VIEW FULL REPORT
                  </button>

                  {/* Land Ownership Bar */}
                  <div style={{ background: '#f8fafc', padding: '7px 9px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '3px' }}>
                      <span style={{ color: 'var(--accent-emerald)', fontWeight: '700' }}>
                        Govt Land: {selectedCandidate.features.govt_land_pct}%
                      </span>
                      <span style={{ color: 'var(--accent-amber)', fontWeight: '700' }}>
                        Private: {selectedCandidate.features.private_land_pct}%
                      </span>
                    </div>
                    <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${selectedCandidate.features.govt_land_pct}%`, background: 'var(--accent-emerald)' }}></div>
                      <div style={{ width: `${selectedCandidate.features.private_land_pct}%`, background: 'var(--accent-amber)' }}></div>
                    </div>
                  </div>

                  {/* Radar Chart */}
                  <div style={{ background: '#ffffff', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '3px', letterSpacing: '0.4px' }}>
                      Multi-Criteria Fingerprint Radar
                    </div>
                    <ScoreRadar
                      criterionScores={selectedCandidate.criterion_scores}
                      candidateName={selectedCandidate.name}
                      scoreColor={selectedCandidate.color}
                    />
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '11.5px', textAlign: 'center', padding: '20px' }}>
                  Select a candidate sector to view suitability verdict.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: 3 BENTO CELLS */}
        <div className="bento-bottom-row">

          {/* BENTO CELL 4: Ranked Candidate Parcels + Compare Trigger */}
          <div className="bento-card">
            <div className="bento-header">
              <div className="bento-title-group">
                <span className="bento-title-tag">RANK</span>
                <span className="bento-title">Candidate Sectors</span>
              </div>
              <button
                onClick={() => setShowCompareModal(true)}
                style={{
                  background: '#0891b2',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '10.5px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                COMPARE SECTORS
              </button>
            </div>

            <div className="bento-body">
              {candidates.map((c) => {
                const isSelected = selectedCandidate?.id === c.id;
                const rankLabel = c.rank === 1 ? 'RANK 1' : c.rank === 2 ? 'RANK 2' : c.rank === 3 ? 'RANK 3' : `#${c.rank}`;
                return (
                  <div
                    key={c.id}
                    className={`bento-candidate-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedCandidateId(c.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: '800' }}>
                        <span style={{ color: '#64748b', marginRight: '6px' }}>{rankLabel} —</span>
                        <span style={{ color: isSelected ? '#0f172a' : 'var(--text-primary)' }}>{c.name}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', fontSize: '12.5px', color: c.color }}>
                        Score: {c.score} <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>/ 100</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '10.5px' }}>
                        <span style={{ color: c.features.govt_land_pct > 60 ? 'var(--accent-emerald)' : 'var(--accent-amber)', fontWeight: '700' }}>
                          Government Land: {c.features.govt_land_pct}%
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>
                          Highway: {c.features.dist_highway_km} km
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSectorReport(c);
                        }}
                        style={{
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '10px',
                          fontWeight: '800',
                          color: '#0f172a',
                          cursor: 'pointer',
                        }}
                      >
                        [VIEW FULL REPORT]
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BENTO CELL 5: Explainable AI Decision Rationales */}
          <div className="bento-card">
            <div className="bento-header">
              <div className="bento-title-group">
                <span className="bento-title-tag">XAI</span>
                <span className="bento-title">Decision Rationales</span>
              </div>
              <span className="bento-badge">Explainable AI</span>
            </div>

            <div className="bento-body">
              {selectedCandidate?.reasons ? (
                selectedCandidate.reasons.map((r, idx) => (
                  <div key={idx} className={`reason-item reason-${r.type}`}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: r.type === 'good' ? 'var(--accent-emerald)' : r.type === 'warn' ? 'var(--accent-amber)' : 'var(--accent-rose)' }}>
                      {r.type === 'good' ? '[PASS]' : r.type === 'warn' ? '[WARN]' : '[RISK]'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', fontSize: '11.5px', color: '#0f172a' }}>{r.label}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: r.type === 'good' ? 'var(--accent-emerald)' : r.type === 'warn' ? 'var(--accent-amber)' : 'var(--accent-rose)', fontWeight: '700' }}>
                          {r.score}/10
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                        {r.text}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>
                  No rationale data available.
                </div>
              )}
            </div>
          </div>

          {/* BENTO CELL 6: AHP Point Contributions & Key GIS Stats */}
          <div className="bento-card">
            <div className="bento-header">
              <div className="bento-title-group">
                <span className="bento-title-tag">AHP</span>
                <span className="bento-title">Point Contributions</span>
              </div>
              <span className="bento-badge">Weights</span>
            </div>

            <div className="bento-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedCandidate?.contributions ? (
                selectedCandidate.contributions.slice(0, 4).map((c, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                      <span style={{ color: '#0f172a', fontWeight: '600' }}>{c.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                        +{c.contribution} pts
                      </span>
                    </div>
                    <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${(c.contribution / 20) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald))' }}></div>
                    </div>
                  </div>
                ))
              ) : null}

              {/* GIS Key Stats Grid */}
              {selectedCandidate && (
                <div className="stat-grid" style={{ marginTop: '4px' }}>
                  <div className="stat-box">
                    <div className="stat-label">Highway Access</div>
                    <div className="stat-value">{selectedCandidate.features.dist_highway_km} km</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Villages (5km)</div>
                    <div className="stat-value">{selectedCandidate.features.villages_5km}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Elevation DEM</div>
                    <div className="stat-value">{selectedCandidate.features.elevation_m} m</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Flood Exposure</div>
                    <div className="stat-value" style={{ color: selectedCandidate.features.flood_pct > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                      {selectedCandidate.features.flood_pct}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Sector Full Report Modal */}
      {activeReportModal && (
        <SectorReportModal
          report={activeReportModal}
          layers={analysisResult?.layers || {}}
          onClose={() => setActiveReportModal(null)}
        />
      )}

      {/* Compare Sectors Modal */}
      {showCompareModal && (
        <CompareSectorsModal
          candidates={candidates}
          project={analysisResult?.project}
          area={analysisResult?.area}
          acres={analysisResult?.acres_requested}
          onClose={() => setShowCompareModal(false)}
        />
      )}

      {/* Report History Modal */}
      {showHistoryModal && (
        <ReportHistoryModal
          history={reportHistory}
          onViewReport={(rep) => {
            setShowHistoryModal(false);
            setActiveReportModal(rep);
          }}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {/* Analysis Scanner Overlay */}
      {isAnalyzing && (
        <AnalyzingOverlay
          steps={analysisSteps}
          onComplete={() => setIsAnalyzing(false)}
        />
      )}
    </div>
  );
}

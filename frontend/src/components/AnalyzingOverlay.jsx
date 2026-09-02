import React, { useState, useEffect } from 'react';

const DEFAULT_STEPS = [
  "Locating study area boundary (Parandur / Kanchipuram)",
  "Loading candidate site parcels (5,000+ acres each)",
  "Querying spatial infrastructure & road networks",
  "Computing population density & 5 km settlement buffers",
  "Evaluating SRTM DEM elevation & flood susceptibility",
  "Cross-referencing TNGIS water bodies & reservoir catchments",
  "Checking protected forests & wildlife sanctuary corridors",
  "Calculating government vs private land ownership ratios",
  "Executing Multi-Criteria AHP scoring matrix",
  "Ranking candidate sites & generating explainable AI insights"
];

export default function AnalyzingOverlay({ steps = DEFAULT_STEPS, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          if (onComplete) setTimeout(onComplete, 400);
          return prev;
        }
      });
    }, 280);

    return () => clearInterval(interval);
  }, [steps, onComplete]);

  return (
    <div className="analyzing-overlay">
      <div className="scanner-ring"></div>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
        Spatial AI Engine Analyzing
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '16px' }}>
        Intersecting geospatial layers & evaluating multi-criteria constraints...
      </p>

      <div className="steps-list" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', width: '400px', maxHeight: '260px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        {steps.map((step, idx) => {
          const isDone = idx < currentStep;
          const isActive = idx === currentStep;
          return (
            <div key={idx} className={`step-row ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
              <span style={{ width: '16px', textAlign: 'center', fontSize: '11px', fontWeight: '700' }}>
                {isDone ? '[DONE]' : isActive ? '[RUN]' : `[${idx+1}]`}
              </span>
              <span style={{ fontSize: '12px' }}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

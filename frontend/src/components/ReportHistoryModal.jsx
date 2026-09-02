import React from 'react';
import { generateSectorReportPDF } from '../utils/pdfGenerator';

export default function ReportHistoryModal({ history = [], onViewReport, onClose }) {
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
        maxWidth: '860px',
        maxHeight: '85vh',
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
              HISTORICAL SECTOR REPORTS LOG
            </div>
            <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#0f172a' }}>
              Analysis Report History ({history.length} Saved Reports)
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

        {/* History List Table */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {history.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
              <p>No historical reports saved yet.</p>
              <p style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                Open any candidate sector report to automatically preserve it in your persistent analysis history.
              </p>
            </div>
          ) : (
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>REPORT ID</th>
                    <th style={{ padding: '10px 14px' }}>DATE / TIME</th>
                    <th style={{ padding: '10px 14px' }}>PROJECT</th>
                    <th style={{ padding: '10px 14px' }}>REGION</th>
                    <th style={{ padding: '10px 14px' }}>SECTOR</th>
                    <th style={{ padding: '10px 14px' }}>RANK</th>
                    <th style={{ padding: '10px 14px' }}>SCORE</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((rep, idx) => (
                    <tr
                      key={rep.reportId || idx}
                      style={{ background: idx % 2 === 0 ? '#f8fafc' : '#ffffff', borderBottom: '1px solid #e2e8f0' }}
                    >
                      <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#0f172a' }}>
                        {rep.reportId}
                      </td>
                      <td style={{ padding: '9px 14px', color: '#475569', fontSize: '11px' }}>
                        {rep.timestamp || rep.generatedAt}
                      </td>
                      <td style={{ padding: '9px 14px', color: '#334155', fontWeight: '600' }}>
                        {rep.projectCategory}
                      </td>
                      <td style={{ padding: '9px 14px', color: '#334155' }}>
                        {rep.targetRegion}
                      </td>
                      <td style={{ padding: '9px 14px', fontWeight: '800', color: '#0f172a' }}>
                        {rep.sectorName}
                      </td>
                      <td style={{ padding: '9px 14px', fontWeight: '700', color: '#475569' }}>
                        Rank #{rep.rank}
                      </td>
                      <td style={{ padding: '9px 14px', fontWeight: '800', color: rep.color }}>
                        {rep.overallScore}/100
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => onViewReport(rep)}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              padding: '4px 10px',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#0f172a',
                              cursor: 'pointer',
                            }}
                          >
                            VIEW
                          </button>
                          <button
                            onClick={() => generateSectorReportPDF(rep)}
                            style={{
                              background: '#059669',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 10px',
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#ffffff',
                              cursor: 'pointer',
                            }}
                          >
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

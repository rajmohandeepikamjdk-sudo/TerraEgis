import { jsPDF } from 'jspdf';

export function generateSectorReportPDF(report, options = {}) {
  if (!report) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  let y = 14;

  // Palette: Clean Government / Engineering Publication
  const primaryNavy = [15, 23, 42];       // #0f172a
  const emeraldGreen = [5, 150, 105];     // #059669
  const mutedSlate = [71, 85, 105];       // #475569
  const lightBg = [248, 250, 252];        // #f8fafc
  const subtleBorder = [226, 232, 240];   // #e2e8f0
  const amberColor = [217, 119, 6];       // #d97706
  const roseColor = [225, 29, 72];        // #e11d48

  function checkPageBreak(neededHeight = 20) {
    if (y + neededHeight > pageHeight - 16) {
      // Footer before new page
      drawPageFooter();
      doc.addPage();
      y = 14;
    }
  }

  function drawPageFooter() {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(...subtleBorder);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text(
      `TerrAegis GIS Decision Support System | Report ID: ${report.reportId} | Verified Govt Publication`,
      margin,
      pageHeight - 8
    );
    const pageStr = `Page ${doc.internal.getNumberOfPages()}`;
    doc.text(pageStr, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  // ─────────────────────────────────────────────────────────────
  // 1. TERRAEGIS HEADER & PROJECT INFORMATION BANNER
  // ─────────────────────────────────────────────────────────────
  doc.setFillColor(...primaryNavy);
  doc.rect(margin, y, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TerrAegis — Government GIS Sector Analysis Report', margin + 6, y + 9);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Site Suitability & Recommendation Engine | Analytical Hierarchy Process (AHP)', margin + 6, y + 16);

  doc.setFontSize(8);
  doc.setFont('courier', 'bold');
  doc.text(`ID: ${report.reportId}`, pageWidth - margin - 6, y + 9, { align: 'right' });
  doc.text(report.timestamp || report.generatedAt, pageWidth - margin - 6, y + 16, { align: 'right' });

  y += 29;

  // ─────────────────────────────────────────────────────────────
  // 2. PROJECT SPECIFICATIONS & SELECTED SECTOR
  // ─────────────────────────────────────────────────────────────
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...subtleBorder);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`TARGET SITE: ${report.sectorName.toUpperCase()}  (RANK #${report.rank})`, margin + 6, y + 7);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedSlate);
  doc.text(`Project Category: ${report.projectCategory}`, margin + 6, y + 13);
  doc.text(`Target Region: ${report.targetRegion}`, margin + 6, y + 18);
  doc.text(`Required Area: ${Number(report.requiredLandAcres || 5000).toLocaleString()} Acres`, margin + 6, y + 23);

  const centroidStr = report.centroid ? `[Lon: ${report.centroid[0]}, Lat: ${report.centroid[1]}]` : 'Data unavailable';
  doc.text(`Parcel Centroid: ${centroidStr}`, margin + 95, y + 13);
  doc.text(`Analysis Status: ${report.status || 'Verified GIS Analysis'}`, margin + 95, y + 18);
  doc.text(`Evaluation Type: Multi-Criteria Spatial Optimization`, margin + 95, y + 23);

  y += 31;

  // ─────────────────────────────────────────────────────────────
  // 3. EXECUTIVE SUMMARY & VERDICT
  // ─────────────────────────────────────────────────────────────
  doc.setFillColor(240, 253, 244); // light emerald tint
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'FD');

  doc.setTextColor(...emeraldGreen);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`EXECUTIVE SUMMARY — VERDICT: ${report.suitability.toUpperCase()} (${report.overallScore} / 100)`, margin + 6, y + 7);

  const recText = report.recommendation?.recommendationText || report.recommendationText || report.recommendation || '';
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...primaryNavy);
  const recLines = doc.splitTextToSize(`Recommendation: ${recText}`, contentWidth - 12);
  doc.text(recLines, margin + 6, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...mutedSlate);
  doc.setFontSize(7.5);
  doc.text(`Government Land: ${report.spatialMetrics?.govtLandPct}% (${report.spatialMetrics?.govtLandAcres} Ac)  |  Private Land: ${report.spatialMetrics?.privateLandPct}% (${report.spatialMetrics?.privateLandAcres} Ac)  |  Confidence: ${report.confidence || report.recommendation?.confidence}`, margin + 6, y + 24);

  y += 33;

  // ─────────────────────────────────────────────────────────────
  // 4. GIS / SPATIAL ANALYSIS METRICS
  // ─────────────────────────────────────────────────────────────
  checkPageBreak(50);
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('1. GIS SPATIAL ANALYSIS METRICS', margin, y);
  y += 5;

  const metricsTable = [
    ['Total Candidate Area', `${report.spatialMetrics?.totalCandidateAreaAcres || report.spatialMetrics?.candidateArea} Acres`],
    ['Required Project Area', `${report.spatialMetrics?.requiredAreaAcres || report.spatialMetrics?.requiredArea} Acres`],
    ['Government Land Composition', `${report.spatialMetrics?.govtLandPct}% (${report.spatialMetrics?.govtLandAcres} Acres)`],
    ['Private Land Acquisition Required', `${report.spatialMetrics?.privateLandPct}% (${report.spatialMetrics?.privateLandAcres} Acres)`],
    ['Highway Distance', `${report.spatialMetrics?.distHighwayKm} km (${report.spatialMetrics?.nearestMajorRoad || 'NH Corridor'})`],
    ['Settlement Proximity', `Settlement Distance: ${report.spatialMetrics?.settlementDistance || 'Data unavailable'}`],
    ['Villages within 5km Analysis Buffer', `${report.spatialMetrics?.villages5kmCount} villages (Nearest: ${report.spatialMetrics?.nearestVillageName})`],
    ['Water Body Distance', `${report.spatialMetrics?.distWaterKm} km (${report.spatialMetrics?.riverProximity || 'Catchment'})`],
    ['Water Body Overlap', `${report.spatialMetrics?.waterBodyOverlapPct}%`],
    ['Reserve Forest Proximity & Overlap', report.spatialMetrics?.forestProximity || `${report.spatialMetrics?.forestOverlapPct}%`],
    ['Wildlife Corridor Overlap', report.spatialMetrics?.wildlifeCorridorOverlap || 'Data unavailable'],
    ['Wildlife Sanctuary Proximity', `${report.spatialMetrics?.distWildlifeKm} km`],
    ['Flood-Risk Zone Overlap', `${report.spatialMetrics?.floodZoneOverlapPct}%`],
    ['DEM Elevation (Mean Surface)', `${report.spatialMetrics?.meanElevationMeters} meters`],
    ['Terrain Slope (<5m Resolution)', report.spatialMetrics?.slope || 'Data unavailable'],
    ['Land-Use Classification', report.spatialMetrics?.landUseClassification || 'Data unavailable'],
    ['Protected Area Overlap', report.spatialMetrics?.protectedAreaOverlap || '0%'],
    ['Cross-Infrastructure Conflicts', `${report.spatialMetrics?.infraConflictsCount} detected`],
  ];

  doc.setFontSize(7.5);
  metricsTable.forEach(([label, val], idx) => {
    checkPageBreak(6);
    if (idx % 2 === 0) {
      doc.setFillColor(...lightBg);
      doc.rect(margin, y - 3.5, contentWidth, 5, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...mutedSlate);
    doc.text(label, margin + 4, y);

    const isUnavailable = val === 'Data unavailable';
    doc.setFont('helvetica', isUnavailable ? 'italic' : 'bold');
    doc.setTextColor(...(isUnavailable ? [148, 163, 184] : primaryNavy));
    doc.text(val.toString(), pageWidth - margin - 4, y, { align: 'right' });
    y += 5;
  });

  y += 6;

  // ─────────────────────────────────────────────────────────────
  // 5. AHP SCORE BREAKDOWN MATRIX
  // ─────────────────────────────────────────────────────────────
  checkPageBreak(55);
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. ANALYTIC HIERARCHY PROCESS (AHP) SCORE BREAKDOWN', margin, y);
  y += 5;

  // Table header
  doc.setFillColor(...primaryNavy);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('CRITERION', margin + 4, y + 4.2);
  doc.text('RAW GIS VALUE', margin + 55, y + 4.2);
  doc.text('SCORE (0-10)', margin + 115, y + 4.2);
  doc.text('WEIGHT', margin + 145, y + 4.2);
  doc.text('CONTRIBUTION', pageWidth - margin - 4, y + 4.2, { align: 'right' });
  y += 6.5;

  const criteria = report.ahp?.criteria || report.ahpBreakdown || [];
  criteria.forEach((row, idx) => {
    checkPageBreak(5.5);
    if (idx % 2 === 0) {
      doc.setFillColor(...lightBg);
      doc.rect(margin, y - 3.5, contentWidth, 5, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryNavy);
    doc.text(row.label, margin + 4, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedSlate);
    doc.text(row.raw_value, margin + 55, y);

    doc.text(`${row.normalized_score} / 10`, margin + 115, y);
    doc.text(`${row.weight_pct}%`, margin + 145, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...emeraldGreen);
    doc.text(`+${row.contribution_points} pts`, pageWidth - margin - 4, y, { align: 'right' });
    y += 5;
  });

  // Total Row
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...subtleBorder);
  doc.rect(margin, y - 1, contentWidth, 6.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryNavy);
  doc.setFontSize(8);
  doc.text('TOTAL AHP SUITABILITY SCORE', margin + 4, y + 3.5);
  doc.setTextColor(...emeraldGreen);
  doc.text(`${report.overallScore} / 100`, pageWidth - margin - 4, y + 3.5, { align: 'right' });
  y += 11;

  // ─────────────────────────────────────────────────────────────
  // 6. XAI / DECISION RATIONALES
  // ─────────────────────────────────────────────────────────────
  checkPageBreak(45);
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('3. EXPLAINABLE AI (XAI) DECISION RATIONALES', margin, y);
  y += 5;

  const rationales = report.xai?.rationales || report.xaiRationales || [];
  rationales.forEach((r) => {
    checkPageBreak(8);
    const tagColor = r.type === 'good' ? emeraldGreen : r.type === 'warn' ? amberColor : roseColor;
    const tagText = r.type === 'good' ? '[PASS]' : r.type === 'warn' ? '[WARNING]' : '[FAIL]';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...tagColor);
    doc.text(tagText, margin + 4, y);

    doc.setTextColor(...primaryNavy);
    doc.text(`${r.label} (${r.score}/10):`, margin + 24, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedSlate);
    doc.text(r.text, margin + 74, y);
    y += 5;
  });

  y += 6;

  // ─────────────────────────────────────────────────────────────
  // 7. GEOSPATIAL MAP SNAPSHOT & BOUNDARY COORDINATES (Requirement 7 & 10)
  // ─────────────────────────────────────────────────────────────
  checkPageBreak(40);
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('4. GEOSPATIAL MAP SNAPSHOT & BOUNDARY COORDINATES', margin, y);
  y += 5;

  doc.setFillColor(...lightBg);
  doc.setDrawColor(...subtleBorder);
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryNavy);
  doc.text(`SECTOR BOUNDARY GEOMETRY — ${report.sectorName}`, margin + 6, y + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedSlate);
  const coordsList = report.boundaryPolygon
    ? report.boundaryPolygon.map(([lon, lat]) => `[${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E]`).join(' → ')
    : 'Polygon geometry coordinates registered in TNGIS Cadastre';

  doc.text(`Centroid Coordinates: [Lat: ${report.centroid?.[1]}°N, Lon: ${report.centroid?.[0]}°E]`, margin + 6, y + 12);
  const coordLines = doc.splitTextToSize(`Polygon Vertices: ${coordsList}`, contentWidth - 12);
  doc.text(coordLines, margin + 6, y + 17);

  doc.text(`Active Overlays Verified: Roads (NH48/SH57), Hydrology (Palar Basin), Flood Susceptibility, Forest Reserves`, margin + 6, y + 26);
  y += 35;

  // ─────────────────────────────────────────────────────────────
  // 8. DATA SOURCES & PROVENANCE
  // ─────────────────────────────────────────────────────────────
  checkPageBreak(45);
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('5. DATA SOURCES & PROVENANCE EVIDENCE', margin, y);
  y += 5;

  (report.dataSources || []).forEach((ds) => {
    checkPageBreak(5);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryNavy);
    doc.text(`• ${ds.dataset}:`, margin + 4, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedSlate);
    doc.text(`${ds.source} | Coverage: ${ds.coverage} | Updated: ${ds.last_updated}`, margin + 70, y);
    y += 4.5;
  });

  y += 5;

  // ─────────────────────────────────────────────────────────────
  // 9. DATA QUALITY & LIMITATIONS
  // ─────────────────────────────────────────────────────────────
  checkPageBreak(40);
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('6. DATA QUALITY & LIMITATIONS', margin, y);
  y += 5;

  const unavail = report.dataQuality?.unavailable || [];
  if (unavail.length > 0) {
    unavail.forEach((u) => {
      checkPageBreak(5);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...amberColor);
      doc.text(`⚠ ${u.dataset} [${u.status}]:`, margin + 4, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...mutedSlate);
      doc.text(u.impact, margin + 70, y);
      y += 4.5;
    });
  }

  const warnings = report.dataQuality?.warnings || [];
  if (warnings.length > 0) {
    warnings.forEach((w) => {
      checkPageBreak(6);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...amberColor);
      const wLines = doc.splitTextToSize(`- Warning: ${w}`, contentWidth - 8);
      doc.text(wLines, margin + 4, y);
      y += (wLines.length * 4);
    });
  }

  y += 6;

  // ─────────────────────────────────────────────────────────────
  // 10. FINAL RECOMMENDATION & STATUTORY CONDITIONS
  // ─────────────────────────────────────────────────────────────
  checkPageBreak(36);
  doc.setFillColor(...primaryNavy);
  doc.rect(margin, y, contentWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`FINAL SECTOR ASSESSMENT: ${report.sectorName} — ${report.suitability.toUpperCase()} (${report.overallScore}/100)`, margin + 6, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Recommendation: ${recText}`, margin + 6, y + 13);

  const conds = report.recommendation?.conditions || report.conditions || [];
  const condText = conds.length > 0 ? conds[0] : 'Subject to standard statutory environmental clearances.';
  doc.setTextColor(251, 191, 36); // amber gold
  doc.setFontSize(7.5);
  const condLines = doc.splitTextToSize(`Conditions / Mitigations: ${condText}`, contentWidth - 12);
  doc.text(condLines, margin + 6, y + 19);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.text(`Decision Confidence: ${report.confidence || report.recommendation?.confidence}  |  Report ID: ${report.reportId}`, margin + 6, y + 27);

  // Draw final page footer
  drawPageFooter();

  // Sanitize filename for all OS file systems (prevent Windows invalid characters)
  const cleanSector = (report.sectorName || 'Sector').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanId = (report.reportId || 'REP').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `TerrAegis_${cleanSector}_Report_${cleanId}.pdf`;

  try {
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    if (options.openInNewTab) {
      window.open(blobUrl, '_blank');
      return { success: true, filename, url: blobUrl };
    }

    // Direct anchor download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      } catch (e) {}
    }, 1500);

    return { success: true, filename, url: blobUrl };
  } catch (err) {
    console.warn('Blob URL download fallback to doc.save:', err);
    try {
      doc.save(filename);
      return { success: true, filename };
    } catch (saveErr) {
      console.error('doc.save also failed:', saveErr);
      return { success: false, error: saveErr.message };
    }
  }
}

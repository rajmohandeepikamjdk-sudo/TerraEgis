import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const CRITERIA_ORDER = [
  { key: 'population', label: 'Population' },
  { key: 'transport', label: 'Transport' },
  { key: 'disaster', label: 'Disaster' },
  { key: 'water', label: 'Water Res.' },
  { key: 'forest', label: 'Forest/Nature' },
  { key: 'wildlife', label: 'Wildlife' },
  { key: 'land', label: 'Land Ownership' },
  { key: 'benefits', label: 'Local Benefits' },
  { key: 'interproject', label: 'Inter-project' },
];

export default function ScoreRadar({ criterionScores, candidateName, scoreColor }) {
  if (!criterionScores) return null;

  const labels = CRITERIA_ORDER.map(c => c.label);
  const dataValues = CRITERIA_ORDER.map(c => criterionScores[c.key] || 0);

  const data = {
    labels,
    datasets: [
      {
        label: `${candidateName} Score`,
        data: dataValues,
        backgroundColor: 'rgba(5, 150, 105, 0.12)',
        borderColor: scoreColor || '#059669',
        borderWidth: 2,
        pointBackgroundColor: scoreColor || '#059669',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: scoreColor || '#059669',
        pointRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: '#cbd5e1' },
        grid: { color: '#e2e8f0' },
        pointLabels: {
          color: '#334155',
          font: { size: 10, family: "'Inter', sans-serif", weight: '600' },
        },
        ticks: { display: false },
        min: 0,
        max: 10,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#0f172a',
        bodyColor: '#059669',
        borderColor: '#cbd5e1',
        borderWidth: 1,
        padding: 8,
        callbacks: {
          label: (context) => `Score: ${context.raw} / 10`,
        },
      },
    },
  };

  try {
    return (
      <div style={{ height: '210px', width: '100%', position: 'relative' }}>
        <Radar data={data} options={options} />
      </div>
    );
  } catch (err) {
    console.warn('Radar chart render exception fallback:', err);
    return (
      <div style={{ padding: '10px', fontSize: '11px', color: '#64748b' }}>
        Radar breakdown unavailable.
      </div>
    );
  }
}

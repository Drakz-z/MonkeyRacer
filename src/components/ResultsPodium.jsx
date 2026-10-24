import React, { useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function Stat({ label, value, title, big = false, children }) {
  return (
    <div className="result-stat" title={title}>
      <div className="result-stat-label">{label}</div>
      <div className={big ? 'result-stat-big' : 'result-stat-value'}>{children ?? value}</div>
    </div>
  );
}

// Solo test results, laid out like Monkeytype's result screen
export default function ResultsPodium({ stats, testLabel = '', onPlayAgain }) {
  useEffect(() => {
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: [cssVar('--main-color', '#e2b714'), '#ffffff'],
    });
  }, []);

  // Enter or Tab starts the next test
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        onPlayAgain?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onPlayAgain]);

  const timeline = stats?.timeline || [];
  const chars = stats?.characters || {};

  const { data, options } = useMemo(() => {
    const main = cssVar('--main-color', '#e2b714');
    const sub = cssVar('--sub-color', '#646669');
    const text = cssVar('--text-color', '#d1d0c5');
    const error = cssVar('--error-color', '#ca4754');
    const subAlt = cssVar('--sub-alt-color', '#2c2e31');
    const labels = timeline.map((t) => t.second);
    const maxErrors = Math.max(1, ...timeline.map((t) => t.errors));

    return {
      data: {
        labels,
        datasets: [
          {
            type: 'line',
            label: 'wpm',
            data: timeline.map((t) => t.wpm),
            borderColor: main,
            backgroundColor: `${main}26`,
            fill: true,
            tension: 0.35,
            pointRadius: 2,
            borderWidth: 3,
            yAxisID: 'y',
            order: 2,
          },
          {
            type: 'line',
            label: 'raw',
            data: timeline.map((t) => t.rawWpm),
            borderColor: sub,
            fill: false,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
            yAxisID: 'y',
            order: 3,
          },
          {
            type: 'line',
            label: 'errors',
            data: timeline.map((t) => (t.errors > 0 ? t.errors : null)),
            borderColor: error,
            backgroundColor: error,
            showLine: false,
            pointStyle: 'crossRot',
            pointRadius: 4,
            pointBorderWidth: 2,
            yAxisID: 'y2',
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: subAlt,
            titleColor: main,
            bodyColor: text,
            callbacks: { title: (items) => `${items[0].label}s` },
          },
        },
        scales: {
          x: { grid: { color: `${sub}26` }, ticks: { color: sub } },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Words per Minute', color: sub },
            grid: { color: `${sub}26` },
            ticks: { color: sub, precision: 0 },
          },
          y2: {
            position: 'right',
            beginAtZero: true,
            max: maxErrors,
            title: { display: true, text: 'Errors', color: sub },
            grid: { display: false },
            ticks: { color: sub, precision: 0 },
          },
        },
      },
    };
  }, [timeline]);

  return (
    <div className="results-card">
      <div className="result-main">
        <div className="result-headline">
          <Stat label="wpm" big title={`${stats?.wpm || 0} wpm (raw ${stats?.rawWpm || 0})`}>
            {stats?.wpm || 0}
          </Stat>
          <Stat label="acc" big title={`${stats?.accuracy ?? 100}% accuracy`}>
            {stats?.accuracy ?? 100}%
          </Stat>
        </div>

        <div className="result-chart">
          {timeline.length > 1 ? (
            <Chart type="line" data={data} options={options} />
          ) : (
            <div style={{ color: 'var(--sub-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              Test too short for a graph
            </div>
          )}
        </div>
      </div>

      <div className="result-row">
        {testLabel && <Stat label="test type" value={testLabel} />}
        <Stat label="raw" value={stats?.rawWpm || 0} title="Raw WPM: every character typed, including mistakes" />
        <Stat
          label="characters"
          title="correct / incorrect / extra / missed"
          value={`${chars.correct || 0}/${chars.incorrect || 0}/${chars.extra || 0}/${chars.missed || 0}`}
        />
        <Stat label="consistency" value={`${stats?.consistency ?? 100}%`} title="How steady your typing speed was" />
        <Stat label="time" value={`${Math.round(stats?.time || 0)}s`} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <button className="btn-primary" onClick={onPlayAgain}>
          <RotateCcw size={18} />
          <span>Next Test</span>
        </button>
        <span style={{ fontSize: '0.75rem', color: 'var(--sub-color)' }}>
          or press <kbd className="kbd-hint">Tab</kbd> / <kbd className="kbd-hint">Enter</kbd>
        </span>
      </div>
    </div>
  );
}

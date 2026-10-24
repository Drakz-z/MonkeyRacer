import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Share2, Medal, CheckCircle2, ArrowRight } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ResultsPodium({
  stats,
  isRace = false,
  participants = [],
  selfId,
  isHost,
  onPlayAgain,
}) {
  // Fire confetti celebration
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e2b714', '#00ffc2', '#bd93f9', '#ffffff'],
    });
  }, []);

  // Find top 3 racers for the podium
  const sortedRacers = [...participants].sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank;
    if (a.isFinished && !b.isFinished) return -1;
    if (!a.isFinished && b.isFinished) return 1;
    return (b.wpm || 0) - (a.wpm || 0);
  });

  const first = sortedRacers[0];
  const second = sortedRacers[1];
  const third = sortedRacers[2];

  const selfRacer = participants.find((p) => p.id === selfId);
  const selfRank = selfRacer?.rank || sortedRacers.findIndex((p) => p.id === selfId) + 1;

  // Chart data
  const timeline = stats?.timeline || [];
  const chartLabels = timeline.map((t) => `${t.second}s`);
  const wpmData = timeline.map((t) => t.wpm);
  const rawWpmData = timeline.map((t) => t.rawWpm);

  const chartData = {
    labels: chartLabels.length > 0 ? chartLabels : ['1s', '2s', '3s', '4s', '5s'],
    datasets: [
      {
        label: 'WPM',
        data: wpmData.length > 0 ? wpmData : [stats?.wpm || 0],
        borderColor: '#e2b714',
        backgroundColor: 'rgba(226, 183, 20, 0.15)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Raw WPM',
        data: rawWpmData.length > 0 ? rawWpmData : [stats?.rawWpm || 0],
        borderColor: '#646669',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.3,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#d1d0c5', font: { family: 'Outfit', size: 12 } },
      },
      tooltip: {
        backgroundColor: '#2c2e31',
        titleColor: '#e2b714',
        bodyColor: '#d1d0c5',
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(100, 102, 105, 0.15)' },
        ticks: { color: '#646669' },
      },
      y: {
        grid: { color: 'rgba(100, 102, 105, 0.15)' },
        ticks: { color: '#646669' },
      },
    },
  };

  return (
    <div className="results-card">
      {/* Race Winner & Podium */}
      {isRace && sortedRacers.length > 1 && (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(226, 183, 20, 0.15)', padding: '0.4rem 1.2rem', borderRadius: '999px', color: 'var(--main-color)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            <Trophy size={18} />
            <span>Race Finished • You Ranked #{selfRank} of {participants.length}!</span>
          </div>

          <div className="podium-container">
            {/* 2nd Place */}
            {second && (
              <div className="podium-step second">
                <div className="podium-user">
                  <div style={{ fontSize: '1.5rem' }}>🥈</div>
                  <div className="podium-username">{second.username}</div>
                  <div className="podium-wpm">{second.wpm} wpm</div>
                </div>
                <div className="podium-pillar">2</div>
              </div>
            )}

            {/* 1st Place */}
            {first && (
              <div className="podium-step first">
                <div className="podium-user">
                  <div style={{ fontSize: '2rem' }}>👑</div>
                  <div className="podium-username" style={{ color: 'var(--main-color)', fontWeight: 800 }}>
                    {first.username}
                  </div>
                  <div className="podium-wpm" style={{ fontSize: '1rem', fontWeight: 700 }}>
                    {first.wpm} wpm
                  </div>
                </div>
                <div className="podium-pillar">1</div>
              </div>
            )}

            {/* 3rd Place */}
            {third && (
              <div className="podium-step third">
                <div className="podium-user">
                  <div style={{ fontSize: '1.5rem' }}>🥉</div>
                  <div className="podium-username">{third.username}</div>
                  <div className="podium-wpm">{third.wpm} wpm</div>
                </div>
                <div className="podium-pillar">3</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Monkeytype Signature Stats Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
        textAlign: 'center',
      }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--sub-color)', textTransform: 'uppercase', fontWeight: 600 }}>wpm</div>
          <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--main-color)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>
            {stats?.wpm || 0}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--sub-color)', textTransform: 'uppercase', fontWeight: 600 }}>acc</div>
          <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--main-color)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>
            {stats?.accuracy || 100}%
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--sub-color)', textTransform: 'uppercase', fontWeight: 600 }}>raw wpm</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-color)', fontFamily: 'var(--font-mono)', marginTop: '0.5rem' }}>
            {stats?.rawWpm || stats?.wpm || 0}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--sub-color)', textTransform: 'uppercase', fontWeight: 600 }}>time</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-color)', fontFamily: 'var(--font-mono)', marginTop: '0.5rem' }}>
            {stats?.time || 0}s
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--sub-color)', textTransform: 'uppercase', fontWeight: 600 }}>characters</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-color)', fontFamily: 'var(--font-mono)', marginTop: '0.9rem' }}>
            <span style={{ color: 'var(--text-color)' }}>{stats?.characters?.correct || 0}</span> /{' '}
            <span style={{ color: 'var(--error-color)' }}>{stats?.errors || 0}</span>
          </div>
        </div>
      </div>

      {/* Chart.js WPM Graph */}
      {timeline.length > 1 && (
        <div style={{ height: '220px', width: '100%', marginBottom: '2rem' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={onPlayAgain}>
          <RotateCcw size={18} />
          <span>{isRace ? (isHost ? 'Start New Race' : 'Back to Lobby') : 'Play Again'}</span>
        </button>
      </div>
    </div>
  );
}

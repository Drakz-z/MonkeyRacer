import React, { useState } from 'react';
import { Trophy, Search, Smartphone, Monitor, Bot, User, CheckCircle2 } from 'lucide-react';

export default function LiveLeaderboard({ participants = [], selfId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Sort participants by finished rank, then progress, then wpm
  const sorted = [...participants].sort((a, b) => {
    if (a.isFinished && !b.isFinished) return -1;
    if (!a.isFinished && b.isFinished) return 1;
    if (a.isFinished && b.isFinished) return (a.rank || 999) - (b.rank || 999);
    if ((b.progress || 0) !== (a.progress || 0)) {
      return (b.progress || 0) - (a.progress || 0);
    }
    return (b.wpm || 0) - (a.wpm || 0);
  });

  const filtered = sorted.filter((p) =>
    p.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentView = filtered.slice((page - 1) * pageSize, page * pageSize);

  const selfRacer = participants.find((p) => p.id === selfId);
  const selfRankIndex = sorted.findIndex((p) => p.id === selfId);

  return (
    <div className="leaderboard-container">
      {/* Header & Search */}
      <div className="leaderboard-toolbar">
        <div className="leaderboard-title">
          <Trophy size={20} color="var(--main-color)" />
          <span style={{ color: 'var(--text-color)' }}>
            Live Leaderboard ({participants.length} Racers)
          </span>
        </div>

        <div className="search-input-box">
          <Search size={15} color="var(--sub-color)" />
          <input
            type="text"
            placeholder="Search racer..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Rank</th>
              <th>Racer</th>
              <th style={{ width: '80px' }}>Device</th>
              <th style={{ width: '150px' }}>Progress</th>
              <th style={{ textAlign: 'right', width: '90px' }}>Speed</th>
              <th style={{ textAlign: 'right', width: '80px' }}>Acc</th>
            </tr>
          </thead>
          <tbody>
            {currentView.map((racer) => {
              const isSelf = racer.id === selfId;
              const overallRank = sorted.findIndex((p) => p.id === racer.id) + 1;
              const rank = racer.rank || overallRank;

              return (
                <tr
                  key={racer.id}
                  className={`leaderboard-row ${isSelf ? 'is-self' : ''}`}
                >
                  {/* Rank Badge */}
                  <td>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background:
                          rank === 1
                            ? '#ffd700'
                            : rank === 2
                            ? '#c0c0c0'
                            : rank === 3
                            ? '#cd7f32'
                            : 'rgba(255,255,255,0.06)',
                        color: rank <= 3 ? '#111' : 'var(--text-color)',
                      }}
                    >
                      {rank === 1 ? '🥇 1' : rank === 2 ? '🥈 2' : rank === 3 ? '🥉 3' : `#${rank}`}
                    </span>
                  </td>

                  {/* Racer Name & Avatar */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: racer.color || 'var(--main-color)',
                          color: '#111',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {racer.username.slice(0, 1).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: isSelf ? 'var(--main-color)' : 'var(--text-color)' }}>
                        {racer.username} {isSelf && '(You)'}
                      </span>
                      {racer.isHost && (
                        <span style={{ fontSize: '0.65rem', background: 'var(--sub-alt-color)', border: '1px solid var(--sub-color)', padding: '1px 5px', borderRadius: '4px', color: 'var(--sub-color)' }}>
                          HOST
                        </span>
                      )}
                      {racer.isFinished && (
                        <CheckCircle2 size={15} color="#4caf50" title="Finished!" />
                      )}
                    </div>
                  </td>

                  {/* Device type */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--sub-color)', fontSize: '0.8rem' }}>
                      {racer.isBot ? (
                        <><Bot size={14} /> Bot</>
                      ) : racer.device === 'mobile' ? (
                        <><Smartphone size={14} /> Phone</>
                      ) : (
                        <><Monitor size={14} /> PC</>
                      )}
                    </div>
                  </td>

                  {/* Progress Bar */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        flex: 1,
                        height: 7,
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${racer.progress || 0}%`,
                          height: '100%',
                          background: isSelf ? 'var(--main-color)' : (racer.color || 'var(--sub-color)'),
                          borderRadius: '4px',
                          transition: 'width 0.15s ease'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--sub-color)', minWidth: '35px' }}>
                        {racer.progress || 0}%
                      </span>
                    </div>
                  </td>

                  {/* Speed */}
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--main-color)' }}>
                    {racer.wpm || 0} <span style={{ fontSize: '0.7rem', color: 'var(--sub-color)', fontWeight: 500 }}>wpm</span>
                  </td>

                  {/* Accuracy */}
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-color)' }}>
                    {racer.accuracy !== undefined ? `${racer.accuracy}%` : '100%'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
          <button
            className="btn-secondary"
            style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span style={{ fontSize: '0.82rem', color: 'var(--sub-color)', fontFamily: 'var(--font-mono)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn-secondary"
            style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

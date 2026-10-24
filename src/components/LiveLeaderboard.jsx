import React, { useState } from 'react';
import { Trophy, Search, Smartphone, Monitor, Bot, WifiOff, ChevronDown, ChevronUp } from 'lucide-react';
import { rankParticipants } from '../utils/room';

export const LEADERBOARD_METRICS = [
  { key: 'bestWpm', label: 'Best WPM', unit: 'wpm' },
  { key: 'avgWpm', label: 'Average WPM', unit: 'wpm' },
  { key: 'avgAcc', label: 'Accuracy', unit: '%' },
  { key: 'testsCompleted', label: 'Tests Done', unit: 'tests' },
];

function RankBadge({ rank }) {
  return (
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
          rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : 'rgba(255,255,255,0.06)',
        color: rank <= 3 ? '#111' : 'var(--text-color)',
      }}
    >
      {rank === 1 ? '🥇 1' : rank === 2 ? '🥈 2' : rank === 3 ? '🥉 3' : `#${rank}`}
    </span>
  );
}

export default function LiveLeaderboard({
  participants = [],
  selfId,
  title = 'Live Leaderboard',
  metric: controlledMetric,
  showMetricTabs = false,
  showLive = true,
  expandable = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [metric, setMetric] = useState(controlledMetric || 'bestWpm');
  const [expandedId, setExpandedId] = useState(null);
  const pageSize = 15;

  const ranked = rankParticipants(participants, metric);
  const filtered = ranked.filter((p) => p.username.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentView = filtered.slice((page - 1) * pageSize, page * pageSize);
  const colSpan = showLive ? 8 : 7;

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-toolbar">
        <div className="leaderboard-title">
          <Trophy size={20} color="var(--main-color)" />
          <span style={{ color: 'var(--text-color)' }}>
            {title} ({participants.length} Racers)
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

      {showMetricTabs && (
        <div className="config-group" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
          {LEADERBOARD_METRICS.map((m) => (
            <button
              key={m.key}
              className={`config-btn ${metric === m.key ? 'active' : ''}`}
              onClick={() => {
                setMetric(m.key);
                setPage(1);
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Rank</th>
              <th>Racer</th>
              <th style={{ width: '70px' }}>Device</th>
              <th style={{ textAlign: 'right', width: '80px' }}>Best</th>
              <th style={{ textAlign: 'right', width: '80px' }}>Avg</th>
              <th style={{ textAlign: 'right', width: '70px' }}>Acc</th>
              <th style={{ textAlign: 'right', width: '60px' }}>Tests</th>
              {showLive && <th style={{ width: '140px' }}>Now</th>}
            </tr>
          </thead>
          <tbody>
            {currentView.map((racer) => {
              const isSelf = racer.id === selfId;
              const rank = ranked.findIndex((p) => p.id === racer.id) + 1;
              const isExpanded = expandable && expandedId === racer.id;
              const hasTests = racer.testsCompleted > 0;

              return (
                <React.Fragment key={racer.id}>
                  <tr
                    className={`leaderboard-row ${isSelf ? 'is-self' : ''}`}
                    onClick={expandable ? () => setExpandedId(isExpanded ? null : racer.id) : undefined}
                    style={{ cursor: expandable ? 'pointer' : 'default', opacity: racer.connected === false ? 0.6 : 1 }}
                  >
                    <td>{hasTests ? <RankBadge rank={rank} /> : <span style={{ color: 'var(--sub-color)' }}>—</span>}</td>

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
                        {racer.connected === false && <WifiOff size={14} color="var(--sub-color)" title="Left the room" />}
                        {expandable && hasTests && (isExpanded ? <ChevronUp size={14} color="var(--sub-color)" /> : <ChevronDown size={14} color="var(--sub-color)" />)}
                      </div>
                    </td>

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

                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: metric === 'bestWpm' ? 'var(--main-color)' : 'var(--text-color)' }}>
                      {racer.bestWpm || 0}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: metric === 'avgWpm' ? 'var(--main-color)' : 'var(--text-color)' }}>
                      {racer.avgWpm || 0}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: metric === 'avgAcc' ? 'var(--main-color)' : 'var(--text-color)' }}>
                      {hasTests ? `${racer.avgAcc}%` : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: metric === 'testsCompleted' ? 'var(--main-color)' : 'var(--sub-color)' }}>
                      {racer.testsCompleted || 0}
                    </td>

                    {showLive && (
                      <td>
                        {racer.live ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, height: 7, background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${racer.live.progress || 0}%`,
                                height: '100%',
                                background: isSelf ? 'var(--main-color)' : (racer.color || 'var(--sub-color)'),
                                borderRadius: '4px',
                                transition: 'width 0.3s ease',
                              }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--sub-color)', minWidth: '48px', textAlign: 'right' }}>
                              {racer.live.wpm} wpm
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--sub-color)' }}>
                            {racer.connected === false ? 'left' : 'idle'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>

                  {isExpanded && hasTests && racer.tests && (
                    <tr>
                      <td colSpan={colSpan} style={{ background: 'rgba(0,0,0,0.18)', padding: '0.75rem 1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--sub-color)', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: 600 }}>
                          {racer.username}'s tests
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {racer.tests.map((t, i) => (
                            <span
                              key={i}
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.78rem',
                                padding: '0.25rem 0.55rem',
                                borderRadius: '6px',
                                border: '1px solid var(--card-border)',
                                color: t.wpm === racer.bestWpm ? 'var(--main-color)' : 'var(--text-color)',
                              }}
                            >
                              #{i + 1}: {t.wpm} wpm · {t.accuracy}%
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

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

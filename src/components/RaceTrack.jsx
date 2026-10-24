import React from 'react';
import { Flag, Trophy, Users, Smartphone, Monitor } from 'lucide-react';

export default function RaceTrack({ participants = [], selfId }) {
  // Sort racers by progress descending, or if finished, by rank
  const sortedRacers = [...participants].sort((a, b) => {
    if (a.isFinished && !b.isFinished) return -1;
    if (!a.isFinished && b.isFinished) return 1;
    if (a.isFinished && b.isFinished) return (a.rank || 999) - (b.rank || 999);
    return (b.progress || 0) - (a.progress || 0);
  });

  const selfRacer = participants.find((p) => p.id === selfId);
  const selfRankIndex = sortedRacers.findIndex((p) => p.id === selfId);

  // If there are more than 5 racers, show top 4 + self lane (if not already in top 4)
  const isLargePack = sortedRacers.length > 5;
  let displayRacers = sortedRacers;
  let showStickySelf = false;

  if (isLargePack) {
    displayRacers = sortedRacers.slice(0, 4);
    if (selfRankIndex >= 4 && selfRacer) {
      showStickySelf = true;
    }
  }

  return (
    <div className="race-track-card">
      <div className="track-header">
        <div className="track-title">
          <Flag size={18} color="var(--main-color)" />
          <span>Live Race Track</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="track-pill">
            <Users size={14} />
            <span>{participants.length} Racers on Track</span>
          </div>
          {selfRankIndex !== -1 && (
            <div className="track-pill" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-color)' }}>
              <span>Your Rank: #{selfRankIndex + 1}</span>
            </div>
          )}
        </div>
      </div>

      {/* Cluster Track for 200 racers: overview track showing all racers as dots */}
      {participants.length > 8 && (
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          borderRadius: '8px',
          padding: '0.6rem 0.8rem',
          marginBottom: '0.85rem',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--sub-color)', marginBottom: '4px' }}>
            <span>START</span>
            <span>200-RACER PACK OVERVIEW</span>
            <span>🏁 FINISH</span>
          </div>
          <div style={{
            height: '14px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '10px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {participants.map((p) => {
              const isSelf = p.id === selfId;
              return (
                <div
                  key={p.id}
                  title={`${p.username}: ${p.progress || 0}% (${p.wpm || 0} WPM)`}
                  style={{
                    position: 'absolute',
                    left: `${Math.min(98, Math.max(0, p.progress || 0))}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: isSelf ? 10 : 6,
                    height: isSelf ? 10 : 6,
                    borderRadius: '50%',
                    backgroundColor: isSelf ? 'var(--main-color)' : (p.color || '#fff'),
                    boxShadow: isSelf ? '0 0 8px var(--main-color)' : 'none',
                    zIndex: isSelf ? 10 : 2,
                    transition: 'left 0.15s linear',
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Main Racer Lanes */}
      <div className="track-lanes-container">
        {displayRacers.map((racer, index) => {
          const isSelf = racer.id === selfId;
          const rank = racer.rank || (index + 1);
          return (
            <RacerLaneItem
              key={racer.id}
              racer={racer}
              isSelf={isSelf}
              rank={rank}
            />
          );
        })}

        {/* Sticky Self Lane if user is further behind */}
        {showStickySelf && selfRacer && (
          <>
            <div style={{ textAlign: 'center', color: 'var(--sub-color)', fontSize: '0.8rem', padding: '0.1rem' }}>
              ••• {selfRankIndex - 3} racers between •••
            </div>
            <RacerLaneItem
              racer={selfRacer}
              isSelf={true}
              rank={selfRankIndex + 1}
            />
          </>
        )}
      </div>
    </div>
  );
}

function RacerLaneItem({ racer, isSelf, rank }) {
  const avatarEmoji = isSelf ? '👑' : (racer.isBot ? '🤖' : '🐵');
  const rankClass = rank === 1 ? 'top-1' : rank === 2 ? 'top-2' : rank === 3 ? 'top-3' : '';

  return (
    <div className={`racer-lane ${isSelf ? 'self-lane' : ''}`}>
      {/* Racer Identity */}
      <div className="lane-info">
        <span className={`lane-rank-badge ${rankClass}`}>
          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
        </span>

        <div className="lane-avatar" style={{ backgroundColor: racer.color || 'var(--main-color)' }}>
          {racer.username?.slice(0, 1).toUpperCase()}
        </div>

        <div style={{ overflow: 'hidden', minWidth: 0 }}>
          <div className="lane-name">
            {racer.username} {isSelf && '(You)'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: 'var(--sub-color)' }}>
            {racer.device === 'mobile' ? <Smartphone size={10} /> : <Monitor size={10} />}
            <span>{racer.isBot ? 'Bot' : (racer.device === 'mobile' ? 'Mobile' : 'Desktop')}</span>
          </div>
        </div>
      </div>

      {/* Progress Track */}
      <div className="lane-progress-track">
        <div
          className="lane-progress-bar"
          style={{
            width: `${Math.min(100, Math.max(0, racer.progress || 0))}%`,
            background: isSelf
              ? 'linear-gradient(90deg, rgba(226, 183, 20, 0.4), var(--main-color))'
              : `linear-gradient(90deg, rgba(255, 255, 255, 0.2), ${racer.color || 'var(--sub-color)'})`,
          }}
        >
          <div className="racer-avatar-marker">
            {avatarEmoji}
          </div>
        </div>
      </div>

      {/* Live Stats */}
      <div className="lane-stats">
        <div className="lane-wpm">{racer.wpm || 0} wpm</div>
        <div style={{ color: 'var(--sub-color)', fontSize: '0.75rem' }}>
          {racer.progress || 0}%
        </div>
      </div>
    </div>
  );
}

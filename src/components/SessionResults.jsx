import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Play, Target, Gauge, Zap } from 'lucide-react';
import LiveLeaderboard from './LiveLeaderboard';
import NameEditor from './NameEditor';
import { rankParticipants } from '../utils/room';

function PodiumStep({ racer, place }) {
  if (!racer) return null;
  const cls = place === 1 ? 'first' : place === 2 ? 'second' : 'third';
  const icon = place === 1 ? '👑' : place === 2 ? '🥈' : '🥉';
  return (
    <div className={`podium-step ${cls}`}>
      <div className="podium-user">
        <div style={{ fontSize: place === 1 ? '2rem' : '1.5rem' }}>{icon}</div>
        <div className="podium-username" style={place === 1 ? { color: 'var(--main-color)', fontWeight: 800 } : undefined}>
          {racer.username}
        </div>
        <div className="podium-wpm" style={place === 1 ? { fontSize: '1rem', fontWeight: 700 } : undefined}>
          {racer.bestWpm} wpm
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--sub-color)' }}>{racer.avgAcc}% acc</div>
      </div>
      <div className="podium-pillar">{place}</div>
    </div>
  );
}

function AwardCard({ icon, label, racer, value }) {
  return (
    <div style={{
      flex: '1 1 180px',
      background: 'rgba(0,0,0,0.18)',
      border: '1px solid var(--card-border)',
      borderRadius: '12px',
      padding: '0.85rem 1rem',
      textAlign: 'left',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--sub-color)', textTransform: 'uppercase', fontWeight: 600 }}>
        {icon} {label}
      </div>
      <div style={{ fontWeight: 700, color: 'var(--text-color)', marginTop: '0.3rem' }}>{racer ? racer.username : '—'}</div>
      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--main-color)', fontWeight: 700 }}>{racer ? value(racer) : ''}</div>
    </div>
  );
}

export default function SessionResults({ room, onRaceAgain, onBackToLobby, onLeave, onRename }) {
  const { participants, selfId, isHost, config } = room;
  const ranked = rankParticipants(participants, 'bestWpm').filter((p) => p.testsCompleted > 0);
  const [first, second, third] = ranked;
  const selfRank = ranked.findIndex((p) => p.id === selfId) + 1;
  const self = participants.find((p) => p.id === selfId);

  const topBy = (metric) => rankParticipants(participants, metric).find((p) => p.testsCompleted > 0);

  useEffect(() => {
    if (ranked.length === 0) return;
    confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.55 },
      colors: ['#e2b714', '#00ffc2', '#bd93f9', '#ffffff'],
    });
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: '1150px', margin: '0 auto' }}>
      <div className="results-card" style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(226, 183, 20, 0.15)', padding: '0.4rem 1.2rem', borderRadius: '999px', color: 'var(--main-color)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          <Trophy size={18} />
          <span>
            Race Finished • {config.sessionMinutes} min of {config.testSeconds}s tests
            {selfRank > 0 ? ` • You ranked #${selfRank} of ${ranked.length}` : ' • You completed no full tests'}
          </span>
        </div>

        {ranked.length > 0 ? (
          <div className="podium-container">
            <PodiumStep racer={second} place={2} />
            <PodiumStep racer={first} place={1} />
            <PodiumStep racer={third} place={3} />
          </div>
        ) : (
          <div style={{ color: 'var(--sub-color)', padding: '2rem 0' }}>
            Nobody completed a full test this round.
          </div>
        )}

        {self && self.testsCompleted > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '1rem',
            margin: '1.5rem 0',
          }}>
            {[
              { label: 'best wpm', value: self.bestWpm, big: true },
              { label: 'avg wpm', value: self.avgWpm },
              { label: 'avg acc', value: `${self.avgAcc}%` },
              { label: 'tests', value: self.testsCompleted },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: '0.8rem', color: 'var(--sub-color)', textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: s.big ? '3rem' : '2.2rem', fontWeight: 800, color: s.big ? 'var(--main-color)' : 'var(--text-color)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {ranked.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', margin: '1rem 0 1.5rem' }}>
            <AwardCard icon={<Zap size={14} />} label="Fastest" racer={topBy('bestWpm')} value={(r) => `${r.bestWpm} wpm`} />
            <AwardCard icon={<Gauge size={14} />} label="Most consistent" racer={topBy('avgWpm')} value={(r) => `${r.avgWpm} wpm avg`} />
            <AwardCard icon={<Target size={14} />} label="Most accurate" racer={topBy('avgAcc')} value={(r) => `${r.avgAcc}% acc`} />
            <AwardCard icon={<Play size={14} />} label="Most tests" racer={topBy('testsCompleted')} value={(r) => `${r.testsCompleted} tests`} />
          </div>
        )}

        {self && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <NameEditor name={self.username} onRename={onRename} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {isHost ? (
            <>
              <button className="btn-primary" onClick={onRaceAgain}>
                <Play size={18} />
                <span>Race Again</span>
              </button>
              <button className="btn-secondary" onClick={onBackToLobby}>
                <RotateCcw size={18} />
                <span>Back to Lobby</span>
              </button>
            </>
          ) : (
            <div style={{ color: 'var(--sub-color)', fontSize: '0.9rem', alignSelf: 'center' }}>
              Waiting for the host to start the next race…
            </div>
          )}
          <button className="btn-secondary" onClick={onLeave}>
            <span>Leave Room</span>
          </button>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <LiveLeaderboard
          participants={participants}
          selfId={selfId}
          title="Final Leaderboard"
          showMetricTabs
          showLive={false}
          expandable
        />
        <div style={{ fontSize: '0.75rem', color: 'var(--sub-color)', textAlign: 'center', marginTop: '0.5rem' }}>
          Switch categories above · click a racer to see every test they completed
        </div>
      </div>
    </div>
  );
}

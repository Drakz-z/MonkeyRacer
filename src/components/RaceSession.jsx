import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, Flag, RotateCcw, Square, CheckCircle2, Hourglass } from 'lucide-react';
import TypingArea from './TypingArea';
import LiveLeaderboard from './LiveLeaderboard';
import { generateText } from '../utils/words';

const NEXT_TEST_DELAY_MS = 2000;

function formatClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Enough words that even very fast typists never run out before the timer
function wordsForTest(testSeconds) {
  return Math.max(60, Math.ceil(testSeconds * 4.5));
}

export default function RaceSession({
  room,
  now,
  onLive,
  onResult,
  onRestartRoom,
  onEndSession,
}) {
  const { config, status, participants, selfId, isHost } = room;
  const testMs = config.testSeconds * 1000;
  const sessionRemaining = room.sessionEndsAt ? room.sessionEndsAt - now : config.sessionMinutes * 60 * 1000;
  const countdownRemaining = room.countdownEndsAt ? room.countdownEndsAt - now : 0;

  const [testKey, setTestKey] = useState(0);
  const [testText, setTestText] = useState(() => generateText(config.type, wordsForTest(config.testSeconds)));
  const [phase, setPhase] = useState('ready'); // 'ready' | 'typing' | 'cooldown'
  const [myTests, setMyTests] = useState([]);
  const cooldownTimerRef = useRef(null);

  // New round (host restarted) → wipe local test history
  useEffect(() => {
    setMyTests([]);
    setPhase('ready');
    setTestText(generateText(config.type, wordsForTest(config.testSeconds)));
    setTestKey((k) => k + 1);
  }, [room.round, config.type, config.testSeconds]);

  useEffect(() => () => clearTimeout(cooldownTimerRef.current), []);

  const nextTest = useCallback(() => {
    setTestText(generateText(config.type, wordsForTest(config.testSeconds)));
    setTestKey((k) => k + 1);
    setPhase('ready');
  }, [config.type, config.testSeconds]);

  const handleStart = useCallback(() => setPhase('typing'), []);

  const handleProgress = useCallback((data) => {
    if (data.isFinished) return;
    onLive({ wpm: data.wpm, accuracy: data.accuracy, progress: data.progress, typing: true });
  }, [onLive]);

  const handleFinish = useCallback((stats) => {
    const result = { wpm: stats.wpm, rawWpm: stats.rawWpm, accuracy: stats.accuracy, errors: stats.errors };
    onResult(result);
    setMyTests((prev) => [...prev, { ...result, consistency: stats.consistency }]);
    setPhase('cooldown');
    clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = setTimeout(nextTest, NEXT_TEST_DELAY_MS);
  }, [onResult, nextTest]);

  // Restarting (Tab) discards the in-progress test
  const handleRestart = useCallback(() => {
    setPhase('ready');
    onLive({ wpm: 0, accuracy: 100, progress: 0, typing: false });
  }, [onLive]);

  const isRunning = status === 'running';
  // A test can only start if it fits completely inside the remaining session time
  const notEnoughTime = isRunning && phase === 'ready' && sessionRemaining < testMs;
  const lastTest = myTests[myTests.length - 1];
  const myBest = myTests.length ? Math.max(...myTests.map((t) => t.wpm)) : 0;
  const self = participants.find((p) => p.id === selfId);
  const sortedByBest = [...participants].filter((p) => p.testsCompleted > 0).sort((a, b) => b.bestWpm - a.bestWpm);
  const myRank = self && self.testsCompleted > 0 ? sortedByBest.findIndex((p) => p.id === selfId) + 1 : null;

  return (
    <div style={{ width: '100%', maxWidth: '1150px', margin: '0 auto', position: 'relative' }}>
      {/* Session status bar */}
      <div className="race-track-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--sub-color)', textTransform: 'uppercase', fontWeight: 600 }}>Race ends in</div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '2rem',
              fontWeight: 800,
              color: isRunning && sessionRemaining <= 30000 ? 'var(--error-color)' : 'var(--main-color)',
            }}>
              <Timer size={24} />
              {formatClock(sessionRemaining)}
            </div>
          </div>
          <div className="track-pill">
            <Flag size={14} />
            <span>{config.testSeconds}s tests</span>
          </div>
          <div className="track-pill" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-color)' }}>
            <span>Your best: {myBest} wpm</span>
          </div>
          <div className="track-pill" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-color)' }}>
            <span>Tests: {myTests.length}</span>
          </div>
          {myRank && (
            <div className="track-pill" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-color)' }}>
              <span>Rank #{myRank}</span>
            </div>
          )}
        </div>

        {isHost && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }} onClick={onEndSession} disabled={!isRunning}>
              <Square size={14} />
              <span>End Now</span>
            </button>
            <button className="btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }} onClick={onRestartRoom}>
              <RotateCcw size={14} />
              <span>Restart Room</span>
            </button>
          </div>
        )}
      </div>

      {status === 'countdown' && (
        <div className="countdown-screen">
          <div style={{ fontSize: '1.25rem', color: 'var(--sub-color)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '2px', marginBottom: '0.5rem' }}>
            Get Ready to Race!
          </div>
          <div className="countdown-number">{Math.max(1, Math.ceil(countdownRemaining / 1000))}</div>
        </div>
      )}

      {/* Last result banner */}
      {lastTest && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          margin: '0.5rem auto 0',
          padding: '0.5rem 1rem',
          borderRadius: '999px',
          width: 'fit-content',
          background: phase === 'cooldown' ? 'rgba(226, 183, 20, 0.15)' : 'transparent',
          color: phase === 'cooldown' ? 'var(--main-color)' : 'var(--sub-color)',
          fontWeight: 600,
          fontSize: '0.9rem',
          transition: 'all 0.3s ease',
        }}>
          <CheckCircle2 size={16} />
          <span>
            Test #{myTests.length}: {lastTest.wpm} wpm · {lastTest.accuracy}% acc · {lastTest.rawWpm} raw · {lastTest.consistency}% consistency
            {lastTest.wpm === myBest && myTests.length > 1 ? ' — new best!' : ''}
            {phase === 'cooldown' ? ' · next test starting…' : ''}
          </span>
        </div>
      )}

      {notEnoughTime ? (
        <div className="test-container" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--sub-color)' }}>
          <Hourglass size={36} color="var(--main-color)" style={{ marginBottom: '0.75rem' }} />
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-color)' }}>
            Not enough time left for another full {config.testSeconds}s test
          </div>
          <div style={{ marginTop: '0.4rem' }}>Results will appear when the race ends.</div>
        </div>
      ) : phase === 'cooldown' ? (
        <div className="test-container" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--sub-color)' }}>
          Get ready for the next test…
        </div>
      ) : (
        <TypingArea
          key={testKey}
          text={testText}
          mode="time"
          timeLimit={config.testSeconds}
          isRace={true}
          raceStarted={isRunning}
          disabled={!isRunning}
          onStart={handleStart}
          onProgressUpdate={handleProgress}
          onFinish={handleFinish}
          onRestart={handleRestart}
        />
      )}

      <div style={{ marginTop: '2rem' }}>
        <LiveLeaderboard participants={participants} selfId={selfId} title="Live Leaderboard" />
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import SoloMode from './components/SoloMode';
import RoomLobby from './components/RoomLobby';
import RaceSession from './components/RaceSession';
import SessionResults from './components/SessionResults';
import ThemeSelector from './components/ThemeSelector';
import SoundSelector from './components/SoundSelector';
import QrCodeModal from './components/QrCodeModal';
import InviteJoin from './components/InviteJoin';
import { RoomHost, RoomClient, normalizeRoomCode } from './utils/room';
import { applyTheme } from './utils/themes';
import { soundEngine } from './utils/sound';
import { loadSettings, saveSettings } from './utils/cookies';
import { PlusCircle, LogIn, Sparkles, Loader2 } from 'lucide-react';

const initialSettings = loadSettings();
// Apply saved preferences before first paint so there's no theme flash
applyTheme(initialSettings.theme);
soundEngine.setSoundType(initialSettings.soundType);
soundEngine.setVolume(initialSettings.volume);

function clearRoomParam() {
  const url = new URL(window.location.href);
  if (url.searchParams.has('room')) {
    url.searchParams.delete('room');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
  }
}

function setRoomParam(roomId) {
  const url = new URL(window.location.href);
  url.searchParams.set('room', roomId);
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
}

export default function App() {
  const initialRoomParam = useRef(new URLSearchParams(window.location.search).get('room'));

  const [appMode, setAppMode] = useState('race'); // 'solo' | 'race'
  const [currentTheme, setCurrentTheme] = useState(initialSettings.theme);
  const [soundType, setSoundType] = useState(initialSettings.soundType);
  const [volume, setVolume] = useState(initialSettings.volume);

  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isSoundOpen, setIsSoundOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);

  const [username, setUsername] = useState(
    () => initialSettings.username || `Racer_${Math.floor(100 + Math.random() * 900)}`
  );
  // Code from a shared link / QR (?room=RACE-ABCD): prefilled so the visitor can pick a name first
  const inviteCode = normalizeRoomCode(initialRoomParam.current);
  const [inviteMode, setInviteMode] = useState(!!inviteCode);
  const [joinRoomCode, setJoinRoomCode] = useState(inviteCode);
  const [busy, setBusy] = useState(null); // null | 'creating' | 'joining'
  const [joinError, setJoinError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Room snapshot from the host, with local-clock deadlines
  const [room, setRoom] = useState(null);
  const roomRef = useRef(null);
  const [now, setNow] = useState(Date.now());
  const toastTimerRef = useRef(null);
  const lastCountdownSecRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const handleState = useCallback((snap, selfId) => {
    const receivedAt = Date.now();
    setRoom({
      ...snap,
      selfId,
      isHost: roomRef.current?.isHost || false,
      countdownEndsAt: snap.countdownRemainingMs != null ? receivedAt + snap.countdownRemainingMs : null,
      sessionEndsAt: snap.sessionRemainingMs != null ? receivedAt + snap.sessionRemainingMs : null,
    });
  }, []);

  const leaveRoom = useCallback(() => {
    roomRef.current?.destroy();
    roomRef.current = null;
    setRoom(null);
    setIsQrOpen(false);
    clearRoomParam();
  }, []);

  const handleRoomClosed = useCallback((reason) => {
    roomRef.current = null;
    setRoom(null);
    setIsQrOpen(false);
    clearRoomParam();
    showToast(reason);
  }, [showToast]);

  const rememberUsername = () => {
    const clean = username.trim().slice(0, 18);
    saveSettings({ username: clean });
    return clean;
  };

  const handleCreateRoom = async () => {
    if (busy) return;
    setJoinError(null);
    setBusy('creating');
    roomRef.current?.destroy();
    const host = new RoomHost({ username: rememberUsername(), onState: handleState, onEvent: showToast });
    roomRef.current = host;
    const { roomId, offline } = await host.start();
    if (roomRef.current !== host) return; // left while connecting
    setBusy(null);
    setAppMode('race');
    // Host URL stays clean: reloading must not try to join the (now closed) room as a guest
    clearRoomParam();
    showToast(offline ? `Created offline room ${roomId} — add bots to practice` : `Room ${roomId} is live — share the code!`);
  };

  const joinRoom = useCallback(async (rawCode, name) => {
    const code = normalizeRoomCode(rawCode);
    if (!code) return;
    setJoinError(null);
    setBusy('joining');
    roomRef.current?.destroy();
    const client = new RoomClient({
      code,
      username: name,
      onState: handleState,
      onEvent: showToast,
      onClose: handleRoomClosed,
    });
    roomRef.current = client;
    try {
      await client.connect();
      if (roomRef.current !== client) return;
      setAppMode('race');
      setRoomParam(code);
      // After this room ends, show the normal landing page rather than the invite again
      setInviteMode(false);
      showToast(`Joined room ${code}!`);
    } catch (err) {
      if (roomRef.current !== client) return; // superseded or cancelled attempt
      roomRef.current = null;
      setJoinError(err.message);
      clearRoomParam();
    } finally {
      if (roomRef.current === client || roomRef.current === null) setBusy(null);
    }
  }, [handleState, showToast, handleRoomClosed]);

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (busy || !joinRoomCode.trim()) return;
    joinRoom(joinRoomCode, rememberUsername());
  };

  useEffect(() => {
    const onUnload = () => roomRef.current?.destroy();
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      roomRef.current?.destroy();
      roomRef.current = null;
    };
  }, []);

  // Local clock for countdown and session timers
  const isTiming = room && (room.status === 'countdown' || room.status === 'running');
  useEffect(() => {
    if (!isTiming) return undefined;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [isTiming]);

  // Countdown beeps
  useEffect(() => {
    if (room?.status === 'countdown' && room.countdownEndsAt) {
      const sec = Math.ceil((room.countdownEndsAt - now) / 1000);
      if (sec > 0 && sec !== lastCountdownSecRef.current) {
        lastCountdownSecRef.current = sec;
        soundEngine.playCountdownSound();
      }
    } else if (room?.status === 'running' && lastCountdownSecRef.current !== null) {
      lastCountdownSecRef.current = null;
      soundEngine.playStartSound();
    }
  }, [room?.status, room?.countdownEndsAt, now]);

  const sendLive = useCallback((data) => roomRef.current?.sendLive(data), []);
  const submitResult = useCallback((data) => roomRef.current?.submitResult(data), []);

  const handleRename = (name) => {
    roomRef.current?.rename(name);
    setUsername(name);
    saveSettings({ username: name });
  };

  const handleAddBots = (count) => {
    const added = roomRef.current?.addBots(count) || 0;
    if (added) showToast(`Added ${added} bot racer${added > 1 ? 's' : ''}!`);
  };

  const handleSelectTheme = (themeKey) => {
    setCurrentTheme(themeKey);
    applyTheme(themeKey);
    saveSettings({ theme: themeKey });
  };

  const handleSelectSound = (type) => {
    setSoundType(type);
    soundEngine.setSoundType(type);
    saveSettings({ soundType: type });
  };

  const handleVolumeChange = (vol) => {
    setVolume(vol);
    soundEngine.setVolume(vol);
    saveSettings({ volume: vol });
  };

  const handleSetMode = (mode) => {
    if (mode === 'solo' && roomRef.current) leaveRoom();
    setAppMode(mode);
  };

  const connectionStatus = !room ? 'none' : room.offline ? 'offline' : 'online';

  const renderRace = () => {
    if (!room && inviteMode) {
      return (
        <InviteJoin
          roomCode={inviteCode}
          username={username}
          onUsernameChange={(name) => {
            setUsername(name);
            setJoinError(null);
          }}
          onJoin={() => joinRoom(inviteCode, rememberUsername())}
          onDismiss={() => {
            setInviteMode(false);
            setJoinRoomCode('');
            setJoinError(null);
            clearRoomParam();
          }}
          busy={busy === 'joining'}
          error={joinError}
        />
      );
    }

    if (!room) {
      return (
        <div style={{ maxWidth: '600px', margin: '2rem auto', width: '100%' }}>
          <div style={{
            background: 'var(--sub-alt-color)',
            border: '1px solid var(--card-border)',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🐵🏁</div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-color)' }}>
                Multiplayer Typing Races
              </h1>
              <p style={{ color: 'var(--sub-color)', fontSize: '0.92rem', marginTop: '0.5rem' }}>
                Create a room, share the code, link or QR, and race for the best WPM before the timer runs out.
              </p>
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--sub-color)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Your Racer Nickname
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={rememberUsername}
                placeholder="Enter racer name..."
                maxLength={18}
                style={{
                  width: '100%',
                  background: 'var(--bg-color)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  color: 'var(--text-color)',
                  fontSize: '1rem',
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                className="btn-primary"
                onClick={handleCreateRoom}
                disabled={!!busy}
                style={{ padding: '0.9rem', fontSize: '1.05rem', width: '100%' }}
              >
                {busy === 'creating' ? <Loader2 size={20} className="spin" /> : <PlusCircle size={20} />}
                <span>{busy === 'creating' ? 'Creating room…' : 'Create New Race Room'}</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.5rem 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--sub-color)', textTransform: 'uppercase' }}>or join existing</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }} />
              </div>

              <form onSubmit={handleJoinRoom} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={joinRoomCode}
                  onChange={(e) => {
                    setJoinRoomCode(e.target.value);
                    setJoinError(null);
                  }}
                  placeholder="Room code (e.g. RACE-7A4B) or link"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: 'var(--bg-color)',
                    border: `1px solid ${joinError ? 'var(--error-color)' : 'var(--card-border)'}`,
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    color: 'var(--text-color)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    outline: 'none',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                />
                <button
                  type="submit"
                  className="btn-secondary"
                  disabled={!!busy || !joinRoomCode.trim()}
                  style={{ padding: '0.75rem 1.25rem', whiteSpace: 'nowrap' }}
                >
                  {busy === 'joining' ? <Loader2 size={18} className="spin" /> : <LogIn size={18} />}
                  <span>{busy === 'joining' ? 'Joining…' : 'Join'}</span>
                </button>
              </form>
              {joinError && (
                <div style={{ color: 'var(--error-color)', fontSize: '0.85rem' }}>{joinError}</div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (room.status === 'lobby') {
      return (
        <RoomLobby
          roomId={room.id}
          isHost={room.isHost}
          config={room.config}
          offline={room.offline}
          participants={room.participants}
          selfId={room.selfId}
          onStartRace={() => roomRef.current?.startSession()}
          onUpdateConfig={(cfg) => roomRef.current?.updateConfig(cfg)}
          onAddBots={handleAddBots}
          onClearBots={() => roomRef.current?.clearBots()}
          onOpenQr={() => setIsQrOpen(true)}
          onRename={handleRename}
        />
      );
    }

    if (room.status === 'finished') {
      return (
        <SessionResults
          room={room}
          onRaceAgain={() => roomRef.current?.startSession()}
          onBackToLobby={() => roomRef.current?.restartRoom()}
          onLeave={leaveRoom}
          onRename={handleRename}
        />
      );
    }

    return (
      <RaceSession
        room={room}
        now={now}
        onLive={sendLive}
        onResult={submitResult}
        onRestartRoom={() => roomRef.current?.restartRoom()}
        onEndSession={() => roomRef.current?.endSessionNow()}
      />
    );
  };

  return (
    <div className="app-container">
      <Navbar
        mode={appMode}
        setMode={handleSetMode}
        currentRoom={room}
        participantCount={room?.participants?.length || 0}
        onOpenTheme={() => setIsThemeOpen(true)}
        onOpenSound={() => setIsSoundOpen(true)}
        onOpenQr={() => setIsQrOpen(true)}
        connectionStatus={connectionStatus}
        onLeaveRoom={leaveRoom}
        soundType={soundType}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {appMode === 'solo' ? <SoloMode /> : renderRace()}
      </main>

      <footer className="footer">
        <div>
          <span>monkeyracer</span> • Real-time Multiplayer Typing Races
        </div>
        <div className="footer-links">
          <span style={{ color: 'var(--sub-color)' }}>
            Phone Friendly • QR Code Joining • Peer-to-Peer Rooms
          </span>
        </div>
      </footer>

      <ThemeSelector
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
      />

      <SoundSelector
        isOpen={isSoundOpen}
        onClose={() => setIsSoundOpen(false)}
        soundType={soundType}
        onSelectSound={handleSelectSound}
        volume={volume}
        onVolumeChange={handleVolumeChange}
      />

      <QrCodeModal
        isOpen={isQrOpen && !!room && !room.offline}
        onClose={() => setIsQrOpen(false)}
        roomId={room?.id}
      />

      {toastMessage && (
        <div className="toast-notice">
          <Sparkles size={16} color="var(--main-color)" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

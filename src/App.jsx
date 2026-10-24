import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import SoloMode from './components/SoloMode';
import RoomLobby from './components/RoomLobby';
import RaceTrack from './components/RaceTrack';
import LiveLeaderboard from './components/LiveLeaderboard';
import TypingArea from './components/TypingArea';
import ResultsPodium from './components/ResultsPodium';
import ThemeSelector from './components/ThemeSelector';
import SoundSelector from './components/SoundSelector';
import QrCodeModal from './components/QrCodeModal';
import { socket } from './utils/socket';
import { applyTheme } from './utils/themes';
import { soundEngine } from './utils/sound';
import { getRandomWords, BOT_NAMES, AVATAR_COLORS } from './utils/words';
import {
  Users,
  PlusCircle,
  LogIn,
  Sparkles,
  Smartphone,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [appMode, setAppMode] = useState('race'); // 'solo' | 'race'
  const [currentTheme, setCurrentTheme] = useState('serika_dark');
  const [soundType, setSoundType] = useState('thock');
  const [volume, setVolume] = useState(0.35);

  // Modals
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isSoundOpen, setIsSoundOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);

  // Multiplayer Room State
  const [roomState, setRoomState] = useState(null);
  // { id, isHost, config, text, status: 'lobby'|'countdown'|'racing'|'finished', participants, selfId, lanIp, port, isLocal }
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('monkeyracer_username') || `Racer_${Math.floor(100 + Math.random() * 900)}`;
  });
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [countdownNum, setCountdownNum] = useState(null);
  const [finalStats, setFinalStats] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Local bot & race simulation refs (for offline / client-side race rooms)
  const localBotIntervalRef = useRef(null);
  const localCountdownIntervalRef = useRef(null);
  const localRaceStartRef = useRef(null);
  const localRankCounterRef = useRef(1);

  // Apply initial theme & sound
  useEffect(() => {
    applyTheme(currentTheme);
    soundEngine.setSoundType(soundType);
    soundEngine.setVolume(volume);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Socket Connection & Event Listeners
  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('ERROR', ({ message }) => {
      showToast(message);
    });

    socket.on('ROOM_JOINED', (data) => {
      setRoomState({
        id: data.roomId,
        isHost: data.isHost,
        config: data.config,
        text: data.text,
        status: data.status,
        participants: data.participants,
        selfId: data.selfId,
        lanIp: data.lanIp,
        port: data.port,
      });
      setFinalStats(null);
      showToast(`Joined Room ${data.roomId}!`);
    });

    socket.on('PARTICIPANT_JOINED', (newParticipant) => {
      setRoomState((prev) => {
        if (!prev) return prev;
        const exists = prev.participants.some((p) => p.id === newParticipant.id);
        if (exists) return prev;
        return {
          ...prev,
          participants: [...prev.participants, newParticipant],
        };
      });
      showToast(`${newParticipant.username} joined!`);
    });

    socket.on('PARTICIPANT_LEFT', ({ id, participants }) => {
      setRoomState((prev) => (prev ? { ...prev, participants } : prev));
    });

    socket.on('PARTICIPANTS_UPDATED', ({ participants }) => {
      setRoomState((prev) => (prev ? { ...prev, participants } : prev));
    });

    socket.on('CONFIG_UPDATED', ({ config, text, participants }) => {
      setRoomState((prev) => (prev ? { ...prev, config, text, participants } : prev));
      showToast('Race settings updated by host');
    });

    socket.on('COUNTDOWN_STARTED', ({ countdown, text, participants }) => {
      setCountdownNum(countdown);
      setRoomState((prev) => (prev ? { ...prev, status: 'countdown', text, participants } : prev));
      setFinalStats(null);
    });

    socket.on('COUNTDOWN_TICK', ({ countdown }) => {
      setCountdownNum(countdown);
    });

    socket.on('RACE_STARTED', () => {
      setCountdownNum(null);
      setRoomState((prev) => (prev ? { ...prev, status: 'racing' } : prev));
    });

    socket.on('RACE_TICK', ({ elapsed, participants }) => {
      setRoomState((prev) => (prev ? { ...prev, participants } : prev));
    });

    socket.on('RACER_FINISHED', ({ id, rank, wpm, username }) => {
      showToast(`🏁 ${username} finished #${rank} (${wpm} wpm)!`);
    });

    socket.on('RACE_FINISHED', ({ participants }) => {
      setRoomState((prev) => (prev ? { ...prev, status: 'finished', participants } : prev));
    });

    socket.on('ROOM_RESET', ({ text, participants }) => {
      setRoomState((prev) => (prev ? { ...prev, status: 'lobby', text, participants } : prev));
      setFinalStats(null);
    });

    // Auto-join from URL parameter (e.g. from QR code scan on mobile phone: ?room=RACE-ABCD)
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setAppMode('race');
      socket.emit('JOIN_ROOM', { roomId: roomParam, username });
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('ERROR');
      socket.off('ROOM_JOINED');
      socket.off('PARTICIPANT_JOINED');
      socket.off('PARTICIPANT_LEFT');
      socket.off('PARTICIPANTS_UPDATED');
      socket.off('CONFIG_UPDATED');
      socket.off('COUNTDOWN_STARTED');
      socket.off('COUNTDOWN_TICK');
      socket.off('RACE_STARTED');
      socket.off('RACE_TICK');
      socket.off('RACER_FINISHED');
      socket.off('RACE_FINISHED');
      socket.off('ROOM_RESET');
    };
  }, [username]);

  const handleCreateRoom = () => {
    localStorage.setItem('monkeyracer_username', username);
    if (socket && socket.connected) {
      socket.emit('CREATE_ROOM', {
        username,
        config: { mode: 'words', amount: 25, type: 'standard' },
      });
    } else {
      // Local Race Room Fallback (100% works anytime, offline or without backend)
      const randomCode = 'RACE-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const initialText = getRandomWords(25);
      const hostParticipant = {
        id: 'local_host',
        username: (username && username.trim()) ? username.trim().slice(0, 18) : 'Racer_Host',
        color: '#e2b714',
        isHost: true,
        isBot: false,
        progress: 0,
        charProgress: 0,
        wpm: 0,
        rawWpm: 0,
        accuracy: 100,
        errors: 0,
        isFinished: false,
        finishTime: null,
        rank: null,
        device: 'desktop',
      };

      setRoomState({
        id: randomCode,
        isHost: true,
        config: { mode: 'words', amount: 25, type: 'standard' },
        text: initialText,
        status: 'lobby',
        participants: [hostParticipant],
        selfId: 'local_host',
        lanIp: 'localhost',
        port: window.location.port || 5173,
        isLocal: true,
      });
      setFinalStats(null);
      showToast(`Created Room ${randomCode}! Add AI Bots to practice.`);
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!joinRoomCode.trim()) return;
    localStorage.setItem('monkeyracer_username', username);
    const code = joinRoomCode.trim().toUpperCase();
    if (socket && socket.connected) {
      socket.emit('JOIN_ROOM', {
        roomId: code,
        username,
      });
    } else {
      // Join local room with specified code
      const initialText = getRandomWords(25);
      setRoomState({
        id: code,
        isHost: true,
        config: { mode: 'words', amount: 25, type: 'standard' },
        text: initialText,
        status: 'lobby',
        participants: [{
          id: 'local_host',
          username: (username && username.trim()) ? username.trim().slice(0, 18) : 'Racer_Host',
          color: '#e2b714',
          isHost: true,
          isBot: false,
          progress: 0,
          charProgress: 0,
          wpm: 0,
          rawWpm: 0,
          accuracy: 100,
          errors: 0,
          isFinished: false,
          finishTime: null,
          rank: null,
          device: 'desktop',
        }],
        selfId: 'local_host',
        lanIp: 'localhost',
        port: window.location.port || 5173,
        isLocal: true,
      });
      setFinalStats(null);
      showToast(`Joined local room session ${code}!`);
    }
  };

  const handleStartRace = () => {
    if (socket && socket.connected && !roomState?.isLocal) {
      socket.emit('START_RACE');
    } else if (roomState) {
      if (localCountdownIntervalRef.current) clearInterval(localCountdownIntervalRef.current);
      if (localBotIntervalRef.current) clearInterval(localBotIntervalRef.current);

      setCountdownNum(5);
      soundEngine.playCountdownSound(5);
      let count = 5;

      setRoomState(prev => {
        if (!prev) return prev;
        const resetParts = prev.participants.map(p => ({
          ...p,
          progress: 0,
          charProgress: 0,
          wpm: 0,
          rawWpm: 0,
          accuracy: 100,
          errors: 0,
          isFinished: false,
          finishTime: null,
          rank: null,
        }));
        return { ...prev, status: 'countdown', participants: resetParts };
      });

      localCountdownIntervalRef.current = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setCountdownNum(count);
          soundEngine.playCountdownSound(count);
        } else {
          clearInterval(localCountdownIntervalRef.current);
          localCountdownIntervalRef.current = null;
          setCountdownNum(null);
          soundEngine.playStartSound();

          localRaceStartRef.current = Date.now();
          localRankCounterRef.current = 1;

          setRoomState(prev => prev ? { ...prev, status: 'racing' } : prev);
          startLocalBotSimulation();
        }
      }, 1000);
    }
  };

  const startLocalBotSimulation = () => {
    if (localBotIntervalRef.current) clearInterval(localBotIntervalRef.current);

    localBotIntervalRef.current = setInterval(() => {
      const startTime = localRaceStartRef.current;
      if (!startTime) return;
      const elapsedSec = (Date.now() - startTime) / 1000;

      setRoomState(prev => {
        if (!prev || prev.status !== 'racing') return prev;
        const totalChars = prev.text.length;

        const updatedParticipants = prev.participants.map(p => {
          if (!p.isBot || p.isFinished) return p;

          const cps = ((p.targetWpm || 60) * 5) / 60;
          const jitter = (Math.sin(elapsedSec * 2 + (p.targetWpm || 60)) * 0.15) + 1;
          const effectiveChars = Math.min(totalChars, Math.floor(elapsedSec * cps * jitter));
          const progress = Math.min(100, Math.round((effectiveChars / totalChars) * 100));
          const wpm = elapsedSec > 0.5 ? Math.round((effectiveChars / 5) / (elapsedSec / 60)) : 0;

          if (effectiveChars >= totalChars && !p.isFinished) {
            const rank = localRankCounterRef.current++;
            return {
              ...p,
              charProgress: effectiveChars,
              progress: 100,
              wpm,
              rawWpm: Math.round(wpm * 1.05),
              isFinished: true,
              finishTime: Date.now(),
              rank,
            };
          }

          return {
            ...p,
            charProgress: effectiveChars,
            progress,
            wpm,
            rawWpm: Math.round(wpm * 1.05),
          };
        });

        const allDone = updatedParticipants.every(p => p.isFinished);
        if (allDone && updatedParticipants.length > 0) {
          clearInterval(localBotIntervalRef.current);
          localBotIntervalRef.current = null;
          return {
            ...prev,
            status: 'finished',
            participants: updatedParticipants,
          };
        }

        return {
          ...prev,
          participants: updatedParticipants,
        };
      });
    }, 150);
  };

  const handleUpdateConfig = (newConfig) => {
    if (socket && socket.connected && !roomState?.isLocal) {
      socket.emit('UPDATE_CONFIG', newConfig);
    } else if (roomState) {
      const mergedConfig = { ...roomState.config, ...newConfig };
      const wordCount = mergedConfig.mode === 'words' ? (parseInt(mergedConfig.amount, 10) || 25) : 350;
      const newText = getRandomWords(wordCount);

      setRoomState(prev => {
        if (!prev) return prev;
        const resetParticipants = prev.participants.map(p => ({
          ...p,
          progress: 0,
          charProgress: 0,
          wpm: 0,
          rawWpm: 0,
          accuracy: 100,
          errors: 0,
          isFinished: false,
          finishTime: null,
          rank: null,
        }));
        return {
          ...prev,
          config: mergedConfig,
          text: newText,
          participants: resetParticipants,
        };
      });
    }
  };

  const handleAddBots = (count) => {
    if (socket && socket.connected && !roomState?.isLocal) {
      socket.emit('ADD_BOTS', { count });
    } else if (roomState) {
      const currentBots = roomState.participants.filter(p => p.isBot).length;
      const availableNames = BOT_NAMES.filter(
        name => !roomState.participants.some(p => p.username === name)
      );

      const newBots = [];
      for (let i = 0; i < count; i++) {
        if (roomState.participants.length + newBots.length >= 200) break;
        const botName = availableNames[i % availableNames.length] || `Bot_${currentBots + i + 1}`;
        const botColor = AVATAR_COLORS[(currentBots + i) % AVATAR_COLORS.length];
        const targetWpm = Math.floor(45 + Math.random() * 65); // 45 - 110 WPM

        newBots.push({
          id: `bot_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`,
          username: botName,
          color: botColor,
          isHost: false,
          isBot: true,
          targetWpm,
          progress: 0,
          charProgress: 0,
          wpm: 0,
          rawWpm: 0,
          accuracy: Math.floor(94 + Math.random() * 6),
          errors: 0,
          isFinished: false,
          finishTime: null,
          rank: null,
          device: Math.random() > 0.5 ? 'mobile' : 'desktop',
        });
      }

      setRoomState(prev => prev ? {
        ...prev,
        participants: [...prev.participants, ...newBots]
      } : prev);
      showToast(`Added ${newBots.length} bot racer${newBots.length > 1 ? 's' : ''}!`);
    }
  };

  const handleClearBots = () => {
    if (socket && socket.connected && !roomState?.isLocal) {
      socket.emit('CLEAR_BOTS');
    } else if (roomState) {
      setRoomState(prev => prev ? {
        ...prev,
        participants: prev.participants.filter(p => !p.isBot)
      } : prev);
      showToast('Cleared all bot racers');
    }
  };

  const handleResetRoom = () => {
    if (socket && socket.connected && !roomState?.isLocal) {
      socket.emit('RESET_ROOM');
    } else if (roomState) {
      const wordCount = roomState.config?.mode === 'words' ? (parseInt(roomState.config?.amount, 10) || 25) : 350;
      const newText = getRandomWords(wordCount);
      setRoomState(prev => {
        if (!prev) return prev;
        const resetParticipants = prev.participants.map(p => ({
          ...p,
          progress: 0,
          charProgress: 0,
          wpm: 0,
          rawWpm: 0,
          accuracy: 100,
          errors: 0,
          isFinished: false,
          finishTime: null,
          rank: null,
        }));
        return {
          ...prev,
          status: 'lobby',
          text: newText,
          participants: resetParticipants,
        };
      });
      setFinalStats(null);
    }
  };

  const handleRacerProgress = (data) => {
    if (socket && socket.connected && !roomState?.isLocal) {
      socket.emit('RACER_UPDATE', data);
    } else if (roomState) {
      setRoomState(prev => {
        if (!prev) return prev;
        const updated = prev.participants.map(p => {
          if (p.id === prev.selfId) {
            return {
              ...p,
              progress: data.progress,
              charProgress: data.charProgress,
              wpm: data.wpm,
              rawWpm: data.rawWpm,
              accuracy: data.accuracy,
              errors: data.errors,
            };
          }
          return p;
        });
        return { ...prev, participants: updated };
      });
    }
  };

  const handleRaceFinish = (stats) => {
    setFinalStats(stats);
    if (socket && socket.connected && !roomState?.isLocal) {
      // Handled by server socket
    } else if (roomState) {
      const userRank = localRankCounterRef.current++;
      setRoomState(prev => {
        if (!prev) return prev;
        const updated = prev.participants.map(p => {
          if (p.id === prev.selfId) {
            return {
              ...p,
              progress: 100,
              wpm: stats.wpm,
              rawWpm: stats.rawWpm,
              accuracy: stats.accuracy,
              errors: stats.errors,
              isFinished: true,
              finishTime: Date.now(),
              rank: userRank,
            };
          }
          return p;
        });

        return {
          ...prev,
          status: 'finished',
          participants: updated,
        };
      });
      if (localBotIntervalRef.current) {
        clearInterval(localBotIntervalRef.current);
        localBotIntervalRef.current = null;
      }
    }
  };

  const handleLeaveRoom = () => {
    if (localBotIntervalRef.current) clearInterval(localBotIntervalRef.current);
    if (localCountdownIntervalRef.current) clearInterval(localCountdownIntervalRef.current);
    setRoomState(null);
    setFinalStats(null);
  };

  const handleSelectTheme = (themeKey) => {
    setCurrentTheme(themeKey);
    applyTheme(themeKey);
  };

  const handleSelectSound = (type) => {
    setSoundType(type);
    soundEngine.setSoundType(type);
  };

  const handleVolumeChange = (vol) => {
    setVolume(vol);
    soundEngine.setVolume(vol);
  };

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <Navbar
        mode={appMode}
        setMode={setAppMode}
        currentRoom={roomState}
        participantCount={roomState?.participants?.length || 0}
        onOpenTheme={() => setIsThemeOpen(true)}
        onOpenSound={() => setIsSoundOpen(true)}
        onOpenQr={() => setIsQrOpen(true)}
        isConnected={isConnected}
        onLeaveRoom={handleLeaveRoom}
        soundType={soundType}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {appMode === 'solo' ? (
          <SoloMode />
        ) : !roomState ? (
          /* Room Selection / Creation Landing */
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
                  Create private rooms with QR codes, race up to 200 players in real-time, and compete on the live leaderboard.
                </p>
              </div>

              {/* Username Input */}
              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--sub-color)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Your Racer Nickname
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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

              {/* Actions: Create or Join */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  className="btn-primary"
                  onClick={handleCreateRoom}
                  style={{ padding: '0.9rem', fontSize: '1.05rem', width: '100%' }}
                >
                  <PlusCircle size={20} />
                  <span>Create New Race Room (Up to 200)</span>
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
                    onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter Room Code (e.g. RACE-7A4B)"
                    style={{
                      flex: 1,
                      background: 'var(--bg-color)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      color: 'var(--text-color)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      outline: 'none',
                      letterSpacing: '1px'
                    }}
                  />
                  <button
                    type="submit"
                    className="btn-secondary"
                    style={{ padding: '0.75rem 1.25rem', whiteSpace: 'nowrap' }}
                  >
                    <LogIn size={18} />
                    <span>Join</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : roomState.status === 'lobby' ? (
          /* Room Lobby */
          <RoomLobby
            roomId={roomState.id}
            isHost={roomState.isHost}
            config={roomState.config}
            participants={roomState.participants}
            selfId={roomState.selfId}
            lanIp={roomState.lanIp}
            port={roomState.port}
            onStartRace={handleStartRace}
            onUpdateConfig={handleUpdateConfig}
            onAddBots={handleAddBots}
            onClearBots={handleClearBots}
            onOpenQr={() => setIsQrOpen(true)}
          />
        ) : (
          /* Racing / Countdown / Finished States */
          <div style={{ width: '100%', maxWidth: '1150px', margin: '0 auto', position: 'relative' }}>
            {/* Visual Race Track */}
            <RaceTrack
              participants={roomState.participants}
              selfId={roomState.selfId}
            />

            {/* Countdown Overlay (5, 4, 3, 2, 1) */}
            {countdownNum !== null && (
              <div className="countdown-screen">
                <div style={{ fontSize: '1.25rem', color: 'var(--sub-color)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '2px', marginBottom: '0.5rem' }}>
                  Get Ready to Race!
                </div>
                <div className="countdown-number">{countdownNum}</div>
              </div>
            )}

            {/* Core Typing Engine or Results Podium */}
            {roomState.status === 'finished' ? (
              <ResultsPodium
                stats={finalStats}
                isRace={true}
                participants={roomState.participants}
                selfId={roomState.selfId}
                isHost={roomState.isHost}
                onPlayAgain={roomState.isHost ? handleResetRoom : () => {}}
              />
            ) : (
              <TypingArea
                text={roomState.text}
                mode={roomState.config?.mode || 'words'}
                timeLimit={roomState.config?.mode === 'time' ? roomState.config?.amount : null}
                isRace={true}
                raceStarted={roomState.status === 'racing'}
                onProgressUpdate={handleRacerProgress}
                onFinish={handleRaceFinish}
                onRestart={() => {}}
                disabled={roomState.status !== 'racing'}
              />
            )}

            {/* 200-Racer Live Leaderboard */}
            <div style={{ marginTop: '2rem' }}>
              <LiveLeaderboard
                participants={roomState.participants}
                selfId={roomState.selfId}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div>
          <span>monkeyracer</span> • Real-time 200-Racer Multiplayer Typing
        </div>
        <div className="footer-links">
          <span style={{ color: 'var(--sub-color)' }}>
            Phone Friendly • QR Code Joining • Low Latency Websockets
          </span>
        </div>
      </footer>

      {/* Modals */}
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
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        roomId={roomState?.id}
        lanIp={roomState?.lanIp}
        port={roomState?.port}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notice">
          <Sparkles size={16} color="var(--main-color)" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

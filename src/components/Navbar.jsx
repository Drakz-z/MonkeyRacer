import React from 'react';
import { Trophy, Volume2, Palette, QrCode, Play, Users, RefreshCw } from 'lucide-react';

export default function Navbar({
  mode,
  setMode,
  currentRoom,
  participantCount,
  onOpenTheme,
  onOpenSound,
  onOpenQr,
  isConnected,
  onLeaveRoom,
  soundType,
}) {
  return (
    <nav className="navbar">
      <div className="logo-group" onClick={() => setMode('solo')}>
        <div className="logo-icon">🐵</div>
        <div className="logo-text">
          <div className="logo-title">
            monkey<span>racer</span>
          </div>
          <div className="logo-subtitle">
            {currentRoom ? `Room: ${currentRoom.id}` : 'Live Multiplayer Typing'}
          </div>
        </div>
      </div>

      <div className="nav-actions">
        {/* Solo vs Multiplayer Mode Switch */}
        <button
          className={`nav-pill-btn ${mode === 'solo' ? 'active' : ''}`}
          onClick={() => {
            if (currentRoom) onLeaveRoom();
            setMode('solo');
          }}
          title="Solo Practice Mode"
        >
          <Play size={16} />
          <span>Solo</span>
        </button>

        <button
          className={`nav-pill-btn ${mode === 'race' ? 'active' : ''}`}
          onClick={() => setMode('race')}
          title="Multiplayer Race Room (Up to 200 Racers)"
        >
          <Users size={16} />
          <span>
            {currentRoom ? `${participantCount}/200 Racers` : 'Race Rooms'}
          </span>
        </button>

        {/* QR Code Quick Button (when in room) */}
        {currentRoom && (
          <button
            className="nav-icon-btn"
            onClick={onOpenQr}
            title="Scan QR Code to Join on Phone"
          >
            <QrCode size={19} />
          </button>
        )}

        {/* Sound Picker Button */}
        <button
          className="nav-icon-btn"
          onClick={onOpenSound}
          title={`Keyboard Sound: ${soundType}`}
        >
          <Volume2 size={19} />
        </button>

        {/* Theme Picker Button */}
        <button
          className="nav-icon-btn"
          onClick={onOpenTheme}
          title="Change Color Theme"
        >
          <Palette size={19} />
        </button>

        {/* Connection status indicator */}
        <div
          title={isConnected ? 'Connected to Multiplayer Server' : 'Connecting to Server...'}
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: isConnected ? '#4caf50' : '#ff9800',
            boxShadow: isConnected ? '0 0 8px #4caf50' : 'none',
            marginLeft: 6,
          }}
        />
      </div>
    </nav>
  );
}

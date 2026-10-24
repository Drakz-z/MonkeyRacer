import React, { useState } from 'react';
import {
  QrCode,
  Copy,
  Check,
  Play,
  Users,
  Settings,
  Sparkles,
  Smartphone,
  Trash2,
  WifiOff,
} from 'lucide-react';
import { getRoomShareUrl, SESSION_MINUTE_OPTIONS, TEST_SECOND_OPTIONS } from '../utils/room';
import { copyText, useQrCode, LocalhostWarning } from './QrCodeModal';

function OptionButton({ active, disabled, onClick, children }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: '55px',
        padding: '0.45rem 0.5rem',
        borderRadius: '8px',
        border: '1px solid',
        borderColor: active ? 'var(--main-color)' : 'var(--card-border)',
        background: active ? 'rgba(226, 183, 20, 0.15)' : 'rgba(0,0,0,0.2)',
        color: active ? 'var(--main-color)' : 'var(--text-color)',
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled && !active ? 0.6 : 1,
        fontSize: '0.85rem',
      }}
    >
      {children}
    </button>
  );
}

function formatTestSeconds(s) {
  return s >= 60 ? `${s / 60}m` : `${s}s`;
}

export default function RoomLobby({
  roomId,
  isHost,
  config,
  offline,
  participants = [],
  selfId,
  onStartRace,
  onUpdateConfig,
  onAddBots,
  onClearBots,
  onOpenQr,
}) {
  const [copied, setCopied] = useState(false);
  const joinUrl = getRoomShareUrl(roomId);
  const qrSrc = useQrCode(offline ? '' : joinUrl, 200);

  const copyLink = async () => {
    if (await copyText(joinUrl)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentCount = participants.length;
  const maxTests = Math.floor((config.sessionMinutes * 60) / config.testSeconds);

  return (
    <div style={{ width: '100%', maxWidth: '1050px', margin: '0 auto' }}>
      {offline && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          background: 'rgba(202, 71, 84, 0.12)',
          border: '1px solid var(--error-color)',
          color: 'var(--text-color)',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.88rem',
        }}>
          <WifiOff size={18} color="var(--error-color)" />
          <span>
            Offline room — the matchmaking server couldn't be reached, so other people can't join.
            You can still race against bots. Leave and create a new room to retry online.
          </span>
        </div>
      )}

      {/* Top Banner: Room code & start */}
      <div style={{
        background: 'var(--sub-alt-color)',
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--sub-color)', textTransform: 'uppercase', fontWeight: 600 }}>
            Room Code
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '4px', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--main-color)',
              letterSpacing: '1px'
            }}>
              {roomId}
            </span>
            {!offline && (
              <>
                <button onClick={copyLink} className="btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? 'Copied' : 'Copy Link'}</span>
                </button>
                <button onClick={onOpenQr} className="btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }} title="Show Phone QR">
                  <QrCode size={16} color="var(--main-color)" />
                  <span>Phone QR</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--card-border)',
            padding: '0.6rem 1rem',
            borderRadius: '12px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--sub-color)' }}>Racers Joined</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-color)' }}>
              {currentCount} <span style={{ fontSize: '0.85rem', color: 'var(--sub-color)' }}>/ 200</span>
            </div>
          </div>

          {isHost ? (
            <button className="btn-primary" onClick={onStartRace} style={{ padding: '0.85rem 2rem', fontSize: '1.1rem' }}>
              <Play size={20} fill="currentColor" />
              <span>START RACE</span>
            </button>
          ) : (
            <div style={{
              background: 'rgba(226, 183, 20, 0.1)',
              border: '1px solid var(--main-color)',
              color: 'var(--main-color)',
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}>
              Waiting for host to start the race...
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* QR Code Quick Join Card */}
        {!offline && (
          <div style={{
            background: 'var(--sub-alt-color)',
            border: '1px solid var(--card-border)',
            borderRadius: '16px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 700, fontSize: '1rem' }}>
              <Smartphone size={18} color="var(--main-color)" />
              <span>Scan with Phone Camera</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--sub-color)', marginBottom: '1rem' }}>
              Or open the site and enter code <b style={{ color: 'var(--main-color)' }}>{roomId}</b>
            </p>

            {qrSrc ? (
              <img
                src={qrSrc}
                alt="Join QR"
                style={{ width: 170, height: 170, borderRadius: '12px', background: '#fff', boxShadow: '0 6px 20px rgba(0,0,0,0.3)' }}
              />
            ) : (
              <div style={{ width: 170, height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sub-color)' }}>
                Loading QR...
              </div>
            )}
            <div style={{ fontSize: '0.72rem', color: 'var(--sub-color)', marginTop: '0.75rem', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
              {joinUrl}
            </div>
            <LocalhostWarning />
          </div>
        )}

        {/* Race settings */}
        <div style={{
          background: 'var(--sub-alt-color)',
          border: '1px solid var(--card-border)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem' }}>
            <Settings size={18} color="var(--main-color)" />
            <span>Race Settings {isHost ? '(Host)' : '(Set by host)'}</span>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--sub-color)', marginBottom: '0.4rem' }}>
              Room duration — how long the race session lasts
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {SESSION_MINUTE_OPTIONS.map((m) => (
                <OptionButton
                  key={m}
                  active={config.sessionMinutes === m}
                  disabled={!isHost}
                  onClick={() => onUpdateConfig({ sessionMinutes: m })}
                >
                  {m} min
                </OptionButton>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--sub-color)', marginBottom: '0.4rem' }}>
              Test length — each test must be completed in full to count
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {TEST_SECOND_OPTIONS.map((s) => (
                <OptionButton
                  key={s}
                  active={config.testSeconds === s}
                  disabled={!isHost || s > config.sessionMinutes * 60}
                  onClick={() => onUpdateConfig({ testSeconds: s })}
                >
                  {formatTestSeconds(s)}
                </OptionButton>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--sub-color)', marginBottom: '0.4rem' }}>
              Vocabulary
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { id: 'standard', label: 'Standard' },
                { id: 'code', label: 'Code JS' },
                { id: 'quote', label: 'Quotes' },
              ].map((item) => (
                <OptionButton
                  key={item.id}
                  active={config.type === item.id}
                  disabled={!isHost}
                  onClick={() => onUpdateConfig({ type: item.id })}
                >
                  {item.label}
                </OptionButton>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--sub-color)', lineHeight: 1.5 }}>
            For <b style={{ color: 'var(--text-color)' }}>{config.sessionMinutes} min</b>, racers take as many{' '}
            <b style={{ color: 'var(--text-color)' }}>{formatTestSeconds(config.testSeconds)}</b> tests as they can (up to {maxTests}).
            Your best WPM ranks you on the leaderboard.
          </div>

          {isHost && (
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '12px',
              padding: '0.85rem',
              border: '1px dashed var(--sub-color)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={14} color="var(--main-color)" /> Practice Bots
                </span>
                {participants.some((p) => p.isBot) && (
                  <button
                    onClick={onClearBots}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--error-color)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <Trash2 size={12} /> Clear Bots
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[1, 5, 20].map((n) => (
                  <button
                    key={n}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                    onClick={() => onAddBots(n)}
                    disabled={currentCount >= 200}
                  >
                    +{n} Bot{n > 1 ? 's' : ''}
                  </button>
                ))}
                <button
                  className="btn-primary"
                  style={{ flex: '1 1 100%', padding: '0.45rem', fontSize: '0.82rem', marginTop: '4px' }}
                  onClick={() => onAddBots(200 - currentCount)}
                  disabled={currentCount >= 200}
                >
                  ⚡ Fill to Max 200 Racers
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Roster */}
      <div style={{
        background: 'var(--sub-alt-color)',
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        padding: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.05rem' }}>
            <Users size={18} color="var(--main-color)" />
            <span>Racers in Lobby ({participants.length})</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--sub-color)' }}>
            Up to 200 can join simultaneously
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: '0.65rem',
          maxHeight: '320px',
          overflowY: 'auto',
          paddingRight: '0.5rem'
        }}>
          {participants.map((p) => {
            const isSelf = p.id === selfId;
            return (
              <div
                key={p.id}
                style={{
                  background: isSelf ? 'rgba(226, 183, 20, 0.12)' : 'rgba(0,0,0,0.18)',
                  border: `1px solid ${isSelf ? 'var(--main-color)' : 'var(--card-border)'}`,
                  borderRadius: '10px',
                  padding: '0.5rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: p.color || 'var(--main-color)',
                  color: '#111',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  flexShrink: 0,
                }}>
                  {p.username.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', fontWeight: 600 }}>
                  <span style={{ color: isSelf ? 'var(--main-color)' : 'var(--text-color)' }}>
                    {p.username}
                  </span>
                  {isSelf && <span style={{ fontSize: '0.7rem', color: 'var(--main-color)' }}> (You)</span>}
                  {p.isHost && <span style={{ fontSize: '0.65rem', color: 'var(--sub-color)', marginLeft: 4 }}>👑</span>}
                  {p.isBot && <span style={{ fontSize: '0.65rem', color: 'var(--sub-color)', marginLeft: 4 }}>🤖</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

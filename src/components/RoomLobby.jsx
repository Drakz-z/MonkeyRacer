import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Copy,
  Check,
  Play,
  Users,
  Bot,
  Settings,
  Sparkles,
  Smartphone,
  Trash2,
  Clock,
  FileText
} from 'lucide-react';
import { getRoomShareUrl } from '../utils/socket';

export default function RoomLobby({
  roomId,
  isHost,
  config,
  participants = [],
  selfId,
  lanIp,
  port,
  onStartRace,
  onUpdateConfig,
  onAddBots,
  onClearBots,
  onOpenQr,
}) {
  const [copied, setCopied] = useState(false);
  const [qrSrc, setQrSrc] = useState(null);

  const joinUrl = getRoomShareUrl(roomId, lanIp, port);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/qr?text=${encodeURIComponent(joinUrl)}`)
      .then((r) => r.json())
      .then((data) => {
        if (isMounted && data.qr) setQrSrc(data.qr);
      })
      .catch((e) => console.error(e));
    return () => { isMounted = false; };
  }, [joinUrl]);

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentCount = participants.length;

  return (
    <div style={{ width: '100%', maxWidth: '1050px', margin: '0 auto' }}>
      {/* Top Banner: Room PIN & Quick Actions */}
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
            Room Lobby Code
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '4px' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--main-color)',
              letterSpacing: '1px'
            }}>
              {roomId}
            </span>
            <button
              onClick={copyLink}
              className="btn-secondary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
            <button
              onClick={onOpenQr}
              className="btn-secondary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
              title="Show Phone QR"
            >
              <QrCode size={16} color="var(--main-color)" />
              <span>Phone QR</span>
            </button>
          </div>
        </div>

        {/* Start Button & Capacity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
            <button
              className="btn-primary"
              onClick={onStartRace}
              style={{ padding: '0.85rem 2rem', fontSize: '1.1rem' }}
            >
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
              Waiting for host to start race...
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* QR Code Quick Join Card */}
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
            Racers can scan and join immediately from mobile browsers
          </p>

          {qrSrc ? (
            <img
              src={qrSrc}
              alt="Join QR"
              style={{
                width: 170,
                height: 170,
                borderRadius: '12px',
                padding: '6px',
                background: '#1e2022',
                boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
              }}
            />
          ) : (
            <div style={{ width: 170, height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sub-color)' }}>
              Loading QR...
            </div>
          )}
          <div style={{ fontSize: '0.75rem', color: 'var(--sub-color)', marginTop: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            {joinUrl}
          </div>
        </div>

        {/* Host Controls & Bot Spawner */}
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
            <span>Race Settings {isHost ? '(Host)' : '(Locked)'}</span>
          </div>

          {/* Mode Switcher: Words or Time */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--sub-color)' }}>Race Mode</span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  disabled={!isHost}
                  onClick={() => onUpdateConfig({ mode: 'time', amount: 120 })}
                  style={{
                    background: config.mode === 'time' ? 'var(--main-color)' : 'rgba(0,0,0,0.2)',
                    color: config.mode === 'time' ? '#111' : 'var(--text-color)',
                    border: 'none',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: isHost ? 'pointer' : 'default',
                  }}
                >
                  Time
                </button>
                <button
                  disabled={!isHost}
                  onClick={() => onUpdateConfig({ mode: 'words', amount: 25 })}
                  style={{
                    background: config.mode === 'words' ? 'var(--main-color)' : 'rgba(0,0,0,0.2)',
                    color: config.mode === 'words' ? '#111' : 'var(--text-color)',
                    border: 'none',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: isHost ? 'pointer' : 'default',
                  }}
                >
                  Words
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {config.mode === 'time' ? (
                [
                  { val: 15, label: '15s' },
                  { val: 30, label: '30s' },
                  { val: 60, label: '60s (1m)' },
                  { val: 120, label: '120s (2m)' },
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    disabled={!isHost}
                    onClick={() => onUpdateConfig({ mode: 'time', amount: val })}
                    style={{
                      flex: 1,
                      minWidth: '55px',
                      padding: '0.45rem 0.5rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: config.mode === 'time' && config.amount === val ? 'var(--main-color)' : 'var(--card-border)',
                      background: config.mode === 'time' && config.amount === val ? 'rgba(226, 183, 20, 0.15)' : 'rgba(0,0,0,0.2)',
                      color: config.mode === 'time' && config.amount === val ? 'var(--main-color)' : 'var(--text-color)',
                      fontWeight: 600,
                      cursor: isHost ? 'pointer' : 'default',
                      fontSize: '0.85rem',
                    }}
                  >
                    {label}
                  </button>
                ))
              ) : (
                [10, 25, 50, 100].map((num) => (
                  <button
                    key={num}
                    disabled={!isHost}
                    onClick={() => onUpdateConfig({ mode: 'words', amount: num })}
                    style={{
                      flex: 1,
                      minWidth: '50px',
                      padding: '0.45rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: config.mode === 'words' && config.amount === num ? 'var(--main-color)' : 'var(--card-border)',
                      background: config.mode === 'words' && config.amount === num ? 'rgba(226, 183, 20, 0.15)' : 'rgba(0,0,0,0.2)',
                      color: config.mode === 'words' && config.amount === num ? 'var(--main-color)' : 'var(--text-color)',
                      fontWeight: 600,
                      cursor: isHost ? 'pointer' : 'default',
                      fontSize: '0.85rem',
                    }}
                  >
                    {num}w
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Word Type */}
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--sub-color)', marginBottom: '0.4rem' }}>
              Dictionary Vocabulary
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { id: 'standard', label: 'Standard' },
                { id: 'code', label: 'Code JS' },
                { id: 'quote', label: 'Quotes' },
              ].map((item) => (
                <button
                  key={item.id}
                  disabled={!isHost}
                  onClick={() => onUpdateConfig({ type: item.id })}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.6rem',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: config.type === item.id ? 'var(--main-color)' : 'var(--card-border)',
                    background: config.type === item.id ? 'rgba(226, 183, 20, 0.15)' : 'rgba(0,0,0,0.2)',
                    color: config.type === item.id ? 'var(--main-color)' : 'var(--text-color)',
                    fontWeight: 600,
                    cursor: isHost ? 'pointer' : 'default',
                    fontSize: '0.85rem',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Test 200 Racers - Bot Spawner */}
          {isHost && (
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '12px',
              padding: '0.85rem',
              border: '1px dashed var(--sub-color)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={14} color="var(--main-color)" /> Simulate 200 Racers
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
                <button
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                  onClick={() => onAddBots(5)}
                  disabled={currentCount >= 200}
                >
                  +5 Bots
                </button>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                  onClick={() => onAddBots(20)}
                  disabled={currentCount >= 200}
                >
                  +20 Bots
                </button>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.78rem' }}
                  onClick={() => onAddBots(50)}
                  disabled={currentCount >= 200}
                >
                  +50 Bots
                </button>
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

      {/* Roster of Connected Racers */}
      <div style={{
        background: 'var(--sub-alt-color)',
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        padding: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
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
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

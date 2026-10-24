import React from 'react';
import { X, Volume2, VolumeX, Play } from 'lucide-react';
import { soundEngine } from '../utils/sound';

export default function SoundSelector({ isOpen, onClose, soundType, onSelectSound, volume, onVolumeChange }) {
  if (!isOpen) return null;

  const SOUND_OPTIONS = [
    { id: 'thock', name: 'Mechanical Thock', desc: 'Deep, satisfying tactile switch (Holy Panda / Ink Black)' },
    { id: 'clicky', name: 'Cherry MX Blue', desc: 'High-pitch snappy click switch' },
    { id: 'typewriter', name: 'Vintage Typewriter', desc: 'Crisp metallic typewriter strike' },
    { id: 'bubble', name: 'Bubble Pop', desc: 'Soft playful pop sound' },
    { id: 'off', name: 'Muted / Off', desc: 'Silent typing without sound effects' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-color)' }}>
          Keyboard Sound Effects
        </h2>
        <p style={{ color: 'var(--sub-color)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Real-time synthesized Web Audio mechanical keystrokes:
        </p>

        {/* Volume Slider */}
        <div style={{ marginBottom: '1.5rem', background: 'var(--sub-alt-color)', padding: '1rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-color)' }}>
              {volume > 0 ? <Volume2 size={18} color="var(--main-color)" /> : <VolumeX size={18} color="var(--sub-color)" />}
              Volume
            </span>
            <span style={{ color: 'var(--main-color)', fontFamily: 'var(--font-mono)' }}>
              {Math.round(volume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--main-color)', cursor: 'pointer' }}
          />
        </div>

        {/* Sound Types list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {SOUND_OPTIONS.map((opt) => {
            const isSelected = soundType === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => {
                  onSelectSound(opt.id);
                  if (opt.id !== 'off') {
                    soundEngine.setSoundType(opt.id);
                    soundEngine.playKeySound();
                  }
                }}
                style={{
                  background: isSelected ? 'rgba(226, 183, 20, 0.1)' : 'var(--sub-alt-color)',
                  border: `1.5px solid ${isSelected ? 'var(--main-color)' : 'var(--card-border)'}`,
                  borderRadius: '12px',
                  padding: '0.9rem 1.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ color: isSelected ? 'var(--main-color)' : 'var(--text-color)', fontWeight: 700, fontSize: '1rem' }}>
                    {opt.name}
                  </div>
                  <div style={{ color: 'var(--sub-color)', fontSize: '0.8rem', marginTop: '2px' }}>
                    {opt.desc}
                  </div>
                </div>

                {opt.id !== 'off' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.setSoundType(opt.id);
                      soundEngine.playKeySound();
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: 'none',
                      color: 'var(--text-color)',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Play size={13} /> Test
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

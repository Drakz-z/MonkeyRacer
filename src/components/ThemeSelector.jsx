import React from 'react';
import { X, Check } from 'lucide-react';
import { THEMES } from '../utils/themes';

export default function ThemeSelector({ isOpen, onClose, currentTheme, onSelectTheme }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-color)' }}>
          Color Themes
        </h2>
        <p style={{ color: 'var(--sub-color)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Select your favorite Monkeytype aesthetic theme:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {Object.entries(THEMES).map(([key, theme]) => {
            const isSelected = currentTheme === key;
            return (
              <div
                key={key}
                onClick={() => onSelectTheme(key)}
                style={{
                  background: theme.bg,
                  border: `2px solid ${isSelected ? theme.main : theme.sub + '40'}`,
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: isSelected ? `0 0 15px ${theme.main}40` : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ color: theme.text, fontWeight: 700, fontSize: '0.95rem' }}>
                    {theme.name}
                  </div>
                  <div style={{ display: 'flex', gap: '5px', marginTop: '6px' }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: theme.main }} />
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: theme.text }} />
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: theme.sub }} />
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: theme.error }} />
                  </div>
                </div>

                {isSelected && (
                  <div style={{ background: theme.main, color: theme.bg, borderRadius: '50%', padding: '3px', display: 'flex' }}>
                    <Check size={16} strokeWidth={3} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

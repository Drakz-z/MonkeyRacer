import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Check, X } from 'lucide-react';

// Shows the racer's current name with an edit button; saving sends a rename to the room
export default function NameEditor({ name, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const save = () => {
    const clean = draft.trim().slice(0, 18);
    if (clean && clean !== name) onRename(clean);
    setEditing(false);
  };

  const iconBtn = {
    background: 'transparent',
    border: '1px solid var(--card-border)',
    borderRadius: '8px',
    color: 'var(--text-color)',
    cursor: 'pointer',
    padding: '0.3rem',
    display: 'inline-flex',
  };

  return (
    <div>
      <div style={{ fontSize: '0.8rem', color: 'var(--sub-color)', textTransform: 'uppercase', fontWeight: 600 }}>
        Your Name
      </div>
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '4px' }}
        >
          <input
            ref={inputRef}
            value={draft}
            maxLength={18}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
            style={{
              background: 'var(--bg-color)',
              border: '1px solid var(--main-color)',
              borderRadius: '8px',
              padding: '0.4rem 0.6rem',
              color: 'var(--text-color)',
              fontSize: '1rem',
              fontWeight: 700,
              fontFamily: 'var(--font-ui)',
              outline: 'none',
              width: '11rem',
            }}
          />
          <button type="submit" style={iconBtn} title="Save name">
            <Check size={16} color="var(--main-color)" />
          </button>
          <button type="button" style={iconBtn} title="Cancel" onClick={() => setEditing(false)}>
            <X size={16} />
          </button>
        </form>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-color)' }}>{name}</span>
          <button style={iconBtn} onClick={() => setEditing(true)} title="Change your name">
            <Pencil size={14} color="var(--main-color)" />
          </button>
        </div>
      )}
    </div>
  );
}

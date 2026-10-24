import React, { useEffect, useRef } from 'react';
import { LogIn, Loader2, AlertCircle, Flag } from 'lucide-react';

// Shown to people who open a room link / QR code: the room is already chosen,
// so they only need a name and a Join button
export default function InviteJoin({ roomCode, username, onUsernameChange, onJoin, onDismiss, busy, error }) {
  const nameInputRef = useRef(null);
  const canJoin = !busy && username.trim().length > 0;

  useEffect(() => {
    nameInputRef.current?.focus();
    nameInputRef.current?.select();
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (canJoin) onJoin();
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto', width: '100%' }}>
      <form
        onSubmit={submit}
        style={{
          background: 'var(--sub-alt-color)',
          border: '1px solid var(--card-border)',
          borderRadius: '20px',
          padding: '2.25rem 2rem 1.75rem',
          boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2.6rem', lineHeight: 1 }}>🐵🏁</div>
        <div style={{
          marginTop: '1rem',
          fontSize: '0.78rem',
          fontWeight: 700,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--sub-color)',
        }}>
          You're invited to race in
        </div>

        {/* Room "ticket" */}
        <div style={{
          position: 'relative',
          margin: '0.75rem auto 1.75rem',
          padding: '1rem 1.25rem',
          border: '2px dashed var(--main-color)',
          borderRadius: '14px',
          background: 'rgba(226, 183, 20, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
        }}>
          <Flag size={22} color="var(--main-color)" />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '2.1rem',
            fontWeight: 800,
            letterSpacing: '2px',
            color: 'var(--main-color)',
          }}>
            {roomCode}
          </span>
        </div>

        <label style={{
          display: 'block',
          textAlign: 'left',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--sub-color)',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
        }}>
          Pick your racer name
        </label>
        <input
          ref={nameInputRef}
          type="text"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          placeholder="Enter racer name..."
          maxLength={18}
          style={{
            width: '100%',
            background: 'var(--bg-color)',
            border: '1px solid var(--card-border)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            color: 'var(--text-color)',
            fontSize: '1.15rem',
            fontFamily: 'var(--font-ui)',
            fontWeight: 700,
            textAlign: 'center',
            outline: 'none',
          }}
        />

        <button
          type="submit"
          className="btn-primary"
          disabled={!canJoin}
          style={{ marginTop: '1.25rem', width: '100%', padding: '0.95rem', fontSize: '1.1rem' }}
        >
          {busy ? <Loader2 size={20} className="spin" /> : <LogIn size={20} />}
          <span>{busy ? 'Joining…' : error ? 'Try Again' : 'Join Race'}</span>
        </button>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.4rem',
            marginTop: '1rem',
            color: 'var(--error-color)',
            fontSize: '0.85rem',
            textAlign: 'left',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onDismiss}
          disabled={!!busy}
          style={{
            marginTop: '1.5rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--sub-color)',
            fontSize: '0.82rem',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Not your room? Create your own or enter another code
        </button>
      </form>
    </div>
  );
}

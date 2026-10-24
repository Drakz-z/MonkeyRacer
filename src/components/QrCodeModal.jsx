import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Smartphone, AlertCircle } from 'lucide-react';
import { getRoomShareUrl, isLocalhostUrl } from '../utils/room';
import QRCode from 'qrcode';

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API is unavailable on plain-http LAN addresses; fall back to execCommand
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  }
}

export function useQrCode(text, width = 240) {
  const [qrSrc, setQrSrc] = useState(null);
  useEffect(() => {
    if (!text) return undefined;
    let isMounted = true;
    QRCode.toDataURL(text, {
      margin: 2,
      width,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => {
        if (isMounted) setQrSrc(url);
      })
      .catch((err) => console.error(err));
    return () => { isMounted = false; };
  }, [text, width]);
  return qrSrc;
}

export function LocalhostWarning() {
  if (!isLocalhostUrl()) return null;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.4rem',
      color: 'var(--error-color)',
      fontSize: '0.78rem',
      marginTop: '0.6rem',
      textAlign: 'left',
    }}>
      <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
      <span>
        This link uses <b>localhost</b>, which other devices can't open. Share the room code instead,
        or open this site via its network address / the live site.
      </span>
    </div>
  );
}

export default function QrCodeModal({ isOpen, onClose, roomId }) {
  const [copied, setCopied] = useState(false);
  const joinUrl = roomId ? getRoomShareUrl(roomId) : '';
  const qrSrc = useQrCode(isOpen ? joinUrl : '', 240);

  if (!isOpen || !roomId) return null;

  const copyToClipboard = async () => {
    if (await copyText(joinUrl)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Smartphone size={24} color="var(--main-color)" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-color)' }}>
            Join Race on Phone
          </h2>
        </div>
        <p style={{ color: 'var(--sub-color)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          Scan with your phone camera — works on any network, no app needed.
        </p>

        <div className="qr-container">
          {qrSrc ? (
            <img src={qrSrc} alt="Room QR Code" className="qr-image" />
          ) : (
            <div style={{ width: 210, height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sub-color)' }}>
              Generating QR...
            </div>
          )}

          <div className="room-code-tag">
            {roomId}
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--sub-alt-color)',
          border: '1px solid var(--card-border)',
          borderRadius: '10px',
          padding: '0.5rem 0.75rem',
          margin: '1rem 0 0',
          gap: '0.5rem'
        }}>
          <input
            type="text"
            readOnly
            value={joinUrl}
            onFocus={(e) => e.target.select()}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-color)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          />
          <button
            onClick={copyToClipboard}
            className="btn-primary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        <LocalhostWarning />
      </div>
    </div>
  );
}

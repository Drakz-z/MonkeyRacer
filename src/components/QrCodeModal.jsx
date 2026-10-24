import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Smartphone, Wifi, ExternalLink } from 'lucide-react';
import { getRoomShareUrl } from '../utils/socket';
import QRCode from 'qrcode';

export default function QrCodeModal({ isOpen, onClose, roomId, lanIp, port }) {
  const [copied, setCopied] = useState(false);
  const [qrSrc, setQrSrc] = useState(null);
  const [selectedHost, setSelectedHost] = useState(lanIp || 'localhost');

  if (!isOpen || !roomId) return null;

  const joinUrl = getRoomShareUrl(roomId, selectedHost, port);

  // Generate QR code client-side
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(joinUrl, {
      margin: 2,
      width: 240,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => {
        if (isMounted) setQrSrc(url);
      })
      .catch((err) => console.error(err));
    return () => { isMounted = false; };
  }, [joinUrl]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
          Scan this QR code with your mobile camera to join up to 200 racers!
        </p>

        {/* QR Code Container */}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--sub-color)', fontSize: '0.8rem', marginTop: '4px' }}>
            <Wifi size={14} color="var(--main-color)" />
            <span>Connect to same Wi-Fi network</span>
          </div>
        </div>

        {/* Direct Link & Copy */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--sub-alt-color)',
          border: '1px solid var(--card-border)',
          borderRadius: '10px',
          padding: '0.5rem 0.75rem',
          margin: '1rem 0',
          gap: '0.5rem'
        }}>
          <input
            type="text"
            readOnly
            value={joinUrl}
            style={{
              flex: 1,
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

        {/* Network host switch if multiple options */}
        {lanIp && lanIp !== 'localhost' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--sub-color)' }}>Host IP:</span>
            <span
              onClick={() => setSelectedHost(lanIp)}
              style={{
                cursor: 'pointer',
                color: selectedHost === lanIp ? 'var(--main-color)' : 'var(--sub-color)',
                fontWeight: selectedHost === lanIp ? 'bold' : 'normal',
                textDecoration: 'underline'
              }}
            >
              LAN ({lanIp})
            </span>
            <span
              onClick={() => setSelectedHost('localhost')}
              style={{
                cursor: 'pointer',
                color: selectedHost === 'localhost' ? 'var(--main-color)' : 'var(--sub-color)',
                fontWeight: selectedHost === 'localhost' ? 'bold' : 'normal',
                textDecoration: 'underline'
              }}
            >
              Localhost
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

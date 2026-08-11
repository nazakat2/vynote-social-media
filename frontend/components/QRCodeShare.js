'use client';
import { useState, useEffect } from 'react';

export default function QRCodeShare({ username, onClose }) {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (username) {
      setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://vynote.app/${username}`)}`);
    }
  }, [username]);

  const handleDownload = async () => {
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode-${username}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(`https://vynote.app/${username}`);
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(380px,96vw)', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: ink, margin: 0 }}>My QR Code</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer' }}>x</button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
            {qrUrl ? (
              <img src={qrUrl} alt="QR Code" style={{ width: 180, height: 180, display: 'block' }} />
            ) : (
              <div style={{ width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13 }}>Loading...</div>
            )}
          </div>

          <p style={{ fontSize: 13, color: sub, marginBottom: 4 }}>Scan to follow <span style={{ fontWeight: 700, color: ink }}>@{username}</span></p>
          <p style={{ fontSize: 12, color: sub, marginBottom: 16 }}>vynote.app/{username}</p>

          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button onClick={handleCopyLink} style={{ flex: 1, height: 42, borderRadius: 21, background: chip, color: ink, fontWeight: 600, fontSize: 14, border: `1px solid ${line}`, cursor: 'pointer' }}>
              Copy Link
            </button>
            <button onClick={handleDownload} style={{ flex: 1, height: 42, borderRadius: 21, background: '#ff2442', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>
              Download
            </button>
          </div>

          <button onClick={() => {
            if (navigator.share) {
              navigator.share({ title: `Follow me on VyNote!`, url: `https://vynote.app/${username}` });
            }
          }} style={{ width: '100%', height: 42, borderRadius: 21, background: 'transparent', color: '#ff2442', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', marginTop: 8 }}>
            Share Profile
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRef, useEffect } from 'react';

export default function LivePlayer({ stream, remoteStream, localStream, isOwner }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isOwner && localStream) {
        videoRef.current.srcObject = localStream;
      } else if (remoteStream) {
        videoRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, localStream, isOwner]);

  return (
    <div style={{ position: 'relative', background: '#000', width: '100%', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden' }}>
      <video ref={videoRef} autoPlay muted={isOwner} playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ padding: '4px 10px', borderRadius: 6, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, animation: 'pulse 1.5s infinite' }}>LIVE</span>
      </div>

      {isOwner && !localStream && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)' }}>
          <p style={{ color: '#fff', fontSize: 14 }}>Camera preview</p>
        </div>
      )}

      {!isOwner && !remoteStream && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.5)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#fff', fontSize: 14 }}>Connecting to stream...</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

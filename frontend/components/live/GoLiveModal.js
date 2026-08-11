'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMediaDevices } from '../../hooks/useMediaDevices';
import { useLiveStream } from '../../hooks/useLiveStream';
import { LIVE_CATEGORIES } from '../../lib/live/liveUtils';

export default function GoLiveModal({ onClose, addToast }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true);

  const {
    devices,
    cameraEnabled,
    microphoneEnabled,
    permissionState,
    error: deviceError,
    requestAccess,
    stopStream,
    toggleCamera,
    toggleMicrophone,
    switchMicrophone,
    switchCamera,
  } = useMediaDevices();

  const {
    stream,
    isBroadcasting,
    localStream,
    status,
    error: streamError,
    duration,
    startBroadcasting,
    stopBroadcasting,
  } = useLiveStream();

  const videoRef = useRef(null);
  const previewStreamRef = useRef(null);
  const chatEndRef = useRef(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [micDevices, setMicDevices] = useState([]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const s = await requestAccess();
      if (mounted && s && videoRef.current) {
        videoRef.current.srcObject = s;
        previewStreamRef.current = s;
      }
      const devs = await navigator.mediaDevices?.enumerateDevices?.() || [];
      if (mounted) {
        setCameraDevices(devs.filter((d) => d.kind === 'videoinput'));
        setMicDevices(devs.filter((d) => d.kind === 'audioinput'));
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (localStream && videoRef.current && isBroadcasting) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, isBroadcasting]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleStart = async () => {
    if (status === 'starting') return;
    try {
      await startBroadcasting({ title, description, category }, { stream: previewStreamRef.current });
      addToast?.('Live stream started!');
    } catch (err) {
      addToast?.(err.message || 'Failed to start stream');
    }
  };

  const handleEnd = async () => {
    const { replay, replayError } = await stopBroadcasting();
    stopStream();
    addToast?.(replay
      ? 'Stream ended — replay saved to your profile'
      : `Stream ended — replay was not saved${replayError?.message ? `: ${replayError.message}` : ''}`);
    onClose();
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [...prev, { username: 'You', text: chatInput, timestamp: Date.now() }]);
    setChatInput('');
  };

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  const errorMsg = deviceError || streamError;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget && !isBroadcasting) onClose(); }}>
      <div style={{ width: 'min(900px,96vw)', maxHeight: '92vh', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease', display: 'flex', flexDirection: 'column' }}>

        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: ink, margin: 0 }}>
            {isBroadcasting ? 'Live Stream' : 'Go Live'}
          </h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isBroadcasting && (
              <>
                <span style={{ padding: '3px 8px', borderRadius: 6, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, animation: 'pulse 1.5s infinite' }}>LIVE</span>
                <span style={{ fontSize: 12, color: sub }}>{formatDuration(duration)}</span>
              </>
            )}
            <button onClick={isBroadcasting ? () => setShowEndConfirm(true) : onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer', fontSize: 16 }}>x</button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, padding: 16 }}>
            <div style={{ position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9', marginBottom: 12 }}>
              <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              {errorMsg && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.8)', padding: 20 }}>
                  <p style={{ color: '#fff', fontSize: 14, textAlign: 'center', margin: 0 }}>{errorMsg}</p>
                  {deviceError && <button type="button" onClick={async () => {
                    const s = await requestAccess();
                    if (s && videoRef.current) {
                      videoRef.current.srcObject = s;
                      previewStreamRef.current = s;
                    }
                  }} style={{ padding: '8px 14px', borderRadius: 18, border: '1px solid rgba(255,255,255,.35)', background: '#fff', color: '#222', fontWeight: 700, cursor: 'pointer' }}>
                    Retry device access
                  </button>}
                </div>
              )}
              {!isBroadcasting && !errorMsg && (
                <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: 6 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 11, fontWeight: 600 }}>
                    {cameraEnabled ? '📷 Camera On' : '📷 Camera Off'}
                  </span>
                  <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 11, fontWeight: 600 }}>
                    {microphoneEnabled ? '🎤 Mic On' : '🎤 Mic Off'}
                  </span>
                </div>
              )}
            </div>

            {isBroadcasting && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: 'center' }}>
                <button onClick={toggleCamera} style={{ padding: '8px 16px', borderRadius: 10, background: cameraEnabled ? chip : 'rgba(239,68,68,.15)', color: cameraEnabled ? ink : '#ef4444', border: `1px solid ${cameraEnabled ? line : 'rgba(239,68,68,.3)'}`, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  {cameraEnabled ? '📷 Camera' : '📷 Off'}
                </button>
                <button onClick={toggleMicrophone} style={{ padding: '8px 16px', borderRadius: 10, background: microphoneEnabled ? chip : 'rgba(239,68,68,.15)', color: microphoneEnabled ? ink : '#ef4444', border: `1px solid ${microphoneEnabled ? line : 'rgba(239,68,68,.3)'}`, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  {microphoneEnabled ? '🎤 Mic' : '🎤 Muted'}
                </button>
                <button onClick={switchCamera} style={{ padding: '8px 16px', borderRadius: 10, background: chip, color: ink, border: `1px solid ${line}`, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  🔄 Switch
                </button>
              </div>
            )}

            {!isBroadcasting && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Stream title (optional)" style={{ width: '100%', height: 40, borderRadius: 10, border: `1px solid ${line}`, background: chip, color: ink, padding: '0 14px', fontSize: 14, boxSizing: 'border-box' }} />
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} style={{ width: '100%', borderRadius: 10, border: `1px solid ${line}`, background: chip, color: ink, padding: '10px 14px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', height: 40, borderRadius: 10, border: `1px solid ${line}`, background: chip, color: ink, padding: '0 14px', fontSize: 14, boxSizing: 'border-box' }}>
                  <option value="">Select category</option>
                  {LIVE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                <div style={{ display: 'flex', gap: 8 }}>
                  {micDevices.length > 1 && (
                    <select onChange={(e) => switchMicrophone(e.target.value)} style={{ flex: 1, height: 38, borderRadius: 8, border: `1px solid ${line}`, background: chip, color: ink, padding: '0 10px', fontSize: 12, boxSizing: 'border-box' }}>
                      {micDevices.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0, 4)}`}</option>)}
                    </select>
                  )}
                </div>
              </div>
            )}

            {!isBroadcasting && (
              <button onClick={handleStart} disabled={status === 'starting' || !previewStreamRef.current} style={{ width: '100%', height: 48, borderRadius: 24, background: 'linear-gradient(135deg, #ef4444, #f97316)', color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', cursor: status === 'starting' || !previewStreamRef.current ? 'not-allowed' : 'pointer', marginTop: 14, opacity: status === 'starting' || !previewStreamRef.current ? 0.55 : 1 }}>
                {status === 'starting' ? 'Starting...' : 'Start Live Stream'}
              </button>
            )}
          </div>

          <div style={{ width: 300, borderLeft: `1px solid ${line}`, display: 'flex', flexDirection: 'column', background: bg }}>
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: ink, margin: 0 }}>Live Chat</h4>
              {isBroadcasting && (
                <button onClick={() => setShowChat(!showChat)} style={{ padding: '4px 10px', borderRadius: 8, background: chip, border: `1px solid ${line}`, color: ink, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {showChat ? 'Hide' : 'Show'}
                </button>
              )}
            </div>

            {showChat && (
              <>
                <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {chatMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: sub, fontSize: 13 }}>No messages yet</div>
                  ) : chatMessages.map((m, i) => (
                    <div key={i} style={{ fontSize: 13 }}>
                      <span style={{ fontWeight: 700, color: '#ff2442', marginRight: 6 }}>{m.username}:</span>
                      <span style={{ color: ink }}>{m.text}</span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div style={{ padding: 10, borderTop: `1px solid ${line}`, display: 'flex', gap: 8 }}>
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} placeholder="Say something..." style={{ flex: 1, height: 36, borderRadius: 18, border: `1px solid ${line}`, background: chip, color: ink, padding: '0 14px', fontSize: 13 }} />
                  <button onClick={sendChat} style={{ width: 36, height: 36, borderRadius: '50%', background: '#ff2442', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M2 21 23 12 2 3v7l15 2-15 2z" /></svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showEndConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: bg, borderRadius: 16, padding: 24, width: 'min(340px,90vw)', textAlign: 'center' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: ink, marginBottom: 8 }}>End Live Stream?</h3>
            <p style={{ fontSize: 14, color: sub, marginBottom: 20 }}>Are you sure you want to end this live stream?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowEndConfirm(false)} style={{ flex: 1, height: 42, borderRadius: 21, background: chip, color: ink, fontWeight: 600, fontSize: 14, border: `1px solid ${line}`, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleEnd} style={{ flex: 1, height: 42, borderRadius: 21, background: '#ef4444', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>End Live</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

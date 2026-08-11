'use client';
import { useState, useRef, useEffect } from 'react';

export default function VoiceMessage({ onSend, onClose }) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [playing, setPlaying] = useState(false);
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.current.start();
      setRecording(true);
      setDuration(0);
      timer.current = setInterval(() => setDuration(p => p + 1), 1000);
    } catch (err) {
      console.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    setRecording(false);
    if (timer.current) clearInterval(timer.current);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setPlaying(!playing);
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(340px,96vw)', background: bg, borderRadius: 20, padding: 24, textAlign: 'center', animation: 'modalIn .25s ease' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: ink, marginBottom: 20 }}>Voice Message</h3>

        {!audioUrl ? (
          <>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: recording ? 'rgba(239,68,68,.1)' : 'rgba(255,36,66,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: recording ? 'pulse 1s infinite' : 'none' }}>
              <button onClick={recording ? stopRecording : startRecording} style={{ width: 60, height: 60, borderRadius: '50%', background: recording ? '#ef4444' : '#ff2442', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 24 }}>
                {recording ? '⏹' : '🎤'}
              </button>
            </div>
            {recording && <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>{formatDuration(duration)}</div>}
            <p style={{ fontSize: 13, color: sub }}>{recording ? 'Tap to stop' : 'Tap to start recording'}</p>
          </>
        ) : (
          <>
            <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} style={{ display: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
              <button onClick={togglePlay} style={{ width: 48, height: 48, borderRadius: '50%', background: '#ff2442', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 20 }}>
                {playing ? '⏸' : '▶️'}
              </button>
              <div style={{ fontSize: 14, color: ink }}>{formatDuration(duration)}</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setAudioUrl(null); setDuration(0); }} style={{ flex: 1, height: 40, borderRadius: 20, background: line, color: ink, fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>Retake</button>
              <button onClick={() => { onSend?.(audioUrl); onClose(); }} style={{ flex: 1, height: 40, borderRadius: 20, background: '#ff2442', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

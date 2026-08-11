'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function LiveStream({ onClose, addToast }) {
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [title, setTitle] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [streamId, setStreamId] = useState(null);
  const [starting, setStarting] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    return () => { stopStream(); };
  }, []);

  const startStream = async () => {
    if (starting) return;
    setStarting(true);
    setMediaError('');
    let stream;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access is not supported in this browser.');
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (mediaErr) {
        if (mediaErr?.name === 'NotFoundError' || mediaErr?.name === 'OverconstrainedError') {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          addToast?.('Microphone unavailable — continuing with video only');
        } else {
          throw mediaErr;
        }
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in before starting a live stream.');
      const { data, error: storyError } = await supabase.from('stories').insert({
        user_id: user.id,
        image_url: '',
        caption: title || 'Live Stream'
      }).select().single();

      const liveId = data?.id || crypto.randomUUID();
      if (storyError) console.warn('Live discovery record was not created:', storyError.message);
      setStreamId(data?.id || null);
      setIsLive(true);
      setViewers(1);

        channelRef.current = supabase.channel(`live-${liveId}`)
          .on('broadcast', { event: 'chat' }, (payload) => {
            setChatMessages(prev => [...prev, payload.payload]);
          })
          .on('presence', { event: 'sync' }, () => {
            const state = channelRef.current.presenceState();
            setViewers(Object.keys(state).length);
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await channelRef.current.track({ user_id: user.id, username: user.email?.split('@')[0] });
            }
          });

      addToast?.(storyError ? 'Live preview started (discovery listing unavailable)' : 'Live stream started!');
    } catch (err) {
      stream?.getTracks().forEach((track) => track.stop());
      const messages = {
        NotAllowedError: 'Camera or microphone permission was blocked. Allow it in Site settings and retry.',
        NotReadableError: 'Camera or microphone is busy in another app. Close that app and retry.',
        AbortError: 'The camera could not start. Please reconnect it and retry.',
        SecurityError: 'Camera access is blocked by browser security settings.',
      };
      const message = messages[err?.name] || err?.message || 'Unable to start the camera.';
      setMediaError(message);
      addToast?.(message);
    } finally {
      setStarting(false);
    }
  };

  const stopStream = async () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (streamId) {
      await supabase.from('stories').delete().eq('id', streamId);
    }
    channelRef.current && supabase.removeChannel(channelRef.current);
    setIsLive(false);
    setViewers(0);
    setStreamId(null);
    setChatMessages([]);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !channelRef.current) return;
    const { data: { user } } = await supabase.auth.getUser();
    const msg = { username: user?.email?.split('@')[0] || 'Anonymous', text: chatInput, timestamp: Date.now() };
    await channelRef.current.send({ type: 'broadcast', event: 'chat', payload: msg });
    setChatMessages(prev => [...prev, msg]);
    setChatInput('');
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(800px,96vw)', maxHeight: '90vh', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease', display: 'flex' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ position: 'relative', background: '#000', aspectRatio: '16/9' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {isLive && (
              <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ padding: '4px 10px', borderRadius: 6, background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, animation: 'pulse 1.5s infinite' }}>LIVE</span>
                <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 11, fontWeight: 600 }}>👁 {viewers}</span>
              </div>
            )}
          </div>

          <div style={{ padding: 16 }}>
            {!isLive ? (
              <>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Stream title (optional)" style={{ width: '100%', height: 40, borderRadius: 10, border: `1px solid ${line}`, background: chip, color: ink, padding: '0 14px', fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
                {mediaError && <div role="alert" style={{ margin: '-2px 2px 12px', padding: '9px 11px', borderRadius: 9, background: '#fff0f2', color: '#c81e3a', fontSize: 12, lineHeight: 1.45 }}>{mediaError}</div>}
                <button disabled={starting} onClick={startStream} style={{ width: '100%', height: 44, borderRadius: 22, background: 'linear-gradient(135deg, #ef4444, #f97316)', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: starting ? 'wait' : 'pointer', opacity: starting ? .7 : 1 }}>
                  {starting ? 'Starting camera…' : 'Start Live Stream'}
                </button>
              </>
            ) : (
              <button onClick={stopStream} style={{ width: '100%', height: 44, borderRadius: 22, background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
                End Stream
              </button>
            )}
          </div>
        </div>

        <div style={{ width: 280, borderLeft: `1px solid ${line}`, display: 'flex', flexDirection: 'column', background: bg }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${line}` }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: ink, margin: 0 }}>Live Chat</h4>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: sub, fontSize: 12 }}>No messages yet</div>
            ) : chatMessages.map((m, i) => (
              <div key={i} style={{ fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: '#ff2442', marginRight: 6 }}>{m.username}:</span>
                <span style={{ color: ink }}>{m.text}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: 12, borderTop: `1px solid ${line}`, display: 'flex', gap: 8 }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Say something..." style={{ flex: 1, height: 36, borderRadius: 18, border: `1px solid ${line}`, background: chip, color: ink, padding: '0 14px', fontSize: 13 }} />
            <button onClick={sendChat} style={{ width: 36, height: 36, borderRadius: '50%', background: '#ff2442', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M2 21 23 12 2 3v7l15 2-15 2z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

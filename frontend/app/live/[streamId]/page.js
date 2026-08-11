'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../lib/AuthContext';
import { supabase } from '../../../lib/supabase';
import { getStreamById, joinStreamAsViewer, leaveStreamAsViewer, sendChatMessage, getChatMessages, sendReaction, deleteChatMessage } from '../../../lib/live/liveService';
import { formatViewerCount, formatDuration, REACTION_TYPES } from '../../../lib/live/liveUtils';
import LivePlayer from '../../../components/live/LivePlayer';
import LiveChat from '../../../components/live/LiveChat';
import Sidebar from '../../../components/Sidebar';
import { useLivePresence } from '../../../hooks/useLivePresence';

export default function StreamViewerPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const streamId = params?.streamId;

  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [following, setFollowing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showChat, setShowChat] = useState(true);
  const [showEndOverlay, setShowEndOverlay] = useState(false);
  const [reaction, setReaction] = useState(null);
  const durationRef = useRef(null);

  const { viewerCount, peakViewerCount } = useLivePresence(streamId);

  useEffect(() => {
    if (!streamId) return;
    loadStream();
    return () => cleanup();
  }, [streamId]);

  useEffect(() => {
    if (!streamId || !user) return;
    joinStreamAsViewer(streamId);
    return () => { leaveStreamAsViewer(streamId); };
  }, [streamId, user]);

  useEffect(() => {
    if (!stream) return;
    const startedAt = new Date(stream.started_at).getTime();
    const tick = () => setDuration(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    durationRef.current = setInterval(tick, 1000);
    return () => clearInterval(durationRef.current);
  }, [stream]);

  useEffect(() => {
    if (!streamId) return;
    const channel = supabase.channel(`live-viewer-${streamId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_streams', filter: `id=eq.${streamId}` }, (payload) => {
        const updated = payload.new;
        setStream((prev) => prev ? { ...prev, ...updated } : prev);
        if (updated.status === 'ended') {
          setShowEndOverlay(true);
          clearInterval(durationRef.current);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [streamId]);

  const loadStream = async () => {
    try {
      const data = await getStreamById(streamId);
      setStream(data);
      if (data.status === 'ended') {
        setShowEndOverlay(true);
      }
      if (user && data.user_id) {
        const { data: followData } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', data.user_id).maybeSingle();
        setFollowing(!!followData);
      }
    } catch (err) {
      setError('Stream not found');
    } finally {
      setLoading(false);
    }
  };

  const cleanup = () => {
    if (streamId && user) {
      leaveStreamAsViewer(streamId).catch(() => {});
    }
  };

  const handleFollow = async () => {
    if (!user || !stream?.user_id) return;
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', stream.user_id);
      setFollowing(false);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: stream.user_id });
      setFollowing(true);
    }
  };

  const handleReaction = async (type) => {
    if (!streamId) return;
    sendReaction(streamId, type);
    setReaction(type);
    setTimeout(() => setReaction(null), 1500);
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg, #fafafa)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--line, #e5e5e5)', borderTopColor: 'var(--rn-red, #ff2442)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--sub, #888)', fontSize: 14 }}>Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg, #fafafa)' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>📺</span>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink, #222)', marginBottom: 8 }}>{error || 'Stream not found'}</h2>
          <button onClick={() => router.push('/live')} style={{ height: 42, padding: '0 24px', borderRadius: 21, background: 'var(--rn-red, #ff2442)', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', marginTop: 16 }}>Browse Live Streams</button>
        </div>
      </div>
    );
  }

  const profileData = stream.profiles;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #fafafa)', paddingBottom: 20 }}>
      <Sidebar
        onExplore={() => router.push('/')}
        onPost={() => user ? router.push('/?create=1') : router.push('/auth/login')}
        onNotifications={() => user ? router.push('/?notifications=1') : router.push('/auth/login')}
        onLive={() => router.push('/live')}
      />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px' }}>
        <button onClick={() => router.push('/live')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub, #888)', fontSize: 14, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 18l-6-6 6-6" /></svg>
          Back to Live
        </button>

        <div style={{ display: 'flex', gap: 20, flexDirection: window.innerWidth < 768 ? 'column' : 'row' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9' }}>
              <LivePlayer stream={stream} isOwner={false} />

              {showEndOverlay && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <span style={{ fontSize: 48 }}>📺</span>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>This live stream has ended.</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,.7)' }}>Thanks for watching!</p>
                  <button onClick={() => router.push('/live')} style={{ height: 42, padding: '0 24px', borderRadius: 21, background: 'var(--rn-red, #ff2442)', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', marginTop: 8 }}>Browse More Streams</button>
                </div>
              )}

              {reaction && (
                <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontSize: 48, animation: 'reactionFloat 1.5s ease-out forwards' }}>
                  {REACTION_TYPES.find((r) => r.type === reaction)?.emoji}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 0' }}>
              <img src={profileData?.avatar_url || 'https://i.pravatar.cc/150'} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--line, #e5e5e5)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink, #222)', margin: 0 }}>
                    {profileData?.display_name || profileData?.username || 'User'}
                  </h2>
                  {profileData?.is_verified && <span style={{ fontSize: 14 }}>✅</span>}
                </div>
                <p style={{ fontSize: 13, color: 'var(--sub, #888)', margin: '2px 0 0' }}>@{profileData?.username}</p>
              </div>

              {user && user.id !== stream.user_id && (
                <button onClick={handleFollow} style={{ padding: '8px 20px', borderRadius: 18, background: following ? 'var(--chip, #f5f5f7)' : 'var(--rn-red, #ff2442)', color: following ? 'var(--ink, #222)' : '#fff', fontWeight: 700, fontSize: 13, border: following ? '1px solid var(--line, #e5e5e5)' : 'none', cursor: 'pointer' }}>
                  {following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              {stream.title && <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink, #222)', margin: 0 }}>{stream.title}</h3>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 13, color: 'var(--sub, #888)' }}>👁 {formatViewerCount(viewerCount)} watching</span>
              </div>
              <span style={{ fontSize: 13, color: 'var(--sub, #888)' }}>⏱ {formatDuration(duration)}</span>
              {stream.category && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: 'var(--chip, #f5f5f7)', color: 'var(--sub, #888)' }}>{stream.category}</span>}
            </div>

            {stream.description && <p style={{ fontSize: 14, color: 'var(--ink, #222)', lineHeight: 1.6 }}>{stream.description}</p>}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {REACTION_TYPES.map((r) => (
                <button key={r.type} onClick={() => handleReaction(r.type)} style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--chip, #f5f5f7)', border: '1px solid var(--line, #e5e5e5)', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {r.emoji}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: 340, flexShrink: 0, height: 'calc(100vh - 120px)', maxHeight: 600, background: 'var(--card-bg, #fff)', borderRadius: 14, border: '1px solid var(--line, #f0f0f2)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <LiveChat streamId={streamId} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes reactionFloat { 0% { opacity: 1; transform: translateX(-50%) translateY(0); } 100% { opacity: 0; transform: translateX(-50%) translateY(-120px); } }
        @media (max-width: 768px) { div[style*="width: 340px"] { width: 100% !important; height: 400px !important; max-height: none !important; } }
      `}</style>
    </div>
  );
}

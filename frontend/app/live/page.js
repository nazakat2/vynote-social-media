'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import { getActiveStreams, getFollowingLiveStreams } from '../../lib/live/liveService';
import { supabase } from '../../lib/supabase';
import LiveGrid from '../../components/live/LiveGrid';
import GoLiveModal from '../../components/live/GoLiveModal';
import Sidebar from '../../components/Sidebar';

export default function LivePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [allStreams, setAllStreams] = useState([]);
  const [followingStreams, setFollowingStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [follows, setFollows] = useState({});
  const [showGoLive, setShowGoLive] = useState(false);

  useEffect(() => {
    loadStreams();
  }, []);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('live-streams-listener')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_streams' }, () => {
        loadStreams();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const loadStreams = async () => {
    try {
      const [all, following] = await Promise.all([
        getActiveStreams(),
        user ? getFollowingLiveStreams() : Promise.resolve([]),
      ]);
      setAllStreams(all);
      setFollowingStreams(following);

      if (user) {
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);
        const followMap = {};
        followingData?.forEach((f) => { followMap[f.following_id] = true; });
        setFollows(followMap);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    if (!user) { router.push('/auth/login'); return; }
    const { data } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).maybeSingle();
    if (data) {
      await supabase.from('follows').delete().eq('id', data.id);
      setFollows((prev) => ({ ...prev, [userId]: false }));
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: userId });
      setFollows((prev) => ({ ...prev, [userId]: true }));
    }
  };

  const handleStreamClick = (stream) => {
    router.push(`/live/${stream.id}`);
  };

  const handleGoLive = () => {
    if (!user) { router.push('/auth/login'); return; }
    setShowGoLive(true);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #fafafa)', paddingBottom: 40 }}>
      <Sidebar
        onExplore={() => router.push('/')}
        onPost={() => user ? router.push('/?create=1') : router.push('/auth/login')}
        onNotifications={() => user ? router.push('/?notifications=1') : router.push('/auth/login')}
        onLive={() => router.push('/live')}
      />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '30px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink, #222)', margin: 0, letterSpacing: '-0.5px' }}>Live</h1>
            <p style={{ fontSize: 14, color: 'var(--sub, #888)', margin: '4px 0 0' }}>Watch creators live or start your own stream</p>
          </div>
          <button onClick={handleGoLive} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, padding: '0 22px', borderRadius: 21, background: 'linear-gradient(135deg, #ef4444, #f97316)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(239,68,68,.35)' }}>
            <span style={{ fontSize: 16 }}>🔴</span> Go Live
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--sub, #888)' }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--line, #e5e5e5)', borderTopColor: 'var(--rn-red, #ff2442)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            Loading live streams...
          </div>
        ) : allStreams.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--card-bg, #fff)', borderRadius: 20, border: '1px solid var(--line, #f0f0f2)' }}>
            <span style={{ fontSize: 56, display: 'block', marginBottom: 16 }}>🔴</span>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink, #222)', marginBottom: 8 }}>No one is live right now.</h3>
            <p style={{ fontSize: 14, color: 'var(--sub, #888)', marginBottom: 24 }}>Be the first to go live and start engaging with your audience!</p>
            <button onClick={handleGoLive} style={{ height: 44, padding: '0 28px', borderRadius: 22, background: 'linear-gradient(135deg, #ef4444, #f97316)', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>Go Live Now</button>
          </div>
        ) : (
          <>
            {user && followingStreams.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink, #222)', marginBottom: 16 }}>Following Live</h2>
                <LiveGrid streams={followingStreams} onStreamClick={handleStreamClick} onFollow={handleFollow} follows={follows} />
              </div>
            )}

            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink, #222)', marginBottom: 16 }}>Live Now</h2>
              <LiveGrid streams={allStreams} onStreamClick={handleStreamClick} onFollow={handleFollow} follows={follows} />
            </div>
          </>
        )}
      </div>

      {showGoLive && (
        <GoLiveModal onClose={() => setShowGoLive(false)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

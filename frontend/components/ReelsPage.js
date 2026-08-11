'use client';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import NoteModal from './NoteModal';
import { useAuth } from '../lib/AuthContext';

const iconButton = { width: 46, height: 46, borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#fff', background: 'rgba(20,20,24,.58)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.2)', cursor: 'pointer', boxShadow: '0 5px 18px rgba(0,0,0,.22)' };
const countStyle = { fontSize: 11, fontWeight: 600, color: '#fff', textShadow: '0 1px 4px #000' };

export default function ReelsPage({ onClose, addToast }) {
  const { profile } = useAuth();
  const [reels, setReels] = useState([]);
  const [currentReel, setCurrentReel] = useState(0);
  const [liked, setLiked] = useState({});
  const [loading, setLoading] = useState(true);
  const [commentReel, setCommentReel] = useState(null);
  const [profileReel, setProfileReel] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => { loadReels(); }, []);

  const loadReels = async () => {
    const { data } = await supabase.from('posts').select('*, profiles:user_id(display_name, username, avatar_url)').not('video_url', 'is', null).order('created_at', { ascending: false }).limit(50);
    if (data) setReels(data);
    setLoading(false);
  };

  const toggleLike = async (reelId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return window.location.assign('/auth/login');
    setLiked(prev => ({ ...prev, [reelId]: !prev[reelId] }));
    await supabase.from('post_likes').upsert({ post_id: reelId, user_id: user.id });
  };

  const shareReel = async (reel) => {
    const url = `${window.location.origin}/?post=${reel.id}`;
    try {
      if (navigator.share) await navigator.share({ title: reel.title || 'VyNote video', url });
      else { await navigator.clipboard.writeText(url); addToast?.('Link copied'); }
    } catch (error) { if (error?.name !== 'AbortError') addToast?.('Could not share video'); }
  };

  const handleScroll = (event) => {
    const index = Math.round(event.target.scrollTop / event.target.clientHeight);
    if (index !== currentReel) setCurrentReel(index);
  };

  const Action = ({ label, children, onClick, active }) => (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 5 }}>
      <button onClick={onClick} style={{ ...iconButton, color: active ? '#ff2442' : '#fff' }}>{children}</button>
      <span style={countStyle}>{label}</span>
    </div>
  );

  return (
    <div className="rn-sidebar-aware-overlay" style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 90 }}>
      <button onClick={onClose} aria-label="Close reels" style={{ position: 'absolute', top: 16, left: 16, ...iconButton, width: 40, height: 40, zIndex: 10 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M15 18l-6-6 6-6" /></svg></button>
      <div ref={containerRef} onScroll={handleScroll} style={{ height: '100vh', overflowY: 'auto', scrollSnapType: 'y mandatory' }}>
        {loading ? <div style={{ height: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>Loading reels...</div> : reels.length === 0 ? <div style={{ height: '100vh', display: 'grid', placeItems: 'center', color: '#fff' }}>No reels yet. Upload a video to get started!</div> : reels.map((reel, index) => (
          <div key={reel.id} style={{ height: '100vh', scrollSnapAlign: 'start', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <video src={reel.video_url} poster={reel.image_url} autoPlay={index === currentReel} loop muted playsInline controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            <div style={{ position: 'absolute', bottom: 80, left: 16, right: 82, color: '#fff', pointerEvents: 'none' }}>
              <button onClick={() => setProfileReel(reel)} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: 0, background: 'none', border: 0, color: '#fff', cursor: 'pointer', textAlign: 'left', pointerEvents: 'auto' }}><img src={reel.profiles?.avatar_url || '/images/default-avatar.png'} alt="" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #fff', objectFit: 'cover' }} /><div><div style={{ fontSize: 14, fontWeight: 700 }}>{reel.profiles?.display_name}</div><div style={{ fontSize: 12, opacity: .8 }}>@{reel.profiles?.username}</div></div></button>
              <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 8 }}>{reel.title}</p>
              {reel.description && <p style={{ fontSize: 13, opacity: .8, lineHeight: 1.4 }}>{reel.description}</p>}
            </div>
            <div style={{ position: 'absolute', right: 18, bottom: 100, display: 'flex', flexDirection: 'column', gap: 17, alignItems: 'center' }}>
              <Action label={reel.like_count || 0} active={liked[reel.id]} onClick={() => toggleLike(reel.id)}><svg width="23" height="23" viewBox="0 0 24 24" fill={liked[reel.id] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg></Action>
              <Action label={reel.comment_count || 0} onClick={() => setCommentReel(reel)}><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /></svg></Action>
              <Action label="Share" onClick={() => shareReel(reel)}><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 16V3m0 0L7 8m5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg></Action>
            </div>
          </div>
        ))}
      </div>
      {commentReel && <NoteModal note={commentReel} me={profile} follows={{}} addToast={addToast} onClose={() => { setCommentReel(null); loadReels(); }} />}
      {profileReel && <NoteModal note={profileReel} me={profile} follows={{}} addToast={addToast} openProfileInitially onClose={() => setProfileReel(null)} />}
    </div>
  );
}

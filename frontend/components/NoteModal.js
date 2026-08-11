'use client';
import { useState, useEffect } from 'react';
import { comments as commentsApi, profiles as profilesApi, posts as postsApi } from '../lib/api/index';
import { supabase } from '../lib/supabase';

export default function NoteModal({ note, follows, onClose, onLike, onCollect, onFollow, addToast, onReport, onBlock, me, openProfileInitially = false }) {
  const [localNote, setLocalNote] = useState(note);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [publicProfile, setPublicProfile] = useState(null);
  const [publicPosts, setPublicPosts] = useState([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  const author = localNote.profiles || {};
  const authorName = author.display_name || author.username || 'Unknown';
  const authorAvatar = author.avatar_url || '/images/default-avatar.png';

  useEffect(() => {
    setLocalNote(note);
    loadComments();
  }, [note]);

  const loadComments = async () => {
    if (!note?.id) return;
    setLoadingComments(true);
    const { data } = await commentsApi.list(note.id);
    if (data) setComments(data);
    setLoadingComments(false);
  };

  if (!localNote) return null;

  const postComment = async () => {
    if (!commentText.trim() || postingComment) return;
    if (!me) {
      window.location.assign('/auth/login');
      return;
    }
    setPostingComment(true);
    const { data, error } = await commentsApi.create(localNote.id, commentText);
    setPostingComment(false);
    if (data) {
      setComments(prev => [{ ...data, profiles: data.profiles || me }, ...prev]);
      setCommentText('');
    } else if (error) {
      addToast?.(`Comment failed: ${error.message}`);
    }
  };

  const openAuthorProfile = async () => {
    if (!localNote.user_id) return;
    setProfileLoading(true);
    setPublicProfile(author);
    const [profileResult, postsResult] = await Promise.all([
      profilesApi.get(localNote.user_id),
      postsApi.list({ userId: localNote.user_id, limit: 20 })
    ]);
    if (profileResult.data) setPublicProfile(profileResult.data);
    setPublicPosts(postsResult.data || []);
    setProfileLoading(false);
  };

  useEffect(() => {
    if (openProfileInitially && note?.user_id) openAuthorProfile();
  }, [openProfileInitially, note?.user_id]);

  return (
    <div className="rn-sidebar-aware-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(1000px,96vw)', maxHeight: '94vh', background: bg, borderRadius: 20, overflow: 'hidden', display: 'flex', animation: 'modalIn .25s ease', position: 'relative' }}>

        <button onClick={onClose} style={{ position: 'absolute', top: 12, left: 12, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: 'rgba(0,0,0,.4)', border: 'none', cursor: 'pointer', zIndex: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M15 18l-6-6 6-6" /></svg>
        </button>

        <div style={{ flex: 1, minWidth: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '94vh' }}>
          {localNote.video_url ? (
            <video src={localNote.video_url} poster={localNote.image_url || undefined} controls autoPlay playsInline style={{ width: '100%', height: '100%', maxHeight: '94vh', objectFit: 'contain', background: '#000' }} />
          ) : (
            <img src={localNote.image_url || `https://picsum.photos/seed/${localNote.id}/400/500`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          )}
        </div>

        <div style={{ width: 'min(380px,40vw)', display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${line}`, maxHeight: '94vh', background: bg }}>
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <img onClick={openAuthorProfile} src={authorAvatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
            <div onClick={openAuthorProfile} style={{ flex: 1, cursor: 'pointer' }}>
              <b style={{ fontSize: 14, display: 'block', color: ink }}>{authorName}</b>
              <span style={{ fontSize: 11, color: sub }}>{new Date(localNote.created_at).toLocaleDateString()} · {localNote.category || ''}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {localNote.user_id !== supabase.auth.getUser()?.id && (
                <button onClick={() => onFollow?.(localNote.user_id)} style={{ height: 30, padding: '0 16px', borderRadius: 15, background: follows?.[localNote.user_id] ? chip : '#ff2442', color: follows?.[localNote.user_id] ? '#888' : '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  {follows?.[localNote.user_id] ? 'Following' : 'Follow'}
                </button>
              )}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowActions(!showActions)} style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', background: chip, border: 'none', cursor: 'pointer' }}>...</button>
                {showActions && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, width: 160, background: bg, border: `1px solid ${line}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.18)', padding: 6, zIndex: 20 }}>
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); addToast?.('Link copied!'); setShowActions(false); }} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 13, color: ink, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Copy Link</button>
                    <button onClick={() => { setShowActions(false); onReport?.('post', localNote.id); }} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Report</button>
                    <button onClick={() => { setShowActions(false); onBlock?.(localNote.user_id, author.display_name || author.username || 'user'); }} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Block User</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}` }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.4, marginBottom: 8, color: ink }}>{localNote.title}</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: ink, whiteSpace: 'pre-line' }}>{localNote.description}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              {(Array.isArray(localNote.tags) ? localNote.tags : []).map((t) => <span key={t} style={{ padding: '4px 12px', borderRadius: 14, background: 'rgba(255,107,107,.08)', color: '#ff2442', fontSize: 12, fontWeight: 600 }}>#{t}</span>)}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', background: bg }}>
            <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: ink }}>Comments ({comments.length})</h4>
            {loadingComments ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: sub }}>Loading comments...</div>
            ) : comments.length > 0 ? comments.map((c) => {
              const ca = c.profiles || {};
              const caName = ca.display_name || ca.username || 'Unknown';
              const caAvatar = ca.avatar_url || '/images/default-avatar.png';
              return (
                <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <img src={caAvatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <b style={{ fontSize: 13, display: 'block', color: ink }}>{caName}</b>
                    <p style={{ fontSize: 13.5, lineHeight: 1.5, marginTop: 4, color: ink }}>{c.content}</p>
                    <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 11, color: sub }}>
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            }) : <p style={{ color: sub, fontSize: 13, padding: '14px 0' }}>No comments yet</p>}
          </div>

          <div style={{ padding: '14px 20px', borderTop: `1px solid ${line}`, display: 'flex', gap: 10, alignItems: 'center', background: bg }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: chip, borderRadius: 20, padding: '10px 16px', border: `1px solid ${line}` }}>
              <img src={me?.avatar_url || '/images/default-avatar.png'} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && postComment()} placeholder="Say something nice..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: ink, fontSize: 14 }} />
            </div>
            {commentText && <button onClick={postComment} disabled={postingComment} style={{ height: 38, padding: '0 18px', borderRadius: 19, background: '#ff2442', color: '#fff', fontWeight: 700, border: 'none', cursor: postingComment ? 'wait' : 'pointer', fontSize: 13, opacity: postingComment ? .65 : 1 }}>{postingComment ? 'Posting...' : 'Post'}</button>}
          </div>

          <div style={{ padding: '14px 20px', borderTop: `1px solid ${line}`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, background: bg }}>
            {[
              { icon: localNote.is_liked ? '❤️' : '🤍', label: localNote.like_count || 0, onClick: () => onLike?.(localNote) },
              { icon: '💬', label: comments.length },
              { icon: localNote.is_collected ? '⭐' : '☆', label: localNote.collect_count || 0, onClick: () => onCollect?.(localNote) },
              { icon: '↗', label: '' }
            ].map((a, i) => (
              <button key={i} onClick={a.onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 0', borderRadius: 12, background: chip, border: `1px solid ${line}`, cursor: 'pointer', fontSize: 12, color: ink }}>
                <span style={{ fontSize: 20 }}>{a.icon}</span>
                {a.label ? <span style={{ fontSize: 11, color: sub }}>{a.label > 999 ? (a.label / 1000).toFixed(1) + 'k' : a.label}</span> : null}
              </button>
            ))}
          </div>
        </div>

        {publicProfile && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 130, background: 'rgba(15,15,18,.72)', display: 'grid', placeItems: 'center', padding: 20 }} onClick={(event) => event.target === event.currentTarget && setPublicProfile(null)}>
            <div style={{ width: 'min(430px,94vw)', maxHeight: '88vh', overflowY: 'auto', background: bg, borderRadius: 20, color: ink, boxShadow: '0 20px 60px rgba(0,0,0,.4)', position: 'relative' }}>
              <div style={{ height: 120, background: publicProfile.cover_url ? `url(${publicProfile.cover_url}) center/cover` : 'linear-gradient(135deg,#ff2442,#ff9b7b)' }} />
              <button onClick={() => setPublicProfile(null)} style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, border: 0, borderRadius: '50%', background: 'rgba(0,0,0,.4)', color: '#fff', cursor: 'pointer' }}>×</button>
              <div style={{ padding: '0 22px 24px' }}>
                <img src={publicProfile.avatar_url || '/images/default-avatar.png'} alt="" style={{ width: 78, height: 78, borderRadius: '50%', objectFit: 'cover', border: `4px solid ${bg}`, marginTop: -39 }} />
                <h3 style={{ marginTop: 9, fontSize: 21 }}>{publicProfile.display_name || publicProfile.username}</h3>
                <div style={{ color: sub, fontSize: 12 }}>@{publicProfile.username}</div>
                <p style={{ marginTop: 10, fontSize: 13 }}>{publicProfile.bio || 'No bio yet'}</p>
                <div style={{ display: 'flex', gap: 28, marginTop: 16, paddingBottom: 14, borderBottom: `1px solid ${line}` }}>
                  <span><b>{publicProfile.following_count || 0}</b> <small style={{ color: sub }}>Following</small></span>
                  <span><b>{publicProfile.follower_count || 0}</b> <small style={{ color: sub }}>Followers</small></span>
                  <span><b>{publicPosts.length}</b> <small style={{ color: sub }}>Posts</small></span>
                </div>
                {profileLoading ? <div style={{ padding: 35, textAlign: 'center', color: sub }}>Loading...</div> : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginTop: 16 }}>
                    {publicPosts.map((post) => (
                      <div key={post.id}>
                        {post.video_url ? (
                          <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', background: '#111' }}>
                            <video src={post.video_url} poster={post.image_url || undefined} muted autoPlay loop playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <span style={{ position: 'absolute', right: 8, top: 8, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,.55)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11 }}>▶</span>
                          </div>
                        ) : (
                          <img src={post.image_url || '/images/default-avatar.png'} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 12 }} />
                        )}
                        <b style={{ display: 'block', fontSize: 12, marginTop: 5 }}>{post.title}</b>
                      </div>
                    ))}
                    {!publicPosts.length && <p style={{ gridColumn: '1/-1', textAlign: 'center', color: sub, padding: 25 }}>No posts yet</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

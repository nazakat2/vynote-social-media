'use client';
import { useState, useEffect, useRef } from 'react';
import NoteCard from './NoteCard';
import { posts as postsApi, profiles as profilesApi } from '../lib/api/index';
import { supabase } from '../lib/supabase';
import { getUserActiveStream } from '../lib/live/liveService';

export default function ProfileModal({ notes, me, follows, onClose, onOpenCreate, onOpenAnalytics, onOpenScheduler, onOpenCaptions, onOpenTheme, onOpenBookmarks, onOpenSettings, onPostUpdated, onPostDeleted, onProfileUpdated }) {
  const [tab, setTab] = useState('notes');
  const [userNotes, setUserNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editNote, setEditNote] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(me?.avatar_url || '/images/default-avatar.png');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [coverUrl, setCoverUrl] = useState(me?.cover_url || '');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [activeStream, setActiveStream] = useState(null);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  useEffect(() => {
    if (me?.id) {
      loadUserNotes();
      loadActiveStream();
    }
  }, [me?.id]);

  useEffect(() => {
    if (!me?.id) return;
    const channel = supabase
      .channel(`profile-live-${me.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_streams',
        filter: `user_id=eq.${me.id}`,
      }, () => loadActiveStream())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [me?.id]);

  useEffect(() => {
    setAvatarUrl(me?.avatar_url || '/images/default-avatar.png');
  }, [me?.avatar_url]);

  useEffect(() => {
    setCoverUrl(me?.cover_url || '');
  }, [me?.cover_url]);

  const updateAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !me?.id) return;
    if (!file.type.startsWith('image/')) {
      setActionError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setActionError('Profile picture must be smaller than 5 MB.');
      return;
    }

    setUploadingAvatar(true);
    setActionError('');
    const extension = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${me.id}/avatar-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      setUploadingAvatar(false);
      setActionError(`Photo upload failed: ${uploadError.message}`);
      return;
    }

    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
    const newAvatarUrl = publicData?.publicUrl;
    const { data: updatedProfile, error: profileError } = await profilesApi.update({ avatar_url: newAvatarUrl });
    setUploadingAvatar(false);

    if (profileError) {
      setActionError(`Profile update failed: ${profileError.message}`);
      return;
    }
    setAvatarUrl(newAvatarUrl);
    onProfileUpdated?.(updatedProfile);
  };

  const updateCover = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !me?.id) return;
    if (!file.type.startsWith('image/')) {
      setActionError('Please select an image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setActionError('Cover image must be smaller than 8 MB.');
      return;
    }

    setUploadingCover(true);
    setActionError('');
    const extension = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${me.id}/cover-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      setUploadingCover(false);
      setActionError(`Cover upload failed: ${uploadError.message}`);
      return;
    }

    const { data: publicData } = supabase.storage.from('covers').getPublicUrl(path);
    const newCoverUrl = publicData?.publicUrl;
    const { data: updatedProfile, error: profileError } = await profilesApi.update({ cover_url: newCoverUrl });
    setUploadingCover(false);
    if (profileError) {
      setActionError(`Cover update failed: ${profileError.message}`);
      return;
    }
    setCoverUrl(newCoverUrl);
    onProfileUpdated?.(updatedProfile);
  };

  const loadUserNotes = async () => {
    setLoading(true);
    const { data } = await postsApi.list({ userId: me.id, limit: 50 });
    if (data) setUserNotes(data);
    setLoading(false);
  };

  const loadActiveStream = async () => {
    if (!me?.id) return;
    try {
      setActiveStream(await getUserActiveStream(me.id));
    } catch (error) {
      console.warn('Failed to load profile live stream:', error);
    }
  };

  const myNotes = userNotes;
  const list = tab === 'notes' ? myNotes : notes.filter((n) => n.liked);

  const saveEdit = async () => {
    if (!editNote?.title?.trim()) return;
    setActionError('');
    setSaving(true);
    const updates = {
      title: editNote.title.trim(),
      description: editNote.description || '',
      category: editNote.category || 'Food'
    };
    const { data, error } = await postsApi.update(editNote.id, updates);
    setSaving(false);
    if (error) {
      setActionError(`Edit failed: ${error.message}`);
      return;
    }
    const updated = { ...editNote, ...data };
    setUserNotes((current) => current.map((note) => note.id === updated.id ? { ...note, ...updated } : note));
    onPostUpdated?.(updated);
    setEditNote(null);
  };

  const deleteNote = async (note) => {
    setDeleting(true);
    setActionError('');
    const { error } = await postsApi.delete(note.id);
    setDeleting(false);
    if (error) {
      setActionError(`Delete failed: ${error.message}`);
      return;
    }
    setUserNotes((current) => current.filter((item) => item.id !== note.id));
    onPostDeleted?.(note.id);
    setDeleteTarget(null);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(420px,96vw)', maxHeight: '92vh', overflowY: 'auto', background: bg, borderRadius: 18, animation: 'modalIn .25s ease', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
        
        <div style={{ height: 130, background: coverUrl ? `url(${coverUrl}) center/cover` : 'linear-gradient(135deg, #ff2442, #ff7a59 55%, #ffb199)', position: 'relative' }}>
          <input ref={coverInputRef} type="file" accept="image/*" onChange={updateCover} hidden />
          <button type="button" onClick={() => !uploadingCover && coverInputRef.current?.click()} disabled={uploadingCover} style={{ position: 'absolute', right: 54, top: 12, height: 32, padding: '0 13px', borderRadius: 16, border: '1px solid rgba(255,255,255,.35)', background: 'rgba(0,0,0,.38)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: uploadingCover ? 'wait' : 'pointer', backdropFilter: 'blur(5px)' }}>
            {uploadingCover ? 'Uploading...' : '✎ Change Cover'}
          </button>
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,.35)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontSize: 14 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div style={{ padding: '0 22px 22px', background: bg }}>
          <div style={{ position: 'relative', width: 80, height: 80, marginTop: 10 }}>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={updateAvatar} hidden />
            <button type="button" onClick={() => !uploadingAvatar && avatarInputRef.current?.click()} disabled={uploadingAvatar} aria-label="Change profile picture" title="Change profile picture" style={{ width: 80, height: 80, borderRadius: '50%', padding: 0, border: `4px solid ${bg}`, background: bg, cursor: uploadingAvatar ? 'wait' : 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,.2)', overflow: 'hidden', position: 'relative' }}>
              <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <span style={{ position: 'absolute', inset: 'auto 0 0', height: 25, background: 'rgba(0,0,0,.62)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>
                {uploadingAvatar ? 'Uploading...' : 'Edit'}
              </span>
            </button>
            <span style={{ position: 'absolute', right: -3, bottom: -3, width: 25, height: 25, borderRadius: '50%', background: '#ff2442', color: '#fff', border: `2px solid ${bg}`, display: 'grid', placeItems: 'center', fontSize: 13, pointerEvents: 'none' }}>✎</span>
          </div>

          {actionError && !editNote && !deleteTarget && <div style={{ marginTop: 10, padding: '9px 11px', borderRadius: 9, background: 'rgba(239,68,68,.1)', color: '#ef4444', fontSize: 12 }}>{actionError}</div>}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: ink }}>{me?.display_name || 'You'}</h3>
            {me?.is_verified && <span style={{ fontSize: 14 }}>✅</span>}
          </div>

          <div style={{ color: sub, fontSize: 12, marginTop: 4 }}>@{me?.username || 'username'}</div>
          
          <p style={{ marginTop: 10, fontSize: 13, color: ink, lineHeight: 1.55, whiteSpace: 'pre-line' }}>{me?.bio || 'No bio yet'}</p>

          {me?.website && (
            <a href={me.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--rn-red)', textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>
              {me.website}
            </a>
          )}

          <div style={{ display: 'flex', gap: 28, marginTop: 16, paddingBottom: 14, borderBottom: `1px solid ${line}` }}>
            <div style={{ textAlign: 'center' }}><b style={{ fontSize: 18, fontWeight: 800, display: 'block', color: ink }}>{me?.following_count || 0}</b><span style={{ fontSize: 12, color: sub }}>Following</span></div>
            <div style={{ textAlign: 'center' }}><b style={{ fontSize: 18, fontWeight: 800, display: 'block', color: ink }}>{me?.follower_count || 0}</b><span style={{ fontSize: 12, color: sub }}>Followers</span></div>
            <div style={{ textAlign: 'center' }}><b style={{ fontSize: 18, fontWeight: 800, display: 'block', color: ink }}>{me?.post_count || 0}</b><span style={{ fontSize: 12, color: sub }}>Posts</span></div>
          </div>

          {activeStream && (
            <button
              type="button"
              onClick={() => window.location.assign(`/live/${activeStream.id}`)}
              style={{ width: '100%', marginTop: 14, padding: 0, overflow: 'hidden', borderRadius: 14, border: '2px solid #ff2442', background: '#111', cursor: 'pointer', textAlign: 'left', position: 'relative' }}
            >
              <div style={{ height: 112, background: activeStream.thumbnail_url ? `url(${activeStream.thumbnail_url}) center/cover` : 'linear-gradient(135deg, #24101a, #5e1728 55%, #ff2442)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,.92)', color: '#ff2442', display: 'grid', placeItems: 'center', fontSize: 20, paddingLeft: 3 }}>▶</span>
              </div>
              <span style={{ position: 'absolute', top: 10, left: 10, padding: '4px 9px', borderRadius: 7, background: '#ff2442', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '.4px' }}>LIVE NOW</span>
              <div style={{ padding: '10px 12px', color: '#fff' }}>
                <div style={{ fontSize: 14, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeStream.title || 'Live Stream'}</div>
                <div style={{ marginTop: 3, fontSize: 11, color: 'rgba(255,255,255,.7)' }}>Tap to watch the live stream</div>
              </div>
            </button>
          )}

          <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
            <button onClick={() => setTab('notes')} style={{ padding: '8px 2px', fontSize: 14, fontWeight: 700, color: tab === 'notes' ? ink : sub, borderBottom: tab === 'notes' ? '2.5px solid #ff2442' : '2.5px solid transparent', border: 'none', background: 'none', cursor: 'pointer' }}>Notes</button>
            <button onClick={() => setTab('liked')} style={{ padding: '8px 2px', fontSize: 14, fontWeight: 700, color: tab === 'liked' ? ink : sub, borderBottom: tab === 'liked' ? '2.5px solid #ff2442' : '2.5px solid transparent', border: 'none', background: 'none', cursor: 'pointer' }}>Liked</button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {[{ icon: '📊', label: 'Analytics', action: onOpenAnalytics }, { icon: '📅', label: 'Scheduler', action: onOpenScheduler }, { icon: '✨', label: 'AI Captions', action: onOpenCaptions }, { icon: '🎨', label: 'Theme', action: onOpenTheme }, { icon: '📚', label: 'Bookmarks', action: onOpenBookmarks }, { icon: '⚙️', label: 'Settings', action: onOpenSettings }].map((b) => (
              <button key={b.label} onClick={b.action} style={{ height: 34, padding: '0 14px', borderRadius: 17, border: `1.5px solid ${line}`, background: chip, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: ink }}>{b.icon} {b.label}</button>
            ))}
          </div>


          <div style={{ paddingTop: 16 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: sub }}>Loading...</div>
            ) : list.length ? (
              <div style={{ columnCount: 2, columnGap: 12 }}>
                {list.map((n, i) => (
                  <div key={n.id} style={{ position: 'relative', breakInside: 'avoid' }}>
                    <NoteCard note={n} index={i} onClick={() => {}} onLike={() => {}} />
                    {tab === 'notes' && (
                      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 3, display: 'flex', gap: 5 }}>
                        <button onClick={(event) => { event.stopPropagation(); setActionError(''); setEditNote({ ...n }); }} title="Edit post" style={{ width: 29, height: 29, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,.92)', color: '#333', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.18)' }}>✎</button>
                        <button onClick={(event) => { event.stopPropagation(); setActionError(''); setDeleteTarget(n); }} title="Delete post" style={{ width: 29, height: 29, borderRadius: '50%', border: 0, background: 'rgba(255,255,255,.92)', color: '#ef4444', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.18)' }}>×</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: sub }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>{tab === 'notes' ? '📝' : '🤍'}</span>
                <p style={{ fontSize: 13 }}>{tab === 'notes' ? 'No notes yet - share your first moment!' : 'Notes you like will appear here.'}</p>
                {tab === 'notes' && <button onClick={onOpenCreate} style={{ marginTop: 14, height: 36, padding: '0 20px', borderRadius: 18, background: '#ff2442', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 13 }}>Create your first note</button>}
              </div>
            )}
          </div>
        </div>

        {editNote && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 130, background: 'rgba(0,0,0,.65)', display: 'grid', placeItems: 'center', padding: 20 }} onClick={(event) => event.target === event.currentTarget && setEditNote(null)}>
            <div style={{ width: 'min(420px,94vw)', background: bg, color: ink, borderRadius: 18, padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Edit Post</h3>
              <label style={{ display: 'block', fontSize: 12, color: sub, marginBottom: 5 }}>Title</label>
              <input value={editNote.title || ''} onChange={(event) => setEditNote((note) => ({ ...note, title: event.target.value }))} maxLength={100} style={{ width: '100%', boxSizing: 'border-box', height: 42, borderRadius: 10, border: `1px solid ${line}`, background: chip, color: ink, padding: '0 12px', marginBottom: 12 }} />
              <label style={{ display: 'block', fontSize: 12, color: sub, marginBottom: 5 }}>Description</label>
              <textarea value={editNote.description || ''} onChange={(event) => setEditNote((note) => ({ ...note, description: event.target.value }))} rows={4} style={{ width: '100%', boxSizing: 'border-box', borderRadius: 10, border: `1px solid ${line}`, background: chip, color: ink, padding: 12, marginBottom: 12, resize: 'vertical' }} />
              <label style={{ display: 'block', fontSize: 12, color: sub, marginBottom: 5 }}>Category</label>
              <select value={editNote.category || 'Food'} onChange={(event) => setEditNote((note) => ({ ...note, category: event.target.value }))} style={{ width: '100%', height: 42, borderRadius: 10, border: `1px solid ${line}`, background: chip, color: ink, padding: '0 10px', marginBottom: 16 }}>
                {['Photography', 'Food', 'Travel', 'Fashion', 'Beauty', 'Fitness', 'Home', 'Art', 'Pets', 'Gaming'].map((category) => <option key={category}>{category}</option>)}
              </select>
              {actionError && <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 10, background: 'rgba(239,68,68,.1)', color: '#ef4444', fontSize: 12 }}>{actionError}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEditNote(null)} disabled={saving} style={{ flex: 1, height: 42, borderRadius: 21, border: `1px solid ${line}`, background: chip, color: ink, cursor: 'pointer' }}>Cancel</button>
                <button onClick={saveEdit} disabled={saving || !editNote.title?.trim()} style={{ flex: 1, height: 42, borderRadius: 21, border: 0, background: '#ff2442', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: saving ? .6 : 1 }}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}

        {deleteTarget && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 135, background: 'rgba(20,20,25,.72)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 20 }} onClick={(event) => event.target === event.currentTarget && !deleting && setDeleteTarget(null)}>
            <div style={{ width: 'min(380px,92vw)', background: bg, color: ink, borderRadius: 20, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,.35)', textAlign: 'center' }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', margin: '0 auto 14px', background: 'rgba(239,68,68,.1)', color: '#ef4444', display: 'grid', placeItems: 'center', fontSize: 25 }}>×</div>
              <h3 style={{ margin: '0 0 8px', fontSize: 19 }}>Delete this post?</h3>
              <p style={{ margin: '0 0 18px', color: sub, fontSize: 13, lineHeight: 1.5 }}>“{deleteTarget.title}” will be permanently removed. This action cannot be undone.</p>
              {actionError && <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 10, background: 'rgba(239,68,68,.1)', color: '#ef4444', fontSize: 12, textAlign: 'left' }}>{actionError}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setDeleteTarget(null); setActionError(''); }} disabled={deleting} style={{ flex: 1, height: 42, borderRadius: 21, border: `1px solid ${line}`, background: chip, color: ink, cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => deleteNote(deleteTarget)} disabled={deleting} style={{ flex: 1, height: 42, borderRadius: 21, border: 0, background: '#ef4444', color: '#fff', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? .65 : 1 }}>{deleting ? 'Deleting...' : 'Delete'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function CollabPost({ onClose, addToast }) {
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [content, setContent] = useState('');

  const searchUsers = async (q) => {
    if (!q.trim()) { setResults([]); return; }
    const { data } = await supabase.from('profiles').select('id, username, display_name, avatar_url').ilike('username', `%${q}%`).limit(5);
    setResults(data || []);
  };

  const inviteUser = (user) => {
    if (!invitedUsers.find(u => u.id === user.id)) {
      setInvitedUsers([...invitedUsers, user]);
    }
    setQuery('');
    setResults([]);
  };

  const removeUser = (userId) => {
    setInvitedUsers(invitedUsers.filter(u => u.id !== userId));
  };

  const handleCreate = async () => {
    if (!content.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('collab_posts').insert({
      creator_id: user.id,
      content,
      invited_users: invitedUsers.map(u => u.id),
      status: 'pending'
    });
    addToast?.('Collaboration post created! Invites sent.');
    onClose();
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(420px,96vw)', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: ink, margin: 0 }}>👥 Collab Post</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer' }}>x</button>
        </div>

        <div style={{ padding: 20 }}>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What's the collaboration about?" rows={3} style={{ width: '100%', borderRadius: 10, border: `1px solid ${line}`, background: chip, color: ink, padding: '10px 14px', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }} />

          <div style={{ fontSize: 13, fontWeight: 600, color: ink, marginBottom: 8 }}>Invite collaborators:</div>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input value={query} onChange={e => { setQuery(e.target.value); searchUsers(e.target.value); }} placeholder="Search users..." style={{ width: '100%', height: 38, borderRadius: 8, border: `1px solid ${line}`, background: chip, color: ink, padding: '0 12px', fontSize: 13, boxSizing: 'border-box' }} />
            {results.length > 0 && (
              <div style={{ position: 'absolute', top: 42, left: 0, right: 0, background: bg, borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,.1)', zIndex: 10, maxHeight: 150, overflowY: 'auto' }}>
                {results.map(u => (
                  <button key={u.id} onClick={() => inviteUser(u)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <img src={u.avatar_url || 'https://i.pravatar.cc/150'} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: ink }}>{u.display_name}</div>
                      <div style={{ fontSize: 11, color: sub }}>@{u.username}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {invitedUsers.map(u => (
              <span key={u.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 12, background: 'rgba(255,36,66,.1)', fontSize: 12, fontWeight: 600, color: '#ff2442' }}>
                @{u.username}
                <button onClick={() => removeUser(u.id)} style={{ background: 'none', border: 'none', color: '#ff2442', cursor: 'pointer', fontSize: 14, padding: 0 }}>x</button>
              </span>
            ))}
          </div>

          <button onClick={handleCreate} disabled={!content.trim()} style={{ width: '100%', height: 44, borderRadius: 22, background: content.trim() ? '#ff2442' : chip, color: content.trim() ? '#fff' : sub, fontWeight: 700, fontSize: 15, border: 'none', cursor: content.trim() ? 'pointer' : 'not-allowed' }}>
            Create Collaboration
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';

export function UserTag({ username, displayName, avatar, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, background: 'rgba(255,36,66,.1)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#ff2442' }}>
      {avatar && <img src={avatar} alt="" style={{ width: 16, height: 16, borderRadius: '50%' }} />}
      @{username}
    </button>
  );
}

export default function UserTagInput({ onTag, addToast }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [tagged, setTagged] = useState([]);

  const searchUsers = async (q) => {
    if (!q.trim()) { setResults([]); return; }
    const { supabase } = await import('../lib/supabase');
    const { data } = await supabase.from('profiles').select('id, username, display_name, avatar_url').ilike('username', `%${q}%`).limit(5);
    setResults(data || []);
  };

  const addTag = (user) => {
    if (!tagged.find(t => t.id === user.id)) {
      setTagged([...tagged, user]);
      onTag?.([...tagged, user]);
    }
    setQuery('');
    setResults([]);
  };

  const removeTag = (userId) => {
    const newTagged = tagged.filter(t => t.id !== userId);
    setTagged(newTagged);
    onTag?.(newTagged);
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {tagged.map(t => (
          <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 12, background: 'rgba(255,36,66,.1)', fontSize: 12, fontWeight: 600, color: '#ff2442' }}>
            @{t.username}
            <button onClick={() => removeTag(t.id)} style={{ background: 'none', border: 'none', color: '#ff2442', cursor: 'pointer', fontSize: 14, padding: 0 }}>x</button>
          </span>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        <input value={query} onChange={e => { setQuery(e.target.value); searchUsers(e.target.value); }} placeholder="@mention users..." style={{ width: '100%', height: 36, borderRadius: 8, border: '1px solid var(--line, #e5e5e5)', background: 'var(--chip, #f5f5f7)', color: 'var(--ink)', padding: '0 12px', fontSize: 13, boxSizing: 'border-box' }} />
        {results.length > 0 && (
          <div style={{ position: 'absolute', top: 40, left: 0, right: 0, background: 'var(--card-bg, #fff)', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,.1)', zIndex: 10, maxHeight: 150, overflowY: 'auto' }}>
            {results.map(u => (
              <button key={u.id} onClick={() => addTag(u)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <img src={u.avatar_url || 'https://i.pravatar.cc/150'} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{u.display_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--sub)' }}>@{u.username}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

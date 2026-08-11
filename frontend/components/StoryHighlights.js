'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function StoryHighlights({ userId, onClose, addToast }) {
  const [highlights, setHighlights] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [stories, setStories] = useState([]);
  const [selectedStories, setSelectedStories] = useState([]);

  useEffect(() => { loadHighlights(); loadStories(); }, []);

  const loadHighlights = async () => {
    const { data } = await supabase.from('story_highlights').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setHighlights(data);
  };

  const loadStories = async () => {
    const { data } = await supabase.from('stories').select('*').eq('user_id', userId).gt('expires_at', new Date().toISOString());
    if (data) setStories(data);
  };

  const createHighlight = async () => {
    if (!newName.trim()) return;
    await supabase.from('story_highlights').insert({ user_id: userId, name: newName, story_ids: selectedStories });
    setNewName('');
    setSelectedStories([]);
    setShowCreate(false);
    loadHighlights();
    addToast?.('Highlight created!');
  };

  const deleteHighlight = async (id) => {
    await supabase.from('story_highlights').delete().eq('id', id);
    loadHighlights();
    addToast?.('Highlight deleted');
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(420px,96vw)', maxHeight: '90vh', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: ink, margin: 0 }}>Story Highlights</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowCreate(!showCreate)} style={{ padding: '6px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600, background: '#ff2442', color: '#fff', border: 'none', cursor: 'pointer' }}>+ New</button>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer' }}>x</button>
          </div>
        </div>

        {showCreate && (
          <div style={{ padding: 16, borderBottom: `1px solid ${line}`, background: chip }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Highlight name" style={{ width: '100%', height: 38, borderRadius: 8, border: `1px solid ${line}`, background: bg, color: ink, padding: '0 12px', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {stories.map(s => (
                <div key={s.id} onClick={() => setSelectedStories(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])} style={{ width: 50, height: 50, borderRadius: 8, overflow: 'hidden', border: `2px solid ${selectedStories.includes(s.id) ? '#ff2442' : 'transparent'}`, cursor: 'pointer' }}>
                  <img src={s.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
              {stories.length === 0 && <p style={{ fontSize: 12, color: sub }}>No active stories</p>}
            </div>
            <button onClick={createHighlight} disabled={!newName.trim()} style={{ width: '100%', height: 38, borderRadius: 19, background: newName.trim() ? '#ff2442' : chip, color: newName.trim() ? '#fff' : sub, fontWeight: 600, fontSize: 13, border: 'none', cursor: newName.trim() ? 'pointer' : 'not-allowed' }}>Create Highlight</button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {highlights.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: sub }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>⭐</span>
              No highlights yet
            </div>
          ) : highlights.map(h => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: chip, borderRadius: 12, marginBottom: 8 }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: 'linear-gradient(135deg, #ff2442, #ff7a59)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff' }}>⭐</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: ink }}>{h.name}</div>
                <div style={{ fontSize: 12, color: sub }}>{h.story_ids?.length || 0} stories</div>
              </div>
              <button onClick={() => deleteHighlight(h.id)} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(239,68,68,.1)', color: '#ef4444', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

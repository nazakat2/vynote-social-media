'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULT_EMOJIS = [
  { id: 1, name: 'fire', url: '🔥' },
  { id: 2, name: '100', url: '💯' },
  { id: 3, name: 'sparkles', url: '✨' },
  { id: 4, name: 'clap', url: '👏' },
  { id: 5, name: 'wave', url: '👋' },
  { id: 6, name: 'heart_eyes', url: '😍' },
  { id: 7, name: 'laugh', url: '😂' },
  { id: 8, name: 'thumbsup', url: '👍' },
];

export default function CustomEmojis({ onSelect, onClose, addToast }) {
  const [customEmojis, setCustomEmojis] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [newEmoji, setNewEmoji] = useState({ name: '', image: null });

  useEffect(() => { loadCustomEmojis(); }, []);

  const loadCustomEmojis = async () => {
    const { data } = await supabase.from('custom_emojis').select('*').order('created_at', { ascending: false });
    if (data) setCustomEmojis(data);
  };

  const uploadEmoji = async () => {
    if (!newEmoji.name.trim() || !newEmoji.image) return;
    const file = newEmoji.image;
    const ext = file.name.split('.').pop();
    const fileName = `emoji-${Date.now()}.${ext}`;
    const { data: uploadData } = await supabase.storage.from('uploads').upload(fileName, file);
    if (uploadData) {
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
      await supabase.from('custom_emojis').insert({ name: newEmoji.name, url: publicUrl });
      setNewEmoji({ name: '', image: null });
      setShowUpload(false);
      loadCustomEmojis();
      addToast?.('Emoji added!');
    }
  };

  const deleteEmoji = async (id) => {
    await supabase.from('custom_emojis').delete().eq('id', id);
    loadCustomEmojis();
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(400px,96vw)', maxHeight: '80vh', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: ink, margin: 0 }}>Emojis</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowUpload(!showUpload)} style={{ padding: '6px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600, background: '#ff2442', color: '#fff', border: 'none', cursor: 'pointer' }}>+ Custom</button>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer', fontSize: 12 }}>x</button>
          </div>
        </div>

        {showUpload && (
          <div style={{ padding: 12, borderBottom: `1px solid ${line}`, background: chip }}>
            <input value={newEmoji.name} onChange={e => setNewEmoji({ ...newEmoji, name: e.target.value })} placeholder="Emoji name" style={{ width: '100%', height: 36, borderRadius: 8, border: `1px solid ${line}`, background: bg, color: ink, padding: '0 12px', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
            <input type="file" accept="image/*" onChange={e => setNewEmoji({ ...newEmoji, image: e.target.files[0] })} style={{ width: '100%', fontSize: 12, marginBottom: 8 }} />
            <button onClick={uploadEmoji} disabled={!newEmoji.name.trim() || !newEmoji.image} style={{ width: '100%', height: 34, borderRadius: 17, background: newEmoji.name.trim() && newEmoji.image ? '#ff2442' : chip, color: newEmoji.name.trim() && newEmoji.image ? '#fff' : sub, fontWeight: 600, fontSize: 12, border: 'none', cursor: newEmoji.name.trim() && newEmoji.image ? 'pointer' : 'not-allowed' }}>Upload</button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: sub, marginBottom: 8 }}>Default</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {DEFAULT_EMOJIS.map(e => (
              <button key={e.id} onClick={() => { onSelect?.(e.url); onClose(); }} style={{ width: 40, height: 40, borderRadius: 8, background: chip, border: 'none', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {e.url}
              </button>
            ))}
          </div>

          {customEmojis.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: sub, marginBottom: 8 }}>Custom</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {customEmojis.map(e => (
                  <div key={e.id} style={{ position: 'relative' }}>
                    <button onClick={() => { onSelect?.(e.url); onClose(); }} style={{ width: 40, height: 40, borderRadius: 8, background: chip, border: 'none', cursor: 'pointer', overflow: 'hidden' }}>
                      <img src={e.url} alt={e.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </button>
                    <button onClick={() => deleteEmoji(e.id)} style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

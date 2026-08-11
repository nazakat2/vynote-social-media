'use client';
import { useState } from 'react';
import NoteCard from './NoteCard';

const EXPLORE_CATS = ['All', '🔥 Trending', '📸 Photography', '🍕 Food', '✈️ Travel', '👗 Fashion', '💄 Beauty', '🏋️ Fitness', '🏠 Home', '🎨 Art', '🐾 Pets'];

export default function ExplorePage({ notes, onClose, onNoteClick, onLike }) {
  const [filter, setFilter] = useState('All');
  const [q, setQ] = useState('');

  const filtered = (notes || []).filter((n) => {
    const noteCategory = String(n?.cat || n?.category || '').toLowerCase();
    const selectedCategory = filter.replace(/[^a-z]/gi, '').toLowerCase();
    if (filter !== 'All' && selectedCategory !== 'trending' && !noteCategory.includes(selectedCategory)) return false;
    if (!q) return true;
    const tags = Array.isArray(n?.tags) ? n.tags.join(' ') : String(n?.tags || '');
    return `${n?.title || ''} ${n?.desc || n?.description || ''} ${tags}`.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <main className="rn-sidebar-aware-overlay" style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 70, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: 'none', background: 'none', cursor: 'pointer' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M15 18l-6-6 6-6" /></svg></button>
        <h3 style={{ fontSize: 17, fontWeight: 700, flexShrink: 0 }}>Explore</h3>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes, people, topics…" style={{ flex: 1, height: 38, borderRadius: 19, background: 'var(--input-bg)', padding: '0 16px', color: 'var(--ink)', border: 'none', outline: 'none', fontSize: 14 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '12px 24px', overflowX: 'auto', borderBottom: '1px solid var(--line)', scrollbarWidth: 'none' }}>
        {EXPLORE_CATS.map((c) => (
          <button key={c} onClick={() => setFilter(c)} style={{ flexShrink: 0, height: 32, padding: '0 16px', borderRadius: 16, background: c === filter ? 'var(--rn-red)' : 'var(--chip)', color: c === filter ? '#fff' : '#555', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>{c}</button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: 'var(--sub)', padding: '12px 24px 0' }}>{filtered.length} results found</div>
      <div style={{ padding: '16px 24px', maxWidth: 1600, margin: '0 auto', width: '100%' }}>
        <div style={{ columnCount: 5, columnGap: 20 }}>
          {filtered.map((n, i) => <NoteCard key={n.id} note={n} index={i} onClick={() => onNoteClick(n)} onLike={() => onLike(n)} />)}
        </div>
        {!filtered.length && <div style={{ textAlign: 'center', padding: '60px 0', color: '#b5b5ba', fontSize: 13 }}>No results found 🔍</div>}
      </div>
    </main>
  );
}

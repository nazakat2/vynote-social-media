'use client';
import { useState } from 'react';

const GIF_CATEGORIES = ['Trending', 'Reactions', 'Animals', 'Sports', 'Emotions', 'Food', 'Travel', 'Fashion'];

const MOCK_GIFS = [
  { id: 1, url: 'https://media.giphy.com/media/3o7TKTHsiE2tFPD6sE/giphy.gif', title: 'Thumbs Up' },
  { id: 2, url: 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif', title: 'Heart Eyes' },
  { id: 3, url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif', title: 'Fire' },
  { id: 4, url: 'https://media.giphy.com/media/pa37dFNyYKjDOt3POW/giphy.gif', title: 'Celebration' },
  { id: 5, url: 'https://media.giphy.com/media/26BRBKqUiq586bRVm/giphy.gif', title: 'Dance' },
  { id: 6, url: 'https://media.giphy.com/media/3o6ZtaO9BZHcOjmErm/giphy.gif', title: 'Laughing' },
  { id: 7, url: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif', title: 'Mind Blown' },
  { id: 8, url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', title: 'Clap' },
  { id: 9, url: 'https://media.giphy.com/media/3o7TKC7v7eRBhVH Prostitutas/giphy.gif', title: 'Cool' },
  { id: 10, url: 'https://media.giphy.com/media/l0HlNQ03J5JR3V2sE/giphy.gif', title: 'Love' },
  { id: 11, url: 'https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif', title: 'OK' },
  { id: 12, url: 'https://media.giphy.com/media/26BRN3QaWDJbrRUec/giphy.gif', title: 'Wave' },
];

export default function GIFSearch({ onSelect, onClose, addToast }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Trending');
  const [gifs] = useState(MOCK_GIFS);

  const filteredGifs = search
    ? gifs.filter(g => g.title.toLowerCase().includes(search.toLowerCase()))
    : gifs;

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(450px,96vw)', maxHeight: '80vh', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: ink, margin: 0 }}>GIFs</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer' }}>x</button>
        </div>

        <div style={{ padding: '12px 16px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search GIFs..." style={{ width: '100%', height: 38, borderRadius: 10, border: `1px solid ${line}`, background: chip, color: ink, padding: '0 14px', fontSize: 13, boxSizing: 'border-box' }} />
        </div>

        <div style={{ padding: '0 12px 8px', overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex', gap: 6 }}>
          {GIF_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 14, fontSize: 11, fontWeight: 600, background: selectedCategory === cat ? '#ff2442' : chip, color: selectedCategory === cat ? '#fff' : ink, border: 'none', cursor: 'pointer' }}>{cat}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {filteredGifs.map(gif => (
              <button key={gif.id} onClick={() => { onSelect?.(gif.url); onClose(); }} style={{ padding: 0, border: 'none', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'none' }}>
                <img src={gif.url} alt={gif.title} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 }} loading="lazy" />
              </button>
            ))}
          </div>
          {filteredGifs.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: sub }}>No GIFs found</div>
          )}
        </div>
      </div>
    </div>
  );
}

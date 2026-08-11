'use client';
import { useState } from 'react';

const MOCK_TRACKS = [
  { id: 1, title: 'Summer Vibes', artist: 'DJ Sun', duration: '3:24', cover: 'https://placehold.co/60x60/ff2442/fff?text=🎵' },
  { id: 2, title: 'Chill Beats', artist: 'Lo-Fi King', duration: '4:12', cover: 'https://placehold.co/60x60/3b82f6/fff?text=🎶' },
  { id: 3, title: 'Night Drive', artist: 'Synth Wave', duration: '3:56', cover: 'https://placehold.co/60x60/8b5cf6/fff?text=🎸' },
  { id: 4, title: 'Morning Coffee', artist: 'Acoustic Soul', duration: '2:48', cover: 'https://placehold.co/60x60/f59e0b/fff?text=☕' },
  { id: 5, title: 'City Lights', artist: 'Urban Flow', duration: '3:33', cover: 'https://placehold.co/60x60/10b981/fff?text=🌃' },
  { id: 6, title: 'Rainy Day', artist: 'Piano Mood', duration: '4:05', cover: 'https://placehold.co/60x60/6b7280/fff?text=🌧️' },
  { id: 7, title: 'Dance Floor', artist: 'EDM Master', duration: '3:18', cover: 'https://placehold.co/60x60/ec4899/fff?text=💃' },
  { id: 8, title: 'Sunset Beach', artist: 'Tropical House', duration: '3:42', cover: 'https://placehold.co/60x60/ff7a59/fff?text=🏖️' },
];

export default function AudioMusic({ onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [playing, setPlaying] = useState(null);

  const filteredTracks = search
    ? MOCK_TRACKS.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.artist.toLowerCase().includes(search.toLowerCase()))
    : MOCK_TRACKS;

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(420px,96vw)', maxHeight: '80vh', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: ink, margin: 0 }}>🎵 Add Music</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer' }}>x</button>
        </div>

        <div style={{ padding: '12px 16px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search songs..." style={{ width: '100%', height: 38, borderRadius: 10, border: `1px solid ${line}`, background: chip, color: ink, padding: '0 14px', fontSize: 13, boxSizing: 'border-box' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
          {filteredTracks.map(track => (
            <div key={track.id} onClick={() => setSelectedTrack(track)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: selectedTrack?.id === track.id ? 'rgba(255,36,66,.1)' : chip, borderRadius: 10, marginBottom: 6, cursor: 'pointer', border: `1px solid ${selectedTrack?.id === track.id ? '#ff2442' : 'transparent'}` }}>
              <img src={track.cover} alt="" style={{ width: 48, height: 48, borderRadius: 8 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: ink }}>{track.title}</div>
                <div style={{ fontSize: 12, color: sub }}>{track.artist}</div>
              </div>
              <div style={{ fontSize: 12, color: sub }}>{track.duration}</div>
              <button onClick={(e) => { e.stopPropagation(); setPlaying(playing === track.id ? null : track.id); }} style={{ width: 32, height: 32, borderRadius: '50%', background: playing === track.id ? '#ff2442' : chip, color: playing === track.id ? '#fff' : ink, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {playing === track.id ? '⏸' : '▶️'}
              </button>
            </div>
          ))}
        </div>

        {selectedTrack && (
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${line}`, display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ flex: 1, height: 40, borderRadius: 20, background: chip, color: ink, fontWeight: 600, fontSize: 14, border: `1px solid ${line}`, cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => { onSelect?.(selectedTrack); onClose(); }} style={{ flex: 1, height: 40, borderRadius: 20, background: '#ff2442', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>Add Song</button>
          </div>
        )}
      </div>
    </div>
  );
}

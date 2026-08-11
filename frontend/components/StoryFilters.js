'use client';
import { useState } from 'react';

const STORY_FILTERS = [
  { id: 'none', name: 'Normal', css: '' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(0.4) contrast(1.1)' },
  { id: 'dramatic', name: 'Dramatic', css: 'contrast(1.4) brightness(0.9) saturate(1.3)' },
  { id: 'fade', name: 'Fade', css: 'brightness(1.1) saturate(0.8) contrast(0.9)' },
  { id: 'bw', name: 'B&W', css: 'grayscale(1) contrast(1.1)' },
  { id: 'warm', name: 'Warm', css: 'sepia(0.2) saturate(1.3) brightness(1.05)' },
  { id: 'cool', name: 'Cool', css: 'hue-rotate(20deg) saturate(1.1)' },
  { id: 'vivid', name: 'Vivid', css: 'saturate(1.8) contrast(1.1)' },
  { id: 'dreamy', name: 'Dreamy', css: 'brightness(1.15) saturate(1.2) contrast(0.85)' },
  { id: 'noir', name: 'Noir', css: 'grayscale(1) contrast(1.3) brightness(0.8)' },
];

export default function StoryFilters({ image, onApply, onClose }) {
  const [selected, setSelected] = useState('none');

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(420px,96vw)', maxHeight: '90vh', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onClose} style={{ fontSize: 14, color: sub, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: ink }}>Story Filters</span>
          <button onClick={() => { onApply(selected === 'none' ? '' : STORY_FILTERS.find(f => f.id === selected)?.css); onClose(); }} style={{ fontSize: 14, color: '#ff2442', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Done</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#000', maxHeight: '40vh' }}>
          <img src={image} alt="" style={{ maxWidth: '100%', maxHeight: '35vh', objectFit: 'contain', filter: STORY_FILTERS.find(f => f.id === selected)?.css || 'none', transition: 'filter 0.2s' }} />
        </div>

        <div style={{ padding: '12px 8px', overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex', gap: 8, scrollbarWidth: 'none' }}>
          {STORY_FILTERS.map(f => (
            <button key={f.id} onClick={() => setSelected(f.id)} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 10, background: selected === f.id ? 'rgba(255,36,66,.1)' : 'transparent', border: `2px solid ${selected === f.id ? '#ff2442' : 'transparent'}`, cursor: 'pointer' }}>
              <div style={{ width: 50, height: 50, borderRadius: 8, overflow: 'hidden' }}>
                <img src={image || 'https://placehold.co/50x50'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: f.css || 'none' }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: selected === f.id ? 700 : 500, color: selected === f.id ? '#ff2442' : sub }}>{f.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

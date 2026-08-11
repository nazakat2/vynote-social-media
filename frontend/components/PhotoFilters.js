'use client';
import { useState, useRef } from 'react';

const FILTERS = [
  { id: 'none', name: 'Normal', css: '' },
  { id: 'clarendon', name: 'Clarendon', css: 'contrast(1.2) saturate(1.35)' },
  { id: 'gingham', name: 'Gingham', css: 'brightness(1.05) sepia(0.1)' },
  { id: 'moon', name: 'Moon', css: 'grayscale(1) contrast(1.1) brightness(1.1)' },
  { id: 'lark', name: 'Lark', css: 'brightness(1.08) contrast(0.95) saturate(1.2)' },
  { id: 'reyes', name: 'Reyes', css: 'sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)' },
  { id: 'juno', name: 'Juno', css: 'contrast(1.1) brightness(1.05) saturate(1.4)' },
  { id: 'slumber', name: 'Slumber', css: 'saturate(0.66) brightness(1.05) sepia(0.1)' },
  { id: 'aden', name: 'Aden', css: 'hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)' },
  { id: 'perpetua', name: 'Perpetua', css: 'brightness(1.1) saturate(1.1)' },
  { id: 'mayfair', name: 'Mayfair', css: 'contrast(1.1) saturate(1.1) brightness(1.15) sepia(0.05)' },
  { id: 'valencia', name: 'Valencia', css: 'contrast(1.08) brightness(1.08) sepia(0.08) saturate(1.2)' },
  { id: 'xpro2', name: 'X-Pro II', css: 'contrast(1.2) brightness(1.1) saturate(1.3) sepia(0.15)' },
  { id: 'lofi', name: 'Lo-Fi', css: 'contrast(1.5) saturate(1.1) brightness(0.95)' },
  { id: 'inkwell', name: 'Inkwell', css: 'brightness(1.1) contrast(1.1) grayscale(1) sepia(0.3)' },
  { id: 'hudson', name: 'Hudson', css: 'brightness(1.2) contrast(0.9) saturate(1.1) hue-rotate(-10deg)' },
  { id: 'willow', name: 'Willow', css: 'grayscale(0.5) contrast(0.95) brightness(0.9)' },
  { id: 'earlybird', name: 'Earlybird', css: 'sepia(0.2) contrast(1.1) brightness(0.95) saturate(1.2)' },
];

export default function PhotoFilters({ image, onApply, onClose }) {
  const [selectedFilter, setSelectedFilter] = useState('none');

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(500px,96vw)', maxHeight: '90vh', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onClose} style={{ fontSize: 14, color: sub, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: ink }}>Edit</span>
          <button onClick={() => { onApply(selectedFilter === 'none' ? '' : FILTERS.find(f => f.id === selectedFilter)?.css); onClose(); }} style={{ fontSize: 14, color: '#ff2442', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Done</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#000', maxHeight: '50vh', overflow: 'hidden' }}>
          <img src={image} alt="Filter preview" style={{ maxWidth: '100%', maxHeight: '40vh', objectFit: 'contain', filter: FILTERS.find(f => f.id === selectedFilter)?.css || 'none', transition: 'filter 0.2s' }} />
        </div>

        <div style={{ padding: '12px 8px', overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex', gap: 8, scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setSelectedFilter(f.id)} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 10, background: selectedFilter === f.id ? 'rgba(255,36,66,.1)' : 'transparent', border: `2px solid ${selectedFilter === f.id ? '#ff2442' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ width: 54, height: 54, borderRadius: 8, overflow: 'hidden' }}>
                <img src={image || 'https://placehold.co/54x54'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: f.css || 'none' }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: selectedFilter === f.id ? 700 : 500, color: selectedFilter === f.id ? '#ff2442' : sub }}>{f.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

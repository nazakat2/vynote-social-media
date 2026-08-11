'use client';
import { useState } from 'react';

const BACKGROUNDS = [
  { id: 'none', name: 'None', preview: '#ffffff', value: '' },
  { id: 'sunset', name: 'Sunset', preview: 'linear-gradient(135deg, #ff7a59, #ff2442)', value: 'linear-gradient(135deg, #ff7a59, #ff2442)' },
  { id: 'ocean', name: 'Ocean', preview: 'linear-gradient(135deg, #667eea, #764ba2)', value: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { id: 'forest', name: 'Forest', preview: 'linear-gradient(135deg, #11998e, #38ef7d)', value: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  { id: 'lavender', name: 'Lavender', preview: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', value: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
  { id: 'peach', name: 'Peach', preview: 'linear-gradient(135deg, #ffecd2, #fcb69f)', value: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
  { id: 'midnight', name: 'Midnight', preview: 'linear-gradient(135deg, #232526, #414345)', value: 'linear-gradient(135deg, #232526, #414345)' },
  { id: 'candy', name: 'Candy', preview: 'linear-gradient(135deg, #fa709a, #fee140)', value: 'linear-gradient(135deg, #fa709a, #fee140)' },
  { id: 'aurora', name: 'Aurora', preview: 'linear-gradient(135deg, #00c6ff, #0072ff, #7c3aed)', value: 'linear-gradient(135deg, #00c6ff, #0072ff, #7c3aed)' },
  { id: 'fire', name: 'Fire', preview: 'linear-gradient(135deg, #f83600, #f9d423)', value: 'linear-gradient(135deg, #f83600, #f9d423)' },
  { id: 'cool', name: 'Cool', preview: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', value: 'linear-gradient(135deg, #00d2ff, #3a7bd5)' },
  { id: 'warm', name: 'Warm', preview: 'linear-gradient(135deg, #f093fb, #f5576c)', value: 'linear-gradient(135deg, #f093fb, #f5576c)' },
];

export default function PostBackgrounds({ onSelect, onClose }) {
  const [selected, setSelected] = useState('none');

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(400px,96vw)', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: ink, margin: 0 }}>Post Background</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { onSelect?.(BACKGROUNDS.find(b => b.id === selected)?.value || ''); onClose(); }} style={{ fontSize: 14, color: '#ff2442', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Apply</button>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer', fontSize: 12 }}>x</button>
          </div>
        </div>

        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {BACKGROUNDS.map(bg => (
            <button key={bg.id} onClick={() => setSelected(bg.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 6, borderRadius: 10, background: selected === bg.id ? 'rgba(255,36,66,.1)' : 'transparent', border: `2px solid ${selected === bg.id ? '#ff2442' : 'transparent'}`, cursor: 'pointer' }}>
              <div style={{ width: '100%', aspectRatio: '1', borderRadius: 8, background: bg.preview || '#f5f5f7', border: `1px solid ${line}` }} />
              <span style={{ fontSize: 10, fontWeight: selected === bg.id ? 700 : 500, color: selected === bg.id ? '#ff2442' : sub }}>{bg.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

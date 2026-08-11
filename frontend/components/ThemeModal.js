'use client';
import { useState } from 'react';

const THEMES = [
  { name: 'Classic Red', primary: '#ff3b5c', secondary: '#ff7a59', bg: '#fff8f7', cardBg: '#ffffff', text: '#1a1a2e' },
  { name: 'Ocean Blue', primary: '#3b82f6', secondary: '#60a5fa', bg: '#f0f7ff', cardBg: '#ffffff', text: '#1a1a2e' },
  { name: 'Forest Green', primary: '#22c55e', secondary: '#4ade80', bg: '#f0fdf4', cardBg: '#ffffff', text: '#1a1a2e' },
  { name: 'Sunset Purple', primary: '#a855f7', secondary: '#c084fc', bg: '#faf5ff', cardBg: '#ffffff', text: '#1a1a2e' },
  { name: 'Midnight', primary: '#f59e0b', secondary: '#fbbf24', bg: '#0f0f12', cardBg: '#1e1e22', text: '#e8e8ea' },
  { name: 'Dark Rose', primary: '#ff3b5c', secondary: '#ff7a59', bg: '#141418', cardBg: '#23232a', text: '#e8e8ea' },
];

export default function ThemeModal({ onClose }) {
  const [active, setActive] = useState(() => {
    return localStorage.getItem('rn-active-theme') || 'Classic Red';
  });

  const applyTheme = (theme) => {
    setActive(theme.name);
    localStorage.setItem('rn-active-theme', theme.name);
    const r = document.documentElement.style;
    r.setProperty('--rn-red', theme.primary);
    r.setProperty('--rn-red-light', theme.secondary);
    r.setProperty('--bg', theme.bg);
    r.setProperty('--card-bg', theme.cardBg);
    r.setProperty('--ink', theme.text);
    r.setProperty('--sub', theme.text === '#1a1a2e' ? '#6b7280' : '#9ca3af');
  };

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
  const modal = { width: 'min(520px,96vw)', maxHeight: '92vh', overflowY: 'auto', background: '#ffffff', borderRadius: 18, padding: 24, animation: 'modalIn .25s ease', position: 'relative' };

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: 'none', background: 'none', cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>🎨 Theme Customization</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {THEMES.map(t => (
            <button key={t.name} onClick={() => applyTheme(t)} style={{ padding: 16, borderRadius: 14, border: active === t.name ? `2.5px solid ${t.primary}` : '2.5px solid var(--line)', background: t.bg, cursor: 'pointer', textAlign: 'left', transition: 'all .2s' }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: t.primary }} />
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: t.secondary }} />
              </div>
              <b style={{ fontSize: 13, display: 'block', color: t.text }}>{t.name}</b>
              {active === t.name && <span style={{ fontSize: 11, color: t.primary }}>✓ Active</span>}
            </button>
          ))}
        </div>
        <p style={{ marginTop: 14, fontSize: 12, color: 'var(--sub)', textAlign: 'center' }}>Changes apply instantly across the app</p>
      </div>
    </div>
  );
}

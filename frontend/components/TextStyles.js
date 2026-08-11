'use client';
import { useState } from 'react';

const TEXT_STYLES = [
  { id: 'normal', name: 'Normal', css: 'none', font: 'inherit' },
  { id: 'bold', name: 'Bold', css: 'none', font: 'bold' },
  { id: 'italic', name: 'Italic', css: 'none', font: 'italic' },
  { id: 'fancy', name: 'Fancy', css: 'none', font: 'cursive' },
  { id: 'mono', name: 'Mono', css: 'none', font: 'monospace' },
  { id: 'outline', name: 'Outline', css: '-webkit-text-stroke: 1px currentColor; color: transparent', font: 'bold' },
  { id: 'shadow', name: 'Shadow', css: '2px 2px 4px rgba(0,0,0,.3)', font: 'bold' },
  { id: 'glow', name: 'Glow', css: '0 0 10px #ff2442, 0 0 20px #ff2442', font: 'bold' },
  { id: 'gradient', name: 'Gradient', css: 'background: linear-gradient(90deg, #ff2442, #ff7a59); -webkit-background-clip: text; -webkit-text-fill-color: transparent', font: 'bold' },
  { id: 'uppercase', name: 'UPPER', css: 'none', font: 'inherit', transform: 'uppercase' },
  { id: 'lowercase', name: 'lower', css: 'none', font: 'inherit', transform: 'lowercase' },
  { id: 'capitalize', name: 'Title', css: 'none', font: 'inherit', transform: 'capitalize' },
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48];
const COLORS = ['#222222', '#ffffff', '#ff2442', '#ff7a59', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'];

export default function TextStyles({ text, onChange, onClose }) {
  const [selectedStyle, setSelectedStyle] = useState('normal');
  const [fontSize, setFontSize] = useState(16);
  const [color, setColor] = useState('#222222');

  const style = TEXT_STYLES.find(s => s.id === selectedStyle);

  const getPreviewStyle = () => ({
    fontFamily: style?.font || 'inherit',
    fontSize: fontSize,
    color: style?.id === 'gradient' ? 'transparent' : color,
    textTransform: style?.transform || 'none',
    filter: style?.css?.includes('glow') ? undefined : undefined,
    WebkitTextStroke: style?.css?.includes('-webkit-text-stroke') ? '1px currentColor' : undefined,
    textShadow: style?.css?.includes('shadow') ? '2px 2px 4px rgba(0,0,0,.3)' : style?.css?.includes('glow') ? '0 0 10px #ff2442, 0 0 20px #ff2442' : 'none',
    background: style?.css?.includes('background') ? 'linear-gradient(90deg, #ff2442, #ff7a59)' : undefined,
    WebkitBackgroundClip: style?.css?.includes('background-clip') ? 'text' : undefined,
    WebkitTextFillColor: style?.css?.includes('-webkit-text-fill-color') ? 'transparent' : undefined,
  });

  return (
    <div style={{ padding: 12, background: 'var(--chip, #f5f5f7)', borderRadius: 12, marginTop: 8 }}>
      <div style={{ background: 'var(--bg, #fff)', borderRadius: 10, padding: 16, marginBottom: 12, textAlign: 'center', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={getPreviewStyle()}>{text || 'Preview text'}</span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {TEXT_STYLES.map(s => (
          <button key={s.id} onClick={() => setSelectedStyle(s.id)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: selectedStyle === s.id ? '#ff2442' : 'var(--bg, #fff)', color: selectedStyle === s.id ? '#fff' : 'var(--ink)', border: `1px solid ${selectedStyle === s.id ? '#ff2442' : 'var(--line, #e5e5e5)'}`, cursor: 'pointer' }}>
            {s.name}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--sub)', marginBottom: 4 }}>Size: {fontSize}px</div>
        <input type="range" min="12" max="48" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={{ width: '100%' }} />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: `2px solid ${color === c ? '#ff2442' : 'transparent'}`, cursor: 'pointer' }} />
        ))}
      </div>
    </div>
  );
}

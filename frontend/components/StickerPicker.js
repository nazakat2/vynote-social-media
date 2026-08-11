'use client';
import { useState } from 'react';

const STICKER_PACKS = [
  { id: 'smileys', name: 'Smileys', stickers: ['😀', '😂', '🥰', '😎', '🤩', '😇', '🥳', '😋', '🤗', '🤔', '😏', '😌', '😴', '🙄', '😬', '🤯'] },
  { id: 'hearts', name: 'Hearts', stickers: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘'] },
  { id: 'hands', name: 'Hands', stickers: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '🤟', '🤘', '👌', '👋', '🤚', '✋', '🖖', '🤙', '💪'] },
  { id: 'animals', name: 'Animals', stickers: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'] },
  { id: 'food', name: 'Food', stickers: ['🍕', '🍔', '🍟', '🌮', '🍜', '🍣', '🍰', '🎂', '🍩', '🍪', '☕', '🧋', '🍷', '🍺', '🥤', '🍎'] },
  { id: 'travel', name: 'Travel', stickers: ['✈️', '🚗', '🏠', '🏖️', '🏔️', '🗼', '🎪', '🌅', '🌄', '🌆', '🌃', '🏙️', '🗺️', '🧭', '🚇', '🚂'] },
];

export default function StickerPicker({ onSelect, onClose }) {
  const [selectedPack, setSelectedPack] = useState('smileys');
  const pack = STICKER_PACKS.find(p => p.id === selectedPack);

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(380px,96vw)', maxHeight: '70vh', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: ink, margin: 0 }}>Stickers</h3>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer', fontSize: 12 }}>x</button>
        </div>

        <div style={{ padding: '8px 12px', overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex', gap: 6, borderBottom: `1px solid ${line}` }}>
          {STICKER_PACKS.map(p => (
            <button key={p.id} onClick={() => setSelectedPack(p.id)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 14, fontSize: 12, fontWeight: 600, background: selectedPack === p.id ? '#ff2442' : chip, color: selectedPack === p.id ? '#fff' : ink, border: 'none', cursor: 'pointer' }}>
              {p.name}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {pack?.stickers.map((sticker, i) => (
              <button key={i} onClick={() => { onSelect?.(sticker); onClose(); }} style={{ width: '100%', aspectRatio: '1', borderRadius: 10, background: chip, border: 'none', cursor: 'pointer', fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {sticker}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

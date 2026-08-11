'use client';
const CATS = ['All', 'Fashion', 'Food', 'Travel', 'Beauty', 'Fitness', 'Home', 'Pets', 'Art', 'Photography'];

export default function CategoryChips({ active, onChange }) {
  return (
    <nav className="rn-category-nav" style={{ position: 'fixed', top: 60, left: 0, right: 0, zIndex: 40, background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(10px)', display: 'flex', gap: 6, padding: '8px 20px', overflowX: 'auto', borderBottom: '1px solid var(--line)', scrollbarWidth: 'none' }}>
      {CATS.map(c => (
        <button key={c} onClick={() => onChange(c)} style={{ flexShrink: 0, height: 32, padding: '0 16px', borderRadius: 16, background: c === active ? 'var(--rn-red)' : 'var(--chip)', color: c === active ? '#fff' : '#555', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all .18s', boxShadow: c === active ? '0 3px 10px rgba(255,36,66,.3)' : 'none' }}>
          {c === 'All' ? '✦ ' + c : c}
        </button>
      ))}
    </nav>
  );
}

'use client';
export default function Toast({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', top: 74, left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'none' }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ background: 'rgba(30,30,35,.9)', color: '#fff', fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 20, backdropFilter: 'blur(4px)', whiteSpace: 'nowrap', animation: 'toastIn .3s ease' }}>{t.msg}</div>
      ))}
    </div>
  );
}

 'use client';

const iconStyle = { width: 22, height: 22, flexShrink: 0 };
export default function Sidebar({ onExplore, onPost, onNotifications, onLive }) {
  const item = { width: '100%', height: 50, padding: '0 18px', borderRadius: 25, border: 0, background: 'transparent', color: '#f5f5f7', display: 'flex', alignItems: 'center', gap: 15, fontSize: 16, fontWeight: 700, cursor: 'pointer', textAlign: 'left' };
  return <aside className="rn-sidebar">
    <button onClick={onExplore} style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#fff', border: 0, background: 'none', cursor: 'pointer', padding: '0 10px', marginBottom: 30 }}><span style={{ width: 32, height: 28, borderRadius: 9, background: '#ff2442', display: 'grid', placeItems: 'center', fontSize: 16 }}>♥</span><span style={{ fontSize: 24, fontWeight: 850, letterSpacing: '-1px' }}>vynote</span></button>
    <nav style={{ display: 'grid', gap: 6 }}>
      <button onClick={onExplore} className="rn-side-item active" style={item}><svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" /></svg>Explore</button>
      <button onClick={onPost} className="rn-side-item" style={item}><svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><path d="M12 8v8M8 12h8" /></svg>Post</button>
      <button onClick={onNotifications} className="rn-side-item" style={item}><svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M14 21h-4" /></svg>Notifications</button>
      <button onClick={onLive} className="rn-side-item" style={item}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px rgba(239,68,68,.5)' }}></span>Live</button>
    </nav>
    <div style={{ marginTop: 'auto', padding: '0 16px 20px', color: '#777780', fontSize: 12, lineHeight: 2.7 }}>
      <div style={{ cursor: 'pointer' }} onClick={() => window.location.assign('/about')}>About VyNote</div>
      <div style={{ cursor: 'pointer' }} onClick={() => window.location.assign('/terms')}>Terms of Service</div>
      <div style={{ cursor: 'pointer' }} onClick={() => window.location.assign('/privacy')}>Privacy Policy</div>
      <div style={{ cursor: 'pointer' }} onClick={() => window.location.assign('/privacy-choices')}>Your Privacy Choices</div>
      <div>© 2026 VyNote</div>
    </div>
  </aside>;
}

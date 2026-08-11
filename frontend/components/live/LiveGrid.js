'use client';

import LiveCard from './LiveCard';

export default function LiveGrid({ streams, onStreamClick, onFollow, follows, emptyMessage }) {
  if (!streams || streams.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>🔴</span>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
          {emptyMessage || 'No one is live right now.'}
        </p>
        <p style={{ fontSize: 14, color: 'var(--sub)' }}>Check back later or start your own stream!</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 16,
      padding: '0 4px',
    }}>
      {streams.map((stream) => (
        <LiveCard
          key={stream.id}
          stream={stream}
          onClick={onStreamClick}
          onFollow={onFollow}
          follows={follows}
        />
      ))}
    </div>
  );
}

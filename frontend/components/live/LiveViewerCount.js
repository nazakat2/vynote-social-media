'use client';

import { formatViewerCount } from '../../lib/live/liveUtils';

export default function LiveViewerCount({ count, peak }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 14 }}>👁</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink, #222)' }}>{formatViewerCount(count)}</span>
        <span style={{ fontSize: 12, color: 'var(--sub, #888)' }}>watching</span>
      </div>
      {peak > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 8, background: 'var(--chip, #f5f5f7)' }}>
          <span style={{ fontSize: 11, color: 'var(--sub, #888)' }}>Peak:</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink, #222)' }}>{formatViewerCount(peak)}</span>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { formatViewerCount } from '../../lib/live/liveUtils';
import { useAuth } from '../../lib/AuthContext';

export default function LiveCard({ stream, onClick, onFollow, follows }) {
  const { user } = useAuth();
  const [hovering, setHovering] = useState(false);

  const profile = stream.profiles;
  const isOwn = user?.id === stream.user_id;
  const isFollowing = follows?.[stream.user_id];

  return (
    <div
      onClick={() => onClick?.(stream)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        position: 'relative',
        borderRadius: 14,
        overflow: 'hidden',
        cursor: 'pointer',
        background: '#000',
        aspectRatio: '9/16',
        transition: 'transform 0.2s',
        transform: hovering ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {stream.thumbnail_url ? (
        <img src={stream.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a2e, #16213e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 48, opacity: 0.3 }}>🔴</span>
        </div>
      )}

      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />

      <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ padding: '3px 8px', borderRadius: 6, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>LIVE</span>
        <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 10, fontWeight: 600 }}>👁 {formatViewerCount(stream.viewer_count)}</span>
      </div>

      {stream.category && (
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 10, fontWeight: 600 }}>{stream.category}</span>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <img
            src={profile?.avatar_url || 'https://i.pravatar.cc/150'}
            alt=""
            style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #ef4444', objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.display_name || profile?.username || 'User'}
              {profile?.is_verified && <span style={{ marginLeft: 4, fontSize: 12 }}>✅</span>}
            </div>
          </div>
          {!isOwn && user && (
            <button
              onClick={(e) => { e.stopPropagation(); onFollow?.(stream.user_id); }}
              style={{
                padding: '4px 12px',
                borderRadius: 12,
                background: isFollowing ? 'transparent' : '#ff2442',
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
                border: isFollowing ? '1px solid rgba(255,255,255,.4)' : 'none',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        {stream.title && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {stream.title}
          </div>
        )}
      </div>
    </div>
  );
}

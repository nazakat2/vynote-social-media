'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function BlockMuteModal({ targetUserId, targetUsername, onClose, addToast }) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { checkStatus(); }, [targetUserId]);

  const checkStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: block } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', targetUserId)
      .maybeSingle();
    setIsBlocked(!!block);

    const { data: mute } = await supabase
      .from('mutes')
      .select('id')
      .eq('user_id', user.id)
      .eq('muted_id', targetUserId)
      .maybeSingle();
    setIsMuted(!!mute);
  };

  const toggleBlock = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isBlocked) {
      await supabase.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', targetUserId);
      setIsBlocked(false);
      addToast?.(`Unblocked @${targetUsername}`);
    } else {
      await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: targetUserId });
      setIsBlocked(true);
      addToast?.(`Blocked @${targetUsername}`);
    }
    setLoading(false);
  };

  const toggleMute = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isMuted) {
      await supabase.from('mutes').delete().eq('user_id', user.id).eq('muted_id', targetUserId);
      setIsMuted(false);
      addToast?.(`Unmuted @${targetUsername}`);
    } else {
      await supabase.from('mutes').insert({ user_id: user.id, muted_id: targetUserId });
      setIsMuted(true);
      addToast?.(`Muted @${targetUsername}`);
    }
    setLoading(false);
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(380px,96vw)', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: ink, margin: 0 }}>@{targetUsername}</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={toggleMute}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: isMuted ? 'rgba(255,36,66,.08)' : chip, border: `1px solid ${isMuted ? '#ff2442' : line}`, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all .15s' }}
          >
            <span style={{ fontSize: 22 }}>{isMuted ? '🔇' : '🔔'}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: isMuted ? '#ff2442' : ink }}>{isMuted ? 'Unmute' : 'Mute'}</div>
              <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>You won't see their posts in your feed</div>
            </div>
          </button>

          <button
            onClick={toggleBlock}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: isBlocked ? 'rgba(239,68,68,.08)' : chip, border: `1px solid ${isBlocked ? '#ef4444' : line}`, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all .15s' }}
          >
            <span style={{ fontSize: 22 }}>{isBlocked ? '🚫' : '⛔'}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: isBlocked ? '#ef4444' : ink }}>{isBlocked ? 'Unblock' : 'Block'}</div>
              <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>They can't see your profile or contact you</div>
            </div>
          </button>

          <button
            onClick={() => { onClose(); addToast?.('Open report dialog'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: chip, border: `1px solid ${line}`, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all .15s' }}
          >
            <span style={{ fontSize: 22 }}>🚩</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: ink }}>Report</div>
              <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>Report this account for violations</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

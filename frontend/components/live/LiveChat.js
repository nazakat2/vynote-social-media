'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useLiveChat } from '../../hooks/useLiveChat';
import { supabase } from '../../lib/supabase';

export default function LiveChat({ streamId, isOwner }) {
  const {
    messages,
    input,
    setInput,
    sending,
    sendMessage,
    newMessagesCount,
    scrollToBottom,
    handleScroll,
    scrollRef,
  } = useLiveChat(streamId);

  const [profiles, setProfiles] = useState({});

  useEffect(() => {
    const userIds = [...new Set(messages.map((m) => m.user_id).filter(Boolean))];
    userIds.forEach(async (uid) => {
      if (!profiles[uid]) {
        const { data } = await supabase.from('profiles').select('username, display_name, avatar_url').eq('id', uid).maybeSingle();
        if (data) setProfiles((prev) => ({ ...prev, [uid]: data }));
      }
    });
  }, [messages]);

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line, #f0f0f2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink, #222)', margin: 0 }}>Live Chat</h4>
        <span style={{ fontSize: 11, color: 'var(--sub, #888)' }}>{messages.length} messages</span>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--sub, #888)', fontSize: 13 }}>
            <span style={{ display: 'block', fontSize: 28, marginBottom: 8 }}>💬</span>
            No messages yet. Say hi!
          </div>
        ) : messages.map((m) => {
          const p = profiles[m.user_id];
          const name = p?.display_name || p?.username || m.user_id?.slice(0, 8) || 'User';
          return (
            <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <img
                src={p?.avatar_url || 'https://i.pravatar.cc/150'}
                alt=""
                style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink, #222)' }}>{name}</span>
                  <span style={{ fontSize: 10, color: 'var(--sub, #888)' }}>{formatTime(m.created_at)}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--ink, #222)', margin: 0, lineHeight: 1.4, wordBreak: 'break-word' }}>{m.message}</p>
              </div>
            </div>
          );
        })}
      </div>

      {newMessagesCount > 0 && (
        <button onClick={scrollToBottom} style={{ display: 'block', width: '100%', padding: '8px 0', background: 'var(--rn-red, #ff2442)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          ↓ {newMessagesCount} new message{newMessagesCount > 1 ? 's' : ''}
        </button>
      )}

      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--line, #f0f0f2)', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Say something..."
          maxLength={500}
          style={{ flex: 1, height: 36, borderRadius: 18, border: '1px solid var(--line, #e5e5e5)', background: 'var(--input-bg, #f5f5f7)', color: 'var(--ink, #222)', padding: '0 14px', fontSize: 13, boxSizing: 'border-box' }}
        />
        <button onClick={sendMessage} disabled={sending || !input.trim()} style={{ width: 36, height: 36, borderRadius: '50%', background: input.trim() ? 'var(--rn-red, #ff2442)' : '#ccc', color: '#fff', border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M2 21 23 12 2 3v7l15 2-15 2z" /></svg>
        </button>
      </div>
    </div>
  );
}

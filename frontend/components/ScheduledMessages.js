'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ScheduledMessages({ onClose, addToast }) {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [newMsg, setNewMsg] = useState({ recipient: '', content: '', scheduled_for: '' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      loadMessages(user?.id);
    });
  }, []);

  const loadMessages = async (userId) => {
    if (!userId) return;
    const { data } = await supabase.from('scheduled_messages').select('*, profiles:recipient_id(display_name, username)').eq('sender_id', userId).order('scheduled_for', { ascending: false });
    if (data) setMessages(data);
  };

  const scheduleMessage = async () => {
    if (!newMsg.recipient || !newMsg.content.trim() || !newMsg.scheduled_for) return;
    const { data: recipient } = await supabase.from('profiles').select('id').eq('username', newMsg.recipient.replace('@', '')).single();
    if (!recipient) { addToast?.('User not found'); return; }
    await supabase.from('scheduled_messages').insert({ sender_id: user.id, recipient_id: recipient.id, content: newMsg.content, scheduled_for: newMsg.scheduled_for });
    setNewMsg({ recipient: '', content: '', scheduled_for: '' });
    setShowSchedule(false);
    loadMessages(user.id);
    addToast?.('Message scheduled!');
  };

  const cancelMessage = async (id) => {
    await supabase.from('scheduled_messages').delete().eq('id', id);
    loadMessages(user.id);
    addToast?.('Message cancelled');
  };

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(450px,96vw)', maxHeight: '90vh', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: ink, margin: 0 }}>📅 Scheduled Messages</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowSchedule(!showSchedule)} style={{ padding: '6px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600, background: '#ff2442', color: '#fff', border: 'none', cursor: 'pointer' }}>+ Schedule</button>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer' }}>x</button>
          </div>
        </div>

        {showSchedule && (
          <div style={{ padding: 16, borderBottom: `1px solid ${line}`, background: chip }}>
            <input value={newMsg.recipient} onChange={e => setNewMsg({ ...newMsg, recipient: e.target.value })} placeholder="@username" style={{ width: '100%', height: 38, borderRadius: 8, border: `1px solid ${line}`, background: bg, color: ink, padding: '0 12px', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
            <textarea value={newMsg.content} onChange={e => setNewMsg({ ...newMsg, content: e.target.value })} placeholder="Message..." rows={2} style={{ width: '100%', borderRadius: 8, border: `1px solid ${line}`, background: bg, color: ink, padding: '8px 12px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />
            <input type="datetime-local" value={newMsg.scheduled_for} onChange={e => setNewMsg({ ...newMsg, scheduled_for: e.target.value })} style={{ width: '100%', height: 38, borderRadius: 8, border: `1px solid ${line}`, background: bg, color: ink, padding: '0 12px', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
            <button onClick={scheduleMessage} disabled={!newMsg.recipient || !newMsg.content.trim() || !newMsg.scheduled_for} style={{ width: '100%', height: 38, borderRadius: 19, background: newMsg.recipient && newMsg.content.trim() && newMsg.scheduled_for ? '#ff2442' : chip, color: newMsg.recipient && newMsg.content.trim() && newMsg.scheduled_for ? '#fff' : sub, fontWeight: 600, fontSize: 13, border: 'none', cursor: newMsg.recipient && newMsg.content.trim() && newMsg.scheduled_for ? 'pointer' : 'not-allowed' }}>Schedule Message</button>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: sub }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>📅</span>
              No scheduled messages
            </div>
          ) : messages.map(msg => (
            <div key={msg.id} style={{ padding: 12, background: chip, borderRadius: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: ink }}>To: @{msg.profiles?.username}</div>
                <button onClick={() => cancelMessage(msg.id)} style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(239,68,68,.1)', color: '#ef4444', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
              <div style={{ fontSize: 13, color: sub, marginBottom: 4 }}>{msg.content}</div>
              <div style={{ fontSize: 11, color: '#f59e0b' }}>Scheduled: {new Date(msg.scheduled_for).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

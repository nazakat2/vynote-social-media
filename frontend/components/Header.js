'use client';
import { useState, useRef, useEffect } from 'react';
import { notifications as notificationsApi, messages as messagesApi, follows as followsApi } from '../lib/api/index';

const TRENDING = ['autumn outfit ideas', 'matcha cafe near me', 'cozy desk setup', 'minimal skincare routine', 'kyoto travel guide'];

export default function Header({ dark, setDark, onSearch, search, onOpenCreate, onOpenProfile, onOpenExplore, onOpenSettings, onOpenAdmin, onOpenModeration, onOpenVideo, onOpenLive, onOpenReels, onOpenGroups, onOpenVerification, onOpenQR, onOpenNearby, onOpenShop, onOpenHighlights, onOpenAutoReply, onOpenScheduledMsg, addToast, me, onSignOut, onLogin, onOpenNotification }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [trendShow, setTrendShow] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMsg, setChatMsg] = useState('');
  const [chatMsgs, setChatMsgs] = useState([]);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [query, setQuery] = useState(search || '');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (notifOpen) {
      loadNotifications();
    }
  }, [notifOpen]);

  useEffect(() => {
    if (msgOpen) {
      loadChats();
    }
  }, [msgOpen]);

  useEffect(() => {
    const closePopupsOnOutsideClick = (event) => {
      if (event.target.closest?.('.rn-notification-panel, .rn-chat-panel, .rn-popup-trigger')) return;
      setNotifOpen(false);
      setMsgOpen(false);
      setActiveChat(null);
    };
    document.addEventListener('pointerdown', closePopupsOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closePopupsOnOutsideClick);
  }, []);

  useEffect(() => {
    if (activeChat) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs, activeChat]);

  useEffect(() => {
    if (!activeChat?.conversation_id) return;
    const subscription = messagesApi.subscribe?.(activeChat.conversation_id, (payload) => {
      if (payload?.eventType !== 'INSERT' || !payload.new) return;
      setChatMsgs((items) => items.some((item) => item.id === payload.new.id) ? items : [...items, payload.new]);
    });
    return () => subscription?.unsubscribe?.();
  }, [activeChat?.conversation_id]);

  useEffect(() => {
    if (!me?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadNotifications();
    const channel = notificationsApi.subscribe?.(me.id, (payload) => {
      loadNotifications();
      if (payload?.eventType === 'INSERT' && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const item = payload.new;
        const notice = new Notification('VyNote notification', { body: item?.content || 'You have a new notification', icon: me.avatar_url || '/images/default-avatar.png' });
        notice.onclick = () => {
          window.focus();
          if (item?.type === 'message') { setMsgOpen(true); loadChats(); }
          else onOpenNotification?.(item);
          notice.close();
        };
      }
    });
    return () => channel?.unsubscribe?.();
  }, [me?.id]);

  const loadNotifications = async () => {
    const { data } = await notificationsApi.list({ limit: 10 });
    if (data) setNotifications(data);
    const { count } = await notificationsApi.getUnreadCount();
    setUnreadCount(count);
  };

  const loadChats = async () => {
    const [conversationResult, followerResult, followingResult] = await Promise.all([
      messagesApi.getConversations(),
      followsApi.getFollowers(me?.id, { limit: 50 }),
      followsApi.getFollowing(me?.id, { limit: 50 })
    ]);
    const conversations = conversationResult.data || [];
    const knownIds = new Set(conversations.map((chat) => chat.profiles?.id));
    const contacts = [];
    const addContacts = (profiles, relationship) => {
      (profiles || []).forEach((profile) => {
        if (!profile?.id || knownIds.has(profile.id)) return;
        knownIds.add(profile.id);
        contacts.push({ conversation_id: null, profiles: profile, relationship });
      });
    };
    addContacts(followingResult.data, 'following');
    addContacts(followerResult.data, 'follower');
    setChats([...conversations, ...contacts]);
  };

  const handleSearch = (v) => { setQuery(v); onSearch(v); };

  const openChat = async (chat) => {
    let conversationId = chat.conversation_id;
    if (!conversationId) {
      const { data: conversation, error } = await messagesApi.createConversation(chat.profiles.id);
      if (error || !conversation) {
        addToast?.(`Conversation failed: ${error?.message || 'Unable to start chat'}`);
        return;
      }
      conversationId = conversation.id;
    }
    const active = { ...chat, conversation_id: conversationId, is_follower: false };
    setActiveChat(active);
    const { data } = await messagesApi.getConversation(conversationId);
    if (data) setChatMsgs(data);
  };

  const sendMsg = async () => {
    if (!chatMsg.trim() || !activeChat) return;
    const { data, error, notificationError } = await messagesApi.send(activeChat.conversation_id, chatMsg);
    if (error) {
      addToast?.(`Message failed: ${error.message}`);
      return;
    }
    if (data) {
      setChatMsgs((items) => items.some((item) => item.id === data.id) ? items : [...items, data]);
      setChatMsg('');
      if (notificationError) addToast?.(`Message sent, notification failed: ${notificationError.message}`);
    }
  };

  const saveEditedMessage = async () => {
    if (!editingMessageId || !editingMessageText.trim()) return;
    const { data, error } = await messagesApi.edit(editingMessageId, editingMessageText.trim());
    if (error) return addToast?.(`Edit failed: ${error.message}`);
    setChatMsgs((items) => items.map((item) => item.id === editingMessageId ? { ...item, ...data } : item));
    setEditingMessageId(null);
    setEditingMessageText('');
  };

  const deleteMessage = async (messageId) => {
    const { data, error } = await messagesApi.delete(messageId);
    if (error) return addToast?.(`Delete failed: ${error.message}`);
    setChatMsgs((items) => items.map((item) => item.id === messageId ? { ...item, ...data } : item));
  };

  const markAllRead = async () => {
    await notificationsApi.markAllAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const openNotifications = async () => {
    setNotifOpen(!notifOpen);
    setMsgOpen(false);
    if (!notifOpen && typeof Notification !== 'undefined' && Notification.permission === 'default') await Notification.requestPermission();
  };

  const selectNotification = async (notification) => {
    if (!notification.is_read) await notificationsApi.markAsRead(notification.id);
    setNotifOpen(false);
    setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
    if (!notification.is_read) setUnreadCount((count) => Math.max(0, count - 1));
    if (notification.type === 'message') {
      setMsgOpen(true);
      await loadChats();
    } else {
      onOpenNotification?.(notification);
    }
  };

  const btnStyle = { width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)', border: 'none', background: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 };
  const badgeStyle = { position: 'absolute', top: 4, right: 4, minWidth: 15, height: 15, padding: '0 4px', borderRadius: 8, background: 'var(--rn-red)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg)' };

  return (
    <header className="rn-top-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 60, zIndex: 50, display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', borderBottom: '1px solid var(--line)', background: 'var(--header-bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }} onClick={() => onSearch('')}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--rn-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(255,36,66,.35)' }}>
          <svg viewBox="0 0 24 24" style={{ width: 17, height: 17, fill: '#fff' }}><path d="M12 21c-4.8-3.3-9-6.6-9-10.6C3 7.4 5.2 5.3 7.9 5.3c1.6 0 3.1.8 4.1 2.2 1-1.4 2.5-2.2 4.1-2.2 2.7 0 4.9 2.1 4.9 5.1 0 4-4.2 7.3-9 10.6z" /></svg>
        </div>
        <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-.4px', color: 'var(--rn-red)' }}>vynote</span>
      </div>

      <div style={{ flex: '1 1 auto', maxWidth: 520, minWidth: 0, position: 'relative', margin: '0 auto' }}>
        <input ref={inputRef} type="text" value={query} onChange={(e) => handleSearch(e.target.value)} onFocus={() => !query && setTrendShow(true)} onBlur={() => setTimeout(() => setTrendShow(false), 200)} placeholder="Search notes, people, topics..." style={{ width: '100%', height: 38, borderRadius: 19, background: 'var(--input-bg)', padding: '0 16px 0 40px', color: 'var(--ink)', border: 'none', outline: 'none', fontSize: 14 }} />
        <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9a9aa0' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        {trendShow && !query && (
          <div style={{ position: 'absolute', top: 46, left: 0, right: 0, background: 'var(--card-bg)', borderRadius: 14, boxShadow: 'var(--shadow)', padding: 8, zIndex: 60 }}>
            <h5 style={{ fontSize: 11, fontWeight: 700, color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: .6, padding: '8px 12px 4px' }}>TRENDING NOW</h5>
            {TRENDING.map((t, i) => (
              <button key={t} onMouseDown={() => { handleSearch(t); setTrendShow(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13.5, color: '#333', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }}>
                <span style={{ width: 18, fontWeight: 800, color: i < 3 ? 'var(--rn-red)' : '#c9c9cf', fontSize: 12 }}>{i + 1}</span>{t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <button onClick={() => setDark(!dark)} style={btnStyle} title="Toggle Theme">{dark ? '☀️' : '🌙'}</button>

        {!me && <button onClick={onLogin} style={{ height: 40, padding: '0 28px', borderRadius: 22, border: 0, background: 'var(--rn-red)', color: '#fff', fontSize: 14, fontWeight: 750, cursor: 'pointer', boxShadow: '0 5px 16px rgba(255,36,66,.3)' }}>Log in</button>}

        {me && <>

        <div style={{ position: 'relative' }}>
          <button className="rn-popup-trigger rn-notification-trigger" onClick={openNotifications} style={btnStyle}>
            <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
            {unreadCount > 0 && <span style={badgeStyle}>{unreadCount}</span>}
          </button>
          {notifOpen && (
            <div className="rn-notification-panel" style={{ position: 'fixed', top: 70, right: 16, width: 320, maxHeight: 'min(460px, calc(100vh - 90px))', overflowY: 'auto', borderRadius: 16, border: '1px solid var(--line)', boxShadow: '0 18px 55px rgba(0,0,0,.2)', background: 'var(--card-bg)', zIndex: 70 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px 10px 16px', borderBottom: '1px solid var(--line)' }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink, #222)' }}>Notifications</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {unreadCount > 0 && <button onClick={markAllRead} style={{ fontSize: 12, color: 'var(--rn-red)', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>}
                  <button onClick={() => setNotifOpen(false)} aria-label="Close notifications" title="Close" style={{ width: 32, height: 32, borderRadius: '50%', border: 0, background: 'var(--chip, #f2f2f4)', color: 'var(--ink, #222)', cursor: 'pointer', fontSize: 18, display: 'grid', placeItems: 'center' }}>×</button>
                </div>
              </div>
              {notifications.map((n) => (
                <div key={n.id} onClick={() => selectNotification(n)} style={{ display: 'flex', gap: 12, padding: '13px 16px', alignItems: 'flex-start', background: n.is_read ? 'transparent' : 'rgba(255,36,66,0.05)', cursor: n.entity_id ? 'pointer' : 'default' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: n.type === 'like' ? '#ff2442' : n.type === 'follow' ? '#10b981' : '#3b82f6', fontSize: 16 }}>
                    {n.type === 'like' ? '❤️' : n.type === 'follow' ? '👤' : '💬'}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--ink, #222)' }}>{n.content || n.text}</p>
                    <span style={{ fontSize: 11, color: 'var(--sub, #888)', display: 'block', marginTop: 3 }}>{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--sub, #888)', fontSize: 13 }}>No notifications yet</div>
              )}
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button className="rn-popup-trigger" onClick={() => { setMsgOpen(!msgOpen); setNotifOpen(false); }} style={btnStyle}>
            <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
          </button>
          {msgOpen && (
            <div className="rn-chat-panel" style={{ position: 'fixed', bottom: 16, right: 16, width: 'min(390px, calc(100vw - 32px))', height: 'min(650px, calc(100vh - 90px))', overflow: 'hidden', borderRadius: 18, border: '1px solid var(--line)', boxShadow: '0 18px 55px rgba(0,0,0,.22)', background: 'var(--card-bg)', zIndex: 70 }}>
              {!activeChat ? (
                <>
                  <div style={{ padding: '10px 12px 10px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink, #222)' }}>Messages</h4>
                    <button onClick={() => setMsgOpen(false)} aria-label="Close messages" title="Close" style={{ width: 32, height: 32, borderRadius: '50%', border: 0, background: 'var(--chip, #f2f2f4)', color: 'var(--ink, #222)', cursor: 'pointer', fontSize: 18, display: 'grid', placeItems: 'center' }}>×</button>
                  </div>
                  {chats.map((c) => (
                    <div key={c.conversation_id || `contact-${c.profiles?.id}`} onClick={() => openChat(c)} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', cursor: 'pointer' }}>
                      <img src={c.profiles?.avatar_url || '/images/default-avatar.png'} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ fontSize: 13.5, display: 'block', color: 'var(--ink, #222)' }}>{c.profiles?.display_name}</b>
                        <span style={{ fontSize: 12.5, color: 'var(--sub, #888)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{c.relationship === 'following' ? 'You follow them · Start a chat' : c.relationship === 'follower' ? 'Follows you · Start a chat' : 'Open conversation'}</span>
                      </div>
                    </div>
                  ))}
                  {chats.length === 0 && (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--sub, #888)', fontSize: 13 }}>No conversations yet</div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ position: 'sticky', top: 0, zIndex: 3, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--line)', background: 'var(--card-bg)' }}>
                    <button onClick={() => setActiveChat(null)} style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <img src={activeChat.profiles?.avatar_url || '/images/default-avatar.png'} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}><b style={{ fontSize: 14, color: 'var(--ink, #222)', display: 'block' }}>{activeChat.profiles?.display_name}</b><span style={{ fontSize: 11, color: 'var(--sub, #888)' }}>Active conversation</span></div>
                    <button onClick={() => { setMsgOpen(false); setActiveChat(null); }} aria-label="Close chat" style={{ width: 30, height: 30, borderRadius: '50%', border: 0, background: 'var(--chip)', color: 'var(--ink)', cursor: 'pointer' }}>×</button>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--input-bg, #fafafa)' }}>
                    <div style={{ marginTop: 'auto' }} />
                    {!chatMsgs.length && <div style={{ textAlign: 'center', color: 'var(--sub, #888)', fontSize: 13 }}><span style={{ display: 'block', fontSize: 30, marginBottom: 8 }}>💬</span>Start your conversation</div>}
                    {chatMsgs.map((m) => {
                      const mine = m.user_id === me?.id;
                      const messageAvatar = mine ? me?.avatar_url : (m.profiles?.avatar_url || activeChat.profiles?.avatar_url);
                      return (
                        <div key={m.id} style={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: mine ? 'flex-end' : 'flex-start', gap: 7 }}>
                          {!mine && <img src={messageAvatar || '/images/default-avatar.png'} alt="" style={{ width: 27, height: 27, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />}
                          {mine && !m.is_deleted && <div style={{ display: 'flex', gap: 3, alignSelf: 'center' }}><button onClick={() => { setEditingMessageId(m.id); setEditingMessageText(m.content || ''); }} title="Edit message" style={{ width: 25, height: 25, borderRadius: '50%', border: '1px solid var(--line)', background: 'var(--card-bg)', color: 'var(--sub)', cursor: 'pointer', fontSize: 12 }}>✎</button><button onClick={() => deleteMessage(m.id)} title="Delete message" style={{ width: 25, height: 25, borderRadius: '50%', border: '1px solid var(--line)', background: 'var(--card-bg)', color: '#ff2442', cursor: 'pointer', fontSize: 12 }}>×</button></div>}
                          <div style={{ maxWidth: '72%', padding: '9px 13px', borderRadius: 14, fontSize: 13.5, lineHeight: 1.45, background: mine && !m.is_deleted ? 'var(--rn-red)' : 'var(--card-bg, #fff)', color: mine && !m.is_deleted ? '#fff' : 'var(--ink, #222)', borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4, border: mine && !m.is_deleted ? 'none' : '1px solid var(--line)', boxShadow: mine ? 'none' : '0 2px 7px rgba(0,0,0,.05)', fontStyle: m.is_deleted ? 'italic' : 'normal', opacity: m.is_deleted ? .65 : 1 }}>
                            {m.is_deleted ? 'Message deleted' : m.content}
                          </div>
                          {mine && <img src={messageAvatar || '/images/default-avatar.png'} alt="" style={{ width: 27, height: 27, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  {editingMessageId && <div style={{ display: 'flex', gap: 7, padding: '8px 12px', borderTop: '1px solid var(--line)', background: 'var(--chip)' }}><input autoFocus value={editingMessageText} onChange={(e) => setEditingMessageText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEditedMessage(); if (e.key === 'Escape') setEditingMessageId(null); }} style={{ flex: 1, height: 34, borderRadius: 17, border: '1px solid var(--line)', padding: '0 12px', outline: 'none', background: 'var(--card-bg)', color: 'var(--ink)' }} /><button onClick={saveEditedMessage} style={{ border: 0, borderRadius: 17, padding: '0 14px', background: 'var(--rn-red)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Save</button><button onClick={() => setEditingMessageId(null)} style={{ border: 0, background: 'none', color: 'var(--sub)', cursor: 'pointer' }}>Cancel</button></div>}
                  <div style={{ position: 'sticky', bottom: 0, zIndex: 3, flexShrink: 0, display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid var(--line)', background: 'var(--card-bg)' }}>
                    <input value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMsg()} placeholder="Type a message..." style={{ flex: 1, height: 38, borderRadius: 19, background: 'var(--input-bg)', padding: '0 15px', border: 'none', outline: 'none', fontSize: 14, color: 'var(--ink)' }} />
                    <button onClick={sendMsg} style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--rn-red)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: 'none', cursor: 'pointer' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M2 21 23 12 2 3v7l15 2-15 2z" /></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button onClick={onOpenCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 18px', borderRadius: 19, background: 'var(--rn-red)', color: '#fff', fontWeight: 700, fontSize: 13.5, boxShadow: '0 4px 14px rgba(255,36,66,.35)', border: 'none', cursor: 'pointer', margin: '0 6px', flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 14, height: 14 }}><path d="M12 5v14M5 12h14" /></svg><span>Create</span>
        </button>
        <button onClick={onOpenVideo} style={btnStyle} title="Upload Video">🎬</button>
        <button onClick={onOpenLive} style={btnStyle} title="Go Live">🔴</button>
        <button onClick={onOpenReels} style={btnStyle} title="Reels">🎞️</button>
        <button onClick={onOpenGroups} style={btnStyle} title="Groups">👥</button>
        <button onClick={onOpenNearby} style={btnStyle} title="Nearby">📍</button>
        <button onClick={onOpenShop} style={btnStyle} title="Shop">🛒</button>
        {me && <button onClick={onOpenQR} style={btnStyle} title="My QR Code">📱</button>}
        {me && <button onClick={onOpenVerification} style={btnStyle} title="Get Verified">✅</button>}
        {me && <button onClick={onOpenHighlights} style={btnStyle} title="Highlights">⭐</button>}
        {me && <button onClick={onOpenAutoReply} style={btnStyle} title="Auto-Reply">🤖</button>}
        {me && <button onClick={onOpenScheduledMsg} style={btnStyle} title="Scheduled Msg">📅</button>}
        {me?.role === 'admin' && <button onClick={onOpenAdmin} style={btnStyle} title="Admin">👑</button>}
        {me?.role === 'admin' && <button onClick={onOpenModeration} style={btnStyle} title="Moderation">🛡️</button>}

        <img src={me?.avatar_url || '/images/default-avatar.png'} alt="" onClick={onOpenProfile} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '2px solid #fff', boxShadow: '0 0 0 1.5px var(--rn-red)', flexShrink: 0 }} />
        <button onClick={onOpenSettings} style={btnStyle} title="Settings">
          <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
        </button>
        </>}
      </div>
      <style>{`
        header button[title]::after {
          content: attr(title); position: absolute; top: calc(100% + 9px); left: 50%;
          transform: translate(-50%, -4px); padding: 6px 9px; border-radius: 7px;
          background: rgba(24,24,28,.94); color: #fff; font-size: 11px; font-weight: 600;
          line-height: 1; white-space: nowrap; opacity: 0; visibility: hidden;
          pointer-events: none; transition: opacity .16s ease, transform .16s ease;
          box-shadow: 0 6px 18px rgba(0,0,0,.2); z-index: 300;
        }
        header button[title] { transition: transform .16s ease, background .16s ease !important; }
        header button[title]:hover { transform: translateY(-1px); background: var(--chip, #f3f3f5) !important; }
        header button[title]:hover::after { opacity: 1; visibility: visible; transform: translate(-50%, 0); }
        @media (hover: none) { header button[title]::after { display: none; } }
        @media (max-width: 900px) { .rn-chat-panel { top: auto !important; bottom: 0 !important; right: 0 !important; width: 100vw !important; height: min(72dvh, 620px) !important; max-height: 72dvh !important; border: 1px solid var(--line) !important; border-bottom: 0 !important; border-radius: 22px 22px 0 0 !important; box-shadow: 0 -14px 45px rgba(0,0,0,.2) !important; z-index: 200 !important; } .rn-notification-panel { top: 64px !important; bottom: auto !important; right: 8px !important; width: min(340px, calc(100vw - 16px)) !important; max-height: 55dvh !important; border-radius: 16px !important; z-index: 200 !important; } }
      `}</style>
    </header>
  );
}

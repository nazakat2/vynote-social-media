'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { sendChatMessage, getChatMessages } from '../lib/live/liveService';
import { MAX_CHAT_LENGTH, CHAT_THROTTLE_MS } from '../lib/live/liveUtils';

export function useLiveChat(streamId) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const channelRef = useRef(null);
  const lastSendRef = useRef(0);
  const isNearBottomRef = useRef(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!streamId) return;

    let mounted = true;

    const loadMessages = async () => {
      try {
        const existing = await getChatMessages(streamId);
        if (mounted) setMessages(existing);
      } catch (err) {
        console.warn('Failed to load chat messages:', err);
      }
    };

    loadMessages();

    const channel = supabase.channel(`live-chat-${streamId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_messages',
        filter: `stream_id=eq.${streamId}`,
      }, (payload) => {
        if (!mounted) return;
        const newMsg = payload.new;
        setMessages((prev) => {
          if (prev.find((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (!isNearBottomRef.current) {
          setNewMessagesCount((c) => c + 1);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [streamId]);

  const sendMessage = useCallback(async () => {
    if (!streamId || !input.trim() || sending) return;

    const now = Date.now();
    if (now - lastSendRef.current < CHAT_THROTTLE_MS) return;
    if (input.trim().length > MAX_CHAT_LENGTH) return;

    lastSendRef.current = now;
    setSending(true);
    const msg = input.trim();
    setInput('');

    try {
      await sendChatMessage(streamId, msg);
    } catch (err) {
      setInput(msg);
      console.warn('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  }, [streamId, input, sending]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setNewMessagesCount(0);
      isNearBottomRef.current = true;
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    if (isNearBottomRef.current) {
      setNewMessagesCount(0);
    }
  }, []);

  return {
    messages,
    input,
    setInput,
    sending,
    sendMessage,
    newMessagesCount,
    scrollToBottom,
    handleScroll,
    scrollRef,
  };
}

'use client'

import { useEffect, useCallback } from 'react'
import { supabase } from './supabase'

export function useRealtime(channelName, table, filter, callback) {
  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        filter
      }, callback)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelName, table, filter, callback])
}

export function useNotificationsRealtime(userId, onNotification) {
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        onNotification(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, onNotification])
}

export function useMessagesRealtime(conversationId, onMessage) {
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        onMessage(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, onMessage])
}

export function usePostLikesRealtime(postId, onLike) {
  useEffect(() => {
    if (!postId) return

    const channel = supabase
      .channel(`post-likes-${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_likes',
        filter: `post_id=eq.${postId}`
      }, (payload) => {
        onLike(payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, onLike])
}

export function useCommentsRealtime(postId, onComment) {
  useEffect(() => {
    if (!postId) return

    const channel = supabase
      .channel(`comments-${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`
      }, (payload) => {
        onComment(payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, onComment])
}

export function useFollowsRealtime(userId, onFollow) {
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`follows-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'follows',
        filter: `following_id=eq.${userId}`
      }, (payload) => {
        onFollow(payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, onFollow])
}

export function useStoriesRealtime(userId, onStory) {
  useEffect(() => {
    const channel = supabase
      .channel('stories-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stories'
      }, (payload) => {
        onStory(payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onStory])
}

export function broadcastTyping(conversationId, userId) {
  const channel = supabase.channel(`typing-${conversationId}`)
  channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { userId, conversationId }
  })
}

export function subscribeToTyping(conversationId, onTyping) {
  const channel = supabase.channel(`typing-${conversationId}`)
  channel
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      onTyping(payload)
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

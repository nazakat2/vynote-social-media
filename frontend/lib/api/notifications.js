import { supabase } from '../supabase'

export const notifications = {
  subscribe: (userId, onChange) => {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        onChange
      )
      .subscribe()

    return {
      unsubscribe: () => supabase.removeChannel(channel)
    }
  },

  list: async ({ page = 1, limit = 20 } = {}) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: new Error('Not authenticated') }
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error } = await supabase
      .from('notifications')
      .select('*, profiles:actor_id(id, username, display_name, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }).range(from, to)
    return { data, error, hasMore: data?.length === limit }
  },

  getUnreadCount: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { count: 0 }
    const { count } = await supabase
      .from('notifications').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('is_read', false)
    return { count: count || 0 }
  },

  markAsRead: async (notificationId) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
    return { error }
  },

  markAllAsRead: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }
    const { error } = await supabase
      .from('notifications').update({ is_read: true })
      .eq('user_id', user.id).eq('is_read', false)
    return { error }
  },

  getPreferences: async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: userError || new Error('Not authenticated') }
    }

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('likes, comments, replies, follows, follow_requests, mentions, reposts, messages, system, push_enabled')
      .eq('user_id', user.id)
      .maybeSingle()

    return { data, error }
  },

  updatePreferences: async (preferences) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: userError || new Error('Not authenticated') }
    }

    const allowedKeys = [
      'likes', 'comments', 'replies', 'follows', 'follow_requests',
      'mentions', 'reposts', 'messages', 'system', 'push_enabled'
    ]
    const updates = Object.fromEntries(
      allowedKeys
        .filter((key) => typeof preferences[key] === 'boolean')
        .map((key) => [key, preferences[key]])
    )

    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(
        { user_id: user.id, ...updates, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    return { data, error }
  }
}

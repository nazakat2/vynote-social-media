import { supabase } from '../supabase'

export const messages = {
  subscribe: (conversationId, onChange) => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, onChange)
      .subscribe()
    return { unsubscribe: () => supabase.removeChannel(channel) }
  },

  getConversations: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: new Error('Not authenticated') }
    const { data: memberships, error } = await supabase
      .from('conversation_participants')
      .select('conversation_id, conversations(id, updated_at)')
      .eq('user_id', user.id)
    if (error || !memberships?.length) return { data: [], error }

    const results = await Promise.all(memberships.map(async (membership) => {
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('profiles:user_id(id, username, display_name, avatar_url)')
        .eq('conversation_id', membership.conversation_id)
        .neq('user_id', user.id)
        .maybeSingle()
      return { ...membership, profiles: participant?.profiles || null }
    }))
    return { data: results.filter((item) => item.profiles), error: null }
  },

  getConversation: async (conversationId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles:user_id(id, username, display_name, avatar_url)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    return { data, error }
  },

  send: async (conversationId, content, imageUrl = null) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, user_id: user.id, content, image_url: imageUrl })
      .select('*, profiles:user_id(id, username, display_name, avatar_url)')
      .single()
    let notificationError = null
    if (!error && data) {
      const { data: recipients } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', user.id)
      if (recipients?.length) {
        const senderName = data.profiles?.display_name || data.profiles?.username || 'Someone'
        const { error: insertNotificationError } = await supabase.from('notifications').insert(recipients.map((recipient) => ({
          user_id: recipient.user_id,
          actor_id: user.id,
          type: 'message',
          entity_type: 'message',
          entity_id: data.id,
          content: `${senderName}: ${content.length > 70 ? `${content.slice(0, 70)}…` : content}`
        })))
        notificationError = insertNotificationError
      }
    }
    return { data, error, notificationError }
  },

  edit: async (messageId, content) => {
    const { data, error } = await supabase
      .from('messages')
      .update({ content })
      .eq('id', messageId)
      .select()
      .single()
    return { data, error }
  },

  delete: async (messageId) => {
    const { data, error } = await supabase
      .from('messages')
      .update({ is_deleted: true, content: null, image_url: null })
      .eq('id', messageId)
      .select()
      .single()
    return { data, error }
  },

  createConversation: async (otherUserId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }
    if (!otherUserId || otherUserId === user.id) {
      return { data: null, error: new Error('Invalid conversation participant') }
    }

    const { data: memberships, error: membershipError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id)
    if (membershipError) return { data: null, error: membershipError }

    for (const membership of memberships || []) {
      const { data: otherMember } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', membership.conversation_id)
        .eq('user_id', otherUserId)
        .maybeSingle()
      if (otherMember) return { data: { id: membership.conversation_id }, error: null }
    }

    const conversationId = crypto.randomUUID()
    const { error: conversationError } = await supabase
      .from('conversations')
      .insert({ id: conversationId })
    if (conversationError) return { data: null, error: conversationError }

    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: conversationId, user_id: user.id },
        { conversation_id: conversationId, user_id: otherUserId }
      ])
    if (participantsError) return { data: null, error: participantsError }

    return { data: { id: conversationId }, error: null }
  }
}

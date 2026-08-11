import { supabase } from '../supabase'

export const profiles = {
  get: async (userId) => {
    const { data, error } = await supabase
      .from('profiles').select('*').eq('id', userId).maybeSingle()
    return { data, error }
  },

  getByUsername: async (username) => {
    const { data, error } = await supabase
      .from('profiles').select('*').eq('username', username).maybeSingle()
    return { data, error }
  },

  getCurrent: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }
    const { data, error } = await supabase
      .from('profiles').select('*').eq('id', user.id).maybeSingle()
    return { data, error }
  },

  update: async (updates) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { data: null, error: userError || new Error('Not authenticated') }
    }

    const allowedKeys = ['username', 'display_name', 'avatar_url', 'cover_url', 'bio', 'website', 'is_private']
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedKeys.includes(key))
    )
    safeUpdates.updated_at = new Date().toISOString()

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(safeUpdates)
      .eq('id', user.id)
      .select()
      .maybeSingle()

    if (updateError || updatedProfile) {
      return { data: updatedProfile, error: updateError }
    }

    const emailUsername = user.email?.split('@')[0]
    const username = user.user_metadata?.username || emailUsername || `user_${user.id.slice(0, 8)}`
    const displayName = safeUpdates.display_name || user.user_metadata?.display_name || username

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username,
        display_name: displayName,
        ...safeUpdates
      })
      .select()
      .single()

    return { data, error }
  },

  search: async (query, limit = 20) => {
    const { data, error } = await supabase
      .from('profiles').select('*')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(limit)
    return { data, error }
  }
}

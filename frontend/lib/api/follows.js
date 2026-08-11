import { supabase } from '../supabase'

export const follows = {
  toggle: async (userId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }
    const { data: existing } = await supabase
      .from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).maybeSingle()
    if (existing) {
      const { error } = await supabase.from('follows').delete().eq('id', existing.id)
      return { data: { following: false }, error }
    } else {
      const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: userId })
      return { data: { following: true }, error }
    }
  },

  check: async (userId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { following: false }
    const { data } = await supabase
      .from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).maybeSingle()
    return { following: !!data }
  },

  getFollowers: async (userId, { page = 1, limit = 20 } = {}) => {
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error } = await supabase
      .from('follows')
      .select('profiles:follower_id(id, username, display_name, avatar_url, is_verified)')
      .eq('following_id', userId).eq('status', 'active')
      .order('created_at', { ascending: false }).range(from, to)
    return { data: data?.map(f => f.profiles), error, hasMore: data?.length === limit }
  },

  getFollowing: async (userId, { page = 1, limit = 20 } = {}) => {
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error } = await supabase
      .from('follows')
      .select('profiles:following_id(id, username, display_name, avatar_url, is_verified)')
      .eq('follower_id', userId).eq('status', 'active')
      .order('created_at', { ascending: false }).range(from, to)
    return { data: data?.map(f => f.profiles), error, hasMore: data?.length === limit }
  },

  getSuggestions: async (limit = 10) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: new Error('Not authenticated') }
    const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
    const followingIds = following?.map(f => f.following_id) || []
    const { data, error } = await supabase
      .from('profiles').select('*')
      .not('id', 'in', `(${[user.id, ...followingIds].join(',')})`)
      .order('follower_count', { ascending: false }).limit(limit)
    return { data, error }
  }
}

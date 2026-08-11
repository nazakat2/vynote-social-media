import { supabase } from '../supabase'

export const collections = {
  list: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: new Error('Not authenticated') }
    const { data, error } = await supabase
      .from('collections').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  create: async (name, icon = '📁') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }
    const { data, error } = await supabase
      .from('collections').insert({ user_id: user.id, name, icon }).select().single()
    return { data, error }
  },

  update: async (collectionId, updates) => {
    const { data, error } = await supabase
      .from('collections').update(updates).eq('id', collectionId).select().single()
    return { data, error }
  },

  delete: async (collectionId) => {
    const { error } = await supabase.from('collections').delete().eq('id', collectionId)
    return { error }
  },

  getNotes: async (collectionId, { page = 1, limit = 20 } = {}) => {
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error } = await supabase
      .from('post_collects')
      .select('posts(*, profiles:user_id(id, username, display_name, avatar_url))')
      .eq('collection_id', collectionId)
      .order('created_at', { ascending: false }).range(from, to)
    return { data: data?.map(c => c.posts), error, hasMore: data?.length === limit }
  },

  toggleNote: async (collectionId, postId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }
    const { data: existing } = await supabase
      .from('post_collects').select('id')
      .eq('collection_id', collectionId).eq('post_id', postId).eq('user_id', user.id).single()
    if (existing) {
      const { error } = await supabase.from('post_collects').delete().eq('id', existing.id)
      return { data: { removed: true }, error }
    } else {
      const { error } = await supabase
        .from('post_collects').insert({ collection_id: collectionId, post_id: postId, user_id: user.id })
      return { data: { added: true }, error }
    }
  }
}

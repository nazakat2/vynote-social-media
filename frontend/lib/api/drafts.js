import { supabase } from '../supabase'

export const drafts = {
  list: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: new Error('Not authenticated') }
    const { data, error } = await supabase
      .from('drafts').select('*').eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    return { data, error }
  },

  create: async (draftData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }
    const { data, error } = await supabase
      .from('drafts').insert({ ...draftData, user_id: user.id }).select().single()
    return { data, error }
  },

  update: async (draftId, updates) => {
    const { data, error } = await supabase
      .from('drafts').update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', draftId).select().single()
    return { data, error }
  },

  delete: async (draftId) => {
    const { error } = await supabase.from('drafts').delete().eq('id', draftId)
    return { error }
  },

  publish: async (draftId) => {
    const { data: draft, error: draftError } = await supabase
      .from('drafts').select('*').eq('id', draftId).single()
    if (draftError) return { data: null, error: draftError }
    const { data: post, error: postError } = await supabase
      .from('posts').insert({
        user_id: draft.user_id, title: draft.title, description: draft.description,
        image_url: draft.image_url, category: draft.category, tags: draft.tags
      }).select().single()
    if (postError) return { data: null, error: postError }
    await supabase.from('drafts').delete().eq('id', draftId)
    return { data: post, error: null }
  }
}

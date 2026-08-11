import { supabase } from '../supabase'

export const stories = {
  list: async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('*, profiles:user_id(id, username, display_name, avatar_url)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    return { data, error }
  },

  create: async (imageUrl, caption = '') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }
    const { data, error } = await supabase
      .from('stories')
      .insert({
        user_id: user.id, image_url: imageUrl, caption,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }).select().single()
    return { data, error }
  },

  delete: async (storyId) => {
    const { error } = await supabase.from('stories').delete().eq('id', storyId)
    return { error }
  },

  markAsViewed: async (storyId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('story_views')
      .upsert(
        { story_id: storyId, user_id: user.id, viewed_at: new Date().toISOString() },
        { onConflict: 'story_id,user_id', ignoreDuplicates: true }
      )
  },

  getViewers: async (storyId) => {
    const { data, error } = await supabase
      .from('story_views')
      .select('profiles:user_id(id, username, display_name, avatar_url), viewed_at')
      .eq('story_id', storyId).order('viewed_at', { ascending: false })
    return { data, error }
  }
}

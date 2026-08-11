import { supabase } from '../supabase'

export const comments = {
  list: async (postId, { page = 1, limit = 20, parentId = null } = {}) => {
    let query = supabase
      .from('comments')
      .select('*, profiles:user_id(id, username, display_name, avatar_url)')
      .eq('post_id', postId)
      .is('parent_id', parentId)
      .order('created_at', { ascending: false })
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error } = await query.range(from, to)
    return { data, error, hasMore: data?.length === limit }
  },

  create: async (postId, content, parentId = null) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: user.id, content, parent_id: parentId })
      .select('*, profiles:user_id(id, username, display_name, avatar_url)')
      .single()

    if (!error && data) {
      const { data: post } = await supabase
        .from('posts')
        .select('user_id, title')
        .eq('id', postId)
        .single()

      if (post?.user_id && post.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: post.user_id,
          actor_id: user.id,
          type: parentId ? 'reply' : 'comment',
          entity_type: 'post',
          entity_id: postId,
          content: parentId
            ? `replied to a comment on “${post.title || 'your post'}”`
            : `commented on “${post.title || 'your post'}”`
        })
      }
    }
    return { data, error }
  },

  update: async (commentId, content) => {
    const { data, error } = await supabase
      .from('comments').update({ content, updated_at: new Date().toISOString() })
      .eq('id', commentId).select().single()
    return { data, error }
  },

  delete: async (commentId) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    return { error }
  },

  toggleLike: async (commentId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }
    const { data: existing } = await supabase
      .from('comment_likes').select('id').eq('comment_id', commentId).eq('user_id', user.id).single()
    if (existing) {
      const { error } = await supabase.from('comment_likes').delete().eq('id', existing.id)
      return { data: { liked: false }, error }
    } else {
      const { error } = await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id })
      return { data: { liked: true }, error }
    }
  }
}

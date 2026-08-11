import { supabase } from '../supabase'

function normalizePost(post) {
  if (!post) return post
  return {
    ...post,
    tags: (post.post_tags || []).map(({ tag }) => tag),
    post_tags: undefined
  }
}

export const posts = {
  list: async ({ page = 1, limit = 20, category, search, userId } = {}) => {
    let query = supabase
      .from('posts')
      .select('*, profiles:user_id(id, username, display_name, avatar_url, is_verified), post_tags(tag)')
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (category && category !== 'All') query = query.eq('category', category)
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    if (userId) query = query.eq('user_id', userId)

    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error } = await query.range(from, to)
    return { data: data?.map(normalizePost), error, hasMore: data?.length === limit }
  },

  get: async (postId) => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles:user_id(id, username, display_name, avatar_url, is_verified), post_tags(tag)')
      .eq('id', postId).single()
    return { data: normalizePost(data), error }
  },

  create: async (postData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }
    const { tags = [], ...postFields } = postData
    const { data, error } = await supabase
      .from('posts').insert({ ...postFields, user_id: user.id }).select().single()
    if (error || !data) return { data, error }

    const normalizedTags = [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))]
    if (normalizedTags.length) {
      const { error: tagsError } = await supabase
        .from('post_tags')
        .insert(normalizedTags.map((tag) => ({ post_id: data.id, tag })))
      if (tagsError) {
        await supabase.from('posts').delete().eq('id', data.id)
        return { data: null, error: tagsError }
      }
    }

    return { data: { ...data, tags: normalizedTags }, error: null }
  },

  update: async (postId, updates) => {
    const { data, error } = await supabase
      .from('posts').update(updates).eq('id', postId).select().single()
    return { data, error }
  },

  delete: async (postId) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    return { error }
  },

  archive: async (postId) => {
    const { data, error } = await supabase
      .from('posts').update({ is_archived: true }).eq('id', postId).select().single()
    return { data, error }
  },

  restore: async (postId) => {
    const { data, error } = await supabase
      .from('posts').update({ is_archived: false }).eq('id', postId).select().single()
    return { data, error }
  },

  toggleLike: async (postId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }
    const { data: existing } = await supabase
      .from('post_likes').select('id').eq('post_id', postId).eq('user_id', user.id).single()
    if (existing) {
      const { error } = await supabase.from('post_likes').delete().eq('id', existing.id)
      return { data: { liked: false }, error }
    } else {
      const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id })
      return { data: { liked: true }, error }
    }
  },

  toggleCollect: async (postId, collectionId = null) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }
    const { data: existing } = await supabase
      .from('post_collects').select('id').eq('post_id', postId).eq('user_id', user.id).single()
    if (existing) {
      const { error } = await supabase.from('post_collects').delete().eq('id', existing.id)
      return { data: { collected: false }, error }
    } else {
      const { error } = await supabase
        .from('post_collects').insert({ post_id: postId, user_id: user.id, collection_id: collectionId })
      return { data: { collected: true }, error }
    }
  },

  toggleRepost: async (postId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not authenticated') }
    const { data: existing } = await supabase
      .from('reposts').select('id').eq('post_id', postId).eq('user_id', user.id).single()
    if (existing) {
      const { error } = await supabase.from('reposts').delete().eq('id', existing.id)
      return { data: { reposted: false }, error }
    } else {
      const { error } = await supabase.from('reposts').insert({ post_id: postId, user_id: user.id })
      return { data: { reposted: true }, error }
    }
  },

  checkInteraction: async (postId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { liked: false, collected: false, reposted: false }
    const [likes, collects, reposts] = await Promise.all([
      supabase.from('post_likes').select('id').eq('post_id', postId).eq('user_id', user.id).single(),
      supabase.from('post_collects').select('id').eq('post_id', postId).eq('user_id', user.id).single(),
      supabase.from('reposts').select('id').eq('post_id', postId).eq('user_id', user.id).single()
    ])
    return { liked: !!likes.data, collected: !!collects.data, reposted: !!reposts.data }
  },

  recordView: async (postId) => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('post_views').insert({
      post_id: postId,
      user_id: user?.id || null
    })
  }
}

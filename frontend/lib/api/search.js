import { supabase } from '../supabase'

export const hashtags = {
  trending: async (limit = 10) => {
    const { data, error } = await supabase
      .from('hashtags').select('*')
      .order('post_count', { ascending: false })
      .limit(limit)
    return { data, error }
  },

  search: async (query, limit = 20) => {
    const { data, error } = await supabase
      .from('hashtags').select('*')
      .ilike('name', `%${query}%`)
      .order('post_count', { ascending: false })
      .limit(limit)
    return { data, error }
  },

  getPosts: async (tagName, { page = 1, limit = 20 } = {}) => {
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error } = await supabase
      .from('post_tags')
      .select('posts(*, profiles:user_id(id, username, display_name, avatar_url))')
      .eq('tag', tagName)
      .order('created_at', { ascending: false }).range(from, to)
    return { data: data?.map(t => t.posts), error, hasMore: data?.length === limit }
  }
}

export const search = {
  global: async (query, { page = 1, limit = 20, type = 'all' } = {}) => {
    const from = (page - 1) * limit
    const to = from + limit - 1
    const results = {}

    if (type === 'all' || type === 'users') {
      const { data } = await supabase
        .from('profiles').select('id, username, display_name, avatar_url, is_verified, follower_count')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10)
      results.users = data || []
    }

    if (type === 'all' || type === 'posts') {
      const { data } = await supabase
        .from('posts')
        .select('*, profiles:user_id(id, username, display_name, avatar_url)')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .range(from, to)
      results.posts = data || []
    }

    if (type === 'all' || type === 'hashtags') {
      const { data } = await supabase
        .from('hashtags').select('*')
        .ilike('name', `%${query}%`)
        .order('post_count', { ascending: false })
        .limit(10)
      results.hashtags = data || []
    }

    return { data: results }
  }
}

export const analytics = {
  getProfileStats: async (userId) => {
    const { data, error } = await supabase
      .from('profiles').select('follower_count, following_count, post_count')
      .eq('id', userId).single()
    return { data, error }
  },

  getPostStats: async (postId) => {
    const { data, error } = await supabase
      .from('posts').select('like_count, comment_count, collect_count, repost_count, view_count')
      .eq('id', postId).single()
    return { data, error }
  },

  getProfileViews: async (userId, days = 30) => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('profile_views').select('*', { count: 'exact', head: true })
      .eq('profile_id', userId).gte('viewed_at', since)
    return { count: count || 0 }
  },

  getPostViews: async (postId, days = 30) => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('post_views').select('*', { count: 'exact', head: true })
      .eq('post_id', postId).gte('viewed_at', since)
    return { count: count || 0 }
  },

  getTopPosts: async (userId, limit = 5) => {
    const { data, error } = await supabase
      .from('posts').select('id, title, like_count, comment_count, collect_count, created_at')
      .eq('user_id', userId).eq('is_archived', false)
      .order('like_count', { ascending: false })
      .limit(limit)
    return { data, error }
  }
}

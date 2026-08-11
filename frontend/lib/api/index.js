export { auth } from './auth'
export { profiles } from './profiles'
export { posts } from './posts'
export { comments } from './comments'
export { follows } from './follows'
export { collections } from './collections'
export { messages } from './messages'
export { notifications } from './notifications'
export { stories } from './stories'
export { drafts } from './drafts'
export { hashtags, search, analytics } from './search'

import { supabase } from '../supabase'

export const blocks = {
  list: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [] };
    return supabase.from('blocks').select('*, blocked:profiles!blocks_blocked_id_fkey(id, username, display_name, avatar_url)').eq('blocker_id', user.id);
  },
  check: async (blockedId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null };
    return supabase.from('blocks').select('id').eq('blocker_id', user.id).eq('blocked_id', blockedId).maybeSingle();
  },
  add: async (blockedId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };
    return supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: blockedId });
  },
  remove: async (blockedId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };
    return supabase.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', blockedId);
  }
}

export const mutes = {
  list: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [] };
    return supabase.from('mutes').select('*, muted:profiles!mutes_muted_id_fkey(id, username, display_name, avatar_url)').eq('user_id', user.id);
  },
  check: async (mutedId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null };
    return supabase.from('mutes').select('id').eq('user_id', user.id).eq('muted_id', mutedId).maybeSingle();
  },
  add: async (mutedId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };
    return supabase.from('mutes').insert({ user_id: user.id, muted_id: mutedId });
  },
  remove: async (mutedId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };
    return supabase.from('mutes').delete().eq('user_id', user.id).eq('muted_id', mutedId);
  }
}

export const reports = {
  create: async ({ entityType, entityId, reason }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };
    return supabase.from('reports').insert({
      reporter_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
      reason
    });
  },
  list: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [] };
    return supabase.from('reports').select('*').eq('reporter_id', user.id).order('created_at', { ascending: false });
  }
}

export const admin = {
  getStats: async () => {
    const [users, posts, reports] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending')
    ]);
    return { users: users.count || 0, posts: posts.count || 0, reports: reports.count || 0 };
  },
  listUsers: async () => {
    return supabase.from('profiles').select('id, username, display_name, avatar_url, role, created_at, is_verified').order('created_at', { ascending: false });
  },
  updateUserRole: async (userId, role) => {
    return supabase.from('profiles').update({ role }).eq('id', userId);
  },
  banUser: async (userId) => {
    return supabase.from('profiles').update({ role: 'banned' }).eq('id', userId);
  },
  listReports: async (status = 'pending') => {
    return supabase.from('reports').select('*, reporter:profiles!reports_reporter_id_fkey(display_name, username, avatar_url)').eq('status', status).order('created_at', { ascending: false });
  },
  resolveReport: async (reportId, status) => {
    return supabase.from('reports').update({ status }).eq('id', reportId);
  }
}

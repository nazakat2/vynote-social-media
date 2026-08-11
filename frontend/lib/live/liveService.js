import { supabase } from '../supabase';

export async function createStream({ title, description, category, thumbnailUrl }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const streamValues = {
    title: title || 'Live Stream',
    description: description || '',
    category: category || '',
    thumbnail_url: thumbnailUrl || null,
    status: 'preparing',
    started_at: null,
    ended_at: null,
  };

  // A closed tab or failed device request can leave a preparing/live row
  // behind. Reuse it so repeated Start clicks never violate the one-active-
  // stream-per-user constraint.
  const { data: existing, error: existingError } = await supabase
    .from('live_streams')
    .select('id')
    .eq('user_id', user.id)
    .in('status', ['preparing', 'live'])
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { data, error } = await supabase
      .from('live_streams')
      .update(streamValues)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('live_streams')
    .insert({
      user_id: user.id,
      ...streamValues,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function startStream(streamId) {
  const { data, error } = await supabase
    .from('live_streams')
    .update({ status: 'live', started_at: new Date().toISOString() })
    .eq('id', streamId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function endStream(streamId) {
  const { data, error } = await supabase
    .from('live_streams')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', streamId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function cancelStream(streamId) {
  const { error } = await supabase
    .from('live_streams')
    .update({ status: 'cancelled', ended_at: new Date().toISOString() })
    .eq('id', streamId);

  if (error) throw error;
}

export async function saveLiveReplay(stream, recordingBlob) {
  if (!stream?.id || !recordingBlob?.size) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const extension = recordingBlob.type.includes('mp4') ? 'mp4' : 'webm';
  const path = `${user.id}/live-${stream.id}-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from('posts')
    .upload(path, recordingBlob, {
      contentType: recordingBlob.type || 'video/webm',
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: publicData } = supabase.storage.from('posts').getPublicUrl(path);
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      title: stream.title || 'Live replay',
      description: stream.description || '',
      // Audio-only browsers still save the WebM replay through video_url;
      // the existing feed player can play its audio track.
      video_url: publicData.publicUrl,
      category: stream.category || 'Live',
      type: 'post',
      visibility: 'public',
      allow_comments: true,
    })
    .select('*, profiles:user_id(display_name, username, avatar_url)')
    .single();

  if (error) {
    await supabase.storage.from('posts').remove([path]);
    throw error;
  }

  return data;
}

export async function getActiveStreams() {
  const { data, error } = await supabase
    .from('live_streams')
    .select('*, profiles:user_id(id, username, display_name, avatar_url, is_verified)')
    .eq('status', 'live')
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getStreamById(streamId) {
  const { data, error } = await supabase
    .from('live_streams')
    .select('*, profiles:user_id(id, username, display_name, avatar_url, is_verified)')
    .eq('id', streamId)
    .single();

  if (error) throw error;
  return data;
}

export async function getFollowingLiveStreams() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id);

  if (!following || following.length === 0) return [];

  const followingIds = following.map((f) => f.following_id);

  const { data, error } = await supabase
    .from('live_streams')
    .select('*, profiles:user_id(id, username, display_name, avatar_url, is_verified)')
    .eq('status', 'live')
    .in('user_id', followingIds)
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getMyActiveStream() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('live_streams')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['preparing', 'live'])
    .maybeSingle();

  return data;
}

export async function getUserActiveStream(userId) {
  const { data } = await supabase
    .from('live_streams')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'live')
    .maybeSingle();

  return data;
}

export async function sendChatMessage(streamId, message) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 500) throw new Error('Invalid message');

  const { data, error } = await supabase
    .from('live_messages')
    .insert({ stream_id: streamId, user_id: user.id, message: trimmed })
    .select('*, profiles:user_id(username, display_name, avatar_url)')
    .single();

  if (error) throw error;
  return data;
}

export async function getChatMessages(streamId, limit = 50) {
  const { data, error } = await supabase
    .from('live_messages')
    .select('*, profiles:user_id(username, display_name, avatar_url)')
    .eq('stream_id', streamId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function deleteChatMessage(messageId) {
  const { error } = await supabase
    .from('live_messages')
    .delete()
    .eq('id', messageId);

  if (error) throw error;
}

export async function sendReaction(streamId, reactionType) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('live_reactions')
    .insert({ stream_id: streamId, user_id: user.id, reaction_type: reactionType });
}

export async function joinStreamAsViewer(streamId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('live_viewers')
    .upsert({ stream_id: streamId, user_id: user.id, left_at: null }, { onConflict: 'stream_id,user_id' });
}

export async function leaveStreamAsViewer(streamId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('live_viewers')
    .update({ left_at: new Date().toISOString() })
    .eq('stream_id', streamId)
    .eq('user_id', user.id);
}

export async function sendLiveNotification(streamId, username) {
  const { data: stream } = await supabase
    .from('live_streams')
    .select('user_id')
    .eq('id', streamId)
    .single();

  if (!stream) return;

  const { data: followers } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', stream.user_id);

  if (!followers || followers.length === 0) return;

  const notifications = followers.map((f) => ({
    user_id: f.follower_id,
    actor_id: stream.user_id,
    type: 'live_start',
    entity_type: 'post',
    entity_id: streamId,
    content: `${username} started a live video`,
  }));

  await supabase.from('notifications').insert(notifications);
}

export function captureThumbnail(videoElement) {
  if (!videoElement) return null;

  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0, 320, 180);

  return canvas.toDataURL('image/jpeg', 0.6);
}

-- RedNote App - Complete Database Schema
-- Supabase PostgreSQL

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  cover_url text,
  bio text default '',
  website text default '',
  is_private boolean default false,
  is_verified boolean default false,
  role text default 'user' check (role in ('user', 'admin', 'moderator')),
  follower_count integer default 0,
  following_count integer default 0,
  post_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://i.pravatar.cc/150?u=' || new.id)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- POSTS (notes)
-- ============================================
create table public.posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text default '',
  image_url text,
  video_url text,
  aspect_ratio text default '4/5',
  category text default 'Food',
  visibility text default 'public' check (visibility in ('public', 'private', 'followers')),
  allow_comments boolean default true,
  is_archived boolean default false,
  like_count integer default 0,
  comment_count integer default 0,
  collect_count integer default 0,
  repost_count integer default 0,
  view_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- POST TAGS
-- ============================================
create table public.post_tags (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  tag text not null,
  unique(post_id, tag)
);

create index idx_post_tags_tag on public.post_tags(tag);

-- ============================================
-- COMMENTS (with nested replies)
-- ============================================
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  like_count integer default 0,
  reply_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_comments_post_id on public.comments(post_id);
create index idx_comments_parent_id on public.comments(parent_id);

-- ============================================
-- COMMENT LIKES
-- ============================================
create table public.comment_likes (
  id uuid primary key default uuid_generate_v4(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(comment_id, user_id)
);

-- ============================================
-- POST LIKES
-- ============================================
create table public.post_likes (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- ============================================
-- FOLLOWS
-- ============================================
create table public.follows (
  id uuid primary key default uuid_generate_v4(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  status text default 'active' check (status in ('active', 'pending')),
  created_at timestamptz default now(),
  unique(follower_id, following_id),
  check (follower_id != following_id)
);

create index idx_follows_follower on public.follows(follower_id);
create index idx_follows_following on public.follows(following_id);

-- ============================================
-- COLLECTIONS (bookmark folders)
-- ============================================
create table public.collections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  icon text default '📁',
  is_private boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_collections_user_id on public.collections(user_id);

-- ============================================
-- POST COLLECTS (bookmarks)
-- ============================================
create table public.post_collects (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  collection_id uuid references public.collections(id) on delete set null,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- ============================================
-- REPOSTS
-- ============================================
create table public.reposts (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

-- ============================================
-- CONVERSATIONS
-- ============================================
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- CONVERSATION PARTICIPANTS
-- ============================================
create table public.conversation_participants (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(conversation_id, user_id)
);

-- ============================================
-- MESSAGES
-- ============================================
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  image_url text,
  reply_to_id uuid references public.messages(id) on delete set null,
  is_deleted boolean default false,
  created_at timestamptz default now()
);

create index idx_messages_conversation on public.messages(conversation_id, created_at desc);

-- ============================================
-- NOTIFICATIONS
-- ============================================
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete cascade,
  type text not null check (type in ('like', 'comment', 'reply', 'follow', 'follow_request', 'mention', 'repost', 'message', 'system')),
  entity_type text check (entity_type in ('post', 'comment', 'message', 'profile')),
  entity_id uuid,
  content text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index idx_notifications_user_id on public.notifications(user_id, created_at desc);
create index idx_notifications_unread on public.notifications(user_id) where is_read = false;

-- ============================================
-- STORIES
-- ============================================
create table public.stories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  caption text default '',
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz default now()
);

create index idx_stories_user_id on public.stories(user_id);
create index idx_stories_expires_at on public.stories(expires_at);

-- ============================================
-- STORY VIEWS
-- ============================================
create table public.story_views (
  id uuid primary key default uuid_generate_v4(),
  story_id uuid not null references public.stories(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz default now(),
  unique(story_id, user_id)
);

-- ============================================
-- DRAFTS
-- ============================================
create table public.drafts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text default '',
  description text default '',
  image_url text,
  category text default 'Food',
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- POST VIEWS (analytics)
-- ============================================
create table public.post_views (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  viewed_at timestamptz default now()
);

create index idx_post_views_post_id on public.post_views(post_id, viewed_at desc);

-- ============================================
-- PROFILE VIEWS (analytics)
-- ============================================
create table public.profile_views (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  viewer_id uuid references public.profiles(id) on delete set null,
  viewed_at timestamptz default now()
);

create index idx_profile_views_profile_id on public.profile_views(profile_id, viewed_at desc);

-- ============================================
-- HASHTAGS (for trending)
-- ============================================
create table public.hashtags (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  post_count integer default 0,
  last_used_at timestamptz default now(),
  created_at timestamptz default now()
);

create index idx_hashtags_name on public.hashtags(name);
create index idx_hashtags_trending on public.hashtags(post_count desc, last_used_at desc);

-- ============================================
-- BLOCKS
-- ============================================
create table public.blocks (
  id uuid primary key default uuid_generate_v4(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_id),
  check (blocker_id != blocked_id)
);

-- ============================================
-- MUTES
-- ============================================
create table public.mutes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  muted_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, muted_id),
  check (user_id != muted_id)
);

-- ============================================
-- REPORTS
-- ============================================
create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  entity_type text not null check (entity_type in ('post', 'comment', 'profile')),
  entity_id uuid not null,
  reason text not null,
  status text default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz default now()
);

-- ============================================
-- POST SCHEDULES
-- ============================================
create table public.post_schedules (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text default '',
  image_url text,
  category text default 'Food',
  scheduled_for timestamptz not null,
  is_published boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- PUSH TOKENS (Firebase FCM)
-- ============================================
create table public.push_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  platform text default 'web' check (platform in ('web', 'ios', 'android')),
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(user_id, token)
);

-- ============================================
-- NOTIFICATION PREFERENCES
-- ============================================
create table public.notification_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  likes boolean default true,
  comments boolean default true,
  replies boolean default true,
  follows boolean default true,
  follow_requests boolean default true,
  mentions boolean default true,
  reposts boolean default true,
  messages boolean default true,
  system boolean default true,
  push_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- ============================================
-- AI USAGE TRACKING
-- ============================================
create table public.ai_usage (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  feature text not null check (feature in ('caption', 'hashtag', 'rewrite', 'alt_text')),
  created_at timestamptz default now()
);

create index idx_ai_usage_user_id on public.ai_usage(user_id, created_at desc);

-- ============================================
-- TRIGGERS: Update counts automatically
-- ============================================

-- Post like count
create or replace function public.update_post_like_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts set like_count = greatest(0, like_count - 1) where id = old.post_id;
    return old;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_post_like_change
  after insert or delete on public.post_likes
  for each row execute function public.update_post_like_count();

-- Post comment count
create or replace function public.update_post_comment_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
    if new.parent_id is not null then
      update public.comments set reply_count = reply_count + 1 where id = new.parent_id;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
    if old.parent_id is not null then
      update public.comments set reply_count = greatest(0, reply_count - 1) where id = old.parent_id;
    end if;
    return old;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_comment_change
  after insert or delete on public.comments
  for each row execute function public.update_post_comment_count();

-- Post collect count
create or replace function public.update_post_collect_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set collect_count = collect_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts set collect_count = greatest(0, collect_count - 1) where id = old.post_id;
    return old;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_post_collect_change
  after insert or delete on public.post_collects
  for each row execute function public.update_post_collect_count();

-- Post repost count
create or replace function public.update_post_repost_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set repost_count = repost_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts set repost_count = greatest(0, repost_count - 1) where id = old.post_id;
    return old;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_repost_change
  after insert or delete on public.reposts
  for each row execute function public.update_post_repost_count();

-- Comment like count
create or replace function public.update_comment_like_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.comments set like_count = like_count + 1 where id = new.comment_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.comments set like_count = greatest(0, like_count - 1) where id = old.comment_id;
    return old;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_comment_like_change
  after insert or delete on public.comment_likes
  for each row execute function public.update_comment_like_count();

-- Profile follower/following count
create or replace function public.update_profile_follower_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' and new.status = 'active' then
    update public.profiles set follower_count = follower_count + 1 where id = new.following_id;
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    return new;
  elsif tg_op = 'DELETE' and old.status = 'active' then
    update public.profiles set follower_count = greatest(0, follower_count - 1) where id = old.following_id;
    update public.profiles set following_count = greatest(0, following_count - 1) where id = old.follower_id;
    return old;
  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'active' then
    update public.profiles set follower_count = follower_count + 1 where id = new.following_id;
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    return new;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_follow_change
  after insert or delete or update on public.follows
  for each row execute function public.update_profile_follower_count();

-- Profile post count
create or replace function public.update_profile_post_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' and not new.is_archived then
    update public.profiles set post_count = post_count + 1 where id = new.user_id;
    return new;
  elsif tg_op = 'DELETE' and not old.is_archived then
    update public.profiles set post_count = greatest(0, post_count - 1) where id = old.user_id;
    return old;
  elsif tg_op = 'UPDATE' then
    if old.is_archived and not new.is_archived then
      update public.profiles set post_count = post_count + 1 where id = new.user_id;
    elsif not old.is_archived and new.is_archived then
      update public.profiles set post_count = greatest(0, post_count - 1) where id = new.user_id;
    end if;
    return new;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_post_count_change
  after insert or delete or update on public.posts
  for each row execute function public.update_profile_post_count();

-- Hashtag count
create or replace function public.update_hashtag_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into public.hashtags (name, post_count, last_used_at)
    values (new.tag, 1, now())
    on conflict (name) do update set
      post_count = public.hashtags.post_count + 1,
      last_used_at = now();
    return new;
  elsif tg_op = 'DELETE' then
    update public.hashtags set post_count = greatest(0, post_count - 1) where name = old.tag;
    delete from public.hashtags where post_count = 0;
    return old;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_hashtag_count_change
  after insert or delete on public.post_tags
  for each row execute function public.update_hashtag_count();

-- ============================================
-- STORAGE BUCKETS
-- ============================================
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('covers', 'covers', true),
  ('posts', 'posts', true),
  ('stories', 'stories', true),
  ('chat-media', 'chat-media', false),
  ('drafts', 'drafts', false);

-- Storage policies
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Cover images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'covers');

create policy "Anyone can upload a cover"
  on storage.objects for insert
  with check (bucket_id = 'covers' and auth.role() = 'authenticated');

create policy "Post images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'posts');

create policy "Authenticated users can upload post images"
  on storage.objects for insert
  with check (bucket_id = 'posts' and auth.role() = 'authenticated');

create policy "Story images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'stories');

create policy "Authenticated users can upload stories"
  on storage.objects for insert
  with check (bucket_id = 'stories' and auth.role() = 'authenticated');

create policy "Chat media is accessible to conversation participants"
  on storage.objects for select
  using (bucket_id = 'chat-media' and auth.role() = 'authenticated');

create policy "Authenticated users can upload chat media"
  on storage.objects for insert
  with check (bucket_id = 'chat-media' and auth.role() = 'authenticated');

create policy "Draft media is accessible to owner"
  on storage.objects for select
  using (bucket_id = 'drafts' and auth.role() = 'authenticated');

create policy "Authenticated users can upload draft media"
  on storage.objects for insert
  with check (bucket_id = 'drafts' and auth.role() = 'authenticated');

-- ============================================
-- ENABLE REALTIME
-- ============================================
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.post_likes;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.follows;
alter publication supabase_realtime add table public.stories;

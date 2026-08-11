-- RedNote App - Row Level Security Policies
-- Supabase PostgreSQL

-- ============================================
-- Enable RLS on all tables
-- ============================================
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_tags enable row level security;
alter table public.comments enable row level security;
alter table public.comment_likes enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_collects enable row level security;
alter table public.reposts enable row level security;
alter table public.follows enable row level security;
alter table public.collections enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.stories enable row level security;
alter table public.story_views enable row level security;
alter table public.drafts enable row level security;
alter table public.post_views enable row level security;
alter table public.profile_views enable row level security;
alter table public.hashtags enable row level security;
alter table public.blocks enable row level security;
alter table public.mutes enable row level security;
alter table public.reports enable row level security;
alter table public.post_schedules enable row level security;
alter table public.push_tokens enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.ai_usage enable row level security;

-- ============================================
-- PROFILES policies
-- ============================================
-- Anyone can view public profiles
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users can insert their own profile (handled by trigger, but allow direct insert too)
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- ============================================
-- POSTS policies
-- ============================================
-- Public posts are viewable by everyone
-- Private posts are viewable only by the author
-- Followers-only posts are viewable by the author and followers
create policy "Posts are viewable based on visibility"
  on public.posts for select
  using (
    visibility = 'public'
    or user_id = auth.uid()
    or (
      visibility = 'followers'
      and exists (
        select 1 from public.follows
        where follower_id = auth.uid()
        and following_id = posts.user_id
        and status = 'active'
      )
    )
  );

-- Authenticated users can create posts
create policy "Authenticated users can create posts"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own posts
create policy "Users can update own posts"
  on public.posts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own posts
create policy "Users can delete own posts"
  on public.posts for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- POST TAGS policies
-- ============================================
-- Post tags follow post visibility
create policy "Post tags are viewable with post"
  on public.post_tags for select
  using (
    exists (
      select 1 from public.posts
      where posts.id = post_tags.post_id
      and (
        posts.visibility = 'public'
        or posts.user_id = auth.uid()
        or (
          posts.visibility = 'followers'
          and exists (
            select 1 from public.follows
            where follower_id = auth.uid()
            and following_id = posts.user_id
            and status = 'active'
          )
        )
      )
    )
  );

-- Users can manage tags on their own posts
create policy "Users can manage tags on own posts"
  on public.post_tags for all
  to authenticated
  using (
    exists (
      select 1 from public.posts
      where posts.id = post_tags.post_id
      and posts.user_id = auth.uid()
    )
  );

-- ============================================
-- COMMENTS policies
-- ============================================
-- Comments follow post visibility
create policy "Comments are viewable with post"
  on public.comments for select
  using (
    exists (
      select 1 from public.posts
      where posts.id = comments.post_id
      and (
        posts.visibility = 'public'
        or posts.user_id = auth.uid()
        or (
          posts.visibility = 'followers'
          and exists (
            select 1 from public.follows
            where follower_id = auth.uid()
            and following_id = posts.user_id
            and status = 'active'
          )
        )
      )
    )
  );

-- Authenticated users can create comments
create policy "Authenticated users can create comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own comments
create policy "Users can update own comments"
  on public.comments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own comments
create policy "Users can delete own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- COMMENT LIKES policies
-- ============================================
-- Comment likes are viewable with comment
create policy "Comment likes are viewable"
  on public.comment_likes for select
  using (true);

-- Authenticated users can like/unlike comments
create policy "Authenticated users can like comments"
  on public.comment_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can remove their own comment likes
create policy "Users can remove own comment likes"
  on public.comment_likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- POST LIKES policies
-- ============================================
-- Post likes are viewable with post
create policy "Post likes are viewable"
  on public.post_likes for select
  using (true);

-- Authenticated users can like/unlike posts
create policy "Authenticated users can like posts"
  on public.post_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can remove their own post likes
create policy "Users can remove own post likes"
  on public.post_likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- POST COLLECTS policies
-- ============================================
-- Users can view their own collects
create policy "Users can view own collects"
  on public.post_collects for select
  to authenticated
  using (auth.uid() = user_id);

-- Authenticated users can collect/uncollect posts
create policy "Authenticated users can collect posts"
  on public.post_collects for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can remove their own collects
create policy "Users can remove own collects"
  on public.post_collects for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- REPOSTS policies
-- ============================================
-- Reposts are viewable with post
create policy "Reposts are viewable"
  on public.reposts for select
  using (true);

-- Authenticated users can repost/unrepost
create policy "Authenticated users can repost"
  on public.reposts for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can remove their own reposts
create policy "Users can remove own reposts"
  on public.reposts for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- FOLLOWS policies
-- ============================================
-- Follows are viewable by everyone
create policy "Follows are viewable"
  on public.follows for select
  using (true);

-- Authenticated users can follow/unfollow
create policy "Authenticated users can follow"
  on public.follows for insert
  to authenticated
  with check (auth.uid() = follower_id);

-- Users can update follow status (for follow requests)
create policy "Users can update follow status"
  on public.follows for update
  to authenticated
  using (auth.uid() = following_id)
  with check (auth.uid() = following_id);

-- Users can unfollow (delete their own follows)
create policy "Users can unfollow"
  on public.follows for delete
  to authenticated
  using (auth.uid() = follower_id or auth.uid() = following_id);

-- ============================================
-- COLLECTIONS policies
-- ============================================
-- Users can view their own collections
-- Public collections are viewable by everyone
create policy "Collections are viewable"
  on public.collections for select
  using (
    user_id = auth.uid()
    or is_private = false
  );

-- Authenticated users can create collections
create policy "Authenticated users can create collections"
  on public.collections for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own collections
create policy "Users can update own collections"
  on public.collections for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own collections
create policy "Users can delete own collections"
  on public.collections for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- CONVERSATIONS policies
-- ============================================
-- Users can view conversations they participate in
create policy "Users can view own conversations"
  on public.conversations for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_participants.conversation_id = conversations.id
      and conversation_participants.user_id = auth.uid()
    )
  );

-- Authenticated users can create conversations
create policy "Authenticated users can create conversations"
  on public.conversations for insert
  to authenticated
  with check (true);

-- ============================================
-- CONVERSATION PARTICIPANTS policies
-- ============================================
-- Users can view participants of their conversations
create policy "Users can view conversation participants"
  on public.conversation_participants for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id
      and cp.user_id = auth.uid()
    )
  );

-- Users can add participants to conversations they own
create policy "Users can add conversation participants"
  on public.conversation_participants for insert
  to authenticated
  with check (true);

-- ============================================
-- MESSAGES policies
-- ============================================
-- Users can view messages in their conversations
create policy "Users can view own messages"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_participants.conversation_id = messages.conversation_id
      and conversation_participants.user_id = auth.uid()
    )
  );

-- Users can send messages to their conversations
create policy "Users can send messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.conversation_participants
      where conversation_participants.conversation_id = messages.conversation_id
      and conversation_participants.user_id = auth.uid()
    )
  );

-- Users can update their own messages (for delete)
create policy "Users can update own messages"
  on public.messages for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- NOTIFICATIONS policies
-- ============================================
-- Users can view their own notifications
create policy "Users can view own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

-- System can create notifications (via function)
create policy "System can create notifications"
  on public.notifications for insert
  to authenticated
  with check (true);

-- Users can update their own notifications (mark as read)
create policy "Users can update own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own notifications
create policy "Users can delete own notifications"
  on public.notifications for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- STORIES policies
-- ============================================
-- Stories are viewable by everyone (within 24 hours)
create policy "Active stories are viewable"
  on public.stories for select
  using (expires_at > now());

-- Authenticated users can create stories
create policy "Authenticated users can create stories"
  on public.stories for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can delete their own stories
create policy "Users can delete own stories"
  on public.stories for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- STORY VIEWS policies
-- ============================================
-- Story views are viewable by story owner
create policy "Story owners can view views"
  on public.story_views for select
  to authenticated
  using (
    exists (
      select 1 from public.stories
      where stories.id = story_views.story_id
      and stories.user_id = auth.uid()
    )
  );

-- Authenticated users can view stories
create policy "Authenticated users can view stories"
  on public.story_views for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ============================================
-- DRAFTS policies
-- ============================================
-- Users can view their own drafts
create policy "Users can view own drafts"
  on public.drafts for select
  to authenticated
  using (auth.uid() = user_id);

-- Authenticated users can create drafts
create policy "Authenticated users can create drafts"
  on public.drafts for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own drafts
create policy "Users can update own drafts"
  on public.drafts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own drafts
create policy "Users can delete own drafts"
  on public.drafts for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- POST VIEWS policies
-- ============================================
-- Post views are viewable by post owner
create policy "Post owners can view views"
  on public.post_views for select
  to authenticated
  using (
    exists (
      select 1 from public.posts
      where posts.id = post_views.post_id
      and posts.user_id = auth.uid()
    )
  );

-- Anyone can record a view
create policy "Anyone can record a view"
  on public.post_views for insert
  to authenticated
  with check (true);

-- ============================================
-- PROFILE VIEWS policies
-- ============================================
-- Profile owners can view their profile views
create policy "Profile owners can view views"
  on public.profile_views for select
  to authenticated
  using (auth.uid() = profile_id);

-- Anyone can record a profile view
create policy "Anyone can record a profile view"
  on public.profile_views for insert
  to authenticated
  with check (true);

-- ============================================
-- HASHTAGS policies
-- ============================================
-- Hashtags are viewable by everyone
create policy "Hashtags are viewable"
  on public.hashtags for select
  using (true);

-- ============================================
-- BLOCKS policies
-- ============================================
-- Users can view their own blocks
create policy "Users can view own blocks"
  on public.blocks for select
  to authenticated
  using (auth.uid() = blocker_id);

-- Authenticated users can block
create policy "Authenticated users can block"
  on public.blocks for insert
  to authenticated
  with check (auth.uid() = blocker_id);

-- Users can unblock
create policy "Users can unblock"
  on public.blocks for delete
  to authenticated
  using (auth.uid() = blocker_id);

-- ============================================
-- MUTES policies
-- ============================================
-- Users can view their own mutes
create policy "Users can view own mutes"
  on public.mutes for select
  to authenticated
  using (auth.uid() = user_id);

-- Authenticated users can mute
create policy "Authenticated users can mute"
  on public.mutes for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can unmute
create policy "Users can unmute"
  on public.mutes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- REPORTS policies
-- ============================================
-- Users can view their own reports
create policy "Users can view own reports"
  on public.reports for select
  to authenticated
  using (auth.uid() = reporter_id);

-- Authenticated users can create reports
create policy "Authenticated users can create reports"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

-- ============================================
-- POST SCHEDULES policies
-- ============================================
-- Users can view their own schedules
create policy "Users can view own schedules"
  on public.post_schedules for select
  to authenticated
  using (auth.uid() = user_id);

-- Authenticated users can create schedules
create policy "Authenticated users can create schedules"
  on public.post_schedules for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own schedules
create policy "Users can update own schedules"
  on public.post_schedules for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own schedules
create policy "Users can delete own schedules"
  on public.post_schedules for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- PUSH TOKENS policies
-- ============================================
-- Users can view their own push tokens
create policy "Users can view own push tokens"
  on public.push_tokens for select
  to authenticated
  using (auth.uid() = user_id);

-- Authenticated users can manage their push tokens
create policy "Users can manage own push tokens"
  on public.push_tokens for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- NOTIFICATION PREFERENCES policies
-- ============================================
-- Users can view their own preferences
create policy "Users can view own notification preferences"
  on public.notification_preferences for select
  to authenticated
  using (auth.uid() = user_id);

-- Authenticated users can manage their preferences
create policy "Users can manage own notification preferences"
  on public.notification_preferences for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- AI USAGE policies
-- ============================================
-- Users can view their own AI usage
create policy "Users can view own AI usage"
  on public.ai_usage for select
  to authenticated
  using (auth.uid() = user_id);

-- Authenticated users can record AI usage
create policy "Authenticated users can record AI usage"
  on public.ai_usage for insert
  to authenticated
  with check (auth.uid() = user_id);

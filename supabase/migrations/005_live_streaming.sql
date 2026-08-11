-- Live streaming tables used by frontend/lib/live/liveService.js

create table if not exists public.live_streams (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Live Stream',
  description text not null default '',
  category text not null default '',
  thumbnail_url text,
  status text not null default 'preparing'
    check (status in ('preparing', 'live', 'ended', 'cancelled')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.live_messages (
  id uuid primary key default uuid_generate_v4(),
  stream_id uuid not null references public.live_streams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.live_reactions (
  id uuid primary key default uuid_generate_v4(),
  stream_id uuid not null references public.live_streams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null check (char_length(reaction_type) between 1 and 40),
  created_at timestamptz not null default now()
);

create table if not exists public.live_viewers (
  id uuid primary key default uuid_generate_v4(),
  stream_id uuid not null references public.live_streams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  unique (stream_id, user_id)
);

create index if not exists idx_live_streams_status_started
  on public.live_streams(status, started_at desc);
create index if not exists idx_live_streams_user_status
  on public.live_streams(user_id, status);
create unique index if not exists idx_one_active_live_stream_per_user
  on public.live_streams(user_id)
  where status in ('preparing', 'live');
create index if not exists idx_live_messages_stream_created
  on public.live_messages(stream_id, created_at);
create index if not exists idx_live_reactions_stream_created
  on public.live_reactions(stream_id, created_at);
create index if not exists idx_live_viewers_active
  on public.live_viewers(stream_id)
  where left_at is null;

alter table public.live_streams enable row level security;
alter table public.live_messages enable row level security;
alter table public.live_reactions enable row level security;
alter table public.live_viewers enable row level security;

drop policy if exists "Live streams are viewable" on public.live_streams;
create policy "Live streams are viewable"
  on public.live_streams for select using (true);

drop policy if exists "Users can create own live streams" on public.live_streams;
create policy "Users can create own live streams"
  on public.live_streams for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own live streams" on public.live_streams;
create policy "Users can update own live streams"
  on public.live_streams for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own live streams" on public.live_streams;
create policy "Users can delete own live streams"
  on public.live_streams for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Live messages are viewable" on public.live_messages;
create policy "Live messages are viewable"
  on public.live_messages for select using (true);

drop policy if exists "Users can send live messages" on public.live_messages;
create policy "Users can send live messages"
  on public.live_messages for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own live messages" on public.live_messages;
create policy "Users can delete own live messages"
  on public.live_messages for delete to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.live_streams
      where live_streams.id = live_messages.stream_id
        and live_streams.user_id = auth.uid()
    )
  );

drop policy if exists "Live reactions are viewable" on public.live_reactions;
create policy "Live reactions are viewable"
  on public.live_reactions for select using (true);

drop policy if exists "Users can send live reactions" on public.live_reactions;
create policy "Users can send live reactions"
  on public.live_reactions for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Live viewers are viewable" on public.live_viewers;
create policy "Live viewers are viewable"
  on public.live_viewers for select using (true);

drop policy if exists "Users can join live streams" on public.live_viewers;
create policy "Users can join live streams"
  on public.live_viewers for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own live presence" on public.live_viewers;
create policy "Users can update own live presence"
  on public.live_viewers for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- The live service creates follower notifications with this type.
alter table public.notifications
  drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check check (
    type in ('like', 'comment', 'reply', 'follow', 'follow_request', 'mention',
             'repost', 'message', 'system', 'live_start')
  );

-- Postgres Changes subscriptions require tables in the realtime publication.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'live_streams', 'live_messages', 'live_reactions', 'live_viewers'
  ] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;

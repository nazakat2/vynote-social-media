-- ============================================
-- LIVE STREAMING SYSTEM
-- Run after 001_initial_schema.sql
-- ============================================

-- 1. LIVE STREAMS
CREATE TABLE IF NOT EXISTS public.live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  thumbnail_url text,
  status text NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing', 'live', 'ended', 'cancelled')),
  category text DEFAULT '',
  viewer_count integer DEFAULT 0,
  peak_viewer_count integer DEFAULT 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_live_streams_status ON public.live_streams(status);
CREATE INDEX idx_live_streams_user_id ON public.live_streams(user_id);
CREATE INDEX idx_live_streams_started_at ON public.live_streams(started_at DESC);

-- 2. LIVE VIEWERS
CREATE TABLE IF NOT EXISTS public.live_viewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  UNIQUE(stream_id, user_id)
);

CREATE INDEX idx_live_viewers_stream_id ON public.live_viewers(stream_id);
CREATE INDEX idx_live_viewers_user_id ON public.live_viewers(user_id);

-- 3. LIVE MESSAGES
CREATE TABLE IF NOT EXISTS public.live_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (char_length(message) > 0 AND char_length(message) <= 500),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_live_messages_stream_id ON public.live_messages(stream_id);
CREATE INDEX idx_live_messages_created_at ON public.live_messages(created_at);

-- 4. LIVE REACTIONS
CREATE TABLE IF NOT EXISTS public.live_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'heart', 'fire', 'clap')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_live_reactions_stream_id ON public.live_reactions(stream_id);

-- 5. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_reactions;

-- 6. ROW LEVEL SECURITY
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_reactions ENABLE ROW LEVEL SECURITY;

-- LIVE STREAMS POLICIES
CREATE POLICY "Anyone can view live streams" ON public.live_streams FOR SELECT USING (true);
CREATE POLICY "Users can create own streams" ON public.live_streams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Streamers can update own streams" ON public.live_streams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Streamers can delete own streams" ON public.live_streams FOR DELETE USING (auth.uid() = user_id);

-- LIVE VIEWERS POLICIES
CREATE POLICY "Anyone can view viewer records" ON public.live_viewers FOR SELECT USING (true);
CREATE POLICY "Users can join streams" ON public.live_viewers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own viewer record" ON public.live_viewers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave streams" ON public.live_viewers FOR DELETE USING (auth.uid() = user_id);

-- LIVE MESSAGES POLICIES
CREATE POLICY "Anyone can read live messages" ON public.live_messages FOR SELECT USING (true);
CREATE POLICY "Users can send messages as themselves" ON public.live_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Streamers can delete messages in their stream" ON public.live_messages FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.live_streams WHERE id = stream_id AND user_id = auth.uid())
);

-- LIVE REACTIONS POLICIES
CREATE POLICY "Anyone can view reactions" ON public.live_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON public.live_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. VIEWER COUNT TRIGGER
CREATE OR REPLACE FUNCTION public.update_live_stream_viewer_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.live_streams
    SET viewer_count = viewer_count + 1,
        peak_viewer_count = GREATEST(peak_viewer_count, viewer_count + 1)
    WHERE id = NEW.stream_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.live_streams
    SET viewer_count = GREATEST(viewer_count - 1, 0)
    WHERE id = OLD.stream_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_viewer_change ON public.live_viewers;
CREATE TRIGGER on_viewer_change
  AFTER INSERT OR DELETE ON public.live_viewers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_live_stream_viewer_count();

-- 8. NOTIFICATION TYPE for live streams
-- (The notifications table already supports 'type text', so we just document it)
-- Use type: 'live_start' for when a followed user starts streaming

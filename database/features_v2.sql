-- ============================================
-- FEATURES 2.0 SQL (Run after previous ones)
-- ============================================

-- 1. Story Highlights
CREATE TABLE IF NOT EXISTS story_highlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  story_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Post Analytics
CREATE TABLE IF NOT EXISTS post_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE UNIQUE,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Auto-Reply Rules
CREATE TABLE IF NOT EXISTS auto_reply_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  reply TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Scheduled Messages
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Custom Emojis
CREATE TABLE IF NOT EXISTS custom_emojis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Collaborative Posts
CREATE TABLE IF NOT EXISTS collab_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  invited_users JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE story_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_reply_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_emojis ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage highlights" ON story_highlights FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view analytics" ON post_analytics FOR SELECT USING (TRUE);
CREATE POLICY "Users can manage auto-reply" ON auto_reply_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage scheduled" ON scheduled_messages FOR ALL USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can manage emojis" ON custom_emojis FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage collab" ON collab_posts FOR ALL USING (auth.uid() = creator_id);

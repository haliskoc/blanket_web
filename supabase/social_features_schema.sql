-- Podomodro Social Features Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  is_public BOOLEAN DEFAULT true,
  show_stats BOOLEAN DEFAULT true,
  show_achievements BOOLEAN DEFAULT true,
  show_history BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Username validation (lowercase, alphanumeric, underscore, hyphen, 3-30 chars)
ALTER TABLE user_profiles ADD CONSTRAINT valid_username 
  CHECK (username ~ '^[a-z0-9_-]{3,30}$');

-- ============================================
-- USER STATS (for leaderboard)
-- ============================================
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_pomodoros INTEGER DEFAULT 0,
  total_focus_time INTEGER DEFAULT 0, -- in minutes
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  weekly_pomodoros INTEGER DEFAULT 0,
  monthly_pomodoros INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- DAILY STATS (for activity history)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  pomodoro_count INTEGER DEFAULT 0,
  focus_time INTEGER DEFAULT 0, -- in minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================
-- USER ACHIEVEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- FRIENDSHIPS
-- ============================================
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Index for faster friendship queries
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- ============================================
-- ROOMS
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_private BOOLEAN DEFAULT false,
  password_hash TEXT,
  max_participants INTEGER DEFAULT 10,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  timer_started_at TIMESTAMPTZ,
  timer_duration INTEGER, -- in minutes
  timer_type TEXT CHECK (timer_type IN ('focus', 'break')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_private ON rooms(is_private) WHERE is_private = false;

-- ============================================
-- ROOM PARTICIPANTS
-- ============================================
CREATE TABLE IF NOT EXISTS room_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'participant' CHECK (role IN ('host', 'participant')),
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'offline', 'away')),
  focus_status TEXT DEFAULT 'idle' CHECK (focus_status IN ('idle', 'focusing', 'break', 'offline')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_room ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON room_participants(status);

-- ============================================
-- ROOM MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS room_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_room ON room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON room_messages(created_at);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- User Profiles RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (is_public = true OR auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User Stats RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stats are viewable by everyone"
  ON user_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Daily Stats RLS
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily stats viewable by friends or public"
  ON daily_stats FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = user_id AND is_public = true
    ) OR
    EXISTS (
      SELECT 1 FROM friendships 
      WHERE status = 'accepted' 
      AND ((user_id = auth.uid() AND friend_id = daily_stats.user_id) OR
           (user_id = daily_stats.user_id AND friend_id = auth.uid()))
    )
  );

CREATE POLICY "Users can manage own daily stats"
  ON daily_stats FOR ALL
  USING (auth.uid() = user_id);

-- User Achievements RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements viewable by everyone"
  ON user_achievements FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own achievements"
  ON user_achievements FOR ALL
  USING (auth.uid() = user_id);

-- Friendships RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friend requests"
  ON friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Rooms RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public rooms are viewable by everyone"
  ON rooms FOR SELECT
  USING (is_private = false OR created_by = auth.uid());

CREATE POLICY "Hosts can update their rooms"
  ON rooms FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Authenticated users can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Hosts can delete their rooms"
  ON rooms FOR DELETE
  USING (created_by = auth.uid());

-- Room Participants RLS
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants viewable by room members"
  ON room_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants rp 
      WHERE rp.room_id = room_participants.room_id AND rp.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM rooms WHERE id = room_participants.room_id AND is_private = false
    )
  );

CREATE POLICY "Users can join rooms"
  ON room_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participant status"
  ON room_participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON room_participants FOR DELETE
  USING (auth.uid() = user_id);

-- Room Messages RLS
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages viewable by room participants"
  ON room_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants rp 
      WHERE rp.room_id = room_messages.room_id AND rp.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON room_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM room_participants rp 
      WHERE rp.room_id = room_messages.room_id AND rp.user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get user rank (for leaderboard)
CREATE OR REPLACE FUNCTION get_user_rank(
  p_user_id UUID,
  p_period TEXT DEFAULT 'weekly',
  p_category TEXT DEFAULT 'pomodoros'
)
RETURNS TABLE(rank BIGINT, total_users BIGINT) AS $$
DECLARE
  v_column TEXT;
BEGIN
  v_column := CASE 
    WHEN p_category = 'pomodoros' AND p_period = 'weekly' THEN 'weekly_pomodoros'
    WHEN p_category = 'pomodoros' AND p_period = 'monthly' THEN 'monthly_pomodoros'
    WHEN p_category = 'pomodoros' THEN 'total_pomodoros'
    WHEN p_category = 'focusTime' THEN 'total_focus_time'
    WHEN p_category = 'streak' THEN 'current_streak'
    ELSE 'total_pomodoros'
  END;

  RETURN QUERY EXECUTE format('
    SELECT 
      (SELECT COUNT(*) + 1 FROM user_stats WHERE %I > (SELECT %I FROM user_stats WHERE user_id = $1)),
      (SELECT COUNT(*) FROM user_stats)
  ', v_column, v_column)
  USING p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'display_name');
  
  INSERT INTO public.user_stats (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE room_messages;

-- Enable full replication for these tables
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    friendships, 
    rooms, 
    room_participants, 
    room_messages,
    user_profiles,
    user_stats;
COMMIT;

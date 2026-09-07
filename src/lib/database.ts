/**
 * Database Types and API Layer
 * Handles all Supabase operations with localStorage fallback
 */
import { supabase, isSupabaseConfigured } from './supabase';

// Database types matching Supabase schema
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface JournalEntryDB {
  id: string;
  user_id: string;
  text: string;
  mood: string;
  sentiment_score: number;
  tags: string[];
  created_at: string;
}

export interface BreathingSessionDB {
  id: string;
  user_id: string;
  pattern_name: string;
  pattern_description: string;
  duration: number;
  completed_cycles: number;
  icon: string;
  color: string;
  created_at: string;
}

export interface ChatMessageDB {
  id: string;
  user_id: string;
  role: 'user' | 'ai';
  content: string;
  created_at: string;
}

// ============ USER PROFILE ============

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase!
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('[DB] getUserProfile error:', err);
    return null;
  }
}

export async function upsertUserProfile(profile: UserProfile): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase!
      .from('user_profiles')
      .upsert(profile, { onConflict: 'id' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('[DB] upsertUserProfile error:', err);
    return false;
  }
}

// ============ JOURNAL ENTRIES ============

export async function getJournalEntries(userId: string, limit = 50): Promise<JournalEntryDB[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase!
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[DB] getJournalEntries error:', err);
    return [];
  }
}

export async function insertJournalEntry(entry: Omit<JournalEntryDB, 'id' | 'created_at'>): Promise<JournalEntryDB | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase!
      .from('journal_entries')
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('[DB] insertJournalEntry error:', err);
    return null;
  }
}

export async function deleteJournalEntry(id: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase!
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('[DB] deleteJournalEntry error:', err);
    return false;
  }
}

// ============ BREATHING SESSIONS ============

export async function getBreathingSessions(userId: string, limit = 50): Promise<BreathingSessionDB[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase!
      .from('breathing_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[DB] getBreathingSessions error:', err);
    return [];
  }
}

export async function insertBreathingSession(session: Omit<BreathingSessionDB, 'id' | 'created_at'>): Promise<BreathingSessionDB | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase!
      .from('breathing_sessions')
      .insert(session)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('[DB] insertBreathingSession error:', err);
    return null;
  }
}

// ============ CHAT MESSAGES ============

export async function getChatMessages(userId: string, limit = 100): Promise<ChatMessageDB[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase!
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[DB] getChatMessages error:', err);
    return [];
  }
}

export async function insertChatMessage(message: Omit<ChatMessageDB, 'id' | 'created_at'>): Promise<ChatMessageDB | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase!
      .from('chat_messages')
      .insert(message)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('[DB] insertChatMessage error:', err);
    return null;
  }
}

// ============ SCHEMA CREATION (Run once) ============

export const SCHEMA_SQL = `
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  mood TEXT NOT NULL,
  sentiment_score REAL DEFAULT 0.5,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Breathing sessions
CREATE TABLE IF NOT EXISTS breathing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_name TEXT NOT NULL,
  pattern_description TEXT DEFAULT '',
  duration INTEGER DEFAULT 0,
  completed_cycles INTEGER DEFAULT 0,
  icon TEXT DEFAULT '🫁',
  color TEXT DEFAULT '#14b8a6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE breathing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own journal" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal" ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal" ON journal_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON breathing_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON breathing_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON breathing_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id, created_at ASC);
`;

/**
 * App State Store — Supabase persistence with localStorage fallback
 * Saves all user data to Supabase when configured, falls back to localStorage
 */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { JournalEntry, BreathingSession, ChatMessage, Mood } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { useAuth } from './auth';

interface AppState {
  journalEntries: JournalEntry[];
  breathingSessions: BreathingSession[];
  chatMessages: ChatMessage[];
  currentMood: Mood;
  userName: string;
}

interface AppContextType extends AppState {
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
  addBreathingSession: (session: Omit<BreathingSession, 'id' | 'timestamp'>) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setCurrentMood: (mood: Mood) => void;
  setUserName: (name: string) => void;
  clearChat: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Sample data for new users
const SAMPLE_DATA: AppState = {
  journalEntries: [
    {
      id: '1', timestamp: Date.now() - 2 * 60 * 60 * 1000,
      text: 'Had a great morning meditation session. Feeling focused and ready for the day.',
      mood: 'calm', sentimentScore: 0.75, tags: ['meditation', 'focused'],
    },
    {
      id: '2', timestamp: Date.now() - 26 * 60 * 60 * 1000,
      text: 'Work deadline is making me very anxious. Need to manage my time better.',
      mood: 'anxious', sentimentScore: 0.3, tags: ['anxious', 'deadline', 'work'],
    },
    {
      id: '3', timestamp: Date.now() - 50 * 60 * 60 * 1000,
      text: 'Went for a run in the park. The weather was wonderful and I feel energized!',
      mood: 'happy', sentimentScore: 0.88, tags: ['happy', 'exercise', 'wonderful'],
    },
  ],
  breathingSessions: [
    {
      id: '1', timestamp: Date.now() - 3 * 60 * 60 * 1000,
      pattern: { name: '4-7-8 Calm', description: 'Deep relaxation', inhale: 4, holdIn: 7, exhale: 8, holdOut: 0, icon: '🌙', color: '#818cf8' },
      duration: 240, completedCycles: 4,
    },
    {
      id: '2', timestamp: Date.now() - 28 * 60 * 60 * 1000,
      pattern: { name: 'Box Breathing', description: 'Focus & clarity', inhale: 4, holdIn: 4, exhale: 4, holdOut: 4, icon: '🧊', color: '#22d3ee' },
      duration: 320, completedCycles: 5,
    },
  ],
  chatMessages: [],
  currentMood: 'calm',
  userName: 'Explorer',
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============ localStorage persistence ============

function loadFromStorage(): Partial<AppState> {
  try {
    const data = localStorage.getItem('pranaai_data');
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

function saveToStorage(state: AppState) {
  try {
    localStorage.setItem('pranaai_data', JSON.stringify({
      journalEntries: state.journalEntries,
      breathingSessions: state.breathingSessions,
      chatMessages: state.chatMessages,
      currentMood: state.currentMood,
      userName: state.userName,
    }));
  } catch { /* storage full */ }
}

// ============ Supabase persistence ============

async function loadFromSupabase(userId: string): Promise<Partial<AppState>> {
  if (!isSupabaseConfigured() || !supabase) return {};

  try {
    const [journalRes, sessionsRes, chatRes] = await Promise.all([
      supabase.from('journal_entries').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('breathing_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('chat_messages').select('*').eq('user_id', userId).order('created_at', { ascending: true }).limit(100),
    ]);

    const journalEntries: JournalEntry[] = (journalRes.data || []).map((e: any) => ({
      id: e.id,
      timestamp: new Date(e.created_at).getTime(),
      text: e.text,
      mood: e.mood,
      sentimentScore: e.sentiment_score,
      tags: e.tags || [],
    }));

    const breathingSessions: BreathingSession[] = (sessionsRes.data || []).map((s: any) => ({
      id: s.id,
      timestamp: new Date(s.created_at).getTime(),
      pattern: { name: s.pattern_name, description: s.pattern_description, inhale: 4, holdIn: 0, exhale: 4, holdOut: 0, icon: s.icon, color: s.color },
      duration: s.duration,
      completedCycles: s.completed_cycles,
    }));

    const chatMessages: ChatMessage[] = (chatRes.data || []).map((m: any) => ({
      id: m.id,
      timestamp: new Date(m.created_at).getTime(),
      role: m.role,
      content: m.content,
    }));

    return { journalEntries, breathingSessions, chatMessages };
  } catch (err) {
    console.warn('[Store] Supabase load error:', err);
    return {};
  }
}

async function saveJournalToSupabase(userId: string, entry: JournalEntry) {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    await supabase.from('journal_entries').insert({
      id: entry.id,
      user_id: userId,
      text: entry.text,
      mood: entry.mood,
      sentiment_score: entry.sentimentScore,
      tags: entry.tags,
      created_at: new Date(entry.timestamp).toISOString(),
    });
  } catch (err) { console.warn('[Store] Journal save error:', err); }
}

async function saveSessionToSupabase(userId: string, session: BreathingSession) {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    await supabase.from('breathing_sessions').insert({
      id: session.id,
      user_id: userId,
      pattern_name: session.pattern.name,
      pattern_description: session.pattern.description,
      duration: session.duration,
      completed_cycles: session.completedCycles,
      icon: session.pattern.icon,
      color: session.pattern.color,
      created_at: new Date(session.timestamp).toISOString(),
    });
  } catch (err) { console.warn('[Store] Session save error:', err); }
}

async function saveChatToSupabase(userId: string, msg: ChatMessage) {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    await supabase.from('chat_messages').insert({
      id: msg.id,
      user_id: userId,
      role: msg.role,
      content: msg.content,
      created_at: new Date(msg.timestamp).toISOString(),
    });
  } catch (err) { console.warn('[Store] Chat save error:', err); }
}

// ============ Provider ============

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(() => {
    const stored = loadFromStorage();
    return {
      ...SAMPLE_DATA,
      ...stored,
    };
  });

  // Load from Supabase when user logs in
  useEffect(() => {
    if (!user?.id) return;

    loadFromSupabase(user.id).then((data) => {
      if (Object.keys(data).length > 0) {
        setState(prev => ({
          ...prev,
          ...data,
          userName: user.name || prev.userName,
        }));
      }
    });
  }, [user?.id]);

  // Save to localStorage on every change
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const addJournalEntry = useCallback((entry: Omit<JournalEntry, 'id' | 'timestamp'>) => {
    const newEntry = { ...entry, id: generateId(), timestamp: Date.now() };
    setState(prev => ({ ...prev, journalEntries: [newEntry, ...prev.journalEntries] }));
    if (user?.id) saveJournalToSupabase(user.id, newEntry);
  }, [user?.id]);

  const addBreathingSession = useCallback((session: Omit<BreathingSession, 'id' | 'timestamp'>) => {
    const newSession = { ...session, id: generateId(), timestamp: Date.now() };
    setState(prev => ({ ...prev, breathingSessions: [newSession, ...prev.breathingSessions] }));
    if (user?.id) saveSessionToSupabase(user.id, newSession);
  }, [user?.id]);

  const addChatMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg = { ...msg, id: generateId(), timestamp: Date.now() };
    setState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, newMsg] }));
    if (user?.id) saveChatToSupabase(user.id, newMsg);
  }, [user?.id]);

  const setCurrentMood = useCallback((mood: Mood) => {
    setState(prev => ({ ...prev, currentMood: mood }));
  }, []);

  const setUserName = useCallback((name: string) => {
    setState(prev => ({ ...prev, userName: name }));
  }, []);

  const clearChat = useCallback(() => {
    setState(prev => ({ ...prev, chatMessages: [] }));
  }, []);

  return (
    <AppContext.Provider value={{
      ...state,
      addJournalEntry,
      addBreathingSession,
      addChatMessage,
      setCurrentMood,
      setUserName,
      clearChat,
    }}>
      {children}
    </AppContext.Provider>
  );
}

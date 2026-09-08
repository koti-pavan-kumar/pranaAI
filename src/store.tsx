/**
 * App State Store — IndexedDB for offline-first persistence
 * No server dependency, works completely offline
 */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { JournalEntry, BreathingSession, ChatMessage, Mood } from './types';
import { useAuth } from './auth';
import {
  addJournalEntry as dbAddJournal,
  getJournalEntries,
  addBreathingSession as dbAddBreathing,
  getBreathingSessions,
  addChatMessage as dbAddChat,
  getChatMessages,
} from './lib/db';

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

// ============ localStorage persistence (fast load) ============

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

  // Load from IndexedDB when user logs in
  useEffect(() => {
    if (!user?.id) return;

    async function loadUserData() {
      try {
        const [journal, breathing, chat] = await Promise.all([
          getJournalEntries(user!.id!),
          getBreathingSessions(user!.id!),
          getChatMessages(user!.id!),
        ]);

        if (journal.length > 0 || breathing.length > 0 || chat.length > 0) {
          setState(prev => ({
            ...prev,
            journalEntries: journal.length > 0 ? journal.map(e => ({
              id: e.id,
              timestamp: e.timestamp,
              text: e.text,
              mood: e.mood as Mood,
              sentimentScore: e.sentimentScore,
              tags: e.tags,
            })) : prev.journalEntries,
            breathingSessions: breathing.length > 0 ? breathing.map(s => ({
              id: s.id,
              timestamp: s.timestamp,
              pattern: s.pattern as BreathingSession['pattern'],
              duration: s.duration,
              completedCycles: s.completedCycles,
            })) : prev.breathingSessions,
            chatMessages: chat.map(m => ({
              id: m.id,
              timestamp: m.timestamp,
              role: m.role as 'user' | 'ai',
              content: m.content,
            })),
            userName: user!.name || prev.userName,
          }));
        }
      } catch (err) {
        console.warn('[Store] IndexedDB load error:', err);
      }
    }

    loadUserData();
  }, [user?.id]);

  // Save to localStorage on every change
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const addJournalEntry = useCallback((entry: Omit<JournalEntry, 'id' | 'timestamp'>) => {
    const newEntry = { ...entry, id: generateId(), timestamp: Date.now() };
    setState(prev => ({ ...prev, journalEntries: [newEntry, ...prev.journalEntries] }));

    // Save to IndexedDB
    if (user?.id) {
      dbAddJournal(user.id, {
        text: entry.text,
        mood: entry.mood,
        sentimentScore: entry.sentimentScore,
        tags: entry.tags,
      }).catch(err => console.warn('[Store] Journal save error:', err));
    }
  }, [user?.id]);

  const addBreathingSession = useCallback((session: Omit<BreathingSession, 'id' | 'timestamp'>) => {
    const newSession = { ...session, id: generateId(), timestamp: Date.now() };
    setState(prev => ({ ...prev, breathingSessions: [newSession, ...prev.breathingSessions] }));

    // Save to IndexedDB
    if (user?.id) {
      dbAddBreathing(user.id, {
        pattern: session.pattern,
        duration: session.duration,
        completedCycles: session.completedCycles,
      }).catch(err => console.warn('[Store] Breathing save error:', err));
    }
  }, [user?.id]);

  const addChatMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg = { ...msg, id: generateId(), timestamp: Date.now() };
    setState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, newMsg] }));

    // Save to IndexedDB
    if (user?.id) {
      dbAddChat(user.id, msg.role, msg.content)
        .catch(err => console.warn('[Store] Chat save error:', err));
    }
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

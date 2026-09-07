export type Mood = 'happy' | 'calm' | 'neutral' | 'anxious' | 'sad' | 'energetic';

export interface JournalEntry {
  id: string;
  timestamp: number;
  text: string;
  mood: Mood;
  sentimentScore: number;
  tags: string[];
}

export interface BreathingSession {
  id: string;
  timestamp: number;
  pattern: BreathingPattern;
  duration: number; // seconds
  completedCycles: number;
  heartRateBefore?: number;
  heartRateAfter?: number;
}

export interface BreathingPattern {
  name: string;
  description: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  icon: string;
  color: string;
}

export interface WellnessScore {
  overall: number;
  mood: number;
  breathing: number;
  journal: number;
  streak: number;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'breathing' | 'journal' | 'activity' | 'insight';
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

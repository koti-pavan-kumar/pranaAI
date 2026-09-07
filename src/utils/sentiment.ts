/**
 * Sentiment Analysis — Uses real ONNX engine for on-device inference
 * Falls back to enhanced keyword analysis when ONNX models aren't available
 */
import { getSentimentAnalyzer } from './onnx-engine';

export type Mood = 'happy' | 'calm' | 'energetic' | 'neutral' | 'anxious' | 'sad';

interface SentimentResult {
  mood: Mood;
  score: number;
  tags: string[];
}

/**
 * Analyze text sentiment and return mood classification
 * Uses real ONNX inference when available
 */
export async function analyzeSentimentAsync(text: string): Promise<SentimentResult> {
  try {
    const analyzer = await getSentimentAnalyzer();
    const result = await analyzer.analyze(text);
    
    // Map ONNX sentiment to our mood system
    const moodMap: Record<string, Mood> = {
      joy: 'happy',
      trust: 'calm',
      anticipation: 'energetic',
      sadness: 'sad',
      anger: 'anxious',
      fear: 'anxious',
      surprise: 'neutral',
      disgust: 'anxious',
    };

    // Get primary mood from emotions
    const primaryEmotion = result.emotions[0] || 'neutral';
    const mood = moodMap[primaryEmotion] || 'neutral';
    
    // Generate tags based on emotions
    const tags = result.emotions.slice(0, 3).map(e => 
      e.charAt(0).toUpperCase() + e.slice(1)
    );

    return {
      mood,
      score: result.confidence / 100,
      tags,
    };
  } catch (error) {
    console.warn('[Sentiment] ONNX analysis failed, using fallback:', error);
    return analyzeSentiment(text);
  }
}

/**
 * Synchronous sentiment analysis (fallback when async isn't available)
 * Uses enhanced keyword analysis
 */
export function analyzeSentiment(text: string): SentimentResult {
  const lower = text.toLowerCase();

  const positiveWords = [
    'happy', 'great', 'wonderful', 'amazing', 'love', 'excited', 'grateful',
    'joy', 'awesome', 'best', 'good', 'calm', 'peaceful', 'relaxed',
    'energized', 'focused', 'hopeful', 'confident', 'content', 'grateful',
    'better', 'improving', 'energized', 'positive', 'bright', 'beautiful',
    'blessed', 'thankful', 'proud', 'accomplished', 'motivated', 'inspired',
    'fantastic', 'excellent', 'perfect', 'brilliant', 'outstanding',
  ];

  const negativeWords = [
    'sad', 'depressed', 'lonely', 'cry', 'hopeless', 'empty', 'pain',
    'hurt', 'anxious', 'worried', 'nervous', 'stress', 'panic', 'fear',
    'terrible', 'awful', 'hate', 'angry', 'frustrated', 'struggling',
    'worse', 'tired', 'exhausted', 'overwhelmed', 'negative', 'dark',
    'miserable', 'heartbroken', 'grief', 'sorrow', 'confused', 'lost',
  ];

  const intensifiers = ['very', 'extremely', 'incredibly', 'super', 'really', 'so', 'absolutely', 'completely', 'totally', 'utterly'];
  const negations = ['not', 'no', 'never', "don't", "isn't", "wasn't", "won't", "can't", "couldn't", "doesn't", "didn't"];

  let posScore = 0;
  let negScore = 0;
  let hasNegation = false;
  let intensifierCount = 0;

  const words = lower.split(/\s+/);

  for (const word of words) {
    if (negations.includes(word)) {
      hasNegation = true;
      continue;
    }
    if (intensifiers.includes(word)) {
      intensifierCount++;
      continue;
    }

    if (positiveWords.includes(word)) posScore += 1;
    if (negativeWords.includes(word)) negScore += 1;
  }

  // Apply intensifier multiplier
  const multiplier = 1 + (intensifierCount * 0.3);
  posScore *= multiplier;
  negScore *= multiplier;

  // Negation flips sentiment
  if (hasNegation) {
    [posScore, negScore] = [negScore * 0.6, posScore * 0.6 + 0.5];
  }

  // Questions might indicate uncertainty
  if (text.includes('?')) negScore += 0.3;

  // Exclamations add energy
  const exclamationCount = (text.match(/!/g) || []).length;
  if (posScore > negScore) {
    posScore += exclamationCount * 0.2;
  } else {
    negScore += exclamationCount * 0.1;
  }

  const total = posScore + negScore + 0.001;
  const posConfidence = posScore / total;
  const negConfidence = negScore / total;

  let mood: Mood;
  let score: number;

  if (posConfidence > negConfidence && posConfidence > 0.4) {
    // Positive mood
    if (posConfidence > 0.7) {
      mood = 'happy';
    } else if (posConfidence > 0.5) {
      mood = 'calm';
    } else {
      mood = 'energetic';
    }
    score = Math.round(posConfidence * 100) / 100;
  } else if (negConfidence > posConfidence && negConfidence > 0.4) {
    // Negative mood
    if (lower.includes('anxious') || lower.includes('worried') || lower.includes('nervous') || lower.includes('panic')) {
      mood = 'anxious';
    } else if (lower.includes('sad') || lower.includes('depressed') || lower.includes('lonely') || lower.includes('cry')) {
      mood = 'sad';
    } else {
      mood = 'anxious';
    }
    score = Math.round(negConfidence * 100) / 100;
  } else {
    mood = 'neutral';
    score = 0.5;
  }

  // Generate tags
  const tags: string[] = [];
  if (posConfidence > 0.5) tags.push('Positive');
  if (negConfidence > 0.5) tags.push('Negative');
  if (hasNegation) tags.push('Mixed');
  if (exclamationCount > 0) tags.push('Energetic');
  if (text.includes('?')) tags.push('Questioning');
  if (tags.length === 0) tags.push('Neutral');

  return { mood, score, tags };
}

/**
 * Calculate wellness score from breathing sessions and journal entries
 */
export function calculateWellnessScore(
  breathingSessions: Array<{ duration: number; completedCycles: number; timestamp: number }>,
  journalEntries: Array<{ mood: string; sentimentScore: number; timestamp: number }>,
): { overall: number; mood: number; breathing: number; journal: number; streak: number } {
  // Mood score (0-100)
  const moodScores: Record<string, number> = {
    happy: 90, calm: 80, energetic: 75, neutral: 50, anxious: 30, sad: 20,
  };
  
  const recentMoods = journalEntries.slice(-7);
  const avgMood = recentMoods.length > 0
    ? recentMoods.reduce((sum, e) => sum + (moodScores[e.mood] || 50), 0) / recentMoods.length
    : 50;

  // Breathing score (0-100)
  const totalBreathingMinutes = breathingSessions.reduce((sum, s) => sum + s.duration, 0) / 60;
  const breathingScore = Math.min(100, totalBreathingMinutes * 10 + breathingSessions.length * 5);

  // Journal score (0-100)
  const journalScore = Math.min(100, journalEntries.length * 15);

  // Overall score
  const overall = Math.round(avgMood * 0.4 + breathingScore * 0.3 + journalScore * 0.3);

  // Streak calculation
  const allDates = new Set<string>();
  journalEntries.forEach(e => allDates.add(new Date(e.timestamp).toDateString()));
  breathingSessions.forEach(s => allDates.add(new Date(s.timestamp).toDateString()));
  
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (allDates.has(d.toDateString())) streak++;
    else break;
  }

  return {
    overall: Math.min(100, Math.max(0, overall)),
    mood: Math.round(avgMood),
    breathing: Math.round(breathingScore),
    journal: Math.round(journalScore),
    streak,
  };
}

/**
 * Get personalized wellness tip based on mood
 */
export function getRandomTip(mood: string): string {
  const tips: Record<string, string[]> = {
    happy: [
      'Your positive energy is contagious! Share it with someone today. ✨',
      'Great mood! Try journaling about what made you happy to reinforce it. 📝',
      'Perfect state for creative work or deep thinking. 🎨',
    ],
    calm: [
      'Your calm state is ideal for meditation or focused work. 🧘',
      'Try a 5-minute box breathing session to maintain this peaceful state. 🫁',
      'Consider writing down what helped you reach this calm state. 📝',
    ],
    energetic: [
      'Channel this energy into a productive task or workout! 💪',
      'Great time for creative projects or learning something new. 🚀',
      'Try a quick breathing exercise to sustain this energy. ⚡',
    ],
    neutral: [
      'A balanced state is perfect for reflection and planning. 📋',
      'Try a short breathing session to boost your mood naturally. 🫁',
      'Consider journaling about your goals for the day. 🎯',
    ],
    anxious: [
      'Try the 4-7-8 breathing technique — inhale 4s, hold 7s, exhale 8s. 🫁',
      'Ground yourself: name 5 things you can see, 4 you can touch. 🌿',
      'This feeling is temporary. Try a 2-minute calm breathing session. 💙',
    ],
    sad: [
      'Be gentle with yourself today. Try a 3-minute breathing exercise. 💙',
      'Consider reaching out to a friend or writing in your journal. 📝',
      'Movement helps — even a short walk can shift your energy. 🚶',
    ],
  };

  const moodTips = tips[mood] || tips.neutral;
  return moodTips[Math.floor(Math.random() * moodTips.length)];
}

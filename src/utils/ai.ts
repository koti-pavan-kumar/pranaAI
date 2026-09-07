/**
 * AI Health Chat — On-device intelligent responses
 * Uses sentiment analysis and knowledge base for personalized advice
 */
import { analyzeSentimentAsync, type Mood } from './sentiment';

interface ChatResponse {
  text: string;
  mood: Mood;
  confidence: number;
  suggestions?: string[];
}

// Mental health knowledge base
const knowledgeBase: Record<string, { patterns: RegExp[]; responses: string[]; suggestions: string[] }> = {
  breathing: {
    patterns: [/breath/i, /breathe/i, /respir/i, /inhale/i, /exhale/i, /lung/i],
    responses: [
      'Breathing exercises are one of the most effective ways to reduce stress and anxiety. The 4-7-8 technique (inhale 4s, hold 7s, exhale 8s) can activate your parasympathetic nervous system within minutes.',
      'Deep breathing sends a signal to your brain to calm down and relax. Try placing your hand on your chest and breathe slowly — feel your chest rise and fall.',
      'Box breathing (4-4-4-4) is used by Navy SEALs to stay calm under pressure. It\'s simple but incredibly effective for immediate stress relief.',
      'Your breath is the bridge between your mind and body. When you focus on slow, deep breathing, you\'re literally telling your nervous system to shift from "fight or flight" to "rest and digest."',
    ],
    suggestions: ['Try a breathing session', 'Learn 4-7-8 technique', 'How often should I breathe?'],
  },
  anxiety: {
    patterns: [/anxious/i, /anxiety/i, /worry/i, /worried/i, /panic/i, /nervous/i, /stress/i, /stressed/i, /overwhelm/i],
    responses: [
      'I understand you\'re feeling anxious. This is your body\'s natural response to perceived threats — it\'s trying to protect you. Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste.',
      'Anxiety can feel overwhelming, but remember: it\'s temporary. Try box breathing — 4 seconds in, 4 seconds hold, 4 seconds out, 4 seconds hold. Repeat 4 times.',
      'When anxiety hits, try this: tense all your muscles for 5 seconds, then release completely. The contrast between tension and relaxation helps break the anxiety cycle.',
      'Your anxious thoughts are not facts. They\'re your brain trying to keep you safe. Acknowledge them, take a deep breath, and remind yourself: "I am safe right now."',
    ],
    suggestions: ['Try calming breathing', 'Grounding techniques', 'Progressive muscle relaxation'],
  },
  depression: {
    patterns: [/depress/i, /sad/i, /unhappy/i, /miserable/i, /hopeless/i, /empty/i, /lonely/i, /alone/i, /cry/i],
    responses: [
      'I hear you, and I want you to know that what you\'re feeling is valid. Depression can make everything feel heavy, but you\'re not alone in this. Even small steps matter.',
      'When everything feels overwhelming, focus on just one small thing: take a deep breath, drink a glass of water, or step outside for 2 minutes. Small actions create momentum.',
      'Depression often lies to us — it says nothing will get better. But feelings are temporary, and reaching out (even to an AI) is a sign of strength, not weakness.',
      'Try to be gentle with yourself today. You don\'t have to be productive or "fix" everything. Just being here, breathing, is enough. 💙',
    ],
    suggestions: ['Try mood journaling', 'Gentle breathing exercise', 'Talk to a professional'],
  },
  sleep: {
    patterns: [/sleep/i, /insomnia/i, /rest/i, /tired/i, /exhaust/i, /fatigue/i, /nap/i, /bed/i],
    responses: [
      'Sleep is crucial for mental health. Try the 4-7-8 breathing technique before bed — it\'s like a natural sleep aid. Inhale 4s, hold 7s, exhale 8s.',
      'Poor sleep affects everything — mood, focus, relationships. Create a wind-down routine: dim lights, avoid screens 1 hour before bed, and try 5 minutes of deep breathing.',
      'If you can\'t sleep, don\'t fight it. Get up, do something relaxing (no screens), and return to bed when you feel sleepy. Your bed should be for sleep only.',
      'Fatigue is your body\'s way of saying it needs rest. Don\'t ignore it. Even a 20-minute power nap can significantly improve your mood and focus.',
    ],
    suggestions: ['Sleep breathing technique', 'Wind-down routine', 'Power nap tips'],
  },
  selfcare: {
    patterns: [/self.?care/i, /wellness/i, /health/i, /habits/i, /routine/i, /routine/i, /practice/i],
    responses: [
      'Self-care isn\'t selfish — it\'s essential. Even 5 minutes of breathing exercises daily can reduce cortisol levels by up to 25% and improve your overall wellbeing.',
      'A good self-care routine includes: 7-9 hours of sleep, 20 minutes of movement, 5 minutes of breathing/meditation, and meaningful social connections.',
      'Consistency beats intensity. 2 minutes of daily breathing is better than 30 minutes once a week. Start small, build the habit, then expand.',
      'Self-care looks different for everyone. For some it\'s meditation, for others it\'s a walk, journaling, or talking to a friend. Find what works for YOU.',
    ],
    suggestions: ['Build a routine', 'Daily breathing practice', 'Journaling benefits'],
  },
  meditation: {
    patterns: [/meditat/i, /mindful/i, /present/i, /aware/i, /focus/i, /concentrat/i],
    responses: [
      'Mindfulness meditation is simply paying attention to the present moment without judgment. Start with just 2 minutes — focus on your breath, and when your mind wanders, gently bring it back.',
      'The goal of meditation isn\'t to empty your mind — it\'s to observe your thoughts without getting caught up in them. Think of thoughts like clouds passing in the sky.',
      'Even 5 minutes of daily meditation can physically change your brain — increasing gray matter in areas associated with self-awareness, compassion, and emotional regulation.',
      'Try a body scan meditation: lie down, close your eyes, and slowly bring attention to each body part from toes to head. Notice sensations without trying to change them.',
    ],
    suggestions: ['Try guided meditation', 'Body scan technique', 'Mindful breathing'],
  },
  greeting: {
    patterns: [/^(hi|hello|hey|howdy|greetings|good\s*(morning|afternoon|evening))/i, /^what'?s up/i, /^how are you/i],
    responses: [
      'Hello! I\'m here to support your mental wellness journey. How are you feeling today?',
      'Hey there! Welcome back. What\'s on your mind today?',
      'Hi! I\'m your AI wellness companion. Whether you need breathing guidance, mood support, or just someone to talk to — I\'m here. 💙',
      'Good to see you! How can I help with your wellness today?',
    ],
    suggestions: ['I feel anxious', 'Help with breathing', 'I need to talk'],
  },
  thanks: {
    patterns: [/thank/i, /thanks/i, /appreciate/i, /helpful/i],
    responses: [
      'You\'re welcome! Remember, small consistent steps lead to big changes. I\'m always here if you need support. 💙',
      'Happy to help! Your wellness matters, and the fact that you\'re seeking support shows real strength. 🌟',
      'Anytime! Take care of yourself, and don\'t hesitate to come back whenever you need guidance.',
    ],
    suggestions: ['Start a breathing session', 'Write in journal', 'Check my wellness score'],
  },
  help: {
    patterns: [/help/i, /what can you do/i, /features/i, /how.*use/i, /guide/i],
    responses: [
      'I can help you with:\n\n🫁 **Breathing Exercises** — Guided patterns with real-time camera detection\n📝 **Mood Journaling** — Track your emotions with AI analysis\n📊 **Wellness Dashboard** — See your progress over time\n💬 **Health Chat** — Ask me anything about mental wellness\n📷 **Camera Breathing** — Use your phone\'s camera to detect breathing\n\nWhich would you like to try?',
    ],
    suggestions: ['Try breathing', 'Start journaling', 'View dashboard'],
  },
  emergency: {
    patterns: [/suicide/i, /kill/i, /end.*life/i, /self.?harm/i, /crisis/i, /emergency/i, /urgent/i],
    responses: [
      'If you\'re in crisis, please reach out for help immediately:\n\n🆘 **National Suicide Prevention Lifeline:** 988\n📱 **Crisis Text Line:** Text HOME to 741741\n🏥 **Emergency Services:** 911\n\nYou are not alone. Professional help is available 24/7. Your life matters. 💙',
    ],
    suggestions: ['Call 988 now', 'Text HOME to 741741', 'I need to talk'],
  },
};

/**
 * Generate AI response to user message
 * Uses sentiment analysis + knowledge base for personalized responses
 */
export async function generateAIResponse(
  message: string,
  recentMoods?: string[],
): Promise<ChatResponse> {
  // Analyze sentiment
  const sentiment = await analyzeSentimentAsync(message);
  
  // Find matching knowledge base entries
  const matchingEntries = Object.entries(knowledgeBase).filter(([_, entry]) =>
    entry.patterns.some(pattern => pattern.test(message))
  );

  // Select best response
  let response: string;
  let suggestions: string[] | undefined;

  if (matchingEntries.length > 0) {
    // Use knowledge base response
    const [category, entry] = matchingEntries[0];
    const responseIndex = Math.floor(Math.random() * entry.responses.length);
    response = entry.responses[responseIndex];
    suggestions = entry.suggestions;
    
    console.log(`[AI] Matched category: ${category}`);
  } else {
    // Generate contextual response based on sentiment
    response = generateContextualResponse(message, sentiment.mood, recentMoods);
  }

  return {
    text: response,
    mood: sentiment.mood,
    confidence: sentiment.score,
    suggestions,
  };
}

/**
 * Generate contextual response when no specific pattern matches
 */
function generateContextualResponse(
  message: string,
  mood: Mood,
  _recentMoods?: string[],
): string {
  const lower = message.toLowerCase();
  
  // Check for specific topics
  if (lower.includes('today') || lower.includes('morning') || lower.includes('day')) {
    return 'How has your day been so far? I\'d love to hear about it — sometimes just putting thoughts into words helps clarify how we\'re feeling.';
  }
  
  if (lower.includes('work') || lower.includes('job') || lower.includes('office')) {
    return 'Work can be both rewarding and stressful. How is it affecting your mental state? I can suggest some quick breathing exercises you can do at your desk.';
  }
  
  if (lower.includes('relationship') || lower.includes('friend') || lower.includes('family')) {
    return 'Relationships are a big part of our mental health. Whether it\'s joy or conflict, talking about it helps. What\'s going on?';
  }
  
  if (lower.includes('goal') || lower.includes('plan') || lower.includes('future')) {
    return 'Having goals gives us direction and purpose. What are you working toward? I can help you break it down into manageable steps.';
  }

  // Mood-based responses
  const moodResponses: Record<Mood, string[]> = {
    happy: [
      'It sounds like you\'re in a good place! What\'s contributing to your positive mood? Understanding what brings you joy helps you create more of it.',
      'Love to hear that! Positive emotions are worth savoring. Try a quick gratitude practice — name 3 things you\'re thankful for right now.',
    ],
    calm: [
      'A calm state is wonderful for clarity and focus. What helped you reach this place? Building on what works is key to mental wellness.',
      'Serenity is a skill, and you\'re practicing it well. Consider using this calm state for reflection or creative thinking.',
    ],
    energetic: [
      'That energy is valuable! How are you channeling it? Physical activity, creative projects, or meaningful work can help sustain this state.',
      'Great to hear! Energy is like a wave — ride it while it lasts. What matters most to you right now?',
    ],
    neutral: [
      'Thanks for sharing. Even "neutral" days have value — they give us space to reflect and recharge. What\'s on your mind?',
      'I appreciate you talking with me. Sometimes the most helpful thing is just to process our thoughts out loud. What would you like to explore?',
    ],
    anxious: [
      'I hear you, and anxiety is tough. Remember: you\'re safe right now. Try taking 3 slow, deep breaths. I\'m here to help you through this.',
      'Anxiety can feel overwhelming, but it\'s your body\'s alarm system — not a prediction of the future. Let\'s work through this together.',
    ],
    sad: [
      'I\'m sorry you\'re feeling this way. Sadness is a natural emotion, and it\'s okay to sit with it. Would you like to talk about what\'s bothering you?',
      'Your feelings are valid. Sometimes we need to acknowledge sadness before we can move through it. I\'m here to listen.',
    ],
  };

  const responses = moodResponses[mood] || moodResponses.neutral;
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Generate wellness insight based on user data
 */
export function getQuickSuggestions(mood: string): string[] {
  const suggestions: Record<string, string[]> = {
    happy: ['What made you happy?', 'How can I stay positive?', 'Gratitude practice'],
    calm: ['How to maintain calm?', 'Meditation tips', 'Focus techniques'],
    energetic: ['Channel my energy', 'Productivity tips', 'Exercise ideas'],
    neutral: ['How are you?', 'Tell me about yourself', 'What can you do?'],
    anxious: ['I feel anxious', 'Help me calm down', 'Breathing exercises'],
    sad: ['I feel sad', 'Cheer me up', 'Talk to someone'],
  };
  return suggestions[mood] || suggestions.neutral;
}

export function generateWellnessInsight(
  recentMoods: string[],
  breathingRate: number,
  sessionCount: number,
): string {
  const moodScores: Record<string, number> = {
    happy: 5, calm: 4, energetic: 4, neutral: 3, anxious: 2, sad: 1,
  };

  const avgMood = recentMoods.reduce((acc, mood) => acc + (moodScores[mood] ?? 3), 0) / (recentMoods.length || 1);

  if (avgMood < 2) {
    return "I've noticed some challenging days recently. Try a 5-minute 4-7-8 breathing session — it activates your parasympathetic nervous system and can help within minutes. 💙";
  } else if (avgMood < 3) {
    return "Your mood has been mixed lately. Consistency is key — even 2 minutes of breathing daily creates measurable improvement in 2 weeks. 🌱";
  } else if (breathingRate > 20) {
    return "Your breathing rate is elevated, which might indicate stress. Try box breathing (4-4-4-4) — it's used by Navy SEALs for instant calm. 🧊";
  } else if (sessionCount > 5) {
    return "You're building a strong breathing practice! Your consistency is impressive. Try extending sessions to 5 minutes for deeper benefits. 🌟";
  } else {
    return "You're doing great! Your wellness scores are trending positively. Keep up the breathing practice — even short sessions make a difference. ✨";
  }
}

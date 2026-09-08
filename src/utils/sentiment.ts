/**
 * Sentiment Analysis — Uses real ONNX engine for on-device inference
 * Falls back to enhanced keyword analysis when ONNX models aren't available
 * Supports: English, Hindi (Devanagari), and Romanized Hindi (Hinglish)
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

    const primaryEmotion = result.emotions[0] || 'neutral';
    const mood = moodMap[primaryEmotion] || 'neutral';
    const tags = result.emotions.slice(0, 3).map(e => 
      e.charAt(0).toUpperCase() + e.slice(1)
    );

    return { mood, score: result.confidence / 100, tags };
  } catch (error) {
    console.warn('[Sentiment] ONNX analysis failed, using fallback:', error);
    return analyzeSentiment(text);
  }
}

// ============================================================================
// WORD LISTS
// ============================================================================

/** Hindi (Devanagari) positive words */
const hindiPositiveWords = [
  'खुश', 'अच्छा', 'शानदार', 'प्यार', 'प्रसन्न', 'शांत', 'आराम',
  'आशावान', 'संतुष्ट', 'बेहतर', 'सुंदर', 'गर्व', 'प्रेरित',
  'उत्साहित', 'हर्षित', 'आनंदित', 'मुस्कुरा', 'हँस',
  'सुखी', 'स्वस्थ', 'ऊर्जावान', 'जीवंत', 'सफल', 'विजयी',
  'ख़ुशी', 'प्रसन्नता', 'ठीक', 'बढ़िया', 'मज़े', 'मस्ती', 'आनंद', 'सुकून', 'मस्त',
];

/** Hindi (Devanagari) negative words */
const hindiNegativeWords = [
  'दुख', 'उदास', 'अकेला', 'रोना', 'निराश', 'खाली', 'दर्द',
  'चोट', 'चिंतित', 'परेशान', 'तनाव', 'डर', 'भय',
  'घृणा', 'गुस्सा', 'क्रोध', 'नाराज़', 'थका', 'बोझिल',
  'कमज़ोर', 'बीमार', 'तबाह', 'बर्बाद', 'असफल', 'हार', 'रोग',
  'बेचैनी', 'घबराहट', 'तकलीफ', 'कष्ट', 'संघर्ष', 'मुश्किल',
  'कठिन', 'बुरा', 'गंदा', 'खराब', 'नाकाम', 'हताश',
];

/** English positive words */
const englishPositiveWords = [
  'happy', 'great', 'wonderful', 'amazing', 'love', 'excited', 'grateful',
  'joy', 'awesome', 'best', 'good', 'calm', 'peaceful', 'relaxed',
  'energized', 'focused', 'hopeful', 'confident', 'content',
  'better', 'improving', 'positive', 'bright', 'beautiful',
  'blessed', 'thankful', 'proud', 'accomplished', 'motivated', 'inspired',
  'fantastic', 'excellent', 'perfect', 'brilliant', 'outstanding',
];

/** English negative words */
const englishNegativeWords = [
  'sad', 'depressed', 'lonely', 'cry', 'hopeless', 'empty', 'pain',
  'hurt', 'anxious', 'worried', 'nervous', 'stress', 'panic', 'fear',
  'terrible', 'awful', 'hate', 'angry', 'frustrated', 'struggling',
  'worse', 'tired', 'exhausted', 'overwhelmed', 'negative', 'dark',
  'miserable', 'heartbroken', 'grief', 'sorrow', 'confused', 'lost',
];

/** Romanized Hindi (Hinglish) positive words — when Google transcribes Hindi speech as Roman text */
const romanHindiPositiveWords = [
  'khush', 'accha', 'acha', 'achcha', 'achha', 'shandar', 'pyar', 'prem', 'prasan', 'shant',
  'santusht', 'behtar', 'sundar', 'garv', 'prerit',
  'utsahit', 'harshit', 'anandit', 'muskura', 'hans',
  'sukhi', 'swasth', 'urjawan', 'jivant', 'safal', 'vijayi',
  'khushi', 'prasnata', 'badhiya', 'badiya', 'maje', 'masti', 'anand', 'sukoon', 'sukun', 'mast',
  'happy', 'great', 'good', 'love', 'excited', 'amazing', 'wonderful',
  'best', 'awesome', 'fantastic', 'excellent', 'perfect', 'beautiful',
  'proud', 'grateful', 'motivated', 'inspired', 'positive', 'blessed',
  'nice', 'fine', 'well', 'enjoy', 'fun', 'cool', 'theek', 'thik',
  'acchi', 'achi', 'achchi', 'achhi', 'mahol', 'vishal',
];

/** Romanized Hindi (Hinglish) negative words */
const romanHindiNegativeWords = [
  'dukh', 'udas', 'udass', 'udaas', 'akela', 'rona', 'nirash', 'khali', 'dard',
  'chot', 'chintit', 'pareshan', 'preshan', 'tanav', 'tension', 'dar', 'bhay',
  'ghrina', 'gussa', 'gusa', 'krodh', 'naraz', 'naraaz', 'thaka', 'bojhil',
  'kamzor', 'bimar', 'tabah', 'barbad', 'asfal', 'haar', 'rog',
  'bechaini', 'ghabrahat', 'takleef', 'kasht', 'sangharsh', 'mushkil',
  'kathin', 'bura', 'ganda', 'kharab', 'nakam', 'hatash',
  'sad', 'depressed', 'lonely', 'cry', 'hopeless', 'pain', 'hurt',
  'anxious', 'worried', 'nervous', 'stress', 'panic', 'fear',
  'terrible', 'awful', 'hate', 'angry', 'frustrated', 'tired',
  'exhausted', 'overwhelmed', 'miserable', 'heartbroken', 'bad', 'worst',
];

// ============================================================================
// SENTIMENT ANALYSIS
// ============================================================================

/**
 * Synchronous sentiment analysis (fallback when async isn't available)
 * Supports English, Hindi (Devanagari), and Romanized Hindi (Hinglish)
 */
export function analyzeSentiment(text: string): SentimentResult {
  const lower = text.toLowerCase().trim();
  if (!lower) return { mood: 'neutral', score: 0.5, tags: ['Neutral'] };

  // Detect text type
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  // Romanized Hindi: mostly Latin chars but contains common Hindi transliterations
  const isRomanHindi = !hasDevanagari && detectRomanHindi(lower);

  let posScore = 0;
  let negScore = 0;
  let hasNegation = false;
  let intensifierCount = 0;
  const exclamationCount = (text.match(/!/g) || []).length;

  const words = lower.split(/\s+/).filter(Boolean);

  if (hasDevanagari) {
    // --- Hindi (Devanagari) mode ---
    const hNegations = ['नहीं', 'ना', 'मत', 'कभी नहीं'];
    const hIntensifiers = ['बहुत', 'अत्यधिक', 'बिल्कुल', 'पूरी तरह'];

    for (const word of words) {
      if (hNegations.some(n => word.includes(n))) { hasNegation = true; continue; }
      if (hIntensifiers.some(i => word.includes(i))) { intensifierCount++; continue; }
      if (hindiPositiveWords.some(pw => word.includes(pw) || pw.includes(word))) posScore += 1;
      if (hindiNegativeWords.some(nw => word.includes(nw) || nw.includes(word))) negScore += 1;
    }
  } else if (isRomanHindi) {
    // --- Romanized Hindi (Hinglish) mode ---
    const rhNegations = ['nahi', 'nahin', 'na', 'mat', 'nahi ', 'nahin '];
    const rhIntensifiers = ['bahut', 'bhot', 'bohot', 'jyada', 'ekdum', 'bilkul'];

    for (const word of words) {
      if (rhNegations.some(n => word === n || word.startsWith(n))) { hasNegation = true; continue; }
      if (rhIntensifiers.some(i => word === i)) { intensifierCount++; continue; }
      if (romanHindiPositiveWords.some(pw => word === pw || word.includes(pw))) posScore += 1;
      if (romanHindiNegativeWords.some(nw => word === nw || word.includes(nw))) negScore += 1;
    }
  } else {
    // --- English mode ---
    const enNegations = ['not', 'no', 'never', "don't", "isn't", "wasn't", "won't", "can't", "couldn't", "doesn't", "didn't"];
    const enIntensifiers = ['very', 'extremely', 'incredibly', 'super', 'really', 'so', 'absolutely', 'completely'];

    for (const word of words) {
      if (enNegations.includes(word)) { hasNegation = true; continue; }
      if (enIntensifiers.includes(word)) { intensifierCount++; continue; }
      if (englishPositiveWords.includes(word)) posScore += 1;
      if (englishNegativeWords.includes(word)) negScore += 1;
    }
  }

  // Apply intensifier multiplier
  const multiplier = 1 + (intensifierCount * 0.3);
  posScore *= multiplier;
  negScore *= multiplier;

  // Negation flips sentiment
  if (hasNegation) {
    [posScore, negScore] = [negScore * 0.6, posScore * 0.6 + 0.5];
  }

  // Questions indicate uncertainty
  if (text.includes('?')) negScore += 0.3;

  // Exclamations add energy
  if (posScore > negScore) {
    posScore += exclamationCount * 0.2;
  } else {
    negScore += exclamationCount * 0.1;
  }

  // Fallback regex patterns if no word matches
  if (posScore === 0 && negScore === 0) {
    if (hasDevanagari) {
      if (/खुश|हर्षित|प्रसन्न|आनंदित|मुस्कुरा|हँस/.test(text)) posScore = 1;
      if (/दुख|उदास|रोना|परेशान|बेचैन|तकलीफ/.test(text)) negScore = 1;
      if (/ठीक|अच्छा|सही/.test(text)) posScore = 0.5;
    } else if (isRomanHindi) {
      if (/khush|happy|good|great|accha|sukoon|mast|maje/.test(lower)) posScore = 1;
      if (/udas|sad|pareshan|takleef|dard|gussa|bura/.test(lower)) negScore = 1;
    }
  }

  const total = posScore + negScore + 0.001;
  const posConfidence = posScore / total;
  const negConfidence = negScore / total;

  // Determine mood
  let mood: Mood;
  let score: number;

  if (posConfidence > negConfidence && posConfidence > 0.4) {
    if (posConfidence > 0.7) mood = 'happy';
    else if (posConfidence > 0.5) mood = 'calm';
    else mood = 'energetic';
    score = Math.round(posConfidence * 100) / 100;
  } else if (negConfidence > posConfidence && negConfidence > 0.4) {
    // Determine anxious vs sad from specific words
    const isAnxious = lower.includes('anxious') || lower.includes('worried') || lower.includes('nervous') ||
      lower.includes('panic') || lower.includes('dar') || lower.includes('chintit') ||
      lower.includes('pareshan') || lower.includes('ghabrahat') || lower.includes('bechaini') ||
      lower.includes('tanav') || lower.includes('stress') || lower.includes('fear');
    const isSad = lower.includes('sad') || lower.includes('depressed') || lower.includes('lonely') ||
      lower.includes('cry') || lower.includes('udas') || lower.includes('dukh') ||
      lower.includes('rona') || lower.includes('nirash') || lower.includes('akela');
    mood = isAnxious ? 'anxious' : isSad ? 'sad' : 'anxious';
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
  if (isRomanHindi) tags.push('Hinglish');
  if (hasDevanagari) tags.push('Hindi');
  if (tags.length === 0) tags.push('Neutral');

  return { mood, score, tags };
}

/**
 * Detect if Roman text is likely transliterated Hindi (Hinglish)
 */
function detectRomanHindi(lower: string): boolean {
  const hinglishIndicators = [
    'main', 'mera', 'meri', 'hun', 'hu', 'hai', 'ho', 'tho', 'toh',
    'bahut', 'bhot', 'bohot', 'accha', 'acha', 'achcha', 'achha', 'theek', 'thik',
    'aaj', 'kal', 'abhi', 'phir', 'bhi', 'mein', 'ko', 'se',
    'khush', 'sad', 'pareshan', 'tension', 'mood', 'feel',
    'jindagi', 'zindagi', 'dil', 'mann', 'kya', 'kyun', 'kyu',
    'nahi', 'nahin', 'haan', 'ji', 'bhai', 'yaar', 'dost',
    'vichar', 'soch', 'raat', 'din', 'subah', 'shaam', 'wakt',
  ];
  const words = lower.split(/\s+/);
  let matchCount = 0;
  for (const w of words) {
    if (hinglishIndicators.includes(w)) matchCount++;
  }
  // If 30%+ words match Hinglish patterns, treat as Romanized Hindi
  return words.length > 0 && (matchCount / words.length) >= 0.25;
}

// ============================================================================
// WELLNESS SCORE
// ============================================================================

export function calculateWellnessScore(
  breathingSessions: Array<{ duration: number; completedCycles: number; timestamp: number }>,
  journalEntries: Array<{ mood: string; sentimentScore: number; timestamp: number }>,
): { overall: number; mood: number; breathing: number; journal: number; streak: number } {
  const moodScores: Record<string, number> = {
    happy: 90, calm: 80, energetic: 75, neutral: 50, anxious: 30, sad: 20,
  };
  
  const recentMoods = journalEntries.slice(-7);
  const avgMood = recentMoods.length > 0
    ? recentMoods.reduce((sum, e) => sum + (moodScores[e.mood] || 50), 0) / recentMoods.length
    : 50;

  const totalBreathingMinutes = breathingSessions.reduce((sum, s) => sum + s.duration, 0) / 60;
  const breathingScore = Math.min(100, totalBreathingMinutes * 10 + breathingSessions.length * 5);
  const journalScore = Math.min(100, journalEntries.length * 15);
  const overall = Math.round(avgMood * 0.4 + breathingScore * 0.3 + journalScore * 0.3);

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

// ============================================================================
// WELLNESS TIPS
// ============================================================================

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

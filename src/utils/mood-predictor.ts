/**
 * Mood Trend Predictor
 * Analyzes journal entry history to predict future mood patterns
 * Uses weighted moving average + trend detection + seasonal patterns
 */

import type { Mood } from './sentiment';

interface JournalEntry {
  id: string;
  text: string;
  mood: Mood;
  sentimentScore: number;
  tags: string[];
  createdAt: string;
}

interface MoodTrend {
  direction: 'improving' | 'declining' | 'stable' | 'volatile';
  strength: number; // 0-100
  description: string;
}

interface DailyMoodAverage {
  date: string;
  avgScore: number;
  dominantMood: Mood;
  entryCount: number;
}

export interface PredictionResult {
  predictedMood: Mood;
  confidence: number;
  predictedScore: number;
  trend: MoodTrend;
  weeklyPattern: DailyMoodAverage[];
  insights: string[];
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  riskFactors: string[];
}

// Mood to numeric score mapping
const MOOD_SCORES: Record<Mood, number> = {
  happy: 0.9,
  calm: 0.7,
  energetic: 0.8,
  neutral: 0.5,
  anxious: 0.3,
  sad: 0.1,
};

// Mood weights for weighted moving average (more recent = higher weight)
const RECENCY_WEIGHTS = [1.0, 0.85, 0.7, 0.55, 0.4, 0.25, 0.15];

/**
 * Predict mood trends from journal history
 */
export function predictMoodTrend(entries: JournalEntry[]): PredictionResult {
  if (entries.length === 0) {
    return {
      predictedMood: 'neutral',
      confidence: 0,
      predictedScore: 0.5,
      trend: { direction: 'stable', strength: 0, description: 'No data available' },
      weeklyPattern: [],
      insights: ['Start journaling to see mood predictions and trends.'],
      riskLevel: 'low',
      riskFactors: [],
    };
  }

  // Sort entries by date (newest first)
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Calculate daily mood averages
  const weeklyPattern = calculateDailyAverages(sorted.slice(0, 21)); // Last 3 weeks

  // Weighted moving average for prediction
  const recentScores = sorted.slice(0, 7).map((e) => MOOD_SCORES[e.mood] ?? 0.5);
  const predictedScore = weightedMovingAverage(recentScores);

  // Detect trend
  const trend = detectTrend(weeklyPattern);

  // Predict mood from score
  const predictedMood = scoreToMood(predictedScore);

  // Calculate confidence based on data quantity and consistency
  const confidence = calculateConfidence(sorted, weeklyPattern);

  // Generate insights
  const insights = generateInsights(sorted, weeklyPattern, trend, predictedMood);

  // Risk assessment
  const { riskLevel, riskFactors } = assessRisk(sorted, weeklyPattern, trend);

  return {
    predictedMood,
    confidence,
    predictedScore,
    trend,
    weeklyPattern,
    insights,
    riskLevel,
    riskFactors,
  };
}

/**
 * Calculate daily mood averages from entries
 */
function calculateDailyAverages(entries: JournalEntry[]): DailyMoodAverage[] {
  const dailyMap = new Map<string, { scores: number[]; moods: Mood[] }>();

  for (const entry of entries) {
    const date = new Date(entry.createdAt).toISOString().split('T')[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { scores: [], moods: [] });
    }
    const day = dailyMap.get(date)!;
    day.scores.push(MOOD_SCORES[entry.mood] ?? 0.5);
    day.moods.push(entry.mood);
  }

  return Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      dominantMood: getMostFrequent(data.moods),
      entryCount: data.scores.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Weighted moving average prediction
 */
function weightedMovingAverage(scores: number[]): number {
  if (scores.length === 0) return 0.5;

  let weightedSum = 0;
  let weightSum = 0;

  for (let i = 0; i < scores.length; i++) {
    const weight = RECENCY_WEIGHTS[i] ?? 0.1;
    weightedSum += scores[i] * weight;
    weightSum += weight;
  }

  return weightSum > 0 ? weightedSum / weightSum : 0.5;
}

/**
 * Detect mood trend direction using linear regression
 */
function detectTrend(weeklyPattern: DailyMoodAverage[]): MoodTrend {
  if (weeklyPattern.length < 3) {
    return {
      direction: 'stable',
      strength: 0,
      description: 'Not enough data to detect a trend',
    };
  }

  const scores = weeklyPattern.map((d) => d.avgScore);
  const n = scores.length;

  // Linear regression
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += scores[i];
    sumXY += i * scores[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgScore = sumY / n;

  // Calculate variance for volatility
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / n;
  const volatility = Math.sqrt(variance);

  // Determine direction and strength
  const slopeMagnitude = Math.abs(slope) * 100;
  let direction: MoodTrend['direction'];
  let description: string;

  if (volatility > 0.25) {
    direction = 'volatile';
    description = `Mood is highly variable (volatility: ${(volatility * 100).toFixed(0)}%). Try to identify triggers.`;
  } else if (slope > 0.01) {
    direction = 'improving';
    description = `Mood is trending upward (+${slopeMagnitude.toFixed(1)}% per day). Keep up what you're doing!`;
  } else if (slope < -0.01) {
    direction = 'declining';
    description = `Mood is declining (${slopeMagnitude.toFixed(1)}% per day). Consider reaching out for support.`;
  } else {
    direction = 'stable';
    description = 'Mood has been stable over the past week.';
  }

  return {
    direction,
    strength: Math.min(100, Math.round(slopeMagnitude * 10 + volatility * 50)),
    description,
  };
}

/**
 * Calculate prediction confidence
 */
function calculateConfidence(
  entries: JournalEntry[],
  weeklyPattern: DailyMoodAverage[]
): number {
  let confidence = 0;

  // Data quantity (more entries = higher confidence)
  if (entries.length >= 14) confidence += 35;
  else if (entries.length >= 7) confidence += 25;
  else if (entries.length >= 3) confidence += 15;
  else confidence += 5;

  // Data consistency (regular journaling = higher confidence)
  if (weeklyPattern.length >= 5) confidence += 25;
  else if (weeklyPattern.length >= 3) confidence += 15;
  else confidence += 5;

  // Trend clarity (strong trend = higher confidence)
  const scores = entries.slice(0, 7).map((e) => MOOD_SCORES[e.mood] ?? 0.5);
  const variance = calculateVariance(scores);
  if (variance < 0.05) confidence += 25;
  else if (variance < 0.15) confidence += 15;
  else confidence += 5;

  // Recency (recent entries = higher confidence)
  const newestEntry = entries[0];
  if (newestEntry) {
    const daysSinceLastEntry = Math.floor(
      (Date.now() - new Date(newestEntry.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastEntry <= 1) confidence += 15;
    else if (daysSinceLastEntry <= 3) confidence += 10;
    else confidence += 3;
  }

  return Math.min(95, confidence);
}

/**
 * Generate actionable insights
 */
function generateInsights(
  entries: JournalEntry[],
  weeklyPattern: DailyMoodAverage[],
  trend: MoodTrend,
  predictedMood: Mood
): string[] {
  const insights: string[] = [];

  // Trend-based insights
  if (trend.direction === 'improving') {
    insights.push('Your mood has been improving! The activities you\'re doing seem to be working.');
  } else if (trend.direction === 'declining') {
    insights.push('Your mood has been declining. Consider what\'s changed recently and reach out if needed.');
  } else if (trend.direction === 'volatile') {
    insights.push('Your mood has been fluctuating. Try to identify patterns — what triggers the ups and downs?');
  }

  // Pattern insights
  if (weeklyPattern.length >= 3) {
    const recentDays = weeklyPattern.slice(-3);
    const dayNames = recentDays.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });

    const avgRecent = recentDays.reduce((s, d) => s + d.avgScore, 0) / recentDays.length;
    if (avgRecent < 0.3) {
      insights.push(`Your mood has been low recently (${dayNames.join(', ')}). Remember: it's okay to have tough days.`);
    } else if (avgRecent > 0.7) {
      insights.push(`Great mood streak on ${dayNames.join(', ')}! What were you doing during those days?`);
    }
  }

  // Entry frequency insight
  if (entries.length < 5) {
    insights.push('Journal more frequently for better mood predictions. Even 1 sentence daily helps.');
  } else if (entries.length >= 14) {
    insights.push('Excellent journaling consistency! Your predictions are becoming more accurate.');
  }

  // Mood-specific insights
  const moodCounts = new Map<Mood, number>();
  entries.slice(0, 14).forEach((e) => {
    moodCounts.set(e.mood, (moodCounts.get(e.mood) ?? 0) + 1);
  });

  const dominantMood = Array.from(moodCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  if (dominantMood && dominantMood[0] === 'anxious') {
    insights.push('Anxiety has been your most frequent mood. Consider breathing exercises or talking to someone you trust.');
  } else if (dominantMood && dominantMood[0] === 'sad') {
    insights.push('Sadness has appeared frequently. Remember that seeking help is a sign of strength, not weakness.');
  }

  if (predictedMood === 'happy' || predictedMood === 'calm') {
    insights.push(`Predicted mood: ${predictedMood}. Keep maintaining the habits that contribute to this positive state.`);
  }

  return insights.slice(0, 5);
}

/**
 * Assess risk level for mental health
 */
function assessRisk(
  entries: JournalEntry[],
  weeklyPattern: DailyMoodAverage[],
  trend: MoodTrend
): { riskLevel: 'low' | 'moderate' | 'elevated' | 'high'; riskFactors: string[] } {
  const riskFactors: string[] = [];
  let riskScore = 0;

  // Check for consecutive negative moods
  const recentMoods = entries.slice(0, 7).map((e) => e.mood);
  const negativeConsecutive = countConsecutiveNegative(recentMoods);
  if (negativeConsecutive >= 5) {
    riskScore += 40;
    riskFactors.push(`${negativeConsecutive} consecutive negative mood entries`);
  } else if (negativeConsecutive >= 3) {
    riskScore += 20;
    riskFactors.push(`${negativeConsecutive} consecutive negative mood entries`);
  }

  // Check for declining trend
  if (trend.direction === 'declining' && trend.strength > 60) {
    riskScore += 25;
    riskFactors.push('Strong declining mood trend');
  }

  // Check for very low average mood
  if (weeklyPattern.length > 0) {
    const recentAvg = weeklyPattern.slice(-3).reduce((s, d) => s + d.avgScore, 0) / Math.min(3, weeklyPattern.length);
    if (recentAvg < 0.2) {
      riskScore += 30;
      riskFactors.push('Very low average mood score');
    } else if (recentAvg < 0.35) {
      riskScore += 15;
      riskFactors.push('Below-average mood scores');
    }
  }

  // Check for volatile mood
  if (trend.direction === 'volatile') {
    riskScore += 15;
    riskFactors.push('High mood volatility');
  }

  // Determine risk level
  let riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  if (riskScore >= 60) riskLevel = 'high';
  else if (riskScore >= 40) riskLevel = 'elevated';
  else if (riskScore >= 20) riskLevel = 'moderate';
  else riskLevel = 'low';

  // Add positive note if low risk
  if (riskLevel === 'low' && entries.length > 0) {
    riskFactors.push('No significant risk indicators detected');
  }

  return { riskLevel, riskFactors };
}

// Helper functions
function getMostFrequent<T>(arr: T[]): T {
  const counts = new Map<T, number>();
  arr.forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1));
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
}

function scoreToMood(score: number): Mood {
  if (score >= 0.8) return 'happy';
  if (score >= 0.65) return 'calm';
  if (score >= 0.55) return 'energetic';
  if (score >= 0.4) return 'neutral';
  if (score >= 0.25) return 'anxious';
  return 'sad';
}

function calculateVariance(arr: number[]): number {
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, x) => sum + Math.pow(x - avg, 2), 0) / arr.length;
}

function countConsecutiveNegative(moods: Mood[]): number {
  let count = 0;
  for (const mood of moods) {
    if (mood === 'sad' || mood === 'anxious') count++;
    else break;
  }
  return count;
}

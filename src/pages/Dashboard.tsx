import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wind, BookOpen, Flame, TrendingUp, ArrowLeft, Sparkles, Brain, Calendar, Clock, Activity, AlertTriangle, Shield, Download, Share2 } from 'lucide-react';
import { useApp } from '../store';
import { useAuth } from '../auth';
import { predictMoodTrend, type PredictionResult } from '../utils/mood-predictor';
import { exportAsJSON, exportAsCSV, shareReport } from '../utils/export';

const MOODS: Record<string, { emoji: string; color: string; bg: string }> = {
  happy: { emoji: '😊', color: '#059669', bg: '#ecfdf5' },
  calm: { emoji: '🧘', color: '#0d9488', bg: '#f0fdfa' },
  energetic: { emoji: '⚡', color: '#d97706', bg: '#fffbeb' },
  neutral: { emoji: '😐', color: '#6b7280', bg: '#f9fafb' },
  anxious: { emoji: '😰', color: '#dc2626', bg: '#fef2f2' },
  sad: { emoji: '😢', color: '#7c3aed', bg: '#faf5ff' },
};

const Container = ({ children }: { children: React.ReactNode }) => (
  <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>{children}</div>
);

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: 'white', border: '1px solid #e8edf2', borderRadius: 18, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', ...style }}>{children}</div>
);

/**
 * ML Mood Prediction Widget
 * Shows predicted mood, trend, risk level, and insights
 */
function MoodPredictionWidget({ entries }: { entries: Array<{ id: string; text: string; mood: string; sentimentScore: number; tags: string[]; timestamp: number }> }) {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  useEffect(() => {
    // Convert store entries to predictor format
    const journalEntries = entries.map(e => ({
      id: e.id,
      text: e.text,
      mood: e.mood as import('../utils/sentiment').Mood,
      sentimentScore: e.sentimentScore,
      tags: e.tags,
      createdAt: new Date(e.timestamp).toISOString(),
    }));
    const result = predictMoodTrend(journalEntries);
    setPrediction(result);
  }, [entries]);

  if (!prediction) return null;

  const riskColors: Record<string, { bg: string; text: string; border: string }> = {
    low: { bg: '#d1fae5', text: '#059669', border: '#a7f3d0' },
    moderate: { bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
    elevated: { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' },
    high: { bg: '#fecaca', text: '#991b1b', border: '#fca5a5' },
  };

  const trendIcons: Record<string, string> = {
    improving: '📈',
    declining: '📉',
    stable: '➡️',
    volatile: '📊',
  };

  const moodEmojis = MOODS;    return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
      {/* Predicted Mood */}
      <div style={{ textAlign: 'center', padding: 16, background: '#f8fafc', borderRadius: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Predicted Mood</p>
        <span style={{ fontSize: 36 }}>{moodEmojis[prediction.predictedMood]?.emoji || '😐'}</span>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 6, textTransform: 'capitalize' }}>{prediction.predictedMood}</p>
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Confidence: {prediction.confidence}%</p>
      </div>

      {/* Mood Trend */}
      <div style={{ textAlign: 'center', padding: 16, background: '#f8fafc', borderRadius: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trend</p>
        <span style={{ fontSize: 36 }}>{trendIcons[prediction.trend.direction]}</span>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 6, textTransform: 'capitalize' }}>{prediction.trend.direction}</p>
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Strength: {prediction.trend.strength}%</p>
      </div>

      {/* Risk Level */}
      <div style={{ textAlign: 'center', padding: 16, background: riskColors[prediction.riskLevel].bg, borderRadius: 14, border: `1px solid ${riskColors[prediction.riskLevel].border}` }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: riskColors[prediction.riskLevel].text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Level</p>
        {prediction.riskLevel === 'low' ? <Shield size={36} color={riskColors[prediction.riskLevel].text} /> : <AlertTriangle size={36} color={riskColors[prediction.riskLevel].text} />}
        <p style={{ fontSize: 14, fontWeight: 700, color: riskColors[prediction.riskLevel].text, marginTop: 6, textTransform: 'capitalize' }}>{prediction.riskLevel}</p>
        <p style={{ fontSize: 11, color: riskColors[prediction.riskLevel].text, marginTop: 4, opacity: 0.8 }}>{prediction.riskFactors[0] || 'No issues detected'}</p>
      </div>          {/* Insights (full width) */}
          {prediction.insights.length > 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 16, background: '#f0fdfa', borderRadius: 14, border: '1px solid #ccfbf1' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#0d9488', marginBottom: 10 }}>🧠 AI Insights</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {prediction.insights.map((insight: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#14b8a6', marginTop: 5, flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { journalEntries, breathingSessions } = useApp();
  const { user } = useAuth();

  const getStreak = () => {
    const dates = new Set<string>();
    journalEntries.forEach(e => dates.add(new Date(e.timestamp).toDateString()));
    breathingSessions.forEach(s => dates.add(new Date(s.timestamp).toDateString()));
    if (dates.size === 0) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (dates.has(d.toDateString())) streak++;
      else break;
    }
    return streak;
  };

  const streak = getStreak();

  // Last 7 days mood data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayEntries = journalEntries.filter(e => new Date(e.timestamp).toDateString() === d.toDateString());
    const daySessions = breathingSessions.filter(s => new Date(s.timestamp).toDateString() === d.toDateString());
    const moodCounts: Record<string, number> = {};
    dayEntries.forEach(e => { moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1; });
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    return { day: d.toLocaleDateString('en-US', { weekday: 'short' }), date: d.getDate(), mood: dominantMood, sessions: daySessions.length, entries: dayEntries.length };
  });

  const totalSessions = breathingSessions.length;
  const totalEntries = journalEntries.length;
  const totalMinutes = Math.round(breathingSessions.reduce((a, s) => a + s.duration, 0) / 60);

  // Mood distribution
  const moodDistribution: Record<string, number> = {};
  journalEntries.forEach(e => { moodDistribution[e.mood] = (moodDistribution[e.mood] || 0) + 1; });
  const topMood = Object.entries(moodDistribution).sort((a, b) => b[1] - a[1])[0];

  // Breathing patterns used
  const patternCounts: Record<string, number> = {};
  breathingSessions.forEach(s => { patternCounts[s.pattern.name] = (patternCounts[s.pattern.name] || 0) + 1; });

  // Personalized recommendations
  const recommendations = [
    { icon: '🎨', title: 'Creative Time', desc: 'Your calm state is perfect for creative work, learning, or deep thinking.', color: '#8b5cf6', bg: '#faf5ff' },
    { icon: '🧊', title: 'Try Box Breathing', desc: 'Used by Navy SEALs — 4s in, 4s hold, 4s out, 4s hold. Great for focus.', color: '#06b6d4', bg: '#ecfeff' },
    { icon: '📝', title: 'Evening Journal', desc: 'Reflect on 3 positive moments from today before sleep.', color: '#f59e0b', bg: '#fffbeb' },
  ];

  return (
    <Container>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 80 }}>

        {/* Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Insights</h1>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Your wellness journey at a glance</p>
            </div>
            <button onClick={() => navigate('/app')} style={{ padding: '8px 14px', borderRadius: 10, background: 'white', border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Back
            </button>
          </div>
          {user?.id && (
            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={() => exportAsJSON(user.id!)} style={{ padding: '7px 12px', borderRadius: 8, background: 'white', border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Download size={13} /> JSON
              </button>
              <button onClick={() => exportAsCSV(user.id!)} style={{ padding: '7px 12px', borderRadius: 8, background: 'white', border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Download size={13} /> CSV
              </button>
              <button onClick={() => shareReport(user.id!)} style={{ padding: '7px 12px', borderRadius: 8, background: 'white', border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Share2 size={13} /> Share
              </button>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {[
            { icon: <Wind size={18} />, label: 'Sessions', value: totalSessions.toString(), color: '#0d9488', bg: '#f0fdfa' },
            { icon: <BookOpen size={18} />, label: 'Journal', value: totalEntries.toString(), color: '#7c3aed', bg: '#faf5ff' },
            { icon: <Clock size={18} />, label: 'Minutes', value: totalMinutes < 1000 ? `${totalMinutes}m` : `${(totalMinutes / 60).toFixed(1)}h`, color: '#06b6d4', bg: '#ecfeff' },
            { icon: <Flame size={18} />, label: 'Streak', value: `${streak}d`, color: '#f59e0b', bg: '#fffbeb' },
          ].map(({ icon, label, value, color, bg }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <div style={{ background: 'white', border: '1px solid #e8edf2', borderRadius: 14, padding: '16px 12px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color }}>{icon}</div>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 6, fontWeight: 600 }}>{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 7-Day Mood Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={18} color="#64748b" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>7-Day Mood Trend</h3>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 8, background: '#f0fdfa', fontSize: 12, fontWeight: 600, color: '#0d9488', display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={14} /> Trending
              </span>
            </div>

            {/* Chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 180, padding: '0 12px', borderBottom: '2px solid #f1f5f9' }}>
              {last7Days.map((d, i) => {
                const totalActivity = d.sessions + d.entries;
                const maxHeight = 140;
                const barHeight = Math.min(maxHeight, totalActivity * 35 + 20);
                const mood = d.mood ? MOODS[d.mood] : null;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
                    {mood && <span style={{ fontSize: 18 }}>{mood.emoji}</span>}
                    <div style={{ width: 32, borderRadius: '8px 8px 0 0', background: mood ? `${mood.color}25` : '#f1f5f9', height: barHeight, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8, transition: 'height 0.5s ease' }}>
                      {totalActivity > 0 && <div style={{ width: 8, height: 8, borderRadius: '50%', background: mood?.color || '#cbd5e1' }} />}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {/* Day Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 12px 0' }}>
              {last7Days.map((d, i) => (
                <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{d.day}</p>
                  <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{d.date}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* ML Mood Prediction */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Brain size={18} color="#8b5cf6" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>AI Mood Prediction</h3>
              </div>
              <span style={{ padding: '4px 12px', borderRadius: 8, background: '#faf5ff', fontSize: 12, fontWeight: 600, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Activity size={14} /> ML Engine
              </span>
            </div>

            <MoodPredictionWidget entries={journalEntries} />
          </Card>
        </motion.div>

        {/* Bottom Row: Recommendations + Mood Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>

          {/* Personalized Recommendations */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card style={{ padding: 24, height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Sparkles size={16} color="#f59e0b" />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Personalized Recommendations</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recommendations.map((rec, i) => (
                  <motion.div key={i} whileHover={{ x: 4 }} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 12, background: rec.bg, border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{rec.icon}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{rec.title}</p>
                      <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{rec.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Mood Distribution */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card style={{ padding: 24, height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Brain size={16} color="#8b5cf6" />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Mood Distribution</h3>
              </div>
              {topMood && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, background: MOODS[topMood[0]]?.bg || '#f8fafc', marginBottom: 16 }}>
                  <span style={{ fontSize: 32 }}>{MOODS[topMood[0]]?.emoji || '😐'}</span>
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', textTransform: 'capitalize' }}>{topMood[0]}</p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>Most frequent mood ({topMood[1]} times)</p>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(moodDistribution).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([mood, count]) => {
                  const m = MOODS[mood];
                  const maxCount = Math.max(...Object.values(moodDistribution));
                  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={mood} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16, width: 28, textAlign: 'center' }}>{m?.emoji || '😐'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>{mood}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{count}</span>
                        </div>
                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.5, duration: 0.8 }}
                            style={{ height: '100%', borderRadius: 3, background: m?.color || '#94a3b8' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(moodDistribution).length === 0 && (
                  <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                    <p style={{ fontSize: 13 }}>No mood data yet. Start journaling!</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Breathing Patterns */}
        {Object.keys(patternCounts).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Wind size={16} color="#0d9488" />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Breathing Patterns Used</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(patternCounts).sort((a, b) => b[1] - a[1]).map(([pattern, count]) => {
                  const maxCount = Math.max(...Object.values(patternCounts));
                  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={pattern} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d9488', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{pattern}</span>
                          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{count} session{count !== 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.6, duration: 0.8 }}
                            style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #14b8a6, #06b6d4)' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Action CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          style={{ display: 'flex', gap: 16, paddingBottom: 24 }}>
          <button onClick={() => navigate('/app/breathing')}
            style={{ flex: 1, padding: '16px 24px', borderRadius: 14, background: 'linear-gradient(135deg, #14b8a6, #06b6d4)', border: 'none', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(20,184,166,0.3)' }}>
            <Wind size={18} /> Start Breathing
          </button>
          <button onClick={() => navigate('/app/journal')}
            style={{ flex: 1, padding: '16px 24px', borderRadius: 14, background: 'white', border: '1px solid #e2e8f0', color: '#1e293b', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <BookOpen size={18} /> Write Journal
          </button>
        </motion.div>

      </motion.div>
    </Container>
  );
}

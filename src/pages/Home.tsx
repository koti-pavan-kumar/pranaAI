import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wind, BookOpen, MessageCircle, Sparkles, TrendingUp, Flame, ChevronRight, Activity, Cpu, Smartphone, LogOut, Settings, Zap, Shield } from 'lucide-react';
import { useApp } from '../store';
import { calculateWellnessScore, getRandomTip } from '../utils/sentiment';
import { useDeviceTelemetry } from '../hooks/useDeviceTelemetry';
import { useAuth } from '../auth';

const MOODS: Record<string, { emoji: string; color: string; bg: string }> = {
  happy: { emoji: '😊', color: '#059669', bg: '#ecfdf5' },
  calm: { emoji: '🧘', color: '#0d9488', bg: '#f0fdfa' },
  energetic: { emoji: '⚡', color: '#d97706', bg: '#fffbeb' },
  neutral: { emoji: '😐', color: '#6b7280', bg: '#f9fafb' },
  anxious: { emoji: '😰', color: '#dc2626', bg: '#fef2f2' },
  sad: { emoji: '😢', color: '#7c3aed', bg: '#faf5ff' },
};

function BreathingCircle() {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <linearGradient id="bcg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="50" fill="none" stroke="#e0f2fe" strokeWidth="4" />
      <circle cx="60" cy="60" r="50" fill="none" stroke="url(#bcg)" strokeWidth="4" strokeLinecap="round" strokeDasharray="100 214" style={{ animation: 'breathe-ring 4s ease-in-out infinite' }}>
        <animate attributeName="stroke-dasharray" values="50 264;150 164;50 264" dur="8s" repeatCount="indefinite" />
      </circle>
      <circle cx="60" cy="60" r="35" fill="url(#bcg)" opacity="0.08">
        <animate attributeName="r" values="30;40;30" dur="4s" repeatCount="indefinite" />
      </circle>
      <text x="60" y="55" textAnchor="middle" fontSize="20" fill="#14b8a6">🫁</text>
      <text x="60" y="75" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b7280">breathe</text>
    </svg>
  );
}

export default function Home() {
  const { userName, currentMood, journalEntries, breathingSessions } = useApp();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const score = calculateWellnessScore(breathingSessions, journalEntries);
  const tip = getRandomTip(currentMood);
  const { getFormattedData } = useDeviceTelemetry();
  const telemetry = getFormattedData();
  const mood = MOODS[currentMood] || MOODS.neutral;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      {/* ══════════ DESKTOP ══════════ */}
      <div className="only-md-flex" style={{ flexDirection: 'column' }}>

        {/* Top Bar */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Good evening, {user?.name || userName}</h1>
            <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{user?.email} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: '7px 14px', borderRadius: 10, background: '#f0fdfa', border: '1px solid #ccfbf1', fontSize: 12, fontWeight: 600, color: '#0d9488', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={14} /> ONNX Runtime
            </div>
            <div style={{ padding: '7px 14px', borderRadius: 10, background: '#f0fdfa', border: '1px solid #ccfbf1', fontSize: 12, fontWeight: 600, color: '#0d9488', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Smartphone size={14} /> {telemetry ? `${telemetry.phoneFirstPercentage}% Phone` : 'Tracking'}
            </div>
            <button onClick={logout} style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }}><LogOut size={16} /></button>
            <button onClick={() => navigate('/app/telemetry')} style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }}><Settings size={16} /></button>
          </div>
        </motion.div>

        {/* 3-Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

          {/* ── LEFT: Main Content ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Hero Banner — Animated Breathing */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: 'linear-gradient(135deg, #0f766e, #14b8a6, #06b6d4)', borderRadius: 20, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', bottom: -30, right: 60, width: 120, height: 120, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
              <div style={{ position: 'relative', maxWidth: 400 }}>
                <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>🫁 AI-Powered Breathing</p>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Start a breathing session</h2>
                <p style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.5, marginBottom: 16 }}>4 guided patterns with real-time camera detection. Track your breathing with TensorFlow.js on-device AI.</p>
                <button onClick={() => navigate('/app/breathing')} style={{ padding: '10px 24px', borderRadius: 12, background: 'white', color: '#0d9488', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                  Start Session →
                </button>
              </div>
              <div style={{ position: 'relative', flexShrink: 0 }}><BreathingCircle /></div>
            </motion.div>

            {/* Quick Actions — Vertical Cards */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Quick Actions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { icon: <Wind size={20} />, label: 'Voice Journal', desc: 'Speak & AI analyzes mood on-device', color: '#8b5cf6', bg: '#faf5ff', path: '/app/journal' },
                  { icon: <TrendingUp size={20} />, label: 'Wellness Dashboard', desc: '7-day mood trends & AI recommendations', color: '#06b6d4', bg: '#ecfeff', path: '/app/dashboard' },
                  { icon: <MessageCircle size={20} />, label: 'AI Health Chat', desc: 'Ask anything, get personalized advice', color: '#10b981', bg: '#ecfdf5', path: '/app/chat' },
                ].map(({ icon, label, desc, color, bg, path }) => (
                  <motion.button key={path} whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }} whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(path)} style={{ borderRadius: 16, padding: 20, textAlign: 'left', border: '1px solid #e2e8f0', cursor: 'pointer', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 14, transition: 'all 0.2s' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{label}</p>
                      <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* AI Insight */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '16px 20px', borderLeft: '4px solid #14b8a6', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              onClick={() => navigate('/app/chat')} className="widget-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={16} color="#0d9488" /></div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#0d9488' }}>AI Wellness Insight</p>
                  <p style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>{tip}</p>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Recent Activity</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ...journalEntries.slice(0, 2).map(e => ({ id: e.id, icon: MOODS[e.mood]?.emoji || '😐', text: e.text, time: e.timestamp, bg: MOODS[e.mood]?.bg || '#f9fafb' })),
                  ...breathingSessions.slice(0, 1).map(s => ({ id: s.id, icon: '💚', text: `${s.pattern.name} — ${s.completedCycles} cycles`, time: s.timestamp, bg: '#f0fdfa' })),
                ].map(item => (
                  <motion.div key={item.id} whileHover={{ x: 4 }} className="widget-card" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: '#1e293b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.text}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{new Date(item.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <ChevronRight size={16} color="#cbd5e1" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Telemetry */}
            <motion.div whileHover={{ x: 4 }} onClick={() => navigate('/app/telemetry')} className="widget-card"
              style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={16} color="#0d9488" /></div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Device Telemetry</p>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{telemetry ? `${telemetry.phoneFirstPercentage}% phone-first · ${telemetry.totalInteractions} interactions` : 'Track phone vs laptop usage'}</p>
              </div>
              <ChevronRight size={16} color="#cbd5e1" />
            </motion.div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>

            {/* Wellness Score */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 18, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wellness Score</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontSize: 12, fontWeight: 700 }}><Flame size={14} />{score.streak}d</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <svg width="90" height="90" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="url(#sgr)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${score.overall * 2.64} ${264 - score.overall * 2.64}`} />
                    <defs><linearGradient id="sgr"><stop offset="0%" stopColor="#14b8a6" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{score.overall}</span></div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[{ l: 'Mood', v: score.mood, c: '#14b8a6' }, { l: 'Breathing', v: score.breathing, c: '#06b6d4' }, { l: 'Journal', v: score.journal, c: '#8b5cf6' }].map(({ l, v, c }) => (
                    <div key={l}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ fontSize: 11, color: '#64748b' }}>{l}</span><span style={{ fontSize: 11, fontWeight: 700, color: c }}>{v}%</span></div>
                      <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 3, background: c, width: `${v}%`, transition: 'width 1s ease' }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Current Mood */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 18, padding: 24, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Current Mood</p>
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
                style={{ width: 56, height: 56, borderRadius: 16, background: mood.bg, border: `2px solid ${mood.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <span style={{ fontSize: 28 }}>{mood.emoji}</span>
              </motion.div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>{currentMood}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Based on latest entry</p>
            </div>

            {/* Breathing Stats */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 18, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Activity Stats</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Sessions', value: breathingSessions.length.toString(), icon: <Wind size={14} />, color: '#0d9488', bg: '#f0fdfa' },
                  { label: 'Total Time', value: `${Math.round(breathingSessions.reduce((a, s) => a + s.duration, 0) / 60)}m`, icon: <Activity size={14} />, color: '#06b6d4', bg: '#ecfeff' },
                  { label: 'Journal', value: journalEntries.length.toString(), icon: <BookOpen size={14} />, color: '#7c3aed', bg: '#faf5ff' },
                  { label: 'Streak', value: `${score.streak}d`, icon: <Flame size={14} />, color: '#f59e0b', bg: '#fffbeb' },
                ].map(({ label, value, icon, color, bg }) => (
                  <div key={label} style={{ background: bg, borderRadius: 12, padding: '14px 10px', textAlign: 'center' }}>
                    <div style={{ color, display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{icon}</div>
                    <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{value}</p>
                    <p style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 18, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Powered By</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: <Zap size={12} />, label: 'TensorFlow.js', sub: 'Pose detection', color: '#f59e0b' },
                  { icon: <Cpu size={12} />, label: 'ONNX Runtime', sub: 'Sentiment analysis', color: '#3b82f6' },
                  { icon: <Shield size={12} />, label: '100% Private', sub: 'Zero cloud uploads', color: '#10b981' },
                ].map(({ icon, label, sub, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{label}</p>
                      <p style={{ fontSize: 10, color: '#94a3b8' }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy */}
            <div style={{ borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
              <p style={{ fontSize: 11, color: '#166534', fontWeight: 500 }}>All AI on-device · Zero cloud · 100% Private 🔒</p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ MOBILE ══════════ */}
      <div className="only-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 420, margin: '0 auto' }}>
        {/* Mobile Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>{getGreeting()}</p>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{user?.name || userName}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={logout} style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer' }}><LogOut size={14} /></button>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: mood.bg, border: `1px solid ${mood.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 18 }}>{mood.emoji}</span></div>
          </div>
        </div>

        {/* Mobile Hero */}
        <motion.div style={{ background: 'linear-gradient(135deg, #0f766e, #14b8a6, #06b6d4)', borderRadius: 16, padding: 18, color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
          <div style={{ position: 'relative' }}>
            <p style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>🫁 AI Breathing</p>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Start breathing session</h2>
            <p style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.4, marginBottom: 12 }}>4 patterns with camera detection</p>
            <button onClick={() => navigate('/app/breathing')} style={{ padding: '8px 18px', borderRadius: 10, background: 'white', color: '#0d9488', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer' }}>Start →</button>
          </div>
        </motion.div>

        {/* Mobile Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: <BookOpen size={18} />, label: 'Voice Journal', color: '#8b5cf6', bg: '#faf5ff', path: '/app/journal' },
            { icon: <TrendingUp size={18} />, label: 'Dashboard', color: '#06b6d4', bg: '#ecfeff', path: '/app/dashboard' },
            { icon: <MessageCircle size={18} />, label: 'AI Chat', color: '#10b981', bg: '#ecfdf5', path: '/app/chat' },
            { icon: <Activity size={18} />, label: 'Telemetry', color: '#f59e0b', bg: '#fffbeb', path: '/app/telemetry' },
          ].map(({ icon, label, color, bg, path }) => (
            <motion.button key={path} whileTap={{ scale: 0.97 }} onClick={() => navigate(path)}
              style={{ borderRadius: 14, padding: 16, textAlign: 'left', border: '1px solid #e2e8f0', cursor: 'pointer', background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{label}</p>
            </motion.button>
          ))}
        </div>

        {/* Mobile Wellness Score */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wellness Score</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#f59e0b', fontSize: 11, fontWeight: 700 }}><Flame size={12} />{score.streak}d</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <svg width="72" height="72" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="url(#sgm)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${score.overall * 2.64} ${264 - score.overall * 2.64}`} />
                <defs><linearGradient id="sgm"><stop offset="0%" stopColor="#14b8a6" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{score.overall}</span></div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[{ l: 'Mood', v: score.mood, c: '#14b8a6' }, { l: 'Breathing', v: score.breathing, c: '#06b6d4' }, { l: 'Journal', v: score.journal, c: '#8b5cf6' }].map(({ l, v, c }) => (
                <div key={l}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}><span style={{ fontSize: 10, color: '#64748b' }}>{l}</span><span style={{ fontSize: 10, fontWeight: 700, color: c }}>{v}%</span></div>
                  <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 2, background: c, width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile AI Insight */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, borderLeft: '3px solid #14b8a6', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }} onClick={() => navigate('/app/chat')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={14} color="#0d9488" />
            <div><p style={{ fontSize: 11, fontWeight: 600, color: '#0d9488' }}>AI Insight</p><p style={{ fontSize: 12, color: '#334155', marginTop: 1 }}>{tip}</p></div>
          </div>
        </div>

        {/* Mobile Recent */}
        <div>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Recent</h3>
          {journalEntries.slice(0, 2).map(entry => (
            <div key={entry.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
              <span style={{ fontSize: 16 }}>{MOODS[entry.mood]?.emoji || '😐'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, color: '#1e293b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.text}</p>
                <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <ChevronRight size={12} color="#cbd5e1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

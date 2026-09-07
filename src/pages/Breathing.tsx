import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Play, Pause, Camera, Wind } from 'lucide-react';
import { useApp } from '../store';
import type { BreathingPattern } from '../types';

const PATTERNS: BreathingPattern[] = [
  { name: '4-7-8 Calm', description: 'Deep relaxation & sleep', inhale: 4, holdIn: 7, exhale: 8, holdOut: 0, icon: '🌙', color: '#8b5cf6' },
  { name: 'Box Breathing', description: 'Focus & clarity', inhale: 4, holdIn: 4, exhale: 4, holdOut: 4, icon: '🧊', color: '#06b6d4' },
  { name: 'Energize', description: 'Quick energy boost', inhale: 2, holdIn: 0, exhale: 2, holdOut: 0, icon: '⚡', color: '#f59e0b' },
  { name: 'Deep Calm', description: 'Anxiety relief', inhale: 6, holdIn: 2, exhale: 8, holdOut: 2, icon: '🌊', color: '#10b981' },
];

export default function Breathing() {
  const navigate = useNavigate();
  const { addBreathingSession } = useApp();
  const [selected, setSelected] = useState<BreathingPattern | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'holdIn' | 'exhale' | 'holdOut'>('inhale');
  const [timeLeft, setTimeLeft] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const getPhaseLabel = () => {
    if (!selected) return '';
    const labels: Record<string, string> = { inhale: 'Breathe In', holdIn: 'Hold', exhale: 'Breathe Out', holdOut: 'Hold' };
    return labels[phase];
  };

  const getPhaseColor = () => {
    if (!selected) return '#14b8a6';
    const colors: Record<string, string> = { inhale: '#14b8a6', holdIn: '#8b5cf6', exhale: '#06b6d4', holdOut: '#f59e0b' };
    return colors[phase];
  };

  useEffect(() => {
    if (!isActive || isPaused || !selected) return;
    const totalPhaseTime = phase === 'inhale' ? selected.inhale : phase === 'holdIn' ? selected.holdIn : phase === 'exhale' ? selected.exhale : selected.holdOut;
    if (totalPhaseTime === 0) { advancePhase(); return; }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { advancePhase(); return totalPhaseTime; }
        return prev - 1;
      });
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive, isPaused, phase, selected]);

  const advancePhase = useCallback(() => {
    if (!selected) return;
    const sequence: Array<{ phase: BreathingPattern['name'] extends string ? 'inhale' | 'holdIn' | 'exhale' | 'holdOut' : never }> = [];
    if (selected.inhale > 0) sequence.push({ phase: 'inhale' });
    if (selected.holdIn > 0) sequence.push({ phase: 'holdIn' });
    if (selected.exhale > 0) sequence.push({ phase: 'exhale' });
    if (selected.holdOut > 0) sequence.push({ phase: 'holdOut' });

    setPhase(prev => {
      const idx = sequence.findIndex(s => s.phase === prev);
      const next = sequence[(idx + 1) % sequence.length];
      if (next.phase === 'inhale') setCycles(c => c + 1);
      return next.phase as 'inhale' | 'holdIn' | 'exhale' | 'holdOut';
    });
  }, [selected]);

  const startSession = (pattern: BreathingPattern) => {
    setSelected(pattern);
    setIsActive(true);
    setIsPaused(false);
    setPhase('inhale');
    setTimeLeft(pattern.inhale);
    setCycles(0);
    setElapsed(0);
  };

  const stopSession = () => {
    if (selected && elapsed > 0) {
      addBreathingSession({ pattern: selected, duration: elapsed, completedCycles: cycles });
    }
    setIsActive(false);
    setSelected(null);
  };

  // ── Active Session View ──
  if (isActive && selected) {
    return (
      <div>
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => { stopSession(); }}
          style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, width: 40, height: 40, borderRadius: 12, background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <ChevronLeft size={20} color="#475569" />
        </motion.button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 24, padding: '40px 20px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Now Breathing</p>

          <motion.div animate={{ scale: phase === 'inhale' ? 1.3 : phase === 'exhale' ? 0.8 : 1 }} transition={{ duration: 2, ease: 'easeInOut' }}
            style={{ width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${getPhaseColor()}20 0%, transparent 70%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${getPhaseColor()}30` }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: getPhaseColor() }}>{getPhaseLabel()}</p>
              <p style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{timeLeft}</p>
            </div>
          </motion.div>

          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{cycles}</p>
              <p style={{ fontSize: 10, color: '#94a3b8' }}>Cycles</p>
            </div>
            <button onClick={() => setIsPaused(!isPaused)} style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${getPhaseColor()}, ${getPhaseColor()}dd)`, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 4px 16px ${getPhaseColor()}40` }}>
              {isPaused ? <Play size={24} color="white" /> : <Pause size={24} color="white" />}
            </button>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}</p>
              <p style={{ fontSize: 10, color: '#94a3b8' }}>Duration</p>
            </div>
          </div>

          <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', maxWidth: 300 }}>{selected.name} · {selected.description}</p>
        </div>
      </div>
    );
  }

  // ── Pattern Selection View ──
  return (
    <div>
      {/* Desktop */}
      <div className="only-md-flex" style={{ flexDirection: 'column', gap: 24 }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>Breathe</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Choose a breathing pattern to begin your session</p>
        </motion.div>

        {/* Camera Breathing CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onClick={() => navigate('/app/camera')} className="widget-card"
          style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #14b8a6' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={20} color="#0d9488" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>📷 Camera Breathing</p>
              <span style={{ padding: '2px 8px', borderRadius: 6, background: '#dcfce7', color: '#16a34a', fontSize: 10, fontWeight: 700 }}>PHONE-FIRST</span>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>AI detects your breathing via front camera · Uses iQOO 15 NPU</p>
          </div>
          <ChevronLeft size={18} color="#cbd5e1" style={{ transform: 'rotate(180deg)' }} />
        </motion.div>

        {/* Pattern Cards */}
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Guided Patterns</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {PATTERNS.map((pattern, i) => (
              <motion.button key={pattern.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }} whileTap={{ scale: 0.98 }}
                onClick={() => startSession(pattern)}
                style={{ borderRadius: 16, padding: 20, textAlign: 'left', border: `2px solid ${pattern.color}20`, cursor: 'pointer', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${pattern.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{pattern.icon}</div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{pattern.name}</p>
                  <p style={{ fontSize: 12, color: '#64748b' }}>{pattern.description}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {pattern.inhale > 0 && <span style={{ padding: '3px 8px', borderRadius: 6, background: '#f0fdfa', fontSize: 10, fontWeight: 600, color: '#0d9488' }}>In {pattern.inhale}s</span>}
                  {pattern.holdIn > 0 && <span style={{ padding: '3px 8px', borderRadius: 6, background: '#faf5ff', fontSize: 10, fontWeight: 600, color: '#7c3aed' }}>Hold {pattern.holdIn}s</span>}
                  {pattern.exhale > 0 && <span style={{ padding: '3px 8px', borderRadius: 6, background: '#ecfeff', fontSize: 10, fontWeight: 600, color: '#0891b2' }}>Out {pattern.exhale}s</span>}
                  {pattern.holdOut > 0 && <span style={{ padding: '3px 8px', borderRadius: 6, background: '#fffbeb', fontSize: 10, fontWeight: 600, color: '#d97706' }}>Hold {pattern.holdOut}s</span>}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Phone-First Info */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Wind size={16} color="#16a34a" style={{ marginTop: 2, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#166534', lineHeight: 1.5 }}><strong>Phone-First Feature:</strong> Point your camera at yourself during breathing for real-time posture feedback. The iQOO 15's NPU detects breathing patterns via chest movement analysis.</p>
        </div>
      </div>

      {/* Mobile */}
      <div className="only-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 420, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Breathe</h1>
        <p style={{ fontSize: 13, color: '#64748b' }}>Choose a pattern to begin</p>

        <div onClick={() => navigate('/app/camera')} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderLeft: '3px solid #14b8a6' }}>
          <Camera size={16} color="#0d9488" />
          <div><p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>📷 Camera Breathing</p><p style={{ fontSize: 11, color: '#64748b' }}>AI detects via camera</p></div>
        </div>

        {PATTERNS.map((pattern, i) => (
          <motion.button key={pattern.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            whileTap={{ scale: 0.98 }} onClick={() => startSession(pattern)}
            style={{ borderRadius: 14, padding: 16, textAlign: 'left', border: '1px solid #e2e8f0', cursor: 'pointer', background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${pattern.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{pattern.icon}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{pattern.name}</p>
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{pattern.description}</p>
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                {pattern.inhale > 0 && <span style={{ padding: '2px 6px', borderRadius: 4, background: '#f0fdfa', fontSize: 9, fontWeight: 600, color: '#0d9488' }}>In {pattern.inhale}s</span>}
                {pattern.exhale > 0 && <span style={{ padding: '2px 6px', borderRadius: 4, background: '#ecfeff', fontSize: 9, fontWeight: 600, color: '#0891b2' }}>Out {pattern.exhale}s</span>}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

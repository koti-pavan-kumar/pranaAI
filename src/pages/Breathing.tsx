import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Play, Pause, Camera, Wind, Sparkles, Heart, Clock, Zap } from 'lucide-react';
import { useApp } from '../store';
import type { BreathingPattern } from '../types';

const PATTERNS: BreathingPattern[] = [
  { name: '4-7-8 Calm', description: 'Deep relaxation & sleep', inhale: 4, holdIn: 7, exhale: 8, holdOut: 0, icon: '🌙', color: '#8b5cf6' },
  { name: 'Box Breathing', description: 'Focus & clarity', inhale: 4, holdIn: 4, exhale: 4, holdOut: 4, icon: '🧊', color: '#06b6d4' },
  { name: 'Energize', description: 'Quick energy boost', inhale: 2, holdIn: 0, exhale: 2, holdOut: 0, icon: '⚡', color: '#f59e0b' },
  { name: 'Deep Calm', description: 'Anxiety relief', inhale: 6, holdIn: 2, exhale: 8, holdOut: 2, icon: '🌊', color: '#10b981' },
];

const PHASE_CONFIG = {
  inhale: { label: 'Breathe In', instruction: 'Expand your chest slowly', icon: '🫁', color: '#14b8a6', gradient: 'from-teal-400 to-cyan-400' },
  holdIn: { label: 'Hold', instruction: 'Keep the air in', icon: '💎', color: '#8b5cf6', gradient: 'from-violet-400 to-purple-400' },
  exhale: { label: 'Breathe Out', instruction: 'Release slowly through your mouth', icon: '💨', color: '#06b6d4', gradient: 'from-cyan-400 to-blue-400' },
  holdOut: { label: 'Hold', instruction: 'Pause before the next breath', icon: '⏸️', color: '#f59e0b', gradient: 'from-amber-400 to-orange-400' },
};

const TIPS = [
  'Place your tongue behind your upper front teeth',
  'Breathe through your nose, out through your mouth',
  'Keep your shoulders relaxed and down',
  'Focus on the sensation of air flowing',
  'Let your belly expand, not just your chest',
  'Count each breath cycle to stay present',
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
  const [currentTip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  const getPhaseLabel = () => {
    if (!selected) return '';
    return PHASE_CONFIG[phase].label;
  };

  const getPhaseColor = () => {
    if (!selected) return '#14b486';
    return PHASE_CONFIG[phase].color;
  };

  const getPhaseInstruction = () => {
    if (!selected) return '';
    return PHASE_CONFIG[phase].instruction;
  };

  // Get all phases in order for progress display
  const getPhaseSequence = () => {
    if (!selected) return [];
    const seq: Array<{ phase: 'inhale' | 'holdIn' | 'exhale' | 'holdOut'; duration: number }> = [];
    if (selected.inhale > 0) seq.push({ phase: 'inhale', duration: selected.inhale });
    if (selected.holdIn > 0) seq.push({ phase: 'holdIn', duration: selected.holdIn });
    if (selected.exhale > 0) seq.push({ phase: 'exhale', duration: selected.exhale });
    if (selected.holdOut > 0) seq.push({ phase: 'holdOut', duration: selected.holdOut });
    return seq;
  };

  const phaseSequence = getPhaseSequence();
  const currentPhaseIndex = phaseSequence.findIndex(p => p.phase === phase);
  const totalPhaseTime = phaseSequence[currentPhaseIndex]?.duration || 1;
  const phaseProgress = 1 - (timeLeft / totalPhaseTime);

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
    const sequence: Array<{ phase: 'inhale' | 'holdIn' | 'exhale' | 'holdOut' }> = [];
    if (selected.inhale > 0) sequence.push({ phase: 'inhale' });
    if (selected.holdIn > 0) sequence.push({ phase: 'holdIn' });
    if (selected.exhale > 0) sequence.push({ phase: 'exhale' });
    if (selected.holdOut > 0) sequence.push({ phase: 'holdOut' });

    setPhase(prev => {
      const idx = sequence.findIndex(s => s.phase === prev);
      const next = sequence[(idx + 1) % sequence.length];
      if (next.phase === 'inhale') setCycles(c => c + 1);
      return next.phase;
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
      <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #f0fdfa 100%)' }}>
        {/* Animated Background Particles */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -30, 0],
                x: [0, (i % 2 === 0 ? 15 : -15), 0],
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.3,
              }}
              style={{
                position: 'absolute',
                left: `${10 + (i * 8) % 80}%`,
                top: `${15 + (i * 12) % 70}%`,
                width: 60 + i * 10,
                height: 60 + i * 10,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${getPhaseColor()}15, transparent)`,
                filter: 'blur(20px)',
              }}
            />
          ))}
        </div>

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={stopSession}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 20,
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <ChevronLeft size={20} color="#475569" />
        </motion.button>

        {/* Pattern Name */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <span style={{ fontSize: 20 }}>{selected.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{selected.name}</span>
          </div>
          <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{selected.description}</p>
        </motion.div>

        {/* Main Content */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '80px 24px 40px',
          position: 'relative',
          zIndex: 10,
        }}>
          {/* Phase Progress Dots */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 40,
              padding: '12px 24px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            {phaseSequence.map((p, i) => (
              <div key={p.phase} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <motion.div
                  animate={{
                    scale: p.phase === phase ? [1, 1.2, 1] : 1,
                    background: p.phase === phase ? PHASE_CONFIG[p.phase].color : i < currentPhaseIndex ? `${PHASE_CONFIG[p.phase].color}60` : '#e2e8f0',
                  }}
                  transition={{ duration: 1.5, repeat: p.phase === phase ? Infinity : 0 }}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    border: `2px solid ${p.phase === phase ? PHASE_CONFIG[p.phase].color : 'transparent'}`,
                    boxShadow: p.phase === phase ? `0 0 12px ${PHASE_CONFIG[p.phase].color}40` : 'none',
                  }}
                />
                {i < phaseSequence.length - 1 && (
                  <div style={{
                    width: 20,
                    height: 2,
                    background: i < currentPhaseIndex ? `${getPhaseColor()}40` : '#e2e8f0',
                    borderRadius: 1,
                  }} />
                )}
              </div>
            ))}
          </motion.div>

          {/* Breathing Circle */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            style={{ position: 'relative', marginBottom: 32 }}
          >
            {/* Outer glow ring */}
            <motion.div
              animate={{
                scale: phase === 'inhale' ? 1.15 : phase === 'exhale' ? 0.85 : 1,
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: totalPhaseTime, ease: 'easeInOut', repeat: Infinity }}
              style={{
                position: 'absolute',
                inset: -20,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${getPhaseColor()}20 0%, transparent 70%)`,
                border: `2px solid ${getPhaseColor()}15`,
              }}
            />

            {/* Main circle */}
            <motion.div
              animate={{
                scale: phase === 'inhale' ? 1.2 : phase === 'exhale' ? 0.8 : 1,
              }}
              transition={{ duration: totalPhaseTime, ease: 'easeInOut' }}
              style={{
                width: 240,
                height: 240,
                borderRadius: '50%',
                background: `radial-gradient(circle at 30% 30%, ${getPhaseColor()}25 0%, ${getPhaseColor()}08 50%, transparent 70%)`,
                border: `3px solid ${getPhaseColor()}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: `0 0 60px ${getPhaseColor()}15, inset 0 0 40px ${getPhaseColor()}08`,
              }}
            >
              {/* Inner ring */}
              <div style={{
                position: 'absolute',
                inset: 15,
                borderRadius: '50%',
                border: `2px solid ${getPhaseColor()}20`,
              }} />

              {/* Progress arc */}
              <svg
                width="240"
                height="240"
                style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
              >
                <circle
                  cx="120"
                  cy="120"
                  r="115"
                  fill="none"
                  stroke={`${getPhaseColor()}15`}
                  strokeWidth="4"
                />
                <motion.circle
                  cx="120"
                  cy="120"
                  r="115"
                  fill="none"
                  stroke={getPhaseColor()}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 115}
                  strokeDashoffset={2 * Math.PI * 115 * (1 - phaseProgress)}
                  transition={{ duration: 0.3 }}
                />
              </svg>

              {/* Content */}
              <div style={{ textAlign: 'center', zIndex: 10 }}>
                <motion.span
                  key={phase}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ fontSize: 32, display: 'block', marginBottom: 4 }}
                >
                  {PHASE_CONFIG[phase].icon}
                </motion.span>
                <motion.p
                  key={`label-${phase}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ fontSize: 18, fontWeight: 700, color: getPhaseColor() }}
                >
                  {getPhaseLabel()}
                </motion.p>
                <motion.p
                  key={`time-${timeLeft}`}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{ fontSize: 48, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}
                >
                  {timeLeft}
                </motion.p>
              </div>
            </motion.div>
          </motion.div>

          {/* Phase Instruction */}
          <motion.p
            key={`instr-${phase}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: 14,
              color: '#64748b',
              textAlign: 'center',
              marginBottom: 32,
              maxWidth: 280,
            }}
          >
            {getPhaseInstruction()}
          </motion.p>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              marginBottom: 32,
            }}
          >
            {/* Cycles */}
            <div style={{
              textAlign: 'center',
              padding: '16px 24px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{cycles}</p>
              <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Cycles</p>
            </div>

            {/* Play/Pause */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPaused(!isPaused)}
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: `linear-gradient(135deg, ${getPhaseColor()}, ${getPhaseColor()}cc)`,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: `0 8px 24px ${getPhaseColor()}40`,
              }}
            >
              {isPaused ? <Play size={28} color="white" /> : <Pause size={28} color="white" />}
            </motion.button>

            {/* Duration */}
            <div style={{
              textAlign: 'center',
              padding: '16px 24px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
                {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>Duration</p>
            </div>
          </motion.div>

          {/* Session Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 24,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {[
              { icon: <Heart size={14} />, label: 'Relaxation', value: phase === 'exhale' ? 'Active' : 'Building', color: '#ef4444' },
              { icon: <Zap size={14} />, label: 'Focus', value: cycles > 3 ? 'High' : 'Medium', color: '#f59e0b' },
              { icon: <Clock size={14} />, label: 'Progress', value: `${Math.min(100, Math.round((elapsed / 180) * 100))}%`, color: '#8b5cf6' },
            ].map(({ icon, label, value, color }) => (
              <div key={label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.5)',
              }}>
                <span style={{ color }}>{icon}</span>
                <div>
                  <p style={{ fontSize: 10, color: '#94a3b8' }}>{label}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{value}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Breathing Tip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(8px)',
              maxWidth: 320,
            }}
          >
            <Sparkles size={14} color="#f59e0b" />
            <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{currentTip}</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Pattern Selection View ──
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #e0f2fe 100%)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ paddingTop: 24, marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>Breathe</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Choose a breathing pattern to begin your session</p>
        </motion.div>

        {/* Camera Breathing CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate('/app/camera')}
          whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(20,184,166,0.15)' }}
          style={{
            background: 'linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%)',
            border: '1px solid #ccfbf1',
            borderRadius: 18,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            cursor: 'pointer',
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(20,184,166,0.08)',
          }}
        >
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(20,184,166,0.3)',
          }}>
            <Camera size={24} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Camera Breathing</p>
              <span style={{ padding: '3px 8px', borderRadius: 6, background: '#dcfce7', color: '#16a34a', fontSize: 10, fontWeight: 700 }}>PHONE-FIRST</span>
            </div>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>AI detects your breathing via front camera · Uses iQOO 15 NPU</p>
          </div>
          <ChevronLeft size={18} color="#94a3b8" style={{ transform: 'rotate(180deg)' }} />
        </motion.div>

        {/* Pattern Cards */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Guided Patterns</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {PATTERNS.map((pattern, i) => (
              <motion.button
                key={pattern.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startSession(pattern)}
                style={{
                  borderRadius: 18,
                  padding: 22,
                  textAlign: 'left',
                  border: `2px solid ${pattern.color}15`,
                  cursor: 'pointer',
                  background: `linear-gradient(135deg, white 0%, ${pattern.color}05 100%)`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: `linear-gradient(135deg, ${pattern.color}15, ${pattern.color}08)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                }}>
                  {pattern.icon}
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{pattern.name}</p>
                  <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{pattern.description}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {pattern.inhale > 0 && <span style={{ padding: '4px 10px', borderRadius: 8, background: '#f0fdfa', fontSize: 11, fontWeight: 600, color: '#0d9488' }}>In {pattern.inhale}s</span>}
                  {pattern.holdIn > 0 && <span style={{ padding: '4px 10px', borderRadius: 8, background: '#faf5ff', fontSize: 11, fontWeight: 600, color: '#7c3aed' }}>Hold {pattern.holdIn}s</span>}
                  {pattern.exhale > 0 && <span style={{ padding: '4px 10px', borderRadius: 8, background: '#ecfeff', fontSize: 11, fontWeight: 600, color: '#0891b2' }}>Out {pattern.exhale}s</span>}
                  {pattern.holdOut > 0 && <span style={{ padding: '4px 10px', borderRadius: 8, background: '#fffbeb', fontSize: 11, fontWeight: 600, color: '#d97706' }}>Hold {pattern.holdOut}s</span>}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            background: 'white',
            borderRadius: 18,
            padding: 24,
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>✨ Why Breathing Exercises Work</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { icon: '🧠', title: 'Reduces Cortisol', desc: 'Lowers stress hormones by up to 25%' },
              { icon: '💤', title: 'Improves Sleep', desc: '4-7-8 pattern helps you fall asleep faster' },
              { icon: '🎯', title: 'Boosts Focus', desc: 'Box breathing used by Navy SEALs' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ textAlign: 'center', padding: 12 }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>{icon}</span>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{title}</p>
                <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Phone-First Info */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '1px solid #bbf7d0',
          borderRadius: 14,
          padding: 16,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 24,
        }}>
          <Wind size={16} color="#16a34a" style={{ marginTop: 2, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#166534', lineHeight: 1.5 }}>
            <strong>Phone-First Feature:</strong> Point your camera at yourself during breathing for real-time posture feedback. The iQOO 15's NPU detects breathing patterns via chest movement analysis.
          </p>
        </div>
      </div>
    </div>
  );
}

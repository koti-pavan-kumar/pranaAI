import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BreathingPattern } from '../types';

interface BreathingCircleProps {
  pattern: BreathingPattern;
  isActive: boolean;
  onComplete?: () => void;
  onCycleComplete?: (cycle: number) => void;
}

export default function BreathingCircle({ pattern, isActive, onComplete, onCycleComplete }: BreathingCircleProps) {
  const [phase, setPhase] = useState<'inhale' | 'holdIn' | 'exhale' | 'holdOut' | 'idle'>('idle');
  const [cycleCount, setCycleCount] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const totalCycles = 5;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalCycleDuration = pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut;

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  }, []);

  useEffect(() => {
    if (!isActive) {
      clearTimers();
      setPhase('idle');
      setCycleCount(0);
      setPhaseProgress(0);
      return;
    }

    let currentCycle = 0;

    const runCycle = () => {
      if (currentCycle >= totalCycles) {
        setPhase('idle');
        onComplete?.();
        return;
      }

      // Inhale
      setPhase('inhale');
      setPhaseProgress(0);
      const inhaleInterval = setInterval(() => {
        setPhaseProgress(p => Math.min(p + 100 / (pattern.inhale * 20), 100));
      }, 50);

      timerRef.current = setTimeout(() => {
        clearInterval(inhaleInterval);
        if (pattern.holdIn > 0) {
          // Hold In
          setPhase('holdIn');
          setPhaseProgress(0);
          const holdInInterval = setInterval(() => {
            setPhaseProgress(p => Math.min(p + 100 / (pattern.holdIn * 20), 100));
          }, 50);

          timerRef.current = setTimeout(() => {
            clearInterval(holdInInterval);
            doExhale();
          }, pattern.holdIn * 1000);
        } else {
          doExhale();
        }
      }, pattern.inhale * 1000);

      const doExhale = () => {
        // Exhale
        setPhase('exhale');
        setPhaseProgress(0);
        const exhaleInterval = setInterval(() => {
          setPhaseProgress(p => Math.min(p + 100 / (pattern.exhale * 20), 100));
        }, 50);

        timerRef.current = setTimeout(() => {
          clearInterval(exhaleInterval);
          if (pattern.holdOut > 0) {
            // Hold Out
            setPhase('holdOut');
            setPhaseProgress(0);
            const holdOutInterval = setInterval(() => {
              setPhaseProgress(p => Math.min(p + 100 / (pattern.holdOut * 20), 100));
            }, 50);

            timerRef.current = setTimeout(() => {
              clearInterval(holdOutInterval);
              currentCycle++;
              setCycleCount(currentCycle);
              onCycleComplete?.(currentCycle);
              runCycle();
            }, pattern.holdOut * 1000);
          } else {
            currentCycle++;
            setCycleCount(currentCycle);
            onCycleComplete?.(currentCycle);
            runCycle();
          }
        }, pattern.exhale * 1000);
      };

      progressRef.current = setInterval(() => {
        // This is just to trigger re-renders for smooth animation
      }, 50);
    };

    runCycle();

    return clearTimers;
  }, [isActive, pattern, clearTimers, onComplete, onCycleComplete, totalCycles]);

  const getScale = () => {
    switch (phase) {
      case 'inhale': return 1 + (phaseProgress / 100) * 0.6;
      case 'holdIn': return 1.6;
      case 'exhale': return 1.6 - (phaseProgress / 100) * 0.6;
      case 'holdOut': return 1;
      default: return 1;
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case 'inhale': return 'Breathe In';
      case 'holdIn': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'holdOut': return 'Hold';
      default: return 'Ready';
    }
  };

  const getPhaseTime = () => {
    switch (phase) {
      case 'inhale': return Math.ceil(pattern.inhale * (1 - phaseProgress / 100));
      case 'holdIn': return Math.ceil(pattern.holdIn * (1 - phaseProgress / 100));
      case 'exhale': return Math.ceil(pattern.exhale * (1 - phaseProgress / 100));
      case 'holdOut': return Math.ceil(pattern.holdOut * (1 - phaseProgress / 100));
      default: return 0;
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow rings */}
      <div className="absolute w-72 h-72 rounded-full" style={{
        background: `radial-gradient(circle, ${pattern.color}15 0%, transparent 70%)`,
        transform: `scale(${getScale() * 1.2})`,
        transition: 'transform 0.1s linear',
      }} />

      {/* Pulse rings */}
      {isActive && phase !== 'idle' && (
        <>
          <motion.div
            className="absolute w-64 h-64 rounded-full border border-white/10"
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: totalCycleDuration, repeat: Infinity }}
          />
          <motion.div
            className="absolute w-56 h-56 rounded-full border border-white/5"
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: totalCycleDuration, repeat: Infinity, delay: 0.5 }}
          />
        </>
      )}

      {/* Main circle */}
      <motion.div
        className="relative w-52 h-52 rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${pattern.color}40, ${pattern.color}15)`,
          boxShadow: isActive ? `0 0 60px ${pattern.color}30, 0 0 120px ${pattern.color}10` : 'none',
          transform: `scale(${getScale()})`,
          transition: 'transform 0.1s linear',
        }}
      >
        {/* Inner glow */}
        <div className="absolute inset-4 rounded-full" style={{
          background: `radial-gradient(circle at 40% 40%, ${pattern.color}30, transparent)`,
        }} />

        {/* Content */}
        <div className="relative text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center"
            >
              <p className="text-2xl font-light text-white/90 mb-1">
                {getPhaseLabel()}
              </p>
              {phase !== 'idle' && (
                <p className="text-5xl font-bold text-white" style={{ color: pattern.color }}>
                  {getPhaseTime()}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Cycle counter */}
      {isActive && (
        <div className="absolute -bottom-8 flex items-center gap-2">
          {Array.from({ length: totalCycles }).map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              animate={{
                backgroundColor: i < cycleCount ? pattern.color : i === cycleCount && isActive ? `${pattern.color}80` : 'rgba(255,255,255,0.2)',
                scale: i === cycleCount && isActive ? [1, 1.3, 1] : 1,
              }}
              transition={{ duration: 0.5 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

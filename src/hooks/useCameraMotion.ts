import { useRef, useCallback, useState, useEffect } from 'react';

export type BreathingPattern = 'normal' | 'shallow' | 'deep' | 'irregular' | 'stress' | 'calm';

export interface PatternClassification {
  pattern: BreathingPattern;
  confidence: number; // 0-100
  description: string;
  healthImpact: 'positive' | 'neutral' | 'negative';
  recommendation: string;
}

export interface StressAnalysis {
  stressScore: number; // 0-100 (0=relaxed, 100=very stressed)
  stressLevel: 'relaxed' | 'mild' | 'moderate' | 'high' | 'severe';
  indicators: string[];
  confidence: number;
}

export interface SessionStats {
  duration: number;
  breathCount: number;
  avgBreathingRate: number;
  phaseDistribution: { inhale: number; exhale: number; rest: number };
  consistency: number; // 0-100, how rhythmic was the breathing
  avgMotionLevel: number;
  feedback: string;
  improvements: string[];
  patternClassification: PatternClassification;
  stressAnalysis: StressAnalysis;
  rawSignalQuality: number; // 0-100, how reliable is the camera data
}

interface UseCameraMotionReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isCameraActive: boolean;
  motionLevel: number;
  breathingPhase: 'inhale' | 'exhale' | 'rest';
  breathingRate: number;
  peakHistory: number[];
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  getSessionStats: () => SessionStats;
}

export function useCameraMotion(): UseCameraMotionReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const animFrameRef = useRef<number>(0);
  const motionHistoryRef = useRef<{ time: number; value: number }[]>([]);
  const peaksRef = useRef<number[]>([]);
  const lastPeakTimeRef = useRef<number>(0);
  const pendingStreamRef = useRef<MediaStream | null>(null);
  const sessionStartRef = useRef<number>(0);

  // Smoothing buffer — stores recent raw motion values, smoothed before use
  const rawMotionBufferRef = useRef<number[]>([]);

  // Phase debounce — require consistency for 0.6 seconds before changing
  const currentPhaseRef = useRef<'inhale' | 'exhale' | 'rest'>('rest');
  const candidatePhaseRef = useRef<'inhale' | 'exhale' | 'rest'>('rest');
  const candidatePhaseStartRef = useRef<number>(0);
  const DEBOUNCE_MS = 600;
  const baselineRef = useRef<number>(0); // Running baseline brightness
  const calibratedRef = useRef<boolean>(false);

  // Phase distribution tracking for session stats
  const phaseTimeRef = useRef<{ inhale: number; exhale: number; rest: number }>({
    inhale: 0, exhale: 0, rest: 0,
  });
  const lastPhaseTimeRef = useRef<number>(0);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [motionLevel, setMotionLevel] = useState(0);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'exhale' | 'rest'>('rest');
  const [breathingRate, setBreathingRate] = useState(0);
  const [peakHistory, setPeakHistory] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Smooth a value using exponential moving average
  const smoothValue = useCallback((raw: number): number => {
    const buffer = rawMotionBufferRef.current;
    buffer.push(raw);
    // Keep last 10 samples
    if (buffer.length > 10) buffer.shift();
    // Weighted average: recent samples have more weight
    let sum = 0;
    let weight = 0;
    for (let i = 0; i < buffer.length; i++) {
      const w = i + 1; // Later samples weigh more
      sum += buffer[i] * w;
      weight += w;
    }
    return sum / weight;
  }, []);  const analyzeFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(analyzeFrame);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const w = Math.min(video.videoWidth || 320, 320);
    const h = Math.min(video.videoHeight || 240, 240);
    if (w === 0 || h === 0) {
      animFrameRef.current = requestAnimationFrame(analyzeFrame);
      return;
    }
    canvas.width = w;
    canvas.height = h;

    // Flip horizontally for selfie view
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -w, 0, w, h);
    ctx.restore();

    const currentFrame = ctx.getImageData(0, 0, w, h);

    if (prevFrameRef.current) {
      const curr = currentFrame.data;      // Focus on CHEST REGION: top 25%-55% of frame, middle 70% width
      const chestTop = Math.floor(h * 0.25);
      const chestBottom = Math.floor(h * 0.55);
      const chestLeft = Math.floor(w * 0.15);
      const chestRight = Math.floor(w * 0.85);

      let totalBrightness = 0;
      let pixelCount = 0;

      // Sample every 2nd pixel for high density
      for (let y = chestTop; y < chestBottom; y += 2) {
        for (let x = chestLeft; x < chestRight; x += 2) {
          const i = (y * w + x) * 4;
          const currBrightness = (curr[i] * 0.299 + curr[i + 1] * 0.587 + curr[i + 2] * 0.114);
          totalBrightness += currBrightness;
          pixelCount++;
        }
      }

      const avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 0;

      // Calibrate baseline during first 1 second
      if (!calibratedRef.current) {
        baselineRef.current = avgBrightness;
        if (motionHistoryRef.current.length > 15) calibratedRef.current = true;
      } else {
        // Slowly track baseline (adapt to lighting changes)
        baselineRef.current = baselineRef.current * 0.995 + avgBrightness * 0.005;
      }

      // Deviation from baseline = breathing signal
      const deviation = avgBrightness - baselineRef.current;

      // Store raw deviation history (not smoothed) for faster response
      const now = Date.now();
      motionHistoryRef.current.push({ time: now, value: deviation });

      // Keep last 8 seconds of data
      motionHistoryRef.current = motionHistoryRef.current.filter(
        (m) => m.time > now - 8000
      );

      // ---- PHASE DETECTION using deviation trend ----
      const history = motionHistoryRef.current;
      const MIN_SAMPLES = 6;
      let newCandidatePhase: 'inhale' | 'exhale' | 'rest' = currentPhaseRef.current;

      if (history.length >= MIN_SAMPLES && calibratedRef.current) {
        // Use recent 0.8s vs previous 1.2s for fast response
        const recentCutoff = now - 800;
        const olderCutoff = now - 2000;

        const recentSamples = history.filter(m => m.time > recentCutoff);
        const olderSamples = history.filter(m => m.time > olderCutoff && m.time <= recentCutoff);

        if (recentSamples.length >= 3 && olderSamples.length >= 3) {
          const recentAvg = recentSamples.reduce((s, m) => s + m.value, 0) / recentSamples.length;
          const olderAvg = olderSamples.reduce((s, m) => s + m.value, 0) / olderSamples.length;
          const trend = recentAvg - olderAvg;

          // Hysteresis: higher threshold to exit current phase, lower to enter new one
          const isExitingPhase = newCandidatePhase !== currentPhaseRef.current;
          const threshold = isExitingPhase ? 0.25 : 0.12;

          if (trend > threshold) {
            newCandidatePhase = 'inhale';
          } else if (trend < -threshold) {
            newCandidatePhase = 'exhale';
          } else {
            newCandidatePhase = 'rest';
          }
        }
      }

      // Debounce: only change phase if consistent for 0.6 seconds
      if (newCandidatePhase !== candidatePhaseRef.current) {
        candidatePhaseRef.current = newCandidatePhase;
        candidatePhaseStartRef.current = now;
      } else if (
        newCandidatePhase !== currentPhaseRef.current &&
        (now - candidatePhaseStartRef.current) > DEBOUNCE_MS
      ) {
        const oldPhase = currentPhaseRef.current;
        currentPhaseRef.current = newCandidatePhase;

        const phaseDuration = now - lastPhaseTimeRef.current;
        phaseTimeRef.current[oldPhase] += phaseDuration;
        lastPhaseTimeRef.current = now;

        setBreathingPhase(newCandidatePhase);

        // Detect peaks (exhale → inhale transition)
        if (oldPhase === 'exhale' && newCandidatePhase === 'inhale') {
          if ((now - lastPeakTimeRef.current) > 1500) {
            lastPeakTimeRef.current = now;
            peaksRef.current.push(now);

            if (peaksRef.current.length > 10) peaksRef.current = peaksRef.current.slice(-10);

            if (peaksRef.current.length >= 2) {
              const intervals = [];
              for (let i = 1; i < peaksRef.current.length; i++) {
                intervals.push(peaksRef.current[i] - peaksRef.current[i - 1]);
              }
              const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
              setBreathingRate(Math.round(60000 / avgInterval));
            }
            setPeakHistory([...peaksRef.current]);
          }
        }
      }

      setMotionLevel(Math.abs(deviation) / 5);
      // Debug log
      if (motionHistoryRef.current.length % 30 === 0) {
        console.log('[Breathing] baseline:', baselineRef.current.toFixed(1), 'avg:', avgBrightness.toFixed(1), 'dev:', deviation.toFixed(2), 'phase:', currentPhaseRef.current, 'trend:', (history.length >= MIN_SAMPLES ? 'yes' : 'no'));
      }
    }

    prevFrameRef.current = currentFrame;
    animFrameRef.current = requestAnimationFrame(analyzeFrame);
  }, [smoothValue]);

  // Helper: attach stream to video element and start analysis
  const attachStreamToVideo = useCallback((stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return false;
    if (video.srcObject) return true; // already attached

    video.srcObject = stream;
    video.play().then(() => {
      motionHistoryRef.current = [];
      peaksRef.current = [];
      lastPeakTimeRef.current = 0;
      rawMotionBufferRef.current = [];
      sessionStartRef.current = Date.now();
      lastPhaseTimeRef.current = Date.now();
      phaseTimeRef.current = { inhale: 0, exhale: 0, rest: 0 };
      currentPhaseRef.current = 'rest';
      candidatePhaseRef.current = 'rest';
      candidatePhaseStartRef.current = Date.now();
      baselineRef.current = 0;
      calibratedRef.current = false;
      animFrameRef.current = requestAnimationFrame(analyzeFrame);
    }).catch((err: unknown) => {
      console.error('Video play error:', err);
      setError('Failed to start video playback');
    });
    pendingStreamRef.current = null;
    return true;
  }, [analyzeFrame]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera requires HTTPS or localhost. Access the app via https:// or from the same machine.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      streamRef.current = stream;
      pendingStreamRef.current = stream;
      setIsCameraActive(true);

      // Poll for video element — wait up to 3 seconds for it to mount
      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        if (attachStreamToVideo(stream) || attempts >= 30) {
          clearInterval(poll);
        }
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera access denied';
      setError(message);
      console.error('Camera error:', err);
    }
  }, [attachStreamToVideo]);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    prevFrameRef.current = null;
    pendingStreamRef.current = null;
    setIsCameraActive(false);
    setMotionLevel(0);
    setBreathingPhase('rest');
    setBreathingRate(0);
  }, []);

  const getSessionStats = useCallback((): SessionStats => {
    const now = Date.now();
    const duration = Math.round((now - sessionStartRef.current) / 1000);

    // Finalize phase time tracking
    const phaseTime = { ...phaseTimeRef.current };
    phaseTime[currentPhaseRef.current] += (now - lastPhaseTimeRef.current);

    const totalPhaseTime = phaseTime.inhale + phaseTime.exhale + phaseTime.rest;

    // Phase distribution as percentages
    const phaseDistribution = {
      inhale: totalPhaseTime > 0 ? Math.round((phaseTime.inhale / totalPhaseTime) * 100) : 33,
      exhale: totalPhaseTime > 0 ? Math.round((phaseTime.exhale / totalPhaseTime) * 100) : 33,
      rest: totalPhaseTime > 0 ? Math.round((phaseTime.rest / totalPhaseTime) * 100) : 34,
    };

    const breathCount = peaksRef.current.length;

    // Consistency: how regular are the breathing intervals
    let consistency = 50;
    if (peaksRef.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < peaksRef.current.length; i++) {
        intervals.push(peaksRef.current[i] - peaksRef.current[i - 1]);
      }
      if (intervals.length >= 1) {
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, iv) => sum + Math.pow(iv - avgInterval, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        const coeffOfVariation = avgInterval > 0 ? stdDev / avgInterval : 1;
        consistency = Math.max(0, Math.min(100, Math.round((1 - Math.min(coeffOfVariation, 1)) * 100)));
      }
      // Bonus for healthy breathing rate
      if (breathingRate >= 10 && breathingRate <= 18) {
        consistency = Math.min(100, consistency + 10);
      }
    } else if (peaksRef.current.length === 1) {
      consistency = 60; // At least one detected breath = decent
    }

    // Average motion level during session
    const history = motionHistoryRef.current;
    const avgMotionLevel = history.length > 0
      ? history.reduce((s, m) => s + m.value, 0) / history.length
      : 0;

    // Average breathing rate
    const avgBreathingRate = breathingRate;

    // Generate feedback
    const feedback = generateFeedback(duration, breathCount, avgBreathingRate, consistency, phaseDistribution, avgMotionLevel);
    const improvements = generateImprovements(duration, avgBreathingRate, consistency, phaseDistribution, avgMotionLevel);

    // ML Classification
    const patternClassification = classifyBreathingPattern(avgBreathingRate, consistency, phaseDistribution, avgMotionLevel, duration);
    const stressAnalysis = calculateStressAnalysis(avgBreathingRate, consistency, phaseDistribution, avgMotionLevel, duration);
    const rawSignalQuality = estimateSignalQuality(avgMotionLevel, consistency, duration, avgBreathingRate);

    return {
      duration,
      breathCount,
      avgBreathingRate,
      phaseDistribution,
      consistency,
      avgMotionLevel,
      feedback,
      improvements,
      patternClassification,
      stressAnalysis,
      rawSignalQuality,
    };
  }, [breathingRate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    isCameraActive,
    motionLevel,
    breathingPhase,
    breathingRate,
    peakHistory,
    error,
    startCamera,
    stopCamera,
    getSessionStats,
  };
}

/**
 * Classify breathing pattern using signal features
 * This is a rule-based classifier using medical breathing norms
 */
function classifyBreathingPattern(
  rate: number,
  consistency: number,
  phases: { inhale: number; exhale: number; rest: number },
  avgMotion: number,
  duration: number,
): PatternClassification {
  // Not enough data
  if (duration < 10 || rate === 0) {
    return {
      pattern: 'normal',
      confidence: 20,
      description: 'Insufficient data for classification.',
      healthImpact: 'neutral',
      recommendation: 'Continue breathing for at least 30 seconds for accurate analysis.',
    };
  }

  const balance = Math.abs(phases.inhale - phases.exhale);
  const restRatio = phases.rest / 100;

  // Feature vector for classification
  const features = {
    rate,
    consistency,
    balance,
    restRatio,
    motionAmplitude: avgMotion,
  };

  // Classification rules based on medical breathing norms
  // Normal: 12-20 BPM, consistent, balanced phases
  // Shallow: >20 BPM, low motion amplitude
  // Deep: <12 BPM, high motion amplitude
  // Irregular: low consistency, high variance
  // Stress: >20 BPM, low consistency, high rest ratio
  // Calm: 10-15 BPM, high consistency, balanced

  let pattern: BreathingPattern = 'normal';
  let confidence = 50;
  let description = '';
  let healthImpact: 'positive' | 'neutral' | 'negative' = 'neutral';
  let recommendation = '';

  // Stress detection (highest priority)
  if (features.rate > 20 && features.consistency < 50) {
    pattern = 'stress';
    confidence = Math.min(90, 70 + (features.rate - 20) * 2);
    description = `Elevated breathing rate (${rate} BPM) with irregular rhythm indicates stress response.`;
    healthImpact = 'negative';
    recommendation = 'Try the 4-7-8 breathing technique: inhale 4s, hold 7s, exhale 8s. Practice for 5 minutes.';
  }
  // Irregular detection
  else if (features.consistency < 35) {
    pattern = 'irregular';
    confidence = Math.min(85, 60 + (35 - features.consistency));
    description = `Breathing rhythm is inconsistent (${consistency}% consistency). This may indicate anxiety or uneven breathing.`;
    healthImpact = 'neutral';
    recommendation = 'Use a guided breathing pattern (Box Breathing or 4-7-8) to build rhythmic consistency.';
  }
  // Shallow breathing
  else if (features.rate > 20 && features.motionAmplitude < 0.3) {
    pattern = 'shallow';
    confidence = Math.min(88, 65 + (features.rate - 20) * 3);
    description = `Fast but shallow breathing (${rate} BPM, low chest movement). Common during anxiety or screen time.`;
    healthImpact = 'negative';
    recommendation = 'Practice diaphragmatic breathing: place hand on belly, feel it rise on inhale. Aim for deep, slow breaths.';
  }
  // Deep breathing
  else if (features.rate < 12 && features.motionAmplitude > 0.4) {
    pattern = 'deep';
    confidence = Math.min(92, 70 + (12 - features.rate) * 3);
    description = `Deep, slow breathing (${rate} BPM) with significant chest movement. Excellent for relaxation and oxygen exchange.`;
    healthImpact = 'positive';
    recommendation = 'Outstanding! This breathing pattern activates the parasympathetic nervous system. Maintain this practice.';
  }
  // Calm breathing
  else if (features.rate >= 10 && features.rate <= 15 && features.consistency > 70) {
    pattern = 'calm';
    confidence = Math.min(95, 75 + features.consistency * 0.2);
    description = `Calm, controlled breathing (${rate} BPM) with excellent consistency (${consistency}%). Optimal for mental clarity.`;
    healthImpact = 'positive';
    recommendation = 'Perfect breathing pattern! Regular practice at this level significantly reduces cortisol and improves focus.';
  }
  // Normal breathing
  else {
    pattern = 'normal';
    confidence = Math.min(80, 50 + features.consistency * 0.3);
    description = `Normal breathing pattern (${rate} BPM) with ${consistency > 60 ? 'good' : 'moderate'} rhythm.`;
    healthImpact = 'neutral';
    recommendation = 'Good baseline. Try to maintain consistency above 70% for optimal wellness benefits.';
  }

  return { pattern, confidence, description, healthImpact, recommendation };
}

/**
 * Calculate stress score from breathing metrics
 * Uses weighted combination of physiological indicators
 */
function calculateStressAnalysis(
  rate: number,
  consistency: number,
  phases: { inhale: number; exhale: number; rest: number },
  avgMotion: number,
  duration: number,
): StressAnalysis {
  if (duration < 10 || rate === 0) {
    return {
      stressScore: 50,
      stressLevel: 'moderate',
      indicators: ['Insufficient data for stress analysis'],
      confidence: 15,
    };
  }

  const indicators: string[] = [];
  let score = 0;
  let totalWeight = 0;

  // Factor 1: Breathing rate (weight: 30)
  // Normal resting rate: 12-20 BPM
  // >20 = stressed, <10 = very relaxed
  const rateWeight = 30;
  let rateScore = 0;
  if (rate > 20) {
    rateScore = Math.min(100, 60 + (rate - 20) * 5);
    indicators.push(`Elevated breathing rate (${rate} BPM)`);
  } else if (rate < 12) {
    rateScore = Math.max(0, 40 - (12 - rate) * 8);
  } else {
    rateScore = 25; // Normal range
  }
  score += rateScore * rateWeight;
  totalWeight += rateWeight;

  // Factor 2: Breathing consistency (weight: 25)
  // Low consistency = high stress
  const consistencyWeight = 25;
  const consistencyScore = Math.max(0, 100 - consistency);
  if (consistency < 40) {
    indicators.push(`Irregular breathing rhythm (${consistency}% consistency)`);
  }
  score += consistencyScore * consistencyWeight;
  totalWeight += consistencyWeight;

  // Factor 3: Phase balance (weight: 20)
  // Imbalanced inhale/exhale = stress
  const balanceWeight = 20;
  const balance = Math.abs(phases.inhale - phases.exhale);
  const balanceScore = Math.min(100, balance * 3);
  if (balance > 20) {
    indicators.push(`Unbalanced breathing phases (${balance}% difference)`);
  }
  score += balanceScore * balanceWeight;
  totalWeight += balanceWeight;

  // Factor 4: Rest ratio (weight: 15)
  // High rest = possible breath-holding (stress response)
  const restWeight = 15;
  const restScore = phases.rest > 25 ? Math.min(100, (phases.rest - 25) * 4) : 0;
  if (phases.rest > 25) {
    indicators.push(`Frequent breath-holding (${phases.rest}% rest phase)`);
  }
  score += restScore * restWeight;
  totalWeight += restWeight;

  // Factor 5: Motion amplitude (weight: 10)
  // Very low motion = shallow breathing (stress indicator)
  const motionWeight = 10;
  const motionScore = avgMotion < 0.1 ? 70 : avgMotion < 0.2 ? 40 : 10;
  if (avgMotion < 0.15) {
    indicators.push('Low chest movement detected (shallow breathing)');
  }
  score += motionScore * motionWeight;
  totalWeight += motionWeight;

  // Calculate final score (0-100)
  const stressScore = Math.round(totalWeight > 0 ? score / totalWeight : 50);

  // Determine stress level
  let stressLevel: StressAnalysis['stressLevel'];
  if (stressScore < 20) stressLevel = 'relaxed';
  else if (stressScore < 40) stressLevel = 'mild';
  else if (stressScore < 60) stressLevel = 'moderate';
  else if (stressScore < 80) stressLevel = 'high';
  else stressLevel = 'severe';

  // Confidence based on data quality
  const confidence = Math.min(95, Math.round(
    (duration > 30 ? 30 : duration) +
    (consistency > 20 ? 25 : consistency * 1.25) +
    (rate > 0 ? 20 : 0) +
    (avgMotion > 0.05 ? 20 : avgMotion * 400)
  ));

  if (indicators.length === 0) {
    indicators.push('Breathing metrics within normal ranges');
  }

  return { stressScore, stressLevel, indicators, confidence };
}

/**
 * Estimate signal quality from motion data
 */
function estimateSignalQuality(
  avgMotion: number,
  consistency: number,
  duration: number,
  rate: number,
): number {
  let quality = 0;

  // Motion amplitude (good signal needs visible motion)
  if (avgMotion > 0.3) quality += 35;
  else if (avgMotion > 0.15) quality += 25;
  else if (avgMotion > 0.05) quality += 15;
  else quality += 5;

  // Consistency (consistent signal = reliable)
  quality += Math.round(consistency * 0.3);

  // Duration (longer = more reliable)
  if (duration > 60) quality += 20;
  else if (duration > 30) quality += 15;
  else if (duration > 10) quality += 10;
  else quality += 3;

  // Valid breathing rate detected
  if (rate > 5 && rate < 30) quality += 15;
  else if (rate > 0) quality += 5;

  return Math.min(100, quality);
}

function generateFeedback(
  duration: number,
  _breathCount: number,
  rate: number,
  consistency: number,
  phases: { inhale: number; exhale: number; rest: number },
  _avgMotion: number,
): string {  if (duration < 10) {
    return 'Session was too short for meaningful analysis. Try to breathe for at least 1 minute next time.';
  }

  const parts: string[] = [];

  // Breathing rate feedback
  if (rate >= 12 && rate <= 18) {
    parts.push(`Your breathing rate of ${rate} breaths/min is within the optimal resting range — excellent for relaxation.`);
  } else if (rate >= 10 && rate < 12) {
    parts.push(`Your breathing rate of ${rate} breaths/min is calm and controlled — great for deep focus.`);
  } else if (rate >= 18 && rate <= 20) {
    parts.push(`Your breathing rate of ${rate} breaths/min is at the upper end of normal — try slowing down slightly for deeper relaxation.`);
  } else if (rate < 10) {
    parts.push(`Your breathing rate of ${rate} breaths/min is very relaxed — this suggests a deep meditative state.`);
  } else if (rate > 20) {
    parts.push(`Your breathing rate of ${rate} breaths/min is elevated — this may indicate stress. Try the 4-7-8 breathing pattern to calm down.`);
  }

  // Consistency feedback
  if (consistency > 80) {
    parts.push('Your breathing rhythm was excellent — very consistent and controlled!');
  } else if (consistency > 60) {
    parts.push('Your breathing rhythm was good with natural variation — keep practicing for even more consistency.');
  } else if (consistency > 40) {
    parts.push('Your breathing had some variation — try focusing on a steady rhythm for better results.');
  } else {
    parts.push('Your breathing rhythm was irregular — this is normal, try practicing with a guided pattern to build consistency.');
  }

  // Phase balance
  const balance = Math.abs(phases.inhale - phases.exhale);
  if (balance < 8) {
    parts.push('Excellent balance between inhale and exhale — this promotes optimal oxygen exchange.');
  } else if (balance < 15) {
    parts.push('Good balance between inhale and exhale phases.');
  } else {
    parts.push('Try to balance your inhale and exhale more evenly — a 1:1 ratio is ideal for relaxation.');
  }

  // Session length
  if (duration >= 180) {
    parts.push(`Outstanding ${Math.floor(duration / 60)}-minute session — regular practice like this significantly improves mental wellbeing.`);
  } else if (duration >= 120) {
    parts.push(`Solid 2-minute session — great commitment to your health. Try extending to 3-5 minutes next time.`);
  } else if (duration >= 60) {
    parts.push(`Nice 1-minute session. Regular short sessions build a healthy habit — aim for 2+ minutes next time.`);
  } else {
    parts.push(`Short ${duration}-second session — try to breathe for at least 1 minute for meaningful benefits.`);
  }

  return parts.join(' ');
}

function generateImprovements(
  duration: number,
  rate: number,
  consistency: number,
  phases: { inhale: number; exhale: number; rest: number },
  avgMotion: number,
): string[] {
  const improvements: string[] = [];

  if (duration < 60) {
    improvements.push('Aim for 2-3 minutes next time — longer sessions activate the parasympathetic nervous system for deeper relaxation.');
  } else if (duration < 120) {
    improvements.push('Try extending to 3-5 minutes for deeper breathing benefits and better mood regulation.');
  }

  if (rate > 20) {
    improvements.push('Slow your breathing — try 4 seconds inhale, 7 seconds hold, 8 seconds exhale (4-7-8 technique).');
  } else if (rate < 10 && rate > 0) {
    improvements.push('Your breathing is very slow — try slightly faster breaths (12-15 BPM) for better oxygen flow.');
  }

  if (consistency < 40) {
    improvements.push('Practice rhythmic breathing with a timer or the guided patterns to build consistency.');
  } else if (consistency < 60) {
    improvements.push('Try the Box Breathing pattern (4-4-4-4) to improve your breathing rhythm consistency.');
  }

  if (Math.abs(phases.inhale - phases.exhale) > 15) {
    improvements.push('Balance your inhale and exhale — aim for equal duration in both phases for optimal relaxation.');
  }

  if (phases.rest > 25) {
    improvements.push('Reduce pause time between breaths — aim for continuous, flowing breathing without long holds.');
  }

  if (avgMotion < 0.05 && avgMotion > 0) {
    improvements.push('Low motion detected — position the camera 30-50cm from your chest, facing directly at you.');
  }

  if (improvements.length === 0) {
    improvements.push('Excellent session! Your breathing technique is solid — keep practicing regularly for lasting benefits.');
    improvements.push('Consider tracking your sessions over time to see how your breathing patterns improve.');
  }

  return improvements;
}

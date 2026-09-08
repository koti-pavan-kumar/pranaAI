import { useRef, useCallback, useState, useEffect } from 'react';

export type BreathingPattern = 'normal' | 'shallow' | 'deep' | 'irregular' | 'stress' | 'calm';

export interface PatternClassification {
  pattern: BreathingPattern;
  confidence: number;
  description: string;
  healthImpact: 'positive' | 'neutral' | 'negative';
  recommendation: string;
}

export interface StressAnalysis {
  stressScore: number;
  stressLevel: 'relaxed' | 'mild' | 'moderate' | 'high' | 'severe';
  indicators: string[];
  confidence: number;
}

export interface SessionStats {
  duration: number;
  breathCount: number;
  avgBreathingRate: number;
  phaseDistribution: { inhale: number; exhale: number; rest: number };
  consistency: number;
  avgMotionLevel: number;
  feedback: string;
  improvements: string[];
  patternClassification: PatternClassification;
  stressAnalysis: StressAnalysis;
  rawSignalQuality: number;
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
  const sessionActiveRef = useRef<boolean>(false);

  const rawMotionBufferRef = useRef<number[]>([]);

  const currentPhaseRef = useRef<'inhale' | 'exhale' | 'rest'>('rest');
  const candidatePhaseRef = useRef<'inhale' | 'exhale' | 'rest'>('rest');
  const candidatePhaseStartRef = useRef<number>(0);
  const DEBOUNCE_MS = 600;
  const baselineRef = useRef<number>(0);
  const calibratedRef = useRef<boolean>(false);

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

  const smoothValue = useCallback((raw: number): number => {
    const buffer = rawMotionBufferRef.current;
    buffer.push(raw);
    if (buffer.length > 10) buffer.shift();
    let sum = 0;
    let weight = 0;
    for (let i = 0; i < buffer.length; i++) {
      const w = i + 1;
      sum += buffer[i] * w;
      weight += w;
    }
    return sum / weight;
  }, []);

  const analyzeFrame = useCallback(() => {
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

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -w, 0, w, h);
    ctx.restore();

    const currentFrame = ctx.getImageData(0, 0, w, h);

    if (prevFrameRef.current) {
      const curr = currentFrame.data;
      const chestTop = Math.floor(h * 0.25);
      const chestBottom = Math.floor(h * 0.55);
      const chestLeft = Math.floor(w * 0.15);
      const chestRight = Math.floor(w * 0.85);

      let totalBrightness = 0;
      let pixelCount = 0;

      for (let y = chestTop; y < chestBottom; y += 2) {
        for (let x = chestLeft; x < chestRight; x += 2) {
          const i = (y * w + x) * 4;
          const currBrightness = (curr[i] * 0.299 + curr[i + 1] * 0.587 + curr[i + 2] * 0.114);
          totalBrightness += currBrightness;
          pixelCount++;
        }
      }

      const avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 0;

      if (!calibratedRef.current) {
        baselineRef.current = avgBrightness;
        if (motionHistoryRef.current.length > 15) calibratedRef.current = true;
      } else {
        baselineRef.current = baselineRef.current * 0.995 + avgBrightness * 0.005;
      }

      const deviation = avgBrightness - baselineRef.current;
      const now = Date.now();
      motionHistoryRef.current.push({ time: now, value: deviation });
      motionHistoryRef.current = motionHistoryRef.current.filter((m) => m.time > now - 8000);

      const history = motionHistoryRef.current;
      const MIN_SAMPLES = 6;
      let newCandidatePhase: 'inhale' | 'exhale' | 'rest' = currentPhaseRef.current;

      if (history.length >= MIN_SAMPLES && calibratedRef.current) {
        const recentCutoff = now - 800;
        const olderCutoff = now - 2000;
        const recentSamples = history.filter(m => m.time > recentCutoff);
        const olderSamples = history.filter(m => m.time > olderCutoff && m.time <= recentCutoff);

        if (recentSamples.length >= 3 && olderSamples.length >= 3) {
          const recentAvg = recentSamples.reduce((s, m) => s + m.value, 0) / recentSamples.length;
          const olderAvg = olderSamples.reduce((s, m) => s + m.value, 0) / olderSamples.length;
          const trend = recentAvg - olderAvg;
          const isExitingPhase = newCandidatePhase !== currentPhaseRef.current;
          const threshold = isExitingPhase ? 0.25 : 0.12;

          if (trend > threshold) newCandidatePhase = 'inhale';
          else if (trend < -threshold) newCandidatePhase = 'exhale';
          else newCandidatePhase = 'rest';
        }
      }

      if (newCandidatePhase !== candidatePhaseRef.current) {
        candidatePhaseRef.current = newCandidatePhase;
        candidatePhaseStartRef.current = now;
      } else if (newCandidatePhase !== currentPhaseRef.current && (now - candidatePhaseStartRef.current) > DEBOUNCE_MS) {
        const oldPhase = currentPhaseRef.current;
        currentPhaseRef.current = newCandidatePhase;
        const phaseDuration = now - lastPhaseTimeRef.current;
        phaseTimeRef.current[oldPhase] += phaseDuration;
        lastPhaseTimeRef.current = now;
        setBreathingPhase(newCandidatePhase);

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
    }

    prevFrameRef.current = currentFrame;
    animFrameRef.current = requestAnimationFrame(analyzeFrame);
  }, [smoothValue]);

  const attachStreamToVideo = useCallback((stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return false;
    if (video.srcObject) return true;

    video.srcObject = stream;
    video.play().then(() => {
      // FIX: Only initialize session start if not already active
      if (!sessionActiveRef.current) {
        sessionStartRef.current = Date.now();
        sessionActiveRef.current = true;
      }
      motionHistoryRef.current = [];
      peaksRef.current = [];
      lastPeakTimeRef.current = 0;
      rawMotionBufferRef.current = [];
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
        setError('Camera requires HTTPS or localhost.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
        audio: false,
      });

      streamRef.current = stream;
      pendingStreamRef.current = stream;
      setIsCameraActive(true);
      sessionActiveRef.current = true;
      sessionStartRef.current = Date.now();

      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        if (attachStreamToVideo(stream) || attempts >= 30) clearInterval(poll);
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera access denied';
      setError(message);
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
    if (videoRef.current) videoRef.current.srcObject = null;
    prevFrameRef.current = null;
    pendingStreamRef.current = null;
    sessionActiveRef.current = false;
    setIsCameraActive(false);
    setMotionLevel(0);
    setBreathingPhase('rest');
    setBreathingRate(0);
  }, []);

  const getSessionStats = useCallback((): SessionStats => {
    const now = Date.now();
    // FIX: Ensure duration is always reasonable (in seconds)
    const rawDuration = sessionStartRef.current > 0 ? (now - sessionStartRef.current) / 1000 : 0;
    const duration = Math.min(Math.round(rawDuration), 3600); // Cap at 1 hour

    const phaseTime = { ...phaseTimeRef.current };
    phaseTime[currentPhaseRef.current] += (now - lastPhaseTimeRef.current);
    const totalPhaseTime = phaseTime.inhale + phaseTime.exhale + phaseTime.rest;

    const phaseDistribution = {
      inhale: totalPhaseTime > 0 ? Math.round((phaseTime.inhale / totalPhaseTime) * 100) : 33,
      exhale: totalPhaseTime > 0 ? Math.round((phaseTime.exhale / totalPhaseTime) * 100) : 33,
      rest: totalPhaseTime > 0 ? Math.round((phaseTime.rest / totalPhaseTime) * 100) : 34,
    };

    const breathCount = peaksRef.current.length;

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
      if (breathingRate >= 10 && breathingRate <= 18) consistency = Math.min(100, consistency + 10);
    } else if (peaksRef.current.length === 1) {
      consistency = 60;
    }

    const history = motionHistoryRef.current;
    const avgMotionLevel = history.length > 0 ? history.reduce((s, m) => s + m.value, 0) / history.length : 0;
    const avgBreathingRate = breathingRate;
    const feedback = generateFeedback(duration, breathCount, avgBreathingRate, consistency, phaseDistribution, avgMotionLevel);
    const improvements = generateImprovements(duration, avgBreathingRate, consistency, phaseDistribution, avgMotionLevel);
    const patternClassification = classifyBreathingPattern(avgBreathingRate, consistency, phaseDistribution, avgMotionLevel, duration);
    const stressAnalysis = calculateStressAnalysis(avgBreathingRate, consistency, phaseDistribution, avgMotionLevel, duration);
    const rawSignalQuality = estimateSignalQuality(avgMotionLevel, consistency, duration, avgBreathingRate);

    return { duration, breathCount, avgBreathingRate, phaseDistribution, consistency, avgMotionLevel, feedback, improvements, patternClassification, stressAnalysis, rawSignalQuality };
  }, [breathingRate]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    };
  }, []);

  return { videoRef, canvasRef, isCameraActive, motionLevel, breathingPhase, breathingRate, peakHistory, error, startCamera, stopCamera, getSessionStats };
}

function classifyBreathingPattern(rate: number, consistency: number, _phases: { inhale: number; exhale: number; rest: number }, avgMotion: number, duration: number): PatternClassification {
  if (duration < 10 || rate === 0) {
    return { pattern: 'normal', confidence: 20, description: 'Insufficient data for classification.', healthImpact: 'neutral', recommendation: 'Continue breathing for at least 30 seconds for accurate analysis.' };
  }
  let pattern: BreathingPattern = 'normal';
  let confidence = 50;
  let description = '';
  let healthImpact: 'positive' | 'neutral' | 'negative' = 'neutral';
  let recommendation = '';
  if (rate > 20 && consistency < 50) {
    pattern = 'stress'; confidence = Math.min(90, 70 + (rate - 20) * 2);
    description = `Elevated breathing rate (${rate} BPM) with irregular rhythm indicates stress response.`;
    healthImpact = 'negative'; recommendation = 'Try the 4-7-8 breathing technique.';
  } else if (consistency < 35) {
    pattern = 'irregular'; confidence = Math.min(85, 60 + (35 - consistency));
    description = `Breathing rhythm is inconsistent (${consistency}% consistency).`;
    healthImpact = 'neutral'; recommendation = 'Use a guided breathing pattern.';
  } else if (rate > 20 && avgMotion < 0.3) {
    pattern = 'shallow'; confidence = Math.min(88, 65 + (rate - 20) * 3);
    description = `Fast but shallow breathing (${rate} BPM).`;
    healthImpact = 'negative'; recommendation = 'Practice diaphragmatic breathing.';
  } else if (rate < 12 && avgMotion > 0.4) {
    pattern = 'deep'; confidence = Math.min(92, 70 + (12 - rate) * 3);
    description = `Deep, slow breathing (${rate} BPM). Excellent for relaxation.`;
    healthImpact = 'positive'; recommendation = 'Outstanding! Maintain this practice.';
  } else if (rate >= 10 && rate <= 15 && consistency > 70) {
    pattern = 'calm'; confidence = Math.min(95, 75 + consistency * 0.2);
    description = `Calm, controlled breathing (${rate} BPM) with excellent consistency.`;
    healthImpact = 'positive'; recommendation = 'Perfect breathing pattern!';
  } else {
    pattern = 'normal'; confidence = Math.min(80, 50 + consistency * 0.3);
    description = `Normal breathing pattern (${rate} BPM).`;
    healthImpact = 'neutral'; recommendation = 'Good baseline.';
  }
  return { pattern, confidence, description, healthImpact, recommendation };
}

function calculateStressAnalysis(rate: number, consistency: number, phases: { inhale: number; exhale: number; rest: number }, avgMotion: number, duration: number): StressAnalysis {
  if (duration < 10 || rate === 0) return { stressScore: 50, stressLevel: 'moderate', indicators: ['Insufficient data'], confidence: 15 };
  const indicators: string[] = [];
  let score = 0; let totalWeight = 0;
  const rateWeight = 30;
  let rateScore = rate > 20 ? Math.min(100, 60 + (rate - 20) * 5) : rate < 12 ? Math.max(0, 40 - (12 - rate) * 8) : 25;
  if (rate > 20) indicators.push(`Elevated breathing rate (${rate} BPM)`);
  score += rateScore * rateWeight; totalWeight += rateWeight;
  const consistencyWeight = 25;
  const consistencyScore = Math.max(0, 100 - consistency);
  if (consistency < 40) indicators.push(`Irregular rhythm (${consistency}%)`);
  score += consistencyScore * consistencyWeight; totalWeight += consistencyWeight;
  const balanceWeight = 20;
  const balance = Math.abs(phases.inhale - phases.exhale);
  const balanceScore = Math.min(100, balance * 3);
  if (balance > 20) indicators.push(`Unbalanced phases (${balance}%)`);
  score += balanceScore * balanceWeight; totalWeight += balanceWeight;
  const restWeight = 15;
  const restScore = phases.rest > 25 ? Math.min(100, (phases.rest - 25) * 4) : 0;
  score += restScore * restWeight; totalWeight += restWeight;
  const motionWeight = 10;
  const motionScore = avgMotion < 0.1 ? 70 : avgMotion < 0.2 ? 40 : 10;
  score += motionScore * motionWeight; totalWeight += motionWeight;
  const stressScore = Math.round(totalWeight > 0 ? score / totalWeight : 50);
  let stressLevel: StressAnalysis['stressLevel'];
  if (stressScore < 20) stressLevel = 'relaxed'; else if (stressScore < 40) stressLevel = 'mild'; else if (stressScore < 60) stressLevel = 'moderate'; else if (stressScore < 80) stressLevel = 'high'; else stressLevel = 'severe';
  if (indicators.length === 0) indicators.push('Metrics within normal ranges');
  const confidence = Math.min(95, Math.round((duration > 30 ? 30 : duration) + (consistency > 20 ? 25 : consistency * 1.25) + (rate > 0 ? 20 : 0) + (avgMotion > 0.05 ? 20 : avgMotion * 400)));
  return { stressScore, stressLevel, indicators, confidence };
}

function estimateSignalQuality(avgMotion: number, consistency: number, duration: number, rate: number): number {
  let quality = 0;
  if (avgMotion > 0.3) quality += 35; else if (avgMotion > 0.15) quality += 25; else if (avgMotion > 0.05) quality += 15; else quality += 5;
  quality += Math.round(consistency * 0.3);
  if (duration > 60) quality += 20; else if (duration > 30) quality += 15; else if (duration > 10) quality += 10; else quality += 3;
  if (rate > 5 && rate < 30) quality += 15; else if (rate > 0) quality += 5;
  return Math.min(100, quality);
}

function generateFeedback(duration: number, _breathCount: number, rate: number, consistency: number, _phases: { inhale: number; exhale: number; rest: number }, _avgMotion: number): string {
  if (duration < 10) return 'Session too short. Try breathing for at least 1 minute.';
  const parts: string[] = [];
  if (rate >= 12 && rate <= 18) parts.push(`Breathing rate of ${rate} BPM is optimal.`);
  else if (rate > 20) parts.push(`Breathing rate of ${rate} BPM is elevated. Try 4-7-8 technique.`);
  else if (rate < 10) parts.push(`Very relaxed breathing at ${rate} BPM.`);
  if (consistency > 80) parts.push('Excellent rhythm consistency!');
  else if (consistency < 40) parts.push('Irregular rhythm — try guided patterns.');
  if (duration >= 120) parts.push(`Great ${Math.floor(duration / 60)}-minute session!`);
  else if (duration >= 60) parts.push('Nice 1-minute session.');
  return parts.join(' ');
}

function generateImprovements(duration: number, rate: number, consistency: number, _phases: { inhale: number; exhale: number; rest: number }, _avgMotion: number): string[] {
  const improvements: string[] = [];
  if (duration < 60) improvements.push('Aim for 2-3 minutes next time.');
  if (rate > 20) improvements.push('Slow down with 4-7-8 technique.');
  if (consistency < 40) improvements.push('Practice with a guided timer.');
  if (improvements.length === 0) improvements.push('Excellent session! Keep practicing.');
  return improvements;
}

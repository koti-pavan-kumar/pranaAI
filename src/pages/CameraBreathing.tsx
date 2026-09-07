import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, Activity, ArrowLeft, Check, TrendingUp, Target, RotateCcw, Cpu, Smartphone, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCameraMotion, type SessionStats } from '../hooks/useCameraMotion';
import { usePoseNet as usePoseNetHook } from '../hooks/usePoseNet';
import { useDeviceTelemetry } from '../hooks/useDeviceTelemetry';
import { useApp } from '../store';

const PHASE_GUIDE = {
  inhale: { label: 'Breathe In', instruction: 'Expand your chest — let the camera detect the movement', color: '#14b8a6', bg: '#f0fdfa', icon: '🫁' },
  exhale: { label: 'Breathe Out', instruction: 'Contract your chest slowly — the camera tracks the deflation', color: '#8b5cf6', bg: '#faf5ff', icon: '💨' },
  rest: { label: 'Steady', instruction: 'Hold naturally — the sensor is calibrating', color: '#06b6d4', bg: '#ecfeff', icon: '🧘' },
};

const Container = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>{children}</div>
);

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 18, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', ...style }}>{children}</div>
);

export default function CameraBreathing() {
  const navigate = useNavigate();
  const { addBreathingSession } = useApp();
  const { videoRef, canvasRef, isCameraActive, breathingPhase, breathingRate, error, startCamera, stopCamera, getSessionStats } = useCameraMotion();
  const poseNet = usePoseNetHook();
  const { isModelLoaded: isPoseNetReady, currentPose, loadModel: loadPoseNet, startAnalysis, stopAnalysis } = poseNet;
  const { logInteraction, currentDevice } = useDeviceTelemetry();

  const [isActive, setIsActive] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [breathCycles, setBreathCycles] = useState(0);
  const [, setShowGuide] = useState(true);
  const [lastPhase, setLastPhase] = useState<string>('rest');
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [poseNetEnabled, setPoseNetEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (lastPhase === 'exhale' && breathingPhase === 'inhale') setBreathCycles(prev => prev + 1);
    setLastPhase(breathingPhase);
  }, [breathingPhase, lastPhase]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive) interval = setInterval(() => setSessionDuration(prev => prev + 1), 1000);
    return () => { if (interval) clearInterval(interval); };
  }, [isActive]);

  const handleStart = useCallback(async () => {
    setShowGuide(false); setSessionComplete(false); setSessionStats(null);
    logInteraction('camera');
    // Set isActive FIRST so the video element mounts before startCamera attaches the stream
    setIsActive(true); setSessionDuration(0); setBreathCycles(0);
    // Wait for DOM to commit the video element, then start camera
    setTimeout(async () => {
      await startCamera();
      if (poseNetEnabled && !isPoseNetReady) loadPoseNet();
    }, 200);
  }, [startCamera, logInteraction, poseNetEnabled, isPoseNetReady, loadPoseNet]);

  useEffect(() => {
    if (isCameraActive && isPoseNetReady && videoRef.current && poseNetEnabled) startAnalysis(videoRef.current);
    return () => { if (!isCameraActive) stopAnalysis(); };
  }, [isCameraActive, isPoseNetReady, videoRef, poseNetEnabled, startAnalysis, stopAnalysis]);

  const handleStop = useCallback(() => {
    const stats = getSessionStats();
    setSessionStats(stats);
    stopCamera(); stopAnalysis(); setIsActive(false); setSessionComplete(true); logInteraction('touch');
    addBreathingSession({
      pattern: { name: 'Camera Breathing', description: `AI-detected · ${stats.breathCount} breaths · ${stats.consistency}% consistency`, inhale: Math.round(stats.phaseDistribution.inhale / 10), holdIn: 0, exhale: Math.round(stats.phaseDistribution.exhale / 10), holdOut: 0, icon: '📷', color: '#14b8a6' },
      duration: stats.duration, completedCycles: stats.breathCount,
    });
  }, [stopCamera, stopAnalysis, getSessionStats, addBreathingSession, logInteraction]);

  const handleRestart = useCallback(() => {
    setSessionComplete(false); setSessionStats(null); setShowGuide(true); setSessionDuration(0); setBreathCycles(0);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ============ SESSION COMPLETE SCREEN ============
  if (sessionComplete && sessionStats) {
    return (
      <Container>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={handleRestart} style={{ width: 44, height: 44, borderRadius: 12, background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <ArrowLeft size={20} color="#475569" />
            </button>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Session Complete!</h1>
              <p style={{ fontSize: 12, color: '#0d9488', fontWeight: 600 }}>AI-generated analysis</p>
            </div>
          </motion.div>

          {/* Success Icon */}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }} style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #d1fae5, #ccfbf1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(16,185,129,0.2)' }}>
              <Check size={36} color="#059669" />
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Duration', value: formatTime(sessionStats.duration), icon: '⏱️', color: '#0d9488' },
              { label: 'Breaths', value: sessionStats.breathCount.toString(), icon: '🫁', color: '#0891b2' },
              { label: 'BPM', value: sessionStats.avgBreathingRate > 0 ? sessionStats.avgBreathingRate.toString() : '--', icon: '💓', color: '#7c3aed' },
            ].map(({ label, value, icon, color }) => (
              <Card key={label} style={{ padding: 16, textAlign: 'center' }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <p style={{ fontSize: 24, fontWeight: 800, color, marginTop: 6 }}>{value}</p>
                <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{label}</p>
              </Card>
            ))}
          </motion.div>

          {/* Consistency Score */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Breathing Consistency</h3>
                <span style={{ fontSize: 14, fontWeight: 700, color: sessionStats.consistency > 75 ? '#059669' : sessionStats.consistency > 50 ? '#d97706' : '#dc2626' }}>{sessionStats.consistency}%</span>
              </div>
              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${sessionStats.consistency}%` }} transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: 4, background: sessionStats.consistency > 75 ? 'linear-gradient(90deg, #10b981, #059669)' : sessionStats.consistency > 50 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #ef4444, #dc2626)' }} />
              </div>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                {sessionStats.consistency > 75 ? 'Excellent rhythm — your breathing was very steady' : sessionStats.consistency > 50 ? 'Good rhythm with some natural variation' : 'Irregular rhythm — focus on steady, controlled breaths'}
              </p>
            </Card>
          </motion.div>

          {/* Phase Distribution */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 14 }}>Phase Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { phase: 'Inhale', value: sessionStats.phaseDistribution.inhale, color: '#14b8a6', icon: '🫁' },
                  { phase: 'Exhale', value: sessionStats.phaseDistribution.exhale, color: '#8b5cf6', icon: '💨' },
                  { phase: 'Steady', value: sessionStats.phaseDistribution.rest, color: '#06b6d4', icon: '🧘' },
                ].map(({ phase, value, color, icon }) => (
                  <div key={phase}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}><span>{icon}</span>{phase}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}%</span>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ delay: 0.6, duration: 0.8 }}
                        style={{ height: '100%', borderRadius: 3, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* AI Feedback */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card style={{ borderLeft: '4px solid #14b8a6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>🤖</span>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>AI Session Analysis</h3>
              </div>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{sessionStats.feedback}</p>
            </Card>
          </motion.div>

          {/* Improvements */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Target size={16} color="#0891b2" />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Areas for Improvement</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sessionStats.improvements.map((improvement, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.05 }}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#0891b2', flexShrink: 0 }}>{i + 1}</div>
                    <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{improvement}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} style={{ display: 'flex', gap: 12, paddingBottom: 20 }}>
            <button onClick={handleRestart} style={{ flex: 1, padding: '14px 0', borderRadius: 12, background: 'linear-gradient(135deg, #14b8a6, #06b6d4)', border: 'none', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(20,184,166,0.3)' }}>
              <RotateCcw size={18} /> Breathe Again
            </button>
            <button onClick={() => navigate('/app/dashboard')} style={{ flex: 1, padding: '14px 0', borderRadius: 12, background: 'white', border: '1px solid #e2e8f0', color: '#1e293b', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <TrendingUp size={18} /> View Dashboard
            </button>
          </motion.div>

          {/* Privacy Badge */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Shield size={16} color="#16a34a" />
            <p style={{ fontSize: 11, color: '#166534' }}>100% on-device · iQOO 15 NPU · No data uploaded</p>
          </div>
        </motion.div>
      </Container>
    );
  }

  // ============ ACTIVE CAMERA SCREEN ============
  if (isActive) {
    return (
      <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={handleStop} style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <ArrowLeft size={20} color="#475569" />
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#0d9488', display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <Smartphone size={12} /> {currentDevice === 'phone' ? 'Phone' : 'Laptop'}
            </div>
            {poseNetEnabled && (
              <div style={{ padding: '6px 12px', borderRadius: 10, background: isPoseNetReady ? '#f0fdf4' : '#fffbeb', border: `1px solid ${isPoseNetReady ? '#bbf7d0' : '#fde68a'}`, fontSize: 11, fontWeight: 600, color: isPoseNetReady ? '#16a34a' : '#d97706', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Cpu size={12} /> {isPoseNetReady ? 'PoseNet' : 'Loading...'}
              </div>
            )}
          </div>
        </motion.div>

        {/* Video Feed */}
        <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#0f172a' }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.7) 0%, transparent 50%, rgba(15,23,42,0.3) 100%)' }} />

          {/* Breathing Phase Overlay */}
          <div style={{ position: 'absolute', top: 60, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ padding: '8px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.95)', border: `2px solid ${PHASE_GUIDE[breathingPhase].color}`, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <span style={{ fontSize: 16 }}>{PHASE_GUIDE[breathingPhase].icon}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: PHASE_GUIDE[breathingPhase].color }}>{PHASE_GUIDE[breathingPhase].label}</p>
                <p style={{ fontSize: 10, color: '#64748b' }}>{PHASE_GUIDE[breathingPhase].instruction}</p>
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{breathCycles}</p>
              <p style={{ fontSize: 10, color: '#64748b' }}>Breaths</p>
            </div>
            <div style={{ padding: '10px 24px', borderRadius: 14, background: 'linear-gradient(135deg, #14b8a6, #06b6d4)', boxShadow: '0 4px 16px rgba(20,184,166,0.4)', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>{formatTime(sessionDuration)}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>Duration</p>
            </div>
            <div style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: breathingRate > 0 ? '#0d9488' : '#94a3b8' }}>{breathingRate > 0 ? breathingRate : '--'}</p>
              <p style={{ fontSize: 10, color: '#64748b' }}>BPM</p>
            </div>
          </div>
        </div>

        {/* PoseNet Status */}
        {poseNetEnabled && (
          <Card style={{ marginTop: 16, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: isPoseNetReady ? '#10b981' : '#f59e0b', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 12, color: '#475569' }}>
                  {isPoseNetReady ? `PoseNet Active · ${currentPose ? Math.round(currentPose.confidence * 100) : 0}% confidence` : 'Loading BlazePose model...'}
                </span>
              </div>
              {isPoseNetReady && currentPose && (
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0d9488' }}>Chest: {Math.round(currentPose.chestExpansion * 100)}%</span>
              )}
            </div>
          </Card>
        )}

        {/* Stop Button */}
        <div style={{ marginTop: 16 }}>
          <button onClick={handleStop} style={{ width: '100%', padding: 16, borderRadius: 14, background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}>
            <CameraOff size={18} /> Stop Session
          </button>
        </div>
      </div>
    );
  }

  // Check if running over insecure HTTP (non-localhost)
  const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // ============ GUIDE SCREEN (START) ============
  return (
    <Container>
      {/* HTTPS Warning */}
      {!isSecure && (
        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>HTTPS Required for Camera Access</p>
            <p style={{ fontSize: 12, color: '#a16207', lineHeight: 1.5 }}>Browsers block camera/microphone on non-secure (HTTP) pages. Access via <strong>https://</strong> or open the app on the same machine at <strong>https://localhost:5173</strong>.</p>
          </div>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <button onClick={() => navigate('/app')} style={{ width: 44, height: 44, borderRadius: 12, background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={20} color="#475569" />
        </button>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Camera Breathing</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ padding: '2px 8px', borderRadius: 6, background: '#dcfce7', color: '#16a34a', fontSize: 10, fontWeight: 700 }}>PHONE-FIRST</span>
            <span style={{ padding: '2px 8px', borderRadius: 6, background: '#ecfeff', color: '#0891b2', fontSize: 10, fontWeight: 700 }}>AI READY</span>
          </div>
        </div>
      </motion.div>

      {/* Hero Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
            style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #f0fdfa, #ecfeff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(20,184,166,0.15)' }}>
            <Camera size={40} color="#0d9488" />
          </motion.div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>How Camera Breathing Works</h2>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
            Your phone's front camera detects chest movement in real-time using TensorFlow.js PoseNet for precision breathing detection.
          </p>
        </Card>
      </motion.div>

      {/* Steps */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginTop: 20 }}>
        <Card>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Getting Started</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { step: 1, text: 'Place phone at chest height, 30-50cm away', icon: '📱', color: '#14b8a6' },
              { step: 2, text: 'Tap "Start Camera" to begin recording', icon: '🎥', color: '#8b5cf6' },
              { step: 3, text: poseNetEnabled ? 'PoseNet tracks shoulder landmarks for precision' : 'Breathe normally — the circle follows your breath', icon: poseNetEnabled ? '🦴' : '🫁', color: '#06b6d4' },
              { step: 4, text: 'See real-time breathing rate and phase detection', icon: '📊', color: '#f59e0b', bg: '#fffbeb' },
            ].map(({ step, text, icon, color, bg }) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 16 }}>{icon}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color, flexShrink: 0 }}>{step}</div>
                  <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.4 }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* PoseNet Toggle */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginTop: 20 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={16} color="#0891b2" />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Enable PoseNet (TensorFlow.js)</p>
                <p style={{ fontSize: 11, color: '#64748b' }}>More accurate chest tracking</p>
              </div>
            </div>
            <button onClick={() => setPoseNetEnabled(!poseNetEnabled)}
              style={{ width: 44, height: 24, borderRadius: 12, background: poseNetEnabled ? '#14b8a6' : '#cbd5e1', border: 'none', cursor: 'pointer', position: 'relative', transition: 'all 0.3s' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: poseNetEnabled ? 22 : 2, transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }} />
            </button>
          </div>
        </Card>
      </motion.div>

      {/* Start Button */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ marginTop: 20, marginBottom: 20 }}>
        <button onClick={handleStart} style={{ width: '100%', padding: 18, borderRadius: 16, background: 'linear-gradient(135deg, #14b8a6, #06b6d4)', border: 'none', color: 'white', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 24px rgba(20,184,166,0.35)', transition: 'all 0.3s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <Camera size={22} /> Start Camera
        </button>
      </motion.div>

      {/* Technical Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card style={{ padding: 18, background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Activity size={16} color="#0d9488" />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>How It Works (Technical)</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { title: 'Pose Detection', desc: 'TensorFlow.js BlazePose detects 33 body landmarks from the front camera', color: '#14b8a6' },
              { title: 'Landmark Tracking', desc: 'Shoulder, hip, and torso landmarks tracked frame-by-frame for chest expansion measurement', color: '#8b5cf6' },
              { title: 'Phase Detection', desc: 'Rising chest expansion trend over 2 seconds = inhale, falling = exhale. 2-second debounce prevents flickering', color: '#06b6d4' },
              { title: 'Breathing Rate', desc: 'Peaks timed between exhale→inhale transitions. Average interval = BPM', color: '#f59e0b' },
            ].map(({ title, desc, color }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, marginTop: 5, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}><strong style={{ color }}>{title}:</strong> {desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Privacy Badge */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, marginTop: 20, marginBottom: 20 }}>
        <Shield size={16} color="#16a34a" />
        <p style={{ fontSize: 11, color: '#166534' }}>100% on-device · TensorFlow.js + BlazePose · No data uploaded</p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 16, marginTop: 16 }}>
          <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>⚠️ {error}</p>
        </div>
      )}
    </Container>
  );
}

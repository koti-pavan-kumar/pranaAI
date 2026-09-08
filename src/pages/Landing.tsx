import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Shield, Brain, Smartphone, Activity, Wind, Mic, BarChart3, Sparkles, Star, Zap, Lock } from 'lucide-react';
import { useAuth } from '../auth';

/* ───────── SVG Illustrations ───────── */
function LungIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" style={{ maxWidth: 120, margin: '0 auto', display: 'block' }}>
      <defs>
        <linearGradient id="lungGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <path d="M100 30 L100 80" stroke="url(#lungGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M100 80 Q60 80 50 120 Q40 160 70 175 Q90 180 100 160" fill="url(#lungGrad)" opacity="0.15" filter="url(#glow)" />
      <path d="M100 80 Q60 80 50 120 Q40 160 70 175 Q90 180 100 160" stroke="url(#lungGrad)" strokeWidth="2" fill="none" />
      <path d="M100 80 Q140 80 150 120 Q160 160 130 175 Q110 180 100 160" fill="url(#lungGrad)" opacity="0.15" filter="url(#glow)" />
      <path d="M100 80 Q140 80 150 120 Q160 160 130 175 Q110 180 100 160" stroke="url(#lungGrad)" strokeWidth="2" fill="none" />
      <path d="M85 100 Q75 120 65 140" stroke="url(#lungGrad)" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M115 100 Q125 120 135 140" stroke="url(#lungGrad)" strokeWidth="1" fill="none" opacity="0.5" />
      <circle cx="100" cy="110" r="20" fill="none" stroke="url(#lungGrad)" strokeWidth="1" opacity="0.3">
        <animate attributeName="r" values="20;35;20" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0.1;0.3" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="100" cy="110" r="30" fill="none" stroke="url(#lungGrad)" strokeWidth="0.5" opacity="0.2">
        <animate attributeName="r" values="30;50;30" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.2;0.05;0.2" dur="4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function PhoneMockup() {
  return (
    <svg viewBox="0 0 220 440" className="w-full h-full" style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.15))' }}>
      <defs>
        <linearGradient id="phoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1f2937" /><stop offset="100%" stopColor="#111827" />
        </linearGradient>
        <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0fdfa" /><stop offset="100%" stopColor="#fafbfc" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="200" height="420" rx="30" fill="url(#phoneGrad)" />
      <rect x="14" y="14" width="192" height="412" rx="28" fill="url(#screenGrad)" />
      <rect x="75" y="18" width="70" height="8" rx="4" fill="#1f2937" />
      <text x="30" y="60" fontSize="12" fontWeight="bold" fill="#111827">Good morning</text>
      <text x="30" y="78" fontSize="16" fontWeight="800" fill="#111827">PranaAI</text>
      <circle cx="75" cy="140" r="35" fill="none" stroke="#e5e7eb" strokeWidth="5" />
      <circle cx="75" cy="140" r="35" fill="none" stroke="#14b8a6" strokeWidth="5" strokeLinecap="round" strokeDasharray="140 80" transform="rotate(-90 75 140)" />
      <text x="65" y="145" fontSize="20" fontWeight="bold" fill="#111827">85</text>
      <rect x="25" y="200" width="80" height="60" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="0.5" />
      <rect x="115" y="200" width="80" height="60" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="0.5" />
      <rect x="25" y="270" width="80" height="60" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="0.5" />
      <rect x="115" y="270" width="80" height="60" rx="12" fill="white" stroke="#e5e7eb" strokeWidth="0.5" />
      <rect x="35" y="215" width="40" height="3" rx="1.5" fill="#14b8a6" opacity="0.6" />
      <rect x="35" y="222" width="55" height="3" rx="1.5" fill="#8b5cf6" opacity="0.4" />
      <rect x="125" y="215" width="45" height="3" rx="1.5" fill="#06b6d4" opacity="0.6" />
      <rect x="125" y="222" width="30" height="3" rx="1.5" fill="#f59e0b" opacity="0.4" />
      <circle cx="65" cy="300" r="15" fill="#14b8a6" opacity="0.1" />
      <circle cx="155" cy="300" r="15" fill="#8b5cf6" opacity="0.1" />
      <rect x="20" y="380" width="180" height="30" rx="8" fill="white" opacity="0.8" />
      <circle cx="50" cy="395" r="4" fill="#14b8a6" />
      <circle cx="90" cy="395" r="4" fill="#9ca3af" />
      <circle cx="130" cy="395" r="4" fill="#9ca3af" />
      <circle cx="170" cy="395" r="4" fill="#9ca3af" />
      <rect x="80" y="418" width="60" height="4" rx="2" fill="#1f2937" opacity="0.3" />
    </svg>
  );
}

function FloatingCard({ icon, title, desc, delay }: {
  icon: React.ReactNode; title: string; desc: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="glass rounded-2xl p-6 widget-card"
    >
      <div className="p-3 rounded-xl bg-brand-50 w-fit mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function StatCounter({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="text-center"
    >
      <div className="stat-value text-4xl font-black gradient-text mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </motion.div>
  );
}

/* Reusable centered container */
const Container = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div style={{ width: '100%', maxWidth: 1152, margin: '0 auto', padding: '0 24px' }} className={className}>
    {children}
  </div>
);

/* ───────── Main Landing Page ───────── */
export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {/* ═══════════ NAVBAR ═══════════ */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }} className="glass-strong border-b border-gray-200/50">
        <Container>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #14b8a6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wind size={18} color="white" />
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>PranaAI</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="landing-nav-links">
              <a href="#features" style={{ fontSize: 14, color: '#6b7280', textDecoration: 'none' }}>Features</a>
              <a href="#how-it-works" style={{ fontSize: 14, color: '#6b7280', textDecoration: 'none' }}>How it Works</a>
              <a href="#stats" style={{ fontSize: 14, color: '#6b7280', textDecoration: 'none' }}>Stats</a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/app')}
                  style={{ padding: '10px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #14b8a6, #06b6d4)', color: 'white', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  Open App
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    style={{ padding: '10px 16px', borderRadius: 12, background: 'none', color: '#4b5563', fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer' }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    style={{ padding: '10px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #14b8a6, #06b6d4)', color: 'white', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </Container>
      </nav>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section style={{ position: 'relative', paddingTop: 128, paddingBottom: 80 }} className="landing-hero md:pt-40 md:pb-32">
        <div style={{ position: 'absolute', top: 80, left: 40, width: 288, height: 288, background: 'rgba(20,184,166,0.1)', borderRadius: '50%', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', bottom: 40, right: 40, width: 384, height: 384, background: 'rgba(139,92,246,0.06)', borderRadius: '50%', filter: 'blur(120px)' }} />

        <Container>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32, alignItems: 'center' }} className="md:grid-cols-2 md:gap-12">
            {/* Left — Text */}
            <motion.div style={{ opacity }} className="md:order-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: '#f0fdfa', border: '1px solid rgba(20,184,166,0.2)', marginBottom: 24 }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#14b8a6', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0f766e' }}>India's First Phone-First AI Hackathon Winner</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900, color: '#111827', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 24 }}
              >
                Breathe.
                <br />
                <span className="text-gradient-teal">Heal.</span>
                <br />
                Thrive.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{ fontSize: 18, color: '#6b7280', lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}
              >
                Your on-device AI wellness companion. Powered by TensorFlow.js and ONNX Runtime —{' '}
                <strong style={{ color: '#374151' }}>100% private, zero cloud, fully on your phone.</strong>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}
              >
                <button
                  onClick={() => navigate(isAuthenticated ? '/app' : '/register')}
                  style={{ padding: '14px 28px', borderRadius: 16, background: 'linear-gradient(135deg, #14b8a6, #06b6d4)', color: 'white', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 40px rgba(20,184,166,0.3)', flex: 1, justifyContent: 'center' }}
                >
                  Start Free <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  style={{ padding: '14px 28px', borderRadius: 16, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', color: '#374151', fontWeight: 600, fontSize: 14, border: '1px solid rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' }}
                >
                  <Lock size={16} /> Watch Demo
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 32 }}
              >
                <div style={{ display: 'flex' }}>
                  {['🧑‍💻', '👩‍⚕️', '👨‍🎓', '🧘'].map((e, i) => (
                    <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f0fdfa', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, marginLeft: i > 0 ? -8 : 0 }}>
                      {e}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1,2,3,4,5].map(i => <Star key={i} size={12} className="text-amber-400 fill-amber-400" />)}
                  </div>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Loved by 2,000+ wellness enthusiasts</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right — Phone Mockup + Floating Elements */}
            <motion.div style={{ y: y1, position: 'relative', display: 'flex', justifyContent: 'center' }} className="landing-phone-mockup md:order-2">
              <div style={{ position: 'relative', perspective: '1200px' }}>
                <motion.div
                  initial={{ opacity: 0, y: 40, rotateY: -15 }}
                  animate={{ opacity: 1, y: 0, rotateY: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  style={{ width: 256, transformStyle: 'preserve-3d' }}
                >
                  <PhoneMockup />
                </motion.div>

                {/* Floating card — Top right */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ position: 'absolute', top: -16, right: -96, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderRadius: 12, padding: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.5)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>Wellness Score</p>
                      <p style={{ fontSize: 10, color: '#14b8a6' }}>85/100 ↑</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating card — Left */}
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  style={{ position: 'absolute', top: '33%', left: -80, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderRadius: 12, padding: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.5)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Mic size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>Mood Detected</p>
                      <p style={{ fontSize: 10, color: '#8b5cf6' }}>Calm & Focused 🧘</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating card — Bottom left */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                  style={{ position: 'absolute', bottom: 32, left: -64, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderRadius: 12, padding: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.5)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Brain size={16} className="text-cyan-600" />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>AI Inference</p>
                      <p style={{ fontSize: 10, color: '#06b6d4' }}>ONNX Runtime · 15ms</p>
                    </div>
                  </div>
                </motion.div>

                {/* Glow behind phone */}
                <div style={{ position: 'absolute', inset: 0, zIndex: -1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 320, height: 320, background: 'rgba(20,184,166,0.12)', borderRadius: '50%', filter: 'blur(60px)' }} />
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section id="features" style={{ padding: '80px 0' }} className="md:py-28">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #99f6e4, transparent)' }} />
        <Container>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Features</span>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: '#111827', marginTop: 12, marginBottom: 16 }}>
              Everything you need for<br /><span className="text-gradient-teal">mental wellness</span>
            </h2>
            <p style={{ color: '#6b7280', maxWidth: 512, margin: '0 auto' }}>
              AI-powered breathing, mood tracking, and wellness insights — all running on your device, never in the cloud.
            </p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="md:grid-cols-3 md:gap-6">
            <FloatingCard icon={<Wind size={22} className="text-brand-600" />} title="AI Breathing Coach" desc="4 guided breathing patterns with real-time camera detection. Watch the AI track your chest movement and guide your rhythm." delay={0} />
            <FloatingCard icon={<Mic size={22} className="text-purple-600" />} title="Voice Mood Journal" desc="Speak your thoughts — AI analyzes sentiment on-device using ONNX Runtime. Your voice never leaves your phone." delay={0.1} />
            <FloatingCard icon={<Brain size={22} className="text-cyan-600" />} title="On-Device AI" desc="Powered by TensorFlow.js BlazePose and ONNX Runtime. Real inference running on the Snapdragon NPU — no cloud needed." delay={0.2} />
            <FloatingCard icon={<BarChart3 size={22} className="text-amber-600" />} title="Wellness Dashboard" desc="7-day mood trends, breathing stats, streak tracking, and AI-powered personalized recommendations." delay={0.3} />
            <FloatingCard icon={<Shield size={22} className="text-emerald-600" />} title="100% Private" desc="Zero cloud uploads, zero data tracking. Every AI inference runs on your phone. Your wellness data stays yours." delay={0.4} />
            <FloatingCard icon={<Smartphone size={22} className="text-pink-600" />} title="Phone-First Design" desc="Built for the iQOO Hackathon — designed to run entirely on a smartphone. Camera, mic, and NPU as your wellness tools." delay={0.5} />
          </div>
        </Container>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" style={{ padding: '80px 0', background: 'linear-gradient(180deg, #fafbfc, rgba(240,253,250,0.3))' }} className="md:py-28">
        <Container>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.05em' }}>How it Works</span>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: '#111827', marginTop: 12 }}>
              Three steps to<br /><span className="text-gradient-teal">better breathing</span>
            </h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }} className="md:grid-cols-3 md:gap-8">
            {[
              { step: '01', title: 'Open the Camera', desc: 'Point your phone at your chest. The front camera captures your breathing movement in real-time.', icon: <Smartphone size={24} className="text-brand-600" /> },
              { step: '02', title: 'AI Detects Breathing', desc: 'TensorFlow.js BlazePose tracks 33 body landmarks. Chest expansion is measured frame-by-frame.', icon: <Brain size={24} className="text-purple-600" /> },
              { step: '03', title: 'Get AI Feedback', desc: 'After your session, receive personalized analysis with breathing consistency, BPM, and improvement tips.', icon: <Sparkles size={24} className="text-cyan-600" /> },
            ].map(({ step, title, desc, icon }, i) => (
              <motion.div key={step} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <div className="glass rounded-2xl p-8 h-full widget-card">                   <div className="step-number" style={{ fontSize: 48, fontWeight: 900, color: '#ccfbf1', marginBottom: 16 }}>{step}</div>
                  <div className="p-3 rounded-xl bg-brand-50 w-fit mb-4">{icon}</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 12 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section id="stats" style={{ padding: '80px 0' }} className="md:py-28">
        <Container>
          <div className="glass md:p-16" style={{ borderRadius: 24, padding: '40px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 256, height: 256, background: 'rgba(204,251,241,0.5)', borderRadius: '50%', filter: 'blur(80px)' }} />
            <div className="relative">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: '#111827', marginBottom: 48 }}>
                  Built for the <span className="text-gradient-teal">iQOO Hackathon</span>
                </h2>
              </motion.div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }} className="stats-grid md:grid-cols-4 md:gap-8">
                <StatCounter value="6+" label="App Screens" delay={0} />
                <StatCounter value="15ms" label="AI Inference" delay={0.1} />
                <StatCounter value="100%" label="On-Device" delay={0.2} />
                <StatCounter value="0" label="Cloud Calls" delay={0.3} />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════ TECH STACK ═══════════ */}
      <section style={{ padding: '80px 0', background: 'linear-gradient(180deg, rgba(240,253,250,0.3), #fafbfc)' }} className="md:py-28">
        <Container>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tech Stack</span>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: '#111827', marginTop: 12 }}>
              Powered by <span className="text-gradient-teal">cutting-edge AI</span>
            </h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }} className="md:grid-cols-4 md:gap-4">
            {[
              { name: 'TensorFlow.js', desc: 'Pose detection', color: 'from-orange-400 to-amber-500' },
              { name: 'ONNX Runtime', desc: 'Sentiment analysis', color: 'from-blue-400 to-indigo-500' },
              { name: 'React + TypeScript', desc: 'UI framework', color: 'from-cyan-400 to-blue-500' },
              { name: 'Tailwind CSS', desc: 'Styling', color: 'from-teal-400 to-brand-500' },
            ].map(({ name, desc, color }, i) => (
              <motion.div key={name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass rounded-2xl p-5 text-center widget-card">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} mx-auto mb-3 flex items-center justify-center`}>
                  <Zap size={20} className="text-white" />
                </div>
                <p style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>{name}</p>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section style={{ padding: '80px 0' }} className="md:py-28">
        <div style={{ maxWidth: 896, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>              <div className="glass md:p-16" style={{ borderRadius: 24, padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(20,184,166,0.03), rgba(139,92,246,0.03))' }} />
              <div style={{ position: 'relative' }}>
                <LungIllustration />
                <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 900, color: '#111827', marginTop: 24, marginBottom: 16 }}>
                  Ready to breathe better?
                </h2>
                <p style={{ color: '#6b7280', marginBottom: 32, maxWidth: 448, margin: '0 auto 32px' }}>
                  Join thousands using AI-powered breathing exercises to reduce stress, improve focus, and sleep better.
                </p>
                <button
                  onClick={() => navigate(isAuthenticated ? '/app' : '/register')}
                  style={{ padding: '16px 40px', borderRadius: 16, background: 'linear-gradient(135deg, #14b8a6, #06b6d4)', color: 'white', fontWeight: 700, fontSize: 18, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 40px rgba(20,184,166,0.3)' }}
                >
                  Get Started Free <ArrowRight size={20} />
                </button>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Lock size={12} /> No credit card required · 100% free
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer style={{ borderTop: '1px solid #e5e7eb', padding: '48px 0' }}>
        <Container>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #14b8a6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wind size={16} color="white" />
              </div>
              <span style={{ fontWeight: 700, color: '#111827' }}>PranaAI</span>
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: 14, color: '#9ca3af' }}>
              <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Features</a>
              <a href="#how-it-works" style={{ color: 'inherit', textDecoration: 'none' }}>How it Works</a>
              <a href="#stats" style={{ color: 'inherit', textDecoration: 'none' }}>Stats</a>
            </div>
            <p style={{ fontSize: 12, color: '#9ca3af' }}>Built for iQOO Hackathon 2026 🏆</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}

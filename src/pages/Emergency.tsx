import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageSquare, ExternalLink, ArrowLeft, Shield, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HELPLINES = [
  {
    name: 'iCall',
    number: '+91 9152987821',
    description: 'Psychosocial helpline',
    available: '24/7',
    type: 'call' as const,
  },
  {
    name: 'Vandrevala Foundation',
    number: '1860-2662-345',
    description: 'Mental health support',
    available: '24/7',
    type: 'call' as const,
  },
  {
    name: 'AASRA',
    number: '+91 9820466726',
    description: 'Emotional support',
    available: '24/7',
    type: 'call' as const,
  },
  {
    name: 'SNEHA',
    number: '+91 44-24640050',
    description: 'Chennai-based helpline',
    available: '24/7',
    type: 'call' as const,
  },
  {
    name: 'iCall WhatsApp',
    number: '+91 9152987821',
    description: 'Text-based support',
    available: '24/7',
    type: 'whatsapp' as const,
  },
];

const COPING_TECHNIQUES = [
  {
    title: 'Ground Yourself (5-4-3-2-1)',
    steps: ['Name 5 things you can SEE', 'Name 4 things you can TOUCH', 'Name 3 things you can HEAR', 'Name 2 things you can SMELL', 'Name 1 thing you can TASTE'],
    icon: '🌍',
  },
  {
    title: 'Cold Water Reset',
    steps: ['Hold ice cubes in your hands', 'Splash cold water on your face', 'This activates your dive reflex, slowing your heart rate'],
    icon: '❄️',
  },
  {
    title: 'Box Breathing',
    steps: ['Breathe IN for 4 seconds', 'HOLD for 4 seconds', 'Breathe OUT for 4 seconds', 'HOLD for 4 seconds', 'Repeat 4 times'],
    icon: '🫁',
  },
];

export default function Emergency() {
  const navigate = useNavigate();
  const [expandedTechnique, setExpandedTechnique] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl glass text-gray-400 hover:text-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-red-400">Emergency Support</h1>
          <p className="text-xs text-gray-400">You are not alone</p>
        </div>
      </div>

      {/* Crisis Message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl p-6 bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20"
      >
        <div className="flex items-center gap-3 mb-3">
          <Heart size={20} className="text-red-400" />
          <h2 className="text-lg font-semibold text-gray-800">You matter.</h2>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Whatever you're going through right now, it will pass. These feelings are valid,
          and there are people who want to help. Please reach out — you deserve support.
        </p>
      </motion.div>

      {/* Quick Call Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Phone size={14} />
          Crisis Helplines
        </h3>
        <div className="space-y-2">
          {HELPLINES.map((line, i) => (
            <motion.div
              key={line.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="glass rounded-2xl p-4 flex items-center gap-4"
            >
              <div className={`p-3 rounded-xl ${line.type === 'whatsapp' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {line.type === 'whatsapp' ? (
                  <MessageSquare size={20} className="text-green-400" />
                ) : (
                  <Phone size={20} className="text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-800">{line.name}</h4>
                <p className="text-xs text-gray-400">{line.description}</p>
                <p className="text-xs text-emerald-400 mt-0.5">🕐 {line.available}</p>
              </div>
              <a
                href={line.type === 'whatsapp'
                  ? `https://wa.me/${line.number.replace(/\D/g, '')}`
                  : `tel:${line.number.replace(/\D/g, '')}`
                }
                className={`p-3 rounded-xl ${
                  line.type === 'whatsapp' ? 'bg-green-500/20 hover:bg-green-500/30' : 'bg-red-500/20 hover:bg-red-500/30'
                } transition-colors`}
              >
                {line.type === 'whatsapp' ? (
                  <ExternalLink size={18} className="text-green-400" />
                ) : (
                  <Phone size={18} className="text-red-400" />
                )}
              </a>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Coping Techniques */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Shield size={14} />
          Immediate Coping Techniques
        </h3>
        <div className="space-y-2">
          {COPING_TECHNIQUES.map((technique, i) => (
            <motion.div
              key={technique.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.05 }}
            >
              <button
                onClick={() => setExpandedTechnique(expandedTechnique === i ? null : i)}
                className="w-full glass rounded-2xl p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{technique.icon}</span>
                  <h4 className="text-sm font-semibold text-gray-800 flex-1">{technique.title}</h4>
                  <motion.div
                    animate={{ rotate: expandedTechnique === i ? 180 : 0 }}
                    className="text-gray-500"
                  >
                    ▼
                  </motion.div>
                </div>
              </button>
              <AnimatePresence>
                {expandedTechnique === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="glass rounded-2xl p-4 mt-1 space-y-2">
                      {technique.steps.map((step, j) => (
                        <div key={j} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center text-[10px] text-brand-400 font-bold shrink-0">
                            {j + 1}
                          </div>
                          <p className="text-sm text-gray-600">{step}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Emergency Number */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <a
          href="tel:112"
          className="block w-full py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-gray-800 text-center font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-500/30"
        >
          <div className="flex items-center justify-center gap-2">
            <Phone size={20} />
            Call Emergency (112)
          </div>
        </a>
      </motion.div>

      {/* Safety Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center py-4"
      >
        <p className="text-[10px] text-gray-500 leading-relaxed max-w-xs mx-auto">
          PranaAI is not a substitute for professional mental health support.
          If you're in crisis, please contact a helpline or emergency services.
        </p>
      </motion.div>
    </div>
  );
}

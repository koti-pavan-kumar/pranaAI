import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Send, ChevronDown, ChevronUp, Sparkles, BookOpen, AlertCircle, Globe } from 'lucide-react';
import { useApp } from '../store';
import { analyzeSentiment, analyzeSentimentAsync } from '../utils/sentiment';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { t, getLanguage } from '../utils/i18n';
import type { Mood } from '../types';

const MOODS: { mood: Mood; emoji: string; label: string; color: string; bg: string }[] = [
  { mood: 'happy', emoji: '😊', label: 'Happy', color: '#059669', bg: '#ecfdf5' },
  { mood: 'calm', emoji: '🧘', label: 'Calm', color: '#0d9488', bg: '#f0fdfa' },
  { mood: 'energetic', emoji: '⚡', label: 'Energetic', color: '#d97706', bg: '#fffbeb' },
  { mood: 'neutral', emoji: '😐', label: 'Neutral', color: '#6b7280', bg: '#f9fafb' },
  { mood: 'anxious', emoji: '😰', label: 'Anxious', color: '#dc2626', bg: '#fef2f2' },
  { mood: 'sad', emoji: '😢', label: 'Sad', color: '#7c3aed', bg: '#faf5ff' },
];

export default function Journal() {
  const { addJournalEntry, journalEntries } = useApp();
  const [text, setText] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [showEntries, setShowEntries] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ mood: Mood; score: number; tags: string[] } | null>(null);
  const { isListening, transcript, startListening, stopListening, error: voiceError, isSupported } = useVoiceInput();

  // Sync voice transcript to textarea
  useEffect(() => {
    if (transcript) {
      setText(transcript);
      scheduleAnalysis(transcript);
    }
  }, [transcript]);

  const analyzeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced analysis — only runs 800ms after user stops typing
  const scheduleAnalysis = useCallback((inputText: string) => {
    if (analyzeTimeoutRef.current) clearTimeout(analyzeTimeoutRef.current);
    analyzeTimeoutRef.current = setTimeout(async () => {
      if (!inputText.trim()) return;
      try {
        const result = await analyzeSentimentAsync(inputText);
        setAnalysisResult(result);
      } catch {
        const result = analyzeSentiment(inputText);
        setAnalysisResult(result);
      }
    }, 800);
  }, []);

  const handleSubmit = async () => {
    const content = text.trim();
    if (!content) return;
    // Run analysis synchronously for submit
    const result = analyzeSentiment(content);
    const mood = selectedMood || result.mood;
    addJournalEntry({ text: content, mood, sentimentScore: result.score, tags: result.tags });
    setText('');
    setSelectedMood(null);
    setAnalysisResult(null);
  };

  return (
    <div>
      {/* Desktop */}
      <div className="only-md-flex" style={{ flexDirection: 'column' }}>
        <Content
          text={text} setText={setText} selectedMood={selectedMood} setSelectedMood={setSelectedMood}
          showEntries={showEntries} setShowEntries={setShowEntries} analysisResult={analysisResult}
          isListening={isListening} startListening={startListening} stopListening={stopListening}            voiceError={voiceError} isSupported={isSupported}
          handleSubmit={handleSubmit} scheduleAnalysis={scheduleAnalysis} journalEntries={journalEntries}
        />
      </div>
      {/* Mobile */}
      <div className="only-mobile">
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <Content
            text={text} setText={setText} selectedMood={selectedMood} setSelectedMood={setSelectedMood}
            showEntries={showEntries} setShowEntries={setShowEntries} analysisResult={analysisResult}
            isListening={isListening} startListening={startListening} stopListening={stopListening}
            voiceError={voiceError} isSupported={isSupported}
            handleSubmit={handleSubmit} scheduleAnalysis={scheduleAnalysis} journalEntries={journalEntries}
          />
        </div>
      </div>
    </div>
  );
}

// Content component defined OUTSIDE to prevent re-mount on every render
function Content({ text, setText, selectedMood, setSelectedMood, showEntries, setShowEntries, analysisResult, isListening, startListening, stopListening, voiceError, isSupported, handleSubmit, scheduleAnalysis, journalEntries }: {
  text: string; setText: (v: string) => void;
  selectedMood: Mood | null; setSelectedMood: (m: Mood | null) => void;
  showEntries: boolean; setShowEntries: (v: boolean) => void;
  analysisResult: { mood: Mood; score: number; tags: string[] } | null;
  isListening: boolean; startListening: () => void; stopListening: () => void;
  voiceError: string | null; isSupported: boolean;
  handleSubmit: () => void; scheduleAnalysis: (text: string) => void;
  journalEntries: Array<{ id: string; text: string; mood: string; timestamp: number; sentimentScore: number; tags: string[] }>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{t('journal.title')}</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{t('journal.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: getLanguage() === 'hi' ? '#fef3c7' : '#f0fdfa', border: `1px solid ${getLanguage() === 'hi' ? '#fcd34d' : '#ccfbf1'}`, flexShrink: 0 }}>
          <Globe size={12} color={getLanguage() === 'hi' ? '#d97706' : '#0d9488'} />
          <span style={{ fontSize: 11, fontWeight: 600, color: getLanguage() === 'hi' ? '#92400e' : '#0f766e' }}>
            {getLanguage() === 'hi' ? 'हिंदी आवाज़' : 'English Voice'}
          </span>
        </div>
      </div>

      {/* Input Area */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 18, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); scheduleAnalysis(e.target.value); }}
          placeholder={t('journal.placeholder')}
          style={{ width: '100%', minHeight: 100, border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, fontSize: 14, color: '#1e293b', background: '#f8fafc', resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6 }}
        />

        {/* Voice + Mood Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <button onClick={isListening ? stopListening : () => startListening()}
              style={{ width: 40, height: 40, borderRadius: 10, background: isListening ? '#fef2f2' : '#f0fdfa', border: `1px solid ${isListening ? '#fecaca' : '#ccfbf1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isListening ? '#dc2626' : '#0d9488', flexShrink: 0 }}>
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            {isListening && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', animation: 'pulse 1s infinite' }} />
                <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>{t('journal.recording')}</span>
              </div>
            )}
            {!isListening && voiceError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={12} color="#dc2626" />
                <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 500 }}>{voiceError}</span>
              </div>
            )}
            {!isListening && !voiceError && !isSupported && (
              <span style={{ fontSize: 11, color: '#94a3b8' }}>Voice not supported in this browser</span>
            )}
          </div>
          <button onClick={handleSubmit} disabled={!text.trim()}
            style={{ padding: '10px 20px', borderRadius: 10, background: text.trim() ? 'linear-gradient(135deg, #14b8a6, #06b6d4)' : '#f1f5f9', border: 'none', color: text.trim() ? 'white' : '#94a3b8', fontWeight: 600, fontSize: 13, cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
            <Send size={14} /> {t('journal.save')}
          </button>
        </div>

        {/* Mood Selection */}
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>{t('journal.mood')}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {MOODS.map(({ mood, emoji, label, color, bg }) => (
              <button key={mood} onClick={() => setSelectedMood(mood === selectedMood ? null : mood)}
                style={{ padding: '6px 12px', borderRadius: 8, background: selectedMood === mood ? bg : '#f8fafc', border: `1.5px solid ${selectedMood === mood ? color : '#e2e8f0'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: selectedMood === mood ? color : '#64748b', transition: 'all 0.15s' }}>
                {emoji} {label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Analysis Preview */}
        {analysisResult && (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Sparkles size={12} color="#0d9488" />
              <p style={{ fontSize: 11, fontWeight: 600, color: '#0d9488' }}>AI Analysis</p>
            </div>
            <p style={{ fontSize: 12, color: '#1e293b' }}>Detected mood: <strong style={{ color: MOODS.find(m => m.mood === analysisResult.mood)?.color }}>{MOODS.find(m => m.mood === analysisResult.mood)?.emoji} {analysisResult.mood}</strong></p>
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Confidence: {Math.round(analysisResult.score * 100)}%</p>
            {analysisResult.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                {analysisResult.tags.map(tag => <span key={tag} style={{ padding: '2px 8px', borderRadius: 4, background: '#e0f2fe', fontSize: 10, fontWeight: 600, color: '#0369a1' }}>{tag}</span>)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Past Entries */}
      <div>
        <button onClick={() => setShowEntries(!showEntries)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <BookOpen size={16} color="#64748b" />
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('journal.past')} ({journalEntries.length})</h3>
          {showEntries ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
        </button>
        {showEntries && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {journalEntries.map(entry => {
              const m = MOODS.find(mood => mood.mood === entry.mood);
              return (
                <div key={entry.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: m?.bg || '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{m?.emoji || '😐'}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.5 }}>{entry.text}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: m?.bg || '#f9fafb', color: m?.color || '#6b7280', fontWeight: 600 }}>{entry.mood}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

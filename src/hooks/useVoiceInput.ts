import { useState, useCallback, useRef, useEffect } from 'react';
import { getVoiceLanguage } from '../utils/i18n';

interface UseVoiceInputReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  error: string | null;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const accumulatedRef = useRef('');
  const resultCountRef = useRef(0);

  const isSupported = typeof window !== 'undefined' && (
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionAPI = typeof window !== 'undefined'
    ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    : null;

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const createRecognition = useCallback(() => {
    if (!SpeechRecognitionAPI) return null;
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    // Always read the CURRENT language — not a stale closure value
    const lang = getVoiceLanguage();
    recognition.lang = lang;
    recognition.maxAlternatives = 1;
    console.log(`[VoiceInput] Creating recognition with lang=${lang}`);
    return recognition;
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Use Chrome, Edge, or Safari.');
      return;
    }

    if (!SpeechRecognitionAPI) return;

    // Stop any existing recognition first
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = createRecognition();
    if (!recognition) return;
    recognitionRef.current = recognition;
    shouldListenRef.current = true;
    accumulatedRef.current = '';
    resultCountRef.current = 0;

    recognition.onresult = (event: any) => {
      let newFinal = '';
      let interim = '';

      // Only process results AFTER the last known result count (prevents duplicates on restart)
      for (let i = resultCountRef.current; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          newFinal += result[0].transcript;
          resultCountRef.current = i + 1;
        } else {
          interim += result[0].transcript;
        }
      }

      if (newFinal) {
        accumulatedRef.current += newFinal;
      }

      setTranscript(accumulatedRef.current);
      setInterimTranscript(interim);
      console.log(`[VoiceInput] Final: "${accumulatedRef.current}" | Interim: "${interim}"`);
    };

    recognition.onerror = (event: any) => {
      console.error('[VoiceInput] Error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permission and try again.');
        setIsListening(false);
        shouldListenRef.current = false;
      } else if (event.error === 'no-speech') {
        // No speech detected — this is normal, just keep listening
        console.log('[VoiceInput] No speech detected, continuing...');
      } else if (event.error === 'audio-capture') {
        setError('No microphone found. Please connect a microphone.');
        setIsListening(false);
        shouldListenRef.current = false;
      } else if (event.error !== 'aborted' && event.error !== 'network') {
        setError(`Speech error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          // Re-read current language on restart — handles language switch while recording
          const newRecognition = createRecognition();
          if (newRecognition) {
            recognitionRef.current = newRecognition;
            newRecognition.onresult = recognition.onresult;
            newRecognition.onerror = recognition.onerror;
            newRecognition.onend = recognition.onend;
            newRecognition.start();
            console.log(`[VoiceInput] Auto-restarted with lang=${newRecognition.lang}`);
          }
        } catch (e) {
          console.error('[VoiceInput] Failed to restart:', e);
          setIsListening(false);
          shouldListenRef.current = false;
        }
      } else {
        setIsListening(false);
      }
    };

    try {
      recognition.start();
      setIsListening(true);
      setError(null);
      console.log('[VoiceInput] Started — speak now!');
    } catch (e) {
      console.error('[VoiceInput] Failed to start:', e);
      setError('Failed to start speech recognition. Please try again.');
    }
  }, [isSupported, createRecognition]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    accumulatedRef.current = '';
    resultCountRef.current = 0;
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error,
  };
}

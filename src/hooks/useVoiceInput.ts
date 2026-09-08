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
  const finalTextRef = useRef('');

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

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Use Chrome, Edge, or Safari.');
      return;
    }
    if (!SpeechRecognitionAPI) return;

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    const lang = getVoiceLanguage();
    recognition.lang = lang;

    recognitionRef.current = recognition;
    shouldListenRef.current = true;
    finalTextRef.current = '';

    // Track ALL final results by index to prevent duplicates
    const processedIndices = new Set<number>();

    recognition.onresult = (event: any) => {
      let newFinal = '';
      let interim = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal && !processedIndices.has(i)) {
          // Only process this result ONCE
          processedIndices.add(i);
          const text = result[0].transcript.trim();
          if (text) {
            newFinal += (newFinal ? ' ' : '') + text;
          }
        } else if (!result.isFinal) {
          interim += result[0].transcript;
        }
      }

      if (newFinal) {
        finalTextRef.current = finalTextRef.current
          ? finalTextRef.current + ' ' + newFinal
          : newFinal;
      }

      setTranscript(finalTextRef.current);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permission and try again.');
        setIsListening(false);
        shouldListenRef.current = false;
      } else if (event.error === 'audio-capture') {
        setError('No microphone found. Please connect a microphone.');
        setIsListening(false);
        shouldListenRef.current = false;
      } else if (event.error !== 'aborted' && event.error !== 'no-speech' && event.error !== 'network') {
        console.error('[VoiceInput] Error:', event.error);
      }
    };

    recognition.onend = () => {
      // Chrome stops after ~60s silence. Don't auto-restart to prevent
      // text duplication. User clicks mic button to continue.
      setIsListening(false);
    };

    try {
      recognition.start();
      setIsListening(true);
      setError(null);
    } catch (e) {
      console.error('[VoiceInput] Failed to start:', e);
      setError('Failed to start speech recognition. Please try again.');
    }
  }, [isSupported, SpeechRecognitionAPI]);

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
    finalTextRef.current = '';
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

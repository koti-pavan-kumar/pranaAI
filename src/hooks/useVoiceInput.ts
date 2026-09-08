import { useState, useCallback, useRef, useEffect } from 'react';

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
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
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

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      // Accumulate final results across restarts
      if (final) {
        accumulatedRef.current += final;
      }
      setTranscript(accumulatedRef.current);
      setInterimTranscript(interim);
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
      // Auto-restart if we're still supposed to be listening
      // Chrome stops after ~60s of silence — we need to restart
      if (shouldListenRef.current) {
        try {
          const newRecognition = createRecognition();
          if (newRecognition) {
            recognitionRef.current = newRecognition;
            // Re-attach event handlers
            newRecognition.onresult = recognition.onresult;
            newRecognition.onerror = recognition.onerror;
            newRecognition.onend = recognition.onend;
            newRecognition.start();
            console.log('[VoiceInput] Auto-restarted recognition');
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

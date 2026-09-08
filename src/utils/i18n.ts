/**
 * Internationalization — Hindi + English support
 */

export type Language = 'en' | 'hi';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.breathe': 'Breathe',
    'nav.journal': 'Journal',
    'nav.insights': 'Insights',
    'nav.chat': 'Chat',
    'nav.telemetry': 'Telemetry',

    // Landing
    'landing.title': 'Breathe. Heal. Thrive.',
    'landing.subtitle': 'Your on-device AI wellness companion. Powered by TensorFlow.js and ONNX Runtime — 100% private, zero cloud, fully on your phone.',
    'landing.cta': 'Start Free',
    'landing.demo': 'Watch Demo',

    // Journal
    'journal.title': 'Journal',
    'journal.subtitle': 'Speak or type your thoughts — AI analyzes mood on-device',
    'journal.placeholder': 'How are you feeling today? Type or use the mic...',
    'journal.save': 'Save Entry',
    'journal.mood': 'Or select your mood:',
    'journal.recording': 'Listening... speak now',
    'journal.past': 'Past Entries',

    // Breathing
    'breathing.title': 'Breathe',
    'breathing.subtitle': 'Choose a breathing pattern to begin your session',
    'breathing.start': 'Start Camera',
    'breathing.stop': 'Stop Session',
    'breathing.cycles': 'Cycles',
    'breathing.duration': 'Duration',

    // Dashboard
    'dashboard.title': 'Insights',
    'dashboard.subtitle': 'Your wellness journey at a glance',
    'dashboard.sessions': 'Sessions',
    'dashboard.entries': 'Journal Entries',
    'dashboard.minutes': 'Total Minutes',
    'dashboard.streak': 'Current Streak',

    // Chat
    'chat.title': 'AI Wellness Coach',
    'chat.subtitle': 'Ask me anything about wellness, breathing, or mental health',
    'chat.placeholder': 'Type your message...',

    // Auth
    'auth.login': 'Sign In',
    'auth.register': 'Create Account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.retry': 'Try Again',
    'common.offline': 'Offline Mode',
    'common.export': 'Export',
    'common.share': 'Share',
  },

  hi: {
    // Navigation
    'nav.home': 'होम',
    'nav.breathe': 'साँस लें',
    'nav.journal': 'डायरी',
    'nav.insights': 'अंतर्दृष्टि',
    'nav.chat': 'चैट',
    'nav.telemetry': 'टेलीमेट्री',

    // Landing
    'landing.title': 'साँस लें। ठीक हों। आगे बढ़ें।',
    'landing.subtitle': 'आपका ऑन-डिवाइस AI वेलनेस साथी। TensorFlow.js और ONNX Runtime द्वारा संचालित — 100% निजी, ज़ीरो क्लाउड, आपके फ़ोन पर पूरी तरह से।',
    'landing.cta': 'मुफ्त शुरू करें',
    'landing.demo': 'डेमो देखें',

    // Journal
    'journal.title': 'डायरी',
    'journal.subtitle': 'अपने विचार बोलें या लिखें — AI ऑन-डिवाइस मूड का विश्लेषण करता है',
    'journal.placeholder': 'आज आप कैसा महसूस कर रहे हैं? टाइप करें या माइक का उपयोग करें...',
    'journal.save': 'एंट्री सहेजें',
    'journal.mood': 'या अपना मूड चुनें:',
    'journal.recording': 'सुन रहे हैं... अब बोलें',
    'journal.past': 'पिछली एंट्री',

    // Breathing
    'breathing.title': 'साँस लें',
    'breathing.subtitle': 'अपना सत्र शुरू करने के लिए एक साँस पैटर्न चुनें',
    'breathing.start': 'कैमरा शुरू करें',
    'breathing.stop': 'सत्र बंद करें',
    'breathing.cycles': 'चक्र',
    'breathing.duration': 'अवधि',

    // Dashboard
    'dashboard.title': 'अंतर्दृष्टि',
    'dashboard.subtitle': 'आपकी वेलनेस यात्रा की एक झलक',
    'dashboard.sessions': 'सत्र',
    'dashboard.entries': 'डायरी एंट्री',
    'dashboard.minutes': 'कुल मिनट',
    'dashboard.streak': 'वर्तमान स्ट्रीक',

    // Chat
    'chat.title': 'AI वेलनेस कोच',
    'chat.subtitle': 'वेलनेस, साँस, या मानसिक स्वास्थ्य के बारे में कुछ भी पूछें',
    'chat.placeholder': 'अपना संदेश टाइप करें...',

    // Auth
    'auth.login': 'साइन इन',
    'auth.register': 'खाता बनाएं',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.name': 'पूरा नाम',

    // Common
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'कुछ गलत हो गया',
    'common.retry': 'फिर से कोशिश करें',
    'common.offline': 'ऑफलाइन मोड',
    'common.export': 'एक्सपोर्ट',
    'common.share': 'शेयर',
  },
};

let currentLanguage: Language = 'en';

export function setLanguage(lang: Language) {
  currentLanguage = lang;
  localStorage.setItem('pranaai_lang', lang);
}

export function getLanguage(): Language {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('pranaai_lang') as Language;
    if (stored && (stored === 'en' || stored === 'hi')) {
      currentLanguage = stored;
    }
  }
  return currentLanguage;
}

export function t(key: string): string {
  return translations[currentLanguage]?.[key] || translations.en[key] || key;
}

export function getVoiceLanguage(): string {
  return currentLanguage === 'hi' ? 'hi-IN' : 'en-US';
}

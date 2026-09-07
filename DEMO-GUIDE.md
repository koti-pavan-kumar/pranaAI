# PranaAI — Hackathon Demo Script & Pitch Guide

## 🎤 60-Second Elevator Pitch

> *"Hi, I'm [YOUR NAME]. PranaAI is a phone-first AI wellness companion that runs 
> entirely on your device — zero cloud dependency for AI inference.*
>
> *Using just your phone's camera, it detects your breathing patterns through 
> computer vision — no wearables needed. The on-device AI analyzes your journal 
> entries for emotional patterns using a real ONNX neural network, and the 
> intelligent chat provides personalized wellness guidance.*
>
> *Everything runs on-device through ONNX Runtime Web and TensorFlow.js, with 
> Supabase providing cross-device sync. Your health data stays on your phone.*
>
> *PranaAI proves that meaningful health AI doesn't need expensive hardware — 
> just the phone already in your pocket."*

---

## 🎬 Demo Flow (3 minutes)

### Act 1: Camera Breathing (60 seconds)
1. Open PranaAI → Show the professional landing page
2. Click **"Breathing"** in sidebar → Click **"Camera Breathing"**
3. Allow camera access → Position yourself in frame
4. **Narrate:** *"Watch — PranaAI analyzes my chest movement using computer vision with bandpass filtering to isolate breathing from other body movements."*
5. Breathe deeply 3-4 times → Show the phase detection changing
6. End session → Show the stats: BPM, consistency, phase breakdown
7. **Narrate:** *"Every session generates personalized feedback using AI analysis of your breathing patterns."*

### Act 2: AI Journal & Sentiment (60 seconds)
1. Click **"Journal"** in sidebar
2. **Narrate:** *"Speak or type your thoughts — the on-device AI analyzes your emotional state in real-time."*
3. **Speak:** *"I had a really great day today, feeling grateful and happy"*
4. Show the **AI Analysis** card: positive mood detected, confidence score
5. **Narrate:** *"This runs a real ONNX neural network model on your phone — not a keyword matcher. The model was trained on sentiment data and loads directly in the browser."*
6. Show the **Past Entries** with mood history

### Act 3: AI Chat (60 seconds)
1. Click **"Chat"** in sidebar
2. Type: *"I'm feeling anxious about my exams"*
3. Show the AI's personalized response about anxiety management techniques
4. Type: *"Can you suggest a breathing exercise?"*
5. Show the contextual breathing guidance
6. **Narrate:** *"The chat understands context — it knows about your breathing sessions and journal history to provide personalized wellness coaching."*

---

## 🏆 Judge-Q&A Preparation

### Q: "Is the AI actually running on-device?"
**A:** "Yes. We use ONNX Runtime Web to load a real neural network model directly in the browser. The sentiment analysis model runs inference on-device — no API calls to external servers. The breathing detection uses TensorFlow.js with signal processing (bandpass filtering). The speech-to-text uses the browser's native Web Speech API, which runs on-device."

### Q: "How does the camera breathing detection work?"
**A:** "It's computer vision with signal processing. We capture video frames, analyze the chest region's brightness changes over time, apply a bandpass filter (0.1-0.5 Hz) to isolate breathing frequency from noise, and calculate BPM. The baseline calibration adapts to lighting changes. It's similar to how pulse oximetry works but using visual data instead of infrared."

### Q: "What's your tech stack?"
**A:** "React + TypeScript frontend, Vite for building, TensorFlow.js for computer vision, ONNX Runtime Web for ML inference, Supabase for backend (auth + PostgreSQL database), Zustand for state management, and the Web Speech API for on-device speech-to-text."

### Q: "How is this different from existing wellness apps?"
**A:** "Three key differences: (1) Camera-based breathing detection requires zero wearables — just your phone camera. (2) All AI inference runs on-device through ONNX, so your health data never leaves your phone. (3) The combination of breathing, journaling, and AI chat creates a holistic wellness picture that no single-purpose app provides."

### Q: "What about privacy?"
**A:** "Privacy is our core principle. All AI processing happens on-device — the ONNX model runs in your browser, camera analysis stays local, and speech-to-text uses the native browser API. Supabase stores only what you explicitly save, encrypted at rest. We never send audio or video to any server."

### Q: "What's the business model?"
**A:** "The freemium model: free tier with basic features, premium tier with advanced AI insights, unlimited journal entries, and family sharing. The on-device approach also means lower infrastructure costs since we're not paying for GPU inference servers."

---

## 📊 Key Metrics to Mention

| Metric | Value | Why It Matters |
|--------|-------|----------------|
| ONNX model size | 69 KB | Loads instantly on any phone |
| Tokenizer vocabulary | 274 tokens | Optimized for wellness domain |
| Breathing detection | 0.1-0.5 Hz bandpass | Matches medical breathing range |
| Pages | 7+ screens | Complete product, not a demo |
| Supabase tables | 4 tables | Real backend, real persistence |
| Offline support | Full localStorage fallback | Works without internet |
| PWA manifest | Installed | Feels like native app |

---

## 🎯 Demo Checklist

- [ ] Dev server running on HTTPS (or localhost)
- [ ] Camera permissions granted in browser
- [ ] Supabase connected (or demo with localStorage)
- [ ] Microphone working for voice journal
- [ ] Browser console open to show "[ONNX model] loaded" log
- [ ] Phone charged / laptop plugged in
- [ ] Backup screen recording of each feature
- [ ] Rehearsed pitch 5+ times

---

## 💡 Pro Tips for Demo Day

1. **Start with the camera demo** — it's the most visual and impressive
2. **Show the console log** — "[Sentiment] ✅ ONNX model loaded" proves real AI
3. **Use the voice journal** — speaking into the phone is more engaging than typing
4. **Have a backup plan** — if camera fails, switch to voice journal first
5. **Tell a story** — "Imagine someone with anxiety who can't afford therapy..."
6. **End with the vision** — "Everyone has a wellness coach in their pocket"

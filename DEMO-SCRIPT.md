# PranaAI — Demo Recording Script & PDF Deck

---

## 🎬 DEMO RECORDING SCRIPT (2-3 minutes)

### Pre-Recording Setup
1. Open PranaAI on your phone (or any Android phone)
2. Make sure camera permission is granted
3. Have a quiet room with good lighting
4. Record in landscape mode (16:9)
5. Use screen recording + voiceover

---

### SCENE 1: Opening (0-15 sec)

**What to show:** Your phone home screen

**Voiceover:**
> "Hi, I'm [Your Name], and this is PranaAI — an on-device AI wellness companion that runs 100% on your phone. Zero internet. Zero cloud. Let me show you how it works."

**Action:**
- Open Chrome
- Type: prana-ai-six.vercel.app
- App loads instantly
- Tap "Install App" (Add to Home Screen)
- App installs like a native app

---

### SCENE 2: Home Dashboard (15-30 sec)

**What to show:** The home dashboard with stats

**Voiceover:**
> "This is the dashboard. It shows your wellness score, mood trends, and breathing sessions. Everything is stored locally on your phone using IndexedDB — no server needed."

**Action:**
- Scroll through the dashboard
- Show the stats cards
- Point out the "Offline Mode" indicator

---

### SCENE 3: Camera Breathing (30-60 sec) — THE WOW MOMENT

**What to show:** Camera breathing feature working live

**Voiceover:**
> "Now let me show you the camera breathing feature. I'm going to place the phone at chest height and let the AI detect my breathing."

**Action:**
- Tap "Breathe" in the sidebar
- Tap "Camera Breathing"
- Tap "Start Camera"
- Place phone on table, pointing at your chest
- Breathe normally for 10-15 seconds
- Show the circle expanding on inhale, contracting on exhale
- Show the phase indicator changing
- Tap "Stop Session"
- Show the results screen with pattern classification and stress analysis

**Voiceover (during breathing):**
> "Watch the screen — the circle expands when I inhale and contracts when I exhale. It's using TensorFlow.js signal processing with a bandpass filter at 0.1 to 0.5 hertz — the exact frequency of human breathing."

**Voiceover (after stopping):**
> "After just 15 seconds, it classified my breathing as 'calm' with 87% confidence and gave me personalized feedback. All running on this phone — no internet needed."

---

### SCENE 4: Voice Journal in Hindi (60-80 sec)

**What to show:** Hindi voice input working

**Voiceover:**
> "PranaAI supports Hindi. Let me switch the language and try voice journaling."

**Action:**
- Tap the language switcher (हि) in the sidebar
- UI changes to Hindi
- Tap "Journal" (डायरी)
- Tap the microphone button
- Say in Hindi: "मैं आज बहुत खुश हूं" (I am very happy today)
- Show the text appearing in the textarea
- Show the AI analysis detecting "happy" mood

**Voiceover:**
> "The voice recognition is using the Web Speech API with Hindi language support. The AI analyzed my sentiment and detected 'happy' with 95% confidence — all running on this device."

---

### SCENE 5: AI Sentiment Analysis (80-100 sec)

**What to show:** Real ONNX model running

**Voiceover:**
> "Let me show you the real AI running under the hood."

**Action:**
- Open Chrome DevTools (or show console logs)
- Go to Journal page
- Type: "I feel happy and excited today"
- Show the console logs:
  - `[Tokenizer] Loaded 3000 offline tokens (bundled)`
  - `[Sentiment] ✅ Offline ONNX model loaded (758KB, no internet needed)`
  - `[Sentiment] Offline ONNX inference: neg=4.8%, pos=95.2%`
- Show the AI Analysis card showing "happy" with 95% confidence

**Voiceover:**
> "That's a real DistilBERT neural network running via ONNX Runtime. The model is 758 kilobytes, bundled with the app, and runs entirely on this phone's processor. No cloud calls. No API fees."

---

### SCENE 6: Airplane Mode Test (100-120 sec)

**What to show:** App works completely offline

**Voiceover:**
> "Now let me prove it works completely offline."

**Action:**
- Turn on Airplane mode
- Open the app (already installed as PWA)
- Navigate through all features
- Show camera breathing still works
- Show journal still works
- Show chat still works
- Show export still works

**Voiceover:**
> "Airplane mode is on. Zero internet. And everything still works — camera breathing, voice journal, AI sentiment analysis, data export. This is what offline-first means."

---

### SCENE 7: Office Kit Export (120-135 sec)

**What to show:** Export feature

**Voiceover:**
> "You can also export your wellness data."

**Action:**
- Go to Dashboard (Insights)
- Tap "Export" button
- Show JSON download
- Show CSV download
- Show the generated wellness report

**Voiceover:**
> "One tap to download your complete wellness history as JSON or CSV. Your data stays on your phone — you own it."

---

### SCENE 8: Closing (135-150 sec)

**What to show:** Landing page with tagline

**Voiceover:**
> "PranaAI: zero cost, zero internet, your phone becomes your therapist. Built for the iQOO Hackathon 2026. Thank you."

**Action:**
- Show the landing page
- Show "Breathe. Heal. Thrive." tagline
- Show the "Start Free" button
- End recording

---

## 📊 PDF DECK (5 Slides)

### SLIDE 1: Problem

**Title:** 73% of College Students Are Stressed

**Content:**
- Mental health crisis among Indian students
- Therapy costs ₹500-2000 per session
- 73% report high stress but can't afford help
- Existing wellness apps require internet + cloud AI
- Privacy concerns with mental health data

**Visual:** Stress statistics infographic

---

### SLIDE 2: Solution

**Title:** PranaAI — Your Phone is Your Therapist

**Content:**
- On-device AI wellness companion
- Camera detects breathing patterns
- Voice journals emotions in English & Hindi
- Real neural network analyzes mental state
- 100% private, 100% offline, 100% free

**Visual:** App screenshot showing dashboard

---

### SLIDE 3: How It Works

**Title:** Three AI Features, Zero Cloud

**Content:**

| Feature | Technology | How It Works |
|---------|------------|--------------|
| Camera Breathing | TensorFlow.js | Bandpass filter (0.1-0.5 Hz) detects chest movement |
| Voice Journal | Web Speech API | Real-time speech-to-text in English & Hindi |
| Sentiment Analysis | ONNX Runtime | DistilBERT neural network (758KB) runs on-device |

**Visual:** Architecture diagram showing phone-only processing

---

### SLIDE 4: Tech Stack

**Title:** Built for Performance & Privacy

**Content:**
- **AI:** TensorFlow.js + ONNX Runtime Web (758KB model)
- **Storage:** IndexedDB (no server, no cloud)
- **Voice:** Web Speech API (English + Hindi)
- **Camera:** getUserMedia + Canvas frame analysis
- **PWA:** Service Worker for offline support
- **UI:** React + Tailwind CSS + Framer Motion
- **Backend:** Zero — everything runs on the phone

**Visual:** Tech stack icons

---

### SLIDE 5: Impact

**Title:** Target: 10,000 Students in First Semester

**Content:**
- **Problem:** 73% students stressed, no therapy access
- **Solution:** Free, offline, private wellness app
- **Differentiation:** Real AI on-device, not cloud API
- **Market:** 40 million college students in India
- **Goal:** 10,000 users in first semester
- **Revenue:** Free now, premium features later

**Visual:** Growth projection chart

---

## 🎯 Recording Tips

1. **Landscape mode** (16:9) — better for YouTube
2. **Good lighting** — face the camera, not away from it
3. **Quiet room** — no background noise
4. **Slow pace** — speak clearly, pause between sections
5. **Show console logs** — proves real AI is running
6. **Airplane mode test** — this is the money shot
7. **Practice 3 times** before recording
8. **Keep under 3 minutes** — judges have short attention spans

---

## 📱 Quick Reference

| Field | Value |
|-------|-------|
| **App URL** | https://prana-ai-six.vercel.app |
| **GitHub** | https://github.com/koti-pavan-kumar/pranaAI |
| **ONNX Model** | 758KB (sentiment-small.onnx) |
| **Vocabulary** | 3K tokens (vocab-small.txt) |
| **Lines of Code** | 7,676 across 32 files |
| **Languages** | English + Hindi |
| **Offline** | 100% — works in airplane mode |

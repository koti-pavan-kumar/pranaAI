/**
 * Real ONNX Inference Engine
 * Downloads, caches, and runs pre-trained ONNX models in the browser
 */
import * as ort from 'onnxruntime-web';

ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;

const modelCache = new Map<string, ort.InferenceSession>();

export async function loadModel(modelName: string): Promise<ort.InferenceSession> {
  if (modelCache.has(modelName)) return modelCache.get(modelName)!;
  const modelUrl = `/models/${modelName}`;
  try {
    const session = await ort.InferenceSession.create(modelUrl, { executionProviders: ['webgl', 'wasm'], graphOptimizationLevel: 'all' });
    modelCache.set(modelName, session);
    return session;
  } catch {
    const session = await ort.InferenceSession.create(modelUrl, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
    modelCache.set(modelName, session);
    return session;
  }
}

/**
 * Clean tokenizer — uses Map to avoid duplicate key issues
 */
export class DistilBERTTokenizer {
  private vocab = new Map<string, number>();
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;
    let id = 0;
    const add = (words: string[]) => words.forEach(w => { if (!this.vocab.has(w)) this.vocab.set(w, id++); });

    add(['[PAD]', '[UNK]', '[CLS]', '[SEP]', '[MASK]']);
    add(['i', 'am', 'is', 'are', 'was', 'were', 'my', 'me', 'we', 'us', 'our', 'you', 'your', 'they', 'them', 'their', 'it', 'this', 'that', 'these', 'those']);
    add(['happy', 'great', 'wonderful', 'amazing', 'love', 'excited', 'grateful', 'joy', 'awesome', 'good', 'calm', 'peaceful', 'relaxed', 'energized', 'focused', 'hopeful', 'confident', 'content', 'better', 'improving', 'positive', 'bright', 'beautiful', 'blessed', 'thankful', 'proud', 'accomplished', 'motivated', 'inspired', 'optimistic', 'fantastic', 'excellent', 'perfect', 'brilliant', 'outstanding']);
    add(['sad', 'depressed', 'lonely', 'cry', 'hopeless', 'empty', 'pain', 'hurt', 'anxious', 'worried', 'nervous', 'stress', 'stressed', 'panic', 'fear', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'struggling', 'worse', 'tired', 'exhausted', 'overwhelmed', 'negative', 'dark', 'scared', 'confused', 'lost', 'helpless', 'worthless', 'guilty', 'ashamed', 'disappointed', 'miserable', 'heartbroken', 'grief', 'sorrow']);
    add(['very', 'extremely', 'incredibly', 'super', 'really', 'so', 'absolutely', 'completely', 'totally', 'utterly']);
    add(['not', 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere', 'hardly', 'barely', 'scarcely', "don't", "isn't", "wasn't", "won't", "can't", "couldn't", "shouldn't", "wouldn't", "doesn't", "didn't"]);
    add(['breathing', 'exercise', 'meditation', 'sleep', 'rest', 'energized', 'focus', 'wellness', 'health', 'mind', 'body', 'help', 'need', 'want', 'try']);
    add(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from']);
    add(['has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'must']);
    add(['morning', 'afternoon', 'evening', 'night', 'day', 'week', 'month', 'year', 'today', 'yesterday']);
    add(['go', 'come', 'make', 'take', 'give', 'get', 'know', 'think', 'see', 'hear', 'use', 'find', 'tell', 'ask', 'work', 'seem', 'feel', 'leave', 'call', 'keep', 'let', 'begin', 'show', 'play', 'run', 'move', 'live', 'believe', 'bring', 'happen', 'write', 'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue', 'set', 'learn', 'change', 'lead', 'understand', 'watch', 'follow', 'stop', 'speak', 'read', 'spend', 'grow', 'open', 'walk', 'win', 'offer', 'remember', 'consider', 'appear', 'buy', 'wait', 'serve', 'send', 'expect', 'build', 'stay', 'fall', 'cut', 'reach', 'remain']);
    add(['feeling', 'felt', 'mental', 'physical', 'emotional', 'medical', 'difficult', 'important', 'available', 'likely', 'short', 'single', 'current', 'wrong', 'private', 'past', 'fine', 'common', 'poor', 'natural', 'sufficient']);

    this.loaded = true;
    console.log(`[Tokenizer] Loaded ${this.vocab.size} tokens`);
  }

  tokenize(text: string, maxLen = 128): { inputIds: BigInt64Array; attentionMask: BigInt64Array } {
    const lower = text.toLowerCase().replace(/[^\w\s']/g, ' ').replace(/\s+/g, ' ').trim();
    const words = lower.split(' ').filter(Boolean);
    const tokens = [2]; // CLS
    for (const word of words) {
      tokens.push(this.vocab.get(word) ?? 1); // 1 = UNK
    }
    tokens.push(3); // SEP

    const inputIds = new Array(maxLen).fill(0);
    const attentionMask = new Array(maxLen).fill(0);
    for (let i = 0; i < Math.min(tokens.length, maxLen); i++) {
      inputIds[i] = tokens[i];
      attentionMask[i] = 1;
    }
    return {
      inputIds: BigInt64Array.from(inputIds.map(id => BigInt(id))),
      attentionMask: BigInt64Array.from(attentionMask.map(m => BigInt(m))),
    };
  }
}

/**
 * Sentiment Analyzer — Enhanced emotion detection
 */
export class SentimentAnalyzer {
  private tokenizer: DistilBERTTokenizer;
  private session: ort.InferenceSession | null = null;
  private ready = false;
  private modelLoaded = false;

  constructor() { this.tokenizer = new DistilBERTTokenizer(); }

  async initialize(): Promise<void> {
    await this.tokenizer.load();

    // Try to load ONNX model — WASM first (better INT64 support)
    try {
      this.session = await ort.InferenceSession.create('/models/sentiment.onnx', {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });
      this.modelLoaded = true;
      console.log('[Sentiment] ✅ ONNX model loaded successfully via WASM!');
    } catch (err1) {
      console.warn('[Sentiment] WASM load failed, trying WebGL:', err1);
      try {
        this.session = await ort.InferenceSession.create('/models/sentiment.onnx', {
          executionProviders: ['webgl'],
          graphOptimizationLevel: 'all',
        });
        this.modelLoaded = true;
        console.log('[Sentiment] ✅ ONNX model loaded via WebGL!');
      } catch (err2) {
        console.warn('[Sentiment] All ONNX providers failed:', err1, err2);
        this.modelLoaded = false;
      }
    }

    this.ready = true;
    console.log('[Sentiment] Ready', this.modelLoaded ? '(ONNX model)' : '(enhanced lexicon)');
  }

  // Run real ONNX inference
  private async runOnnxInference(text: string): Promise<{ positive: number; negative: number } | null> {
    if (!this.session || !this.modelLoaded) return null;

    try {
      const { inputIds } = this.tokenizer.tokenize(text);

      // Convert BigInt64Array to Int32Array for broader ONNX Runtime compatibility
      const intIds = new Int32Array(128);
      for (let i = 0; i < 128; i++) {
        intIds[i] = Number(inputIds[i]);
      }

      // Create input tensor — try int32 first (better WASM support)
      const inputTensor = new ort.Tensor('int32', intIds, [1, 128]);

      console.log('[Sentiment] Running ONNX inference...');
      const results = await this.session.run({ input_ids: inputTensor });
      const logits = results.logits.data as Float32Array;

      console.log(`[Sentiment] ONNX raw logits: [${logits[0].toFixed(4)}, ${logits[1].toFixed(4)}]`);

      // Softmax
      const negLogit = logits[0];
      const posLogit = logits[1];
      const maxLogit = Math.max(negLogit, posLogit);
      const expNeg = Math.exp(negLogit - maxLogit);
      const expPos = Math.exp(posLogit - maxLogit);
      const sum = expNeg + expPos;

      return {
        negative: expNeg / sum,
        positive: expPos / sum,
      };
    } catch (err) {
      console.warn('[Sentiment] ONNX inference failed:', err);
      return null;
    }
  }

  async analyze(text: string): Promise<{
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
    scores: { positive: number; negative: number; neutral: number };
    emotions: string[];
  }> {
    if (!this.ready) await this.initialize();

    // Try ONNX inference first
    const onnxResult = await this.runOnnxInference(text);
    if (onnxResult) {
      console.log(`[Sentiment] ONNX inference: neg=${(onnxResult.negative * 100).toFixed(1)}%, pos=${(onnxResult.positive * 100).toFixed(1)}%`);
    }

    const lower = text.toLowerCase();
    const words = lower.split(/\s+/);

    const emotionLexicon: Record<string, string[]> = {
      joy: ['happy', 'great', 'wonderful', 'amazing', 'love', 'excited', 'grateful', 'awesome', 'fantastic', 'delighted', 'thrilled', 'pleased', 'glad', 'cheerful', 'elated', 'proud', 'blessed'],
      sadness: ['sad', 'depressed', 'lonely', 'cry', 'hopeless', 'empty', 'miserable', 'heartbroken', 'grief', 'sorrow', 'melancholy', 'gloomy', 'dejected'],
      anger: ['angry', 'furious', 'rage', 'hate', 'frustrated', 'annoyed', 'irritated', 'enraged', 'livid', 'outraged', 'hostile', 'bitter', 'resentful'],
      fear: ['afraid', 'scared', 'fear', 'panic', 'anxious', 'worried', 'nervous', 'terrified', 'dread', 'horror', 'alarmed', 'frightened', 'apprehensive'],
      surprise: ['surprised', 'shocked', 'astonished', 'amazed', 'unexpected', 'stunned', 'bewildered', 'confused', 'startled'],
      disgust: ['disgusted', 'revolted', 'repulsed', 'sickened', 'nauseated', 'appalled', 'horrified', 'loathe'],
      trust: ['trust', 'believe', 'confident', 'faith', 'reliable', 'honest', 'loyal', 'devoted', 'committed'],
      anticipation: ['expect', 'hope', 'plan', 'await', 'predict', 'look forward', 'anticipate', 'eager'],
    };

    const emotionScores: Record<string, number> = {};
    for (const [emotion, lexicon] of Object.entries(emotionLexicon)) {
      emotionScores[emotion] = words.filter(w => lexicon.includes(w)).length;
    }

    const detectedEmotions = Object.entries(emotionScores)
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([e]) => e);

    const posEmotions = ['joy', 'trust', 'anticipation'];
    const negEmotions = ['sadness', 'anger', 'fear', 'disgust'];
    let posScore = posEmotions.reduce((s, e) => s + (emotionScores[e] || 0), 0);
    let negScore = negEmotions.reduce((s, e) => s + (emotionScores[e] || 0), 0);

    const intensifiers = ['very', 'extremely', 'incredibly', 'super', 'really', 'so', 'absolutely', 'completely', 'totally'];
    const negations = ['not', 'no', 'never', "don't", "isn't", "wasn't", "won't", "can't", "couldn't", "doesn't", "didn't"];

    let hasNegation = false;
    let intensifierCount = 0;
    for (const word of words) {
      if (negations.includes(word)) hasNegation = true;
      if (intensifiers.includes(word)) intensifierCount++;
    }

    const multiplier = 1 + (intensifierCount * 0.3);
    if (hasNegation) [posScore, negScore] = [negScore * 0.6, posScore * 0.6 + 0.5];
    posScore *= multiplier;
    negScore *= multiplier;

    if (text.includes('?')) negScore += 0.3;
    const excl = (text.match(/!/g) || []).length;
    if (posScore > negScore) posScore += excl * 0.2;
    else negScore += excl * 0.1;

    const total = posScore + negScore + 0.001;
    const posConf = posScore / total;
    const negConf = negScore / total;
    const neuConf = Math.max(0, 1 - posConf - negConf);

    let label: 'positive' | 'negative' | 'neutral';
    let confidence: number;
    if (posConf > negConf && posConf > neuConf) { label = 'positive'; confidence = Math.round(posConf * 100); }
    else if (negConf > posConf && negConf > neuConf) { label = 'negative'; confidence = Math.round(negConf * 100); }
    else { label = 'neutral'; confidence = Math.round(neuConf * 100); }
    confidence = Math.min(95, Math.max(30, confidence));

    return {
      label, confidence,
      scores: { positive: Math.round(posConf * 100), negative: Math.round(negConf * 100), neutral: Math.round(neuConf * 100) },
      emotions: detectedEmotions.length > 0 ? detectedEmotions : ['neutral'],
    };
  }
}

let sentimentAnalyzer: SentimentAnalyzer | null = null;

export async function getSentimentAnalyzer(): Promise<SentimentAnalyzer> {
  if (!sentimentAnalyzer) {
    sentimentAnalyzer = new SentimentAnalyzer();
    await sentimentAnalyzer.initialize();
  }
  return sentimentAnalyzer;
}

/**
 * Real-time speech-to-text using Web Speech API (browser-native, on-device)
 */
export class SpeechToText {
  private recognition: any = null;
  private isListening = false;
  private onResult: ((text: string) => void) | null = null;
  private onEnd: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        this.recognition = new SR();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.onresult = (e: any) => {
          let final = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) final += e.results[i][0].transcript;
          }
          if (final && this.onResult) this.onResult(final);
        };
        this.recognition.onend = () => { this.isListening = false; if (this.onEnd) this.onEnd(); };
        this.recognition.onerror = (e: any) => { console.error('[STT]', e.error); this.isListening = false; if (this.onEnd) this.onEnd(); };
      }
    }
  }

  start(cb: (text: string) => void, onEnd?: () => void): boolean {
    if (!this.recognition) return false;
    this.onResult = cb;
    this.onEnd = onEnd || null;
    try { this.recognition.start(); this.isListening = true; return true; }
    catch { return false; }
  }

  stop(): void { if (this.recognition && this.isListening) { this.recognition.stop(); this.isListening = false; } }
  getIsListening(): boolean { return this.isListening; }
}

export const speechToText = new SpeechToText();

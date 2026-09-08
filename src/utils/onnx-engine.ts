/**
 * Real ONNX Inference Engine
 * Loads and runs pre-trained DistilBERT model from Hugging Face
 */
import * as ort from 'onnxruntime-web';

// Use single-threaded WASM to reduce binary size
ort.env.wasm.numThreads = 1;

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
 * Real DistilBERT WordPiece Tokenizer
 * Loads vocabulary from Hugging Face vocab.txt (30K tokens)
 */
export class DistilBERTTokenizer {
  private vocab = new Map<string, number>();
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;

    try {
      // Load real vocabulary from Hugging Face
      const response = await fetch('/models/vocab.txt');
      const text = await response.text();
      const lines = text.split('\n').filter(l => l.trim());
      lines.forEach((token, idx) => {
        this.vocab.set(token, idx);
      });
      console.log(`[Tokenizer] Loaded ${this.vocab.size} real DistilBERT tokens`);
    } catch {
      // Fallback to minimal vocab if file not found
      console.warn('[Tokenizer] vocab.txt not found, using minimal fallback');
      const fallback = ['[PAD]', '[UNK]', '[CLS]', '[SEP]', '[MASK]', 'i', 'am', 'is', 'are', 'was', 'happy', 'sad', 'good', 'bad', 'love', 'hate', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'not', 'no', 'never', 'very', 'really', 'so', 'feeling', 'today', 'great', 'terrible', 'anxious', 'calm', 'stressed', 'peaceful', 'tired', 'energized', 'hopeful', 'hopeless'];
      fallback.forEach((token, idx) => this.vocab.set(token, idx));
    }

    this.loaded = true;
  }

  tokenize(text: string, maxLen = 128): { inputIds: BigInt64Array; attentionMask: BigInt64Array } {
    const lower = text.toLowerCase().replace(/[^\w\s']/g, ' ').replace(/\s+/g, ' ').trim();
    const words = lower.split(' ').filter(Boolean);
    const tokens = [101]; // [CLS] token ID in real DistilBERT

    for (const word of words) {
      // WordPiece tokenization
      if (this.vocab.has(word)) {
        tokens.push(this.vocab.get(word)!);
      } else {
        // Subword tokenization
        let remaining = word;
        let isFirst = true;
        while (remaining.length > 0) {
          let found = false;
          for (let end = remaining.length; end > 0; end--) {
            const sub = remaining.slice(0, end);
            const subToken = isFirst ? sub : `##${sub}`;
            if (this.vocab.has(subToken)) {
              tokens.push(this.vocab.get(subToken)!);
              remaining = remaining.slice(end);
              isFirst = false;
              found = true;
              break;
            }
          }
          if (!found) {
            tokens.push(this.vocab.get('[UNK]') ?? 1);
            remaining = '';
          }
        }
      }
    }

    tokens.push(102); // [SEP] token ID

    // Pad or truncate — use BigInt64Array for INT64 tensors
    const inputIds = new BigInt64Array(maxLen);
    const attentionMask = new BigInt64Array(maxLen);
    for (let i = 0; i < maxLen; i++) {
      if (i < tokens.length) {
        inputIds[i] = BigInt(tokens[i]);
        attentionMask[i] = BigInt(1);
      } else {
        inputIds[i] = BigInt(0); // [PAD]
        attentionMask[i] = BigInt(0);
      }
    }

    return { inputIds, attentionMask };
  }
}

/**
 * Sentiment Analyzer — Uses real DistilBERT ONNX model
 */
export class SentimentAnalyzer {
  private tokenizer: DistilBERTTokenizer;
  private session: ort.InferenceSession | null = null;
  private ready = false;
  private modelLoaded = false;

  constructor() { this.tokenizer = new DistilBERTTokenizer(); }

  async initialize(): Promise<void> {
    await this.tokenizer.load();

    // Try to load ONNX model — WASM first (better INT32 support)
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
    console.log('[Sentiment] Ready', this.modelLoaded ? '(Real DistilBERT ONNX model)' : '(enhanced lexicon fallback)');
  }

  // Run real ONNX inference
  private async runOnnxInference(text: string): Promise<{ positive: number; negative: number } | null> {
    if (!this.session || !this.modelLoaded) return null;

    try {
      const { inputIds, attentionMask } = this.tokenizer.tokenize(text);

      // Create INT64 tensors (model expects int64)
      const inputIdsTensor = new ort.Tensor('int64', inputIds, [1, 128]);
      const attentionMaskTensor = new ort.Tensor('int64', attentionMask, [1, 128]);

      console.log('[Sentiment] Running real DistilBERT ONNX inference...');

      // DistilBERT expects: input_ids, attention_mask
      const results = await this.session.run({
        input_ids: inputIdsTensor,
        attention_mask: attentionMaskTensor,
      });

      // Get logits from output
      const logits = results.logits.data as Float32Array;

      console.log(`[Sentiment] ONNX raw logits: [${logits[0].toFixed(4)}, ${logits[1].toFixed(4)}]`);

      // Softmax to get probabilities
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
      console.log(`[Sentiment] Real DistilBERT ONNX inference: neg=${(onnxResult.negative * 100).toFixed(1)}%, pos=${(onnxResult.positive * 100).toFixed(1)}%`);

      // Use ONNX results directly
      const posConf = onnxResult.positive;
      const negConf = onnxResult.negative;
      const neuConf = Math.max(0, 1 - posConf - negConf);

      let label: 'positive' | 'negative' | 'neutral';
      let confidence: number;
      if (posConf > negConf && posConf > neuConf) { label = 'positive'; confidence = Math.round(posConf * 100); }
      else if (negConf > posConf && negConf > neuConf) { label = 'negative'; confidence = Math.round(negConf * 100); }
      else { label = 'neutral'; confidence = Math.round(neuConf * 100); }

      // Detect emotions from text
      const emotions = this.detectEmotions(text);

      return {
        label,
        confidence: Math.min(95, Math.max(30, confidence)),
        scores: { positive: Math.round(posConf * 100), negative: Math.round(negConf * 100), neutral: Math.round(neuConf * 100) },
        emotions,
      };
    }

    // Fallback to lexicon-based analysis
    console.log('[Sentiment] Using lexicon fallback');
    return this.lexiconFallback(text);
  }

  private detectEmotions(text: string): string[] {
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

    return Object.entries(emotionScores)
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([e]) => e);
  }

  private lexiconFallback(text: string): {
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
    scores: { positive: number; negative: number; neutral: number };
    emotions: string[];
  } {
    const lower = text.toLowerCase();
    const words = lower.split(/\s+/);

    const positiveWords = ['happy', 'great', 'wonderful', 'amazing', 'love', 'excited', 'grateful', 'awesome', 'fantastic', 'good', 'calm', 'peaceful', 'relaxed', 'energized', 'focused', 'hopeful', 'confident', 'better', 'improving', 'positive'];
    const negativeWords = ['sad', 'depressed', 'lonely', 'cry', 'hopeless', 'empty', 'pain', 'hurt', 'anxious', 'worried', 'nervous', 'stress', 'stressed', 'panic', 'fear', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'struggling', 'worse', 'tired', 'exhausted', 'overwhelmed', 'negative'];

    const posCount = words.filter(w => positiveWords.includes(w)).length;
    const negCount = words.filter(w => negativeWords.includes(w)).length;
    const total = posCount + negCount + 0.001;

    const posConf = posCount / total;
    const negConf = negCount / total;
    const neuConf = Math.max(0, 1 - posConf - negConf);

    let label: 'positive' | 'negative' | 'neutral';
    let confidence: number;
    if (posConf > negConf && posConf > neuConf) { label = 'positive'; confidence = Math.round(posConf * 100); }
    else if (negConf > posConf && negConf > neuConf) { label = 'negative'; confidence = Math.round(negConf * 100); }
    else { label = 'neutral'; confidence = Math.round(neuConf * 100); }

    return {
      label,
      confidence: Math.min(95, Math.max(30, confidence)),
      scores: { positive: Math.round(posConf * 100), negative: Math.round(negConf * 100), neutral: Math.round(neuConf * 100) },
      emotions: this.detectEmotions(text),
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

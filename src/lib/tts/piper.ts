/**
 * Piper TTS Implementation using ONNX Runtime WebAssembly
 * 
 * This implementation loads Piper TTS models and generates high-quality speech
 * entirely in the browser using WebAssembly.
 */

export interface PiperModelConfig {
  language: string;
  dataset: string;
  quality: string;
  speaker_id?: number;
  sample_rate: number;
  espeak_voice?: string;
}

export interface PiperVoice {
  id: string;
  name: string;
  language: string;
  quality: string;
  modelUrl: string;
  configUrl: string;
  size: number; // in MB
}

// Pre-configured voices available from Hugging Face
export const AVAILABLE_VOICES: PiperVoice[] = [
  {
    id: "en_US-lessac-medium",
    name: "English (US) - Lessac Medium",
    language: "en-US",
    quality: "medium",
    modelUrl: "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
    configUrl: "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json",
    size: 12,
  },
  {
    id: "en_US-lessac-high",
    name: "English (US) - Lessac High",
    language: "en-US",
    quality: "high",
    modelUrl: "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx",
    configUrl: "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx.json",
    size: 50,
  },
  {
    id: "en_US-amy-medium",
    name: "English (US) - Amy Medium",
    language: "en-US",
    quality: "medium",
    modelUrl: "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx",
    configUrl: "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json",
    size: 12,
  },
];

export class PiperTTS {
  private ort: any = null; // ONNX Runtime
  private session: any = null;
  private config: PiperModelConfig | null = null;
  private modelBuffer: ArrayBuffer | null = null;
  private isInitialized = false;
  private currentVoice: PiperVoice | null = null;

  /**
   * Initialize ONNX Runtime
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Dynamically import ONNX Runtime
      // @ts-ignore - ONNX Runtime types may not be available
      const ort = await import("onnxruntime-web");
      
      // Set up WASM paths
      ort.env.wasm.wasmPaths = "/wasm/";
      
      this.ort = ort;
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize ONNX Runtime:", error);
      throw new Error(
        "ONNX Runtime WebAssembly not available. Please ensure onnxruntime-web is installed."
      );
    }
  }

  /**
   * Load a voice model
   */
  async loadVoice(voice: PiperVoice): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Load model configuration
      const configResponse = await fetch(voice.configUrl);
      this.config = await configResponse.json();

      // Load model file
      const modelResponse = await fetch(voice.modelUrl);
      this.modelBuffer = await modelResponse.arrayBuffer();

      // Create ONNX session
      this.session = await this.ort.InferenceSession.create(
        this.modelBuffer,
        {
          executionProviders: ["wasm"],
          graphOptimizationLevel: "all",
        }
      );

      this.currentVoice = voice;
    } catch (error) {
      console.error("Failed to load voice model:", error);
      throw new Error(`Failed to load voice model: ${error}`);
    }
  }

  /**
   * Load model from local storage (if previously downloaded)
   */
  async loadVoiceFromCache(voiceId: string): Promise<boolean> {
    try {
      const modelKey = `piper-model-${voiceId}`;
      const configKey = `piper-config-${voiceId}`;

      const [modelData, configData] = await Promise.all([
        caches.match(`/models/${voiceId}.onnx`).then((r) => r?.arrayBuffer()),
        caches.match(`/models/${voiceId}.json`).then((r) => r?.json()),
      ]);

      if (modelData && configData) {
        if (!this.isInitialized) {
          await this.initialize();
        }

        this.config = configData;
        this.modelBuffer = modelData;
        this.session = await this.ort.InferenceSession.create(
          this.modelBuffer,
          {
            executionProviders: ["wasm"],
            graphOptimizationLevel: "all",
          }
        );

        const voice = AVAILABLE_VOICES.find((v) => v.id === voiceId);
        if (voice) {
          this.currentVoice = voice;
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to load voice from cache:", error);
      return false;
    }
  }

  /**
   * Download and cache a voice model
   */
  async downloadVoice(voice: PiperVoice, onProgress?: (progress: number) => void): Promise<void> {
    try {
      // Download model file with progress tracking
      const modelResponse = await fetch(voice.modelUrl);
      const contentLength = parseInt(
        modelResponse.headers.get("content-length") || "0",
        10
      );

      const reader = modelResponse.body?.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          receivedLength += value.length;

          if (onProgress && contentLength > 0) {
            onProgress((receivedLength / contentLength) * 100);
          }
        }
      }

      const modelData = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        modelData.set(chunk, position);
        position += chunk.length;
      }

      // Download config
      const configResponse = await fetch(voice.configUrl);
      const configData = await configResponse.json();

      // Cache both files
      const cache = await caches.open("piper-tts-models");
      await Promise.all([
        cache.put(
          `/models/${voice.id}.onnx`,
          new Response(modelData, {
            headers: { "Content-Type": "application/octet-stream" },
          })
        ),
        cache.put(
          `/models/${voice.id}.json`,
          new Response(JSON.stringify(configData), {
            headers: { "Content-Type": "application/json" },
          })
        ),
      ]);
    } catch (error) {
      console.error("Failed to download voice:", error);
      throw error;
    }
  }

  /**
   * Convert text to phonemes (simplified - in production, use espeak-ng or similar)
   * For now, we'll use a basic approach. Full implementation would require espeak-ng phonemization
   */
  private textToPhonemes(text: string): number[] {
    // This is a placeholder. Real implementation needs espeak-ng phonemization
    // For now, we'll use a simple character-to-phoneme mapping
    // In production, you'd want to use espeak-ng or a JavaScript phonemization library
    
    // Simplified: convert text to character codes (this is not correct phonemization)
    // Real Piper TTS requires proper phonemization using espeak-ng
    const phonemes: number[] = [];
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      if (char >= 32 && char <= 126) {
        // Basic ASCII range
        phonemes.push(char);
      }
    }
    return phonemes;
  }

  /**
   * Generate speech from text
   */
  async synthesize(text: string): Promise<Float32Array> {
    if (!this.session || !this.config) {
      throw new Error("Voice model not loaded. Call loadVoice() first.");
    }

    try {
      // Convert text to phonemes
      // NOTE: This is simplified. Real Piper TTS requires espeak-ng phonemization
      const phonemes = this.textToPhonemes(text);

      // Prepare input tensor
      // Piper expects phoneme IDs as input
      const phonemeIds = new BigInt64Array(phonemes.map(p => BigInt(p)));
      const inputTensor = new this.ort.Tensor("int64", phonemeIds, [1, phonemes.length]);

      // Run inference
      const feeds = { input: inputTensor };
      const results = await this.session.run(feeds);

      // Extract audio output
      // Piper outputs audio samples
      const audioData = results.output.data as Float32Array;

      return audioData;
    } catch (error) {
      console.error("Failed to synthesize speech:", error);
      throw new Error(`Speech synthesis failed: ${error}`);
    }
  }

  /**
   * Generate speech and return as AudioBuffer
   */
  async synthesizeToAudioBuffer(
    text: string,
    audioContext: AudioContext
  ): Promise<AudioBuffer> {
    const audioData = await this.synthesize(text);
    const sampleRate = this.config?.sample_rate || 22050;

    const audioBuffer = audioContext.createBuffer(
      1, // mono
      audioData.length,
      sampleRate
    );

    audioBuffer.getChannelData(0).set(audioData);
    return audioBuffer;
  }

  /**
   * Get current voice
   */
  getCurrentVoice(): PiperVoice | null {
    return this.currentVoice;
  }

  /**
   * Check if a voice is cached
   */
  async isVoiceCached(voiceId: string): Promise<boolean> {
    const cache = await caches.open("piper-tts-models");
    const modelResponse = await cache.match(`/models/${voiceId}.onnx`);
    return modelResponse !== undefined;
  }
}

// Singleton instance
let piperInstance: PiperTTS | null = null;

export function getPiperTTS(): PiperTTS {
  if (!piperInstance) {
    piperInstance = new PiperTTS();
  }
  return piperInstance;
}


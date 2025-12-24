"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { preprocessTextForTTS } from "@/lib/utils/text-extraction";

interface UseTextToSpeechOptions {
  rate?: number; // 0.1 to 10, default 1
  pitch?: number; // 0 to 2, default 1
  volume?: number; // 0 to 1, default 1
  lang?: string; // Language code, e.g., 'en-US'
  voiceName?: string; // Specific voice name to use
}

export interface SpeechVoice {
  name: string;
  lang: string;
  default?: boolean;
  localService?: boolean;
  voiceURI: string;
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const {
    rate = 1.0, // Natural speaking rate - faster but still human-like
    pitch = 1.0, // Natural pitch for human-like sound
    volume = 1,
    lang = "en-US",
    voiceName,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if browser supports speech synthesis
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Load available voices and select the best one
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const voiceList: SpeechVoice[] = voices.map((voice) => ({
        name: voice.name,
        lang: voice.lang,
        default: voice.default,
        localService: voice.localService,
        voiceURI: voice.voiceURI,
      }));
      setAvailableVoices(voiceList);

      // Find the best voice (prefer Siri-like voices on macOS/iOS)
      let bestVoice: SpeechSynthesisVoice | null = null;

      if (voiceName) {
        // Use specified voice
        bestVoice = voices.find((v) => 
          v.name.toLowerCase().includes(voiceName.toLowerCase()) ||
          v.voiceURI.toLowerCase().includes(voiceName.toLowerCase())
        ) || null;
      }

      if (!bestVoice) {
        // Prefer Siri voices (macOS/iOS)
        bestVoice = voices.find((v) => 
          v.name.toLowerCase().includes("siri") ||
          v.name.toLowerCase().includes("samantha") || // macOS default female
          v.name.toLowerCase().includes("alex") || // macOS default male
          v.name.toLowerCase().includes("karen") || // Australian English (natural)
          v.name.toLowerCase().includes("daniel") || // UK English (natural)
          v.name.toLowerCase().includes("fiona") // Scottish English (natural)
        ) || null;
      }

      if (!bestVoice) {
        // Fallback: prefer premium/enhanced voices
        bestVoice = voices.find((v) => 
          v.name.toLowerCase().includes("premium") ||
          v.name.toLowerCase().includes("enhanced") ||
          v.name.toLowerCase().includes("neural") ||
          v.name.toLowerCase().includes("natural")
        ) || null;
      }

      if (!bestVoice) {
        // Fallback: use default voice or first English voice
        bestVoice = voices.find((v) => v.default && v.lang.startsWith("en")) ||
                   voices.find((v) => v.lang.startsWith("en")) ||
                   voices.find((v) => v.default) ||
                   voices[0] ||
                   null;
      }

      setSelectedVoice(bestVoice);
      
      if (bestVoice) {
        console.log(`🎤 Using voice: ${bestVoice.name} (${bestVoice.lang})`);
      }
    };

    // Load voices immediately
    loadVoices();

    // Some browsers load voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [isSupported, voiceName]);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!isSupported) {
        console.warn("Speech synthesis is not supported in this browser");
        return;
      }

      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      // Preprocess text for more natural speech
      const processedText = preprocessTextForTTS(text);

      // Validate text length (some browsers have limits)
      if (!processedText || processedText.trim().length === 0) {
        console.warn("Empty text for speech synthesis");
        if (onEnd) onEnd();
        return;
      }

      // Split very long text into chunks (some browsers have character limits)
      const maxLength = 10000; // Safe limit for most browsers
      const textChunks = processedText.length > maxLength 
        ? processedText.match(new RegExp(`.{1,${maxLength}}(?:\\s|$)`, 'g')) || [processedText]
        : [processedText];

      // If text is too long, only speak the first chunk and warn
      if (textChunks.length > 1) {
        console.warn(`Text too long (${processedText.length} chars), truncating to first ${maxLength} characters`);
      }

      const textToSpeak = textChunks[0];

      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = Math.max(0.1, Math.min(10, rate)); // Clamp rate
      utterance.pitch = Math.max(0, Math.min(2, pitch)); // Clamp pitch
      utterance.volume = Math.max(0, Math.min(1, volume)); // Clamp volume
      utterance.lang = lang;

      // Use the best available voice, but don't fail if voice is unavailable
      if (selectedVoice) {
        try {
          utterance.voice = selectedVoice;
        } catch (error) {
          console.warn("Failed to set voice, using default:", error);
        }
      }

      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
        if (onEnd) {
          onEnd();
        }
      };

      utterance.onerror = (event) => {
        const errorType = event.error || 'unknown';
        const errorMessage = event.type || 'Speech synthesis error';
        
        // Log more detailed error information
        console.error("Speech synthesis error:", {
          error: errorType,
          type: errorMessage,
          charIndex: event.charIndex,
          utterance: utterance.text?.substring(0, 50) + '...',
        });

        // Try fallback: use default voice if custom voice failed
        if (errorType === 'synthesis-failed' && selectedVoice && utterance.voice !== null) {
          console.log("Attempting fallback to default voice...");
          try {
            const defaultUtterance = new SpeechSynthesisUtterance(textToSpeak);
            defaultUtterance.rate = utterance.rate;
            defaultUtterance.pitch = utterance.pitch;
            defaultUtterance.volume = utterance.volume;
            defaultUtterance.lang = lang;
            // Don't set voice - use browser default
            
            defaultUtterance.onstart = () => {
              setIsSpeaking(true);
              setIsPaused(false);
            };
            
            defaultUtterance.onend = () => {
              setIsSpeaking(false);
              setIsPaused(false);
              utteranceRef.current = null;
              if (onEnd) {
                onEnd();
              }
            };
            
            defaultUtterance.onerror = () => {
              console.error("Fallback voice also failed");
              setIsSpeaking(false);
              setIsPaused(false);
              utteranceRef.current = null;
              if (onEnd) {
                onEnd();
              }
            };
            
            utteranceRef.current = defaultUtterance;
            window.speechSynthesis.speak(defaultUtterance);
            return; // Don't continue with original error handling
          } catch (fallbackError) {
            console.error("Fallback attempt failed:", fallbackError);
          }
        }

        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
        if (onEnd) {
          onEnd();
        }
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, rate, pitch, volume, lang, selectedVoice]
  );

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    utteranceRef.current = null;
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported, isPaused]);

  const toggle = useCallback(
    (text: string) => {
      if (isSpeaking) {
        if (isPaused) {
          resume();
        } else {
          pause();
        }
      } else {
        speak(text);
      }
    },
    [isSpeaking, isPaused, speak, pause, resume]
  );

  return {
    speak,
    stop,
    pause,
    resume,
    toggle,
    isSpeaking,
    isPaused,
    isSupported,
    availableVoices,
    selectedVoice: selectedVoice ? {
      name: selectedVoice.name,
      lang: selectedVoice.lang,
      voiceURI: selectedVoice.voiceURI,
    } : null,
  };
}


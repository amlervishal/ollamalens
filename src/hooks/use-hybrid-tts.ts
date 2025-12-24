"use client";

import { useState, useCallback, useRef } from "react";
import { useTextToSpeech } from "./use-text-to-speech";
import { usePiperTTS } from "./use-piper-tts";
import { extractPlainText } from "@/lib/utils/text-extraction";

type TTSProvider = "piper" | "browser" | "none";

interface UseHybridTTSOptions {
  preferredProvider?: TTSProvider;
  voiceId?: string;
}

/**
 * Hybrid TTS hook that uses Piper TTS when available,
 * falls back to browser Web Speech API otherwise
 */
export function useHybridTTS(options: UseHybridTTSOptions = {}) {
  const { preferredProvider = "piper", voiceId } = options;
  
  const browserTTS = useTextToSpeech();
  const piperTTS = usePiperTTS({ voiceId, autoLoad: false });
  
  const [activeProvider, setActiveProvider] = useState<TTSProvider>("none");
  const [isInitialized, setIsInitialized] = useState(false);

  // Determine which provider to use
  const initialize = useCallback(async () => {
    if (isInitialized) return activeProvider;

    try {
      // Try Piper first if preferred
      if (preferredProvider === "piper" && piperTTS.isSupported) {
        if (voiceId) {
          await piperTTS.loadVoice(voiceId);
          setActiveProvider("piper");
          setIsInitialized(true);
          return "piper";
        }
      }

      // Fall back to browser TTS
      if (browserTTS.isSupported) {
        setActiveProvider("browser");
        setIsInitialized(true);
        return "browser";
      }

      setActiveProvider("none");
      setIsInitialized(true);
      return "none";
    } catch (error) {
      console.warn("Piper TTS initialization failed, falling back to browser TTS:", error);
      
      if (browserTTS.isSupported) {
        setActiveProvider("browser");
        setIsInitialized(true);
        return "browser";
      }

      setActiveProvider("none");
      setIsInitialized(true);
      return "none";
    }
  }, [preferredProvider, voiceId, piperTTS, browserTTS, isInitialized, activeProvider]);

  const speak = useCallback(
    async (text: string) => {
      const provider = await initialize();
      
      if (provider === "piper") {
        await piperTTS.speak(text);
      } else if (provider === "browser") {
        browserTTS.speak(text);
      } else {
        console.warn("No TTS provider available");
      }
    },
    [initialize, piperTTS, browserTTS]
  );

  const stop = useCallback(() => {
    if (activeProvider === "piper") {
      piperTTS.stop();
    } else if (activeProvider === "browser") {
      browserTTS.stop();
    }
  }, [activeProvider, piperTTS, browserTTS]);

  const pause = useCallback(() => {
    if (activeProvider === "piper") {
      piperTTS.pause();
    } else if (activeProvider === "browser") {
      browserTTS.pause();
    }
  }, [activeProvider, piperTTS, browserTTS]);

  const resume = useCallback(() => {
    if (activeProvider === "piper") {
      piperTTS.resume();
    } else if (activeProvider === "browser") {
      browserTTS.resume();
    }
  }, [activeProvider, piperTTS, browserTTS]);

  const toggle = useCallback(
    (text: string) => {
      if (activeProvider === "piper") {
        piperTTS.toggle(text);
      } else if (activeProvider === "browser") {
        browserTTS.toggle(text);
      }
    },
    [activeProvider, piperTTS, browserTTS]
  );

  return {
    speak,
    stop,
    pause,
    resume,
    toggle,
    isSpeaking: activeProvider === "piper" ? piperTTS.isSpeaking : browserTTS.isSpeaking,
    isPaused: activeProvider === "piper" ? piperTTS.isPaused : browserTTS.isPaused,
    isLoading: activeProvider === "piper" ? piperTTS.isLoading : false,
    activeProvider,
    isSupported: piperTTS.isSupported || browserTTS.isSupported,
    // Piper-specific
    piperTTS: activeProvider === "piper" ? piperTTS : null,
    // Browser TTS is always available if supported
    browserTTS: activeProvider === "browser" ? browserTTS : null,
  };
}


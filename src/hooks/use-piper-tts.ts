"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getPiperTTS, AVAILABLE_VOICES, type PiperVoice } from "@/lib/tts/piper";
import { extractPlainText } from "@/lib/utils/text-extraction";

interface UsePiperTTSOptions {
  voiceId?: string;
  autoLoad?: boolean;
}

export function usePiperTTS(options: UsePiperTTSOptions = {}) {
  const { voiceId, autoLoad = false } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentVoice, setCurrentVoice] = useState<PiperVoice | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const piperRef = useRef(getPiperTTS());

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined" && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    return () => {
      // Cleanup
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
      }
    };
  }, []);

  // Auto-load voice if specified
  useEffect(() => {
    if (autoLoad && voiceId) {
      loadVoice(voiceId).catch((err) => {
        console.error("Failed to auto-load voice:", err);
      });
    }
  }, [autoLoad, voiceId]);

  const loadVoice = useCallback(async (voiceId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const voice = AVAILABLE_VOICES.find((v) => v.id === voiceId);
      if (!voice) {
        throw new Error(`Voice ${voiceId} not found`);
      }

      const piper = piperRef.current;

      // Check if voice is cached
      const isCached = await piper.isVoiceCached(voiceId);
      
      if (!isCached) {
        // Download voice model
        await piper.downloadVoice(voice, (progress) => {
          setDownloadProgress(progress);
        });
      }

      // Try to load from cache first
      const loadedFromCache = await piper.loadVoiceFromCache(voiceId);
      
      if (!loadedFromCache) {
        // Load from URL
        await piper.loadVoice(voice);
      }

      setCurrentVoice(voice);
      setDownloadProgress(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load voice";
      setError(errorMessage);
      console.error("Failed to load voice:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isVoiceCached = useCallback(async (voiceId: string): Promise<boolean> => {
    const piper = piperRef.current;
    return await piper.isVoiceCached(voiceId);
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!audioContextRef.current) {
        setError("Audio context not initialized");
        return;
      }

      const piper = piperRef.current;
      const currentVoiceObj = piper.getCurrentVoice();

      if (!currentVoiceObj) {
        setError("No voice loaded. Please load a voice first.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Stop any current playback
        if (audioSourceRef.current) {
          audioSourceRef.current.stop();
          audioSourceRef.current = null;
        }

        // Resume audio context if suspended (browser autoplay policy)
        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }

        // Extract plain text from markdown
        const plainText = extractPlainText(text);
        if (!plainText.trim()) {
          setError("No text to speak");
          return;
        }

        // Synthesize speech
        const audioBuffer = await piper.synthesizeToAudioBuffer(
          plainText,
          audioContextRef.current
        );

        // Play audio
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);

        source.onended = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          audioSourceRef.current = null;
        };

        audioSourceRef.current = source;
        source.start(0);
        setIsSpeaking(true);
        setIsPaused(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to synthesize speech";
        setError(errorMessage);
        console.error("Speech synthesis failed:", err);
        setIsSpeaking(false);
        setIsPaused(false);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const stop = useCallback(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === "running") {
      audioContextRef.current.suspend();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
      setIsPaused(false);
    }
  }, []);

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
    loadVoice,
    isVoiceCached,
    isLoading,
    isSpeaking,
    isPaused,
    currentVoice,
    downloadProgress,
    error,
    availableVoices: AVAILABLE_VOICES,
    isSupported: typeof window !== "undefined" && "AudioContext" in window,
  };
}


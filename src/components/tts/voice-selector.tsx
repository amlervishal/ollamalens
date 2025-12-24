"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Check, Volume2 } from "lucide-react";
import { AVAILABLE_VOICES, type PiperVoice } from "@/lib/tts/piper";
import { usePiperTTS } from "@/hooks/use-piper-tts";

interface VoiceSelectorProps {
  onVoiceSelected?: (voiceId: string) => void;
  currentVoiceId?: string;
}

export function VoiceSelector({ onVoiceSelected, currentVoiceId }: VoiceSelectorProps) {
  const { loadVoice, isLoading, downloadProgress, currentVoice, error, isVoiceCached } = usePiperTTS();
  const [downloadingVoice, setDownloadingVoice] = useState<string | null>(null);
  const [cachedVoices, setCachedVoices] = useState<Set<string>>(new Set());

  // Check cached voices on mount
  useEffect(() => {
    AVAILABLE_VOICES.forEach((voice) => {
      isVoiceCached(voice.id).then((cached) => {
        if (cached) {
          setCachedVoices((prev) => new Set(prev).add(voice.id));
        }
      }).catch(console.error);
    });
  }, [isVoiceCached]);

  const handleSelectVoice = async (voice: PiperVoice) => {
    try {
      setDownloadingVoice(voice.id);
      await loadVoice(voice.id);
      setCachedVoices((prev) => new Set(prev).add(voice.id));
      onVoiceSelected?.(voice.id);
    } catch (err) {
      console.error("Failed to select voice:", err);
    } finally {
      setDownloadingVoice(null);
    }
  };


  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Voice</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose a high-quality voice for text-to-speech. Models will be downloaded and cached in your browser.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid gap-3">
        {AVAILABLE_VOICES.map((voice) => {
          const isSelected = currentVoiceId === voice.id || currentVoice?.id === voice.id;
          const isDownloading = downloadingVoice === voice.id;
          const isCached = cachedVoices.has(voice.id);

          return (
            <Card
              key={voice.id}
              className={`cursor-pointer transition-colors ${
                isSelected ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => !isDownloading && handleSelectVoice(voice)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">{voice.name}</CardTitle>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <CardDescription className="text-xs mt-1">
                  {voice.language} • {voice.quality} quality • {voice.size} MB
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {isCached ? (
                      <span className="text-green-600">✓ Cached</span>
                    ) : (
                      <span>Not downloaded</span>
                    )}
                  </div>
                  {isDownloading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs text-muted-foreground">
                        {downloadProgress > 0 ? `${Math.round(downloadProgress)}%` : "Loading..."}
                      </span>
                    </div>
                  ) : (
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      disabled={isLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectVoice(voice);
                      }}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Selected
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5 mr-1" />
                          {isCached ? "Select" : "Download"}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-md">
        <p className="font-medium mb-1">Note:</p>
        <p>
          Voice models are downloaded once and cached in your browser. They work completely offline after the initial download.
          Models are typically 12-50 MB in size.
        </p>
      </div>
    </div>
  );
}


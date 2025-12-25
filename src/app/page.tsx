"use client";

import { useState, useCallback, useRef } from "react";
import { ChatHistory } from "@/components/chat/chat-history";
import { ChatInput } from "@/components/chat/chat-input";
import { ComparisonView } from "@/components/comparison/comparison-view";
import { useSendMessage } from "@/hooks/use-send-message";
import { ThemeToggle } from "@/components/theme-toggle";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { OfflineIndicator } from "@/components/offline-indicator";
import { useChatStore } from "@/store/chat-store";
import { useChatMessages } from "@/hooks/use-chats";

export default function Home() {
  const { sendMessage, regenerateModel } = useSendMessage();
  const { currentChatId } = useChatStore();
  const { messages: chatMessages } = useChatMessages(currentChatId);
  
  // Evaluation state at page level
  const [showHighlights, setShowHighlights] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isAnalyzingHighlights, setIsAnalyzingHighlights] = useState(false);
  const [hasHighlights, setHasHighlights] = useState(false);
  const [evaluationReady, setEvaluationReady] = useState(false);
  const evaluateAllRef = useRef<(() => Promise<void>) | null>(null);
  const analyzeAllHighlightsRef = useRef<(() => Promise<void>) | null>(null);

  const handleEvaluateAll = useCallback(() => {
    if (!evaluateAllRef.current) {
      console.warn("[Page] Evaluation function not ready yet");
      return;
    }
    evaluateAllRef.current();
  }, []);

  const handleAnalyzeHighlights = useCallback(() => {
    analyzeAllHighlightsRef.current?.();
    setShowHighlights(true);
  }, []);

  const handleToggleHighlights = useCallback(() => {
    setShowHighlights(prev => !prev);
  }, [showHighlights]);

  return (
    <>
      <OfflineIndicator />
      <PWAInstallPrompt />
      <div className="flex h-screen overflow-hidden">
        {/* Chat History Sidebar */}
        <div className="w-64 shrink-0">
          <ChatHistory
            evaluationControls={{
              onEvaluateAll: handleEvaluateAll,
              onAnalyzeHighlights: handleAnalyzeHighlights,
              onToggleHighlights: handleToggleHighlights,
              isEvaluating,
              isAnalyzingHighlights,
              hasHighlights,
              showHighlights,
              disabled: !evaluationReady,
            }}
          />
        </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Theme Toggle - positioned at top right */}
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Comparison View */}
          <div className="flex-1 overflow-hidden pb-28 min-h-0">
            <ComparisonView
              onRegenerate={regenerateModel}
              showHighlights={showHighlights}
              onEvaluationStateChange={setIsEvaluating}
              onHighlightStateChange={setIsAnalyzingHighlights}
              onHasHighlightsChange={setHasHighlights}
              onEvaluationReadyChange={setEvaluationReady}
              evaluateAllRef={evaluateAllRef}
              analyzeAllHighlightsRef={analyzeAllHighlightsRef}
            />
          </div>
          <ChatInput onSend={sendMessage} />
        </div>
      </div>
      </div>
    </>
  );
}

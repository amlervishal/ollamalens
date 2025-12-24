"use client";

import { useState, useMemo } from "react";
import { useChatStore } from "@/store/chat-store";
import { useChatMessages } from "@/hooks/use-chats";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  Copy, 
  Check, 
  RefreshCw, 
  User,
  ChevronDown,
  ChevronUp,
  Volume2,
  Pause
} from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { ModelIcon, ModelTextLogo } from "@/components/model-icons/model-icon";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { extractPlainText } from "@/lib/utils/text-extraction";
import type { Message } from "@/types";

// Group messages into conversation turns
interface ConversationTurn {
  userMessage: Message;
  responses: Map<string, Message>; // model -> response
}

function groupMessagesByTurn(messages: Message[], selectedModels: string[]): ConversationTurn[] {
  const turns: ConversationTurn[] = [];
  let currentTurn: ConversationTurn | null = null;

  for (const message of messages) {
    if (message.role === "user") {
      // Start a new turn
      if (currentTurn) {
        turns.push(currentTurn);
      }
      currentTurn = {
        userMessage: message,
        responses: new Map(),
      };
    } else if (message.role === "assistant" && currentTurn) {
      // Add response to current turn
      if (message.model) {
        currentTurn.responses.set(message.model, message);
      }
    }
  }

  // Don't forget the last turn
  if (currentTurn) {
    turns.push(currentTurn);
  }

  return turns;
}

interface ResponseCardProps {
  model: string;
  response: Message | null;
  streamingContent?: string;
  isStreaming: boolean;
  isLoading: boolean;
  isRegenerating: boolean;
  onCopy: (text: string) => void;
  onRegenerate: (model: string) => void;
  copiedModel: string | null;
  speakingModel: string | null;
  onSpeak: (text: string, model: string) => void;
  onStop: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
}

function ResponseCard({
  model,
  response,
  streamingContent,
  isStreaming,
  isLoading,
  isRegenerating,
  onCopy,
  onRegenerate,
  copiedModel,
  speakingModel,
  onSpeak,
  onStop,
  isSpeaking,
  isPaused,
  isSupported,
}: ResponseCardProps) {
  const content = streamingContent || response?.content || "";
  const showLoading = (isLoading || isRegenerating) && !content;

  // Extract version/tag from model name (e.g., "gemma3:4b" -> "3:4b", "llama3.1:8b" -> "3.1:8b")
  const getModelVersion = (name: string): string | null => {
    // Match version pattern: numbers, dots, colons, and size indicators
    const match = name.match(/(\d+\.?\d*:?\w*)$/);
    return match ? match[1] : null;
  };
  const modelVersion = getModelVersion(model);

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      {/* Model Header */}
      <div className="px-4 py-2.5 border-b bg-muted/30 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ModelIcon modelName={model} size="md" />
            <ModelTextLogo modelName={model} height={18} />
          </div>
          {modelVersion && (
            <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
              {modelVersion}
            </span>
          )}
        </div>
      </div>

      {/* Response Content */}
      <CardContent className="flex-1 overflow-hidden p-0 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4">
            {showLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Generating...
                </span>
              </div>
            ) : content ? (
              <div className="text-sm relative">
                <MarkdownRenderer content={content} />
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                Waiting for response...
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Footer Actions */}
      {content && !isStreaming && (
        <div className="px-4 py-2 border-t bg-muted/20 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {isSupported && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    if (speakingModel === model) {
                      onStop();
                    } else {
                      onSpeak(content, model);
                    }
                  }}
                  title={speakingModel === model && isSpeaking ? (isPaused ? "Resume speech" : "Pause speech") : "Read aloud"}
                >
                  {speakingModel === model && isSpeaking ? (
                    isPaused ? (
                      <>
                        <Volume2 className="h-3.5 w-3.5 mr-1" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="h-3.5 w-3.5 mr-1" />
                        Pause
                      </>
                    )
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5 mr-1" />
                      Speak
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onCopy(content)}
                title="Copy response"
              >
                {copiedModel === model ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-green-600" />
                    <span className="text-green-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onRegenerate(model)}
                disabled={isLoading || isRegenerating}
                title="Regenerate response"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

interface TurnViewProps {
  turn: ConversationTurn;
  selectedModels: string[];
  isLatestTurn: boolean;
  currentResponses: Record<string, { content: string; done: boolean }>;
  isLoading: boolean;
  regeneratingModels: Set<string>;
  onCopy: (text: string, model: string) => void;
  onRegenerate: (model: string) => void;
  copiedModel: string | null;
  speakingModel: string | null;
  onSpeak: (text: string, model: string) => void;
  onStop: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
}

function TurnView({
  turn,
  selectedModels,
  isLatestTurn,
  currentResponses,
  isLoading,
  regeneratingModels,
  onCopy,
  onRegenerate,
  copiedModel,
  speakingModel,
  onSpeak,
  onStop,
  isSpeaking,
  isPaused,
  isSupported,
}: TurnViewProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="space-y-3">
      {/* User Question */}
      <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg">
        <div className="shrink-0">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">You</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!isCollapsed && (
            <div className="text-sm mt-1">
              <MarkdownRenderer content={turn.userMessage.content} />
              {/* Display attachments if any */}
              {turn.userMessage.attachments && turn.userMessage.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {turn.userMessage.attachments.map((attachment) => (
                    <div key={attachment.id} className="relative">
                      {attachment.type === "image" && (
                        <div className="relative w-24 h-24 rounded-md overflow-hidden border">
                          <img
                            src={attachment.data}
                            alt={attachment.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Model Responses Grid */}
      {!isCollapsed && (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${selectedModels.length}, 1fr)` }}
        >
          {selectedModels.map((model) => {
            const savedResponse = turn.responses.get(model) || null;
            const streamingResponse = isLatestTurn ? currentResponses[model] : null;
            const isStreaming = isLatestTurn && streamingResponse && !streamingResponse.done;
            const isModelRegenerating = regeneratingModels.has(model);

            return (
              <ResponseCard
                key={model}
                model={model}
                response={savedResponse}
                streamingContent={isLatestTurn ? streamingResponse?.content : undefined}
                isStreaming={!!isStreaming}
                isLoading={isLatestTurn && isLoading}
                isRegenerating={isModelRegenerating}
                onCopy={(text) => onCopy(text, model)}
                onRegenerate={onRegenerate}
                copiedModel={copiedModel}
                speakingModel={speakingModel}
                onSpeak={onSpeak}
                onStop={onStop}
                isSpeaking={isSpeaking}
                isPaused={isPaused}
                isSupported={isSupported}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ComparisonViewProps {
  onRegenerate?: (model: string) => void;
}

export function ComparisonView({ onRegenerate }: ComparisonViewProps) {
  const { selectedModels, currentResponses, isLoading, currentChatId, regeneratingModels } = useChatStore();
  const { messages } = useChatMessages(currentChatId);
  
  // Stabilize currentResponses by memoizing based on content, not object reference
  // This prevents re-render loops when the store updates with the same content
  const stableCurrentResponses = useMemo(() => currentResponses, [
    JSON.stringify(Object.entries(currentResponses).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, v.content, v.done]))
  ]);
  const [copiedModel, setCopiedModel] = useState<string | null>(null);
  const [speakingModel, setSpeakingModel] = useState<string | null>(null);
  const { speak, stop, pause, resume, isSpeaking, isPaused, isSupported } = useTextToSpeech();

  const handleCopy = async (text: string, model: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedModel(model);
      setTimeout(() => setCopiedModel(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleRegenerate = async (model: string) => {
    if (onRegenerate) {
      onRegenerate(model);
    }
  };

  const handleSpeak = (text: string, model: string) => {
    if (speakingModel === model && isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      // Stop any current speech
      if (speakingModel) {
        stop();
      }
      const plainText = extractPlainText(text);
      if (plainText) {
        setSpeakingModel(model);
        speak(plainText, () => {
          // Reset speakingModel when speech ends
          setSpeakingModel((prev) => (prev === model ? null : prev));
        });
      }
    }
  };

  const handleStop = () => {
    stop();
    setSpeakingModel(null);
  };

  if (selectedModels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select models to compare responses
      </div>
    );
  }

  // Group messages into conversation turns
  const turns = groupMessagesByTurn(messages, selectedModels);

  // Check if the last turn already has all responses saved
  const lastTurnHasAllResponses = turns.length > 0 && 
    selectedModels.every(model => turns[turns.length - 1].responses.has(model));

  // Check if currentResponses has any data that isn't saved yet
  // A response is unsaved if it exists in currentResponses but not in the last turn
  const hasUnsavedResponses = turns.length > 0 && lastTurnHasAllResponses
    ? false // If last turn has all responses, nothing is unsaved
    : Object.keys(stableCurrentResponses).length > 0 && 
      Object.values(stableCurrentResponses).some(response => response.content);

  // Show streaming placeholder ONLY when:
  // 1. We're actively loading (isLoading is true), OR
  // 2. We have unsaved responses AND (no turns yet OR last turn doesn't have all responses)
  // This prevents duplicate rendering once responses are saved to the turn
  const showStreamingPlaceholder = (isLoading || hasUnsavedResponses) && 
    (turns.length === 0 || !lastTurnHasAllResponses);

  if (turns.length === 0 && !showStreamingPlaceholder) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Send a message to compare model responses
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {turns.map((turn, index) => (
            <TurnView
              key={turn.userMessage.id}
              turn={turn}
              selectedModels={selectedModels}
              isLatestTurn={index === turns.length - 1}
              currentResponses={stableCurrentResponses}
              isLoading={isLoading}
              regeneratingModels={regeneratingModels}
              onCopy={handleCopy}
              onRegenerate={handleRegenerate}
              copiedModel={copiedModel}
              speakingModel={speakingModel}
              onSpeak={handleSpeak}
              onStop={handleStop}
              isSpeaking={isSpeaking}
              isPaused={isPaused}
              isSupported={isSupported}
            />
          ))}

          {/* Show streaming placeholder for new messages */}
          {showStreamingPlaceholder && Object.keys(stableCurrentResponses).length > 0 && (
            <div className="space-y-3">
              {/* Only show model responses grid when streaming new turn */}
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${selectedModels.length}, 1fr)` }}
              >
                {selectedModels.map((model) => {
                  const streamingResponse = stableCurrentResponses[model];
                  const isStreaming = streamingResponse && !streamingResponse.done;

                  return (
                    <ResponseCard
                      key={model}
                      model={model}
                      response={null}
                      streamingContent={streamingResponse?.content}
                      isStreaming={!!isStreaming}
                      isLoading={isLoading}
                      isRegenerating={regeneratingModels.has(model)}
                      onCopy={(text) => handleCopy(text, model)}
                      onRegenerate={handleRegenerate}
                      copiedModel={copiedModel}
                      speakingModel={speakingModel}
                      onSpeak={handleSpeak}
                      onStop={handleStop}
                      isSpeaking={isSpeaking}
                      isPaused={isPaused}
                      isSupported={isSupported}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

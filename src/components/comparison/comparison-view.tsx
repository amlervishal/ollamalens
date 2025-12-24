"use client";

import { useState, useMemo, useCallback } from "react";
import { useChatStore } from "@/store/chat-store";
import { useChatMessages } from "@/hooks/use-chats";
import { useResponseEvaluation } from "@/hooks/use-response-evaluation";
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
  Pause,
  BarChart3
} from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { ModelIcon, ModelTextLogo } from "@/components/model-icons/model-icon";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { extractPlainText } from "@/lib/utils/text-extraction";
import { EvaluationDisplay } from "@/components/comparison/evaluation-display";
import { HighlightedContent } from "@/components/comparison/highlighted-content";
import type { Message, ResponseEvaluation, HighlightAnalysis } from "@/types";

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
  onEvaluate?: (model: string) => void;
  copiedModel: string | null;
  speakingModel: string | null;
  onSpeak: (text: string, model: string) => void;
  onStop: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  evaluation?: ResponseEvaluation | null;
  highlightAnalysis?: HighlightAnalysis | null;
  isEvaluating?: boolean;
  isAnalyzingHighlights?: boolean;
  evaluationError?: string;
  onHighlightClick?: () => void;
  showHighlights?: boolean;
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
  onEvaluate,
  copiedModel,
  speakingModel,
  onSpeak,
  onStop,
  isSpeaking,
  isPaused,
  isSupported,
  evaluation,
  highlightAnalysis,
  isEvaluating,
  isAnalyzingHighlights,
  evaluationError,
  onHighlightClick,
  showHighlights = false,
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
                {showHighlights && highlightAnalysis ? (
                  <HighlightedContent
                    content={content}
                    highlightAnalysis={highlightAnalysis}
                    showHighlights={showHighlights}
                  />
                ) : (
                  <MarkdownRenderer content={content} />
                )}
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

      {/* Evaluation Display */}
      {content && !isStreaming && (
        <EvaluationDisplay
          evaluation={evaluation || null}
          isLoading={isEvaluating}
          error={evaluationError}
          onHighlightClick={onHighlightClick}
          isHighlightLoading={isAnalyzingHighlights}
        />
      )}

      {/* Footer Actions */}
      {content && !isStreaming && (
        <div className="px-4 py-2 border-t bg-muted/20 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  console.log('[ResponseCard] Evaluate button clicked for model:', model);
                  console.log('[ResponseCard] onEvaluate exists?', !!onEvaluate);
                  console.log('[ResponseCard] isEvaluating:', isEvaluating);
                  onEvaluate?.(model);
                }}
                disabled={isLoading || isEvaluating}
                title="Evaluate response"
              >
                <BarChart3 className={`h-3.5 w-3.5 mr-1 ${isEvaluating ? 'animate-spin' : ''}`} />
                {isEvaluating ? 'Evaluating...' : 'Evaluate'}
              </Button>
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
  const [highlightedModels, setHighlightedModels] = useState<Set<string>>(new Set());

  // Create a serialized key from currentResponses to detect when done status changes
  // This ensures responsesMap useMemo recalculates when models complete sequentially
  // Compute directly from currentResponses each render - React will compare the string value
  const currentResponsesKey = (() => {
    const entries = Object.entries(currentResponses)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([model, response]) => `${model}:${response.done}:${response.content.length}`);
    const key = entries.join('|');
    console.log(`[ComparisonView] 🔑 currentResponsesKey computed:`, {
      key: key.substring(0, 100) + (key.length > 100 ? '...' : ''),
      entriesCount: entries.length,
      allDone: entries.every(e => e.includes(':true:')),
    });
    return key;
  })();

  // Build responses map for evaluation hook
  const responsesMap = useMemo(() => {
    const map = new Map<string, { content: string; done: boolean }>();
    
    // For latest turn, prefer streaming responses (they have the most up-to-date done status)
    if (isLatestTurn) {
      selectedModels.forEach((model) => {
        const streamingResponse = currentResponses[model];
        if (streamingResponse) {
          map.set(model, {
            content: streamingResponse.content,
            done: streamingResponse.done,
          });
        } else {
          // Fall back to saved response if no streaming response
          const savedResponse = turn.responses.get(model);
          if (savedResponse) {
            map.set(model, { content: savedResponse.content, done: true });
          }
        }
      });
    } else {
      // For older turns, use saved responses
      selectedModels.forEach((model) => {
        const savedResponse = turn.responses.get(model);
        if (savedResponse) {
          map.set(model, { content: savedResponse.content, done: true });
        }
      });
    }
    
    return map;
  }, [turn.responses, currentResponsesKey, isLatestTurn, selectedModels]);

  // Use evaluation hook - MANUAL evaluation only (autoEvaluate: false)
  const {
    evaluations,
    highlightAnalyses,
    isEvaluating,
    isAnalyzingHighlights,
    errors,
    analyzeHighlights: triggerHighlightAnalysis,
    evaluateResponse: evaluateSingleModel,
  } = useResponseEvaluation(turn.userMessage.content, responsesMap, {
    autoEvaluate: false,
    evalModel: "llama3.2:3b",
  });

  const handleHighlightClick = (model: string) => {
    if (highlightedModels.has(model)) {
      // Toggle off
      const newSet = new Set(highlightedModels);
      newSet.delete(model);
      setHighlightedModels(newSet);
    } else {
      // Toggle on and trigger analysis if not already done
      setHighlightedModels(new Set(highlightedModels).add(model));
      if (!highlightAnalyses.has(model)) {
        triggerHighlightAnalysis(model);
      }
    }
  };


  const handleEvaluateSingle = useCallback(async (model: string) => {
    console.log("[ComparisonView] 🔘 Evaluate Single button clicked for model:", model);
    console.log("[ComparisonView] responsesMap:", responsesMap);
    console.log("[ComparisonView] evaluateSingleModel exists?", !!evaluateSingleModel);
    const response = responsesMap.get(model);
    console.log("[ComparisonView] Found response for model:", !!response);
    if (response) {
      console.log("[ComparisonView] Response content length:", response.content.length);
      console.log("[ComparisonView] Response done:", response.done);
    }
    if (response && evaluateSingleModel) {
      console.log("[ComparisonView] Calling evaluateSingleModel...");
      await evaluateSingleModel(model, response.content);
      console.log("[ComparisonView] evaluateSingleModel completed");
    } else {
      console.log("[ComparisonView] Cannot evaluate - missing response or evaluateSingleModel function");
    }
  }, [responsesMap, evaluateSingleModel]);

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
            
            // Get evaluation data
            const evaluation = evaluations.get(model) || savedResponse?.evaluation || null;
            const highlightAnalysis = highlightAnalyses.get(model) || savedResponse?.highlightAnalysis || null;
            const showHighlights = highlightedModels.has(model);

            console.log(`[TurnView] Rendering ResponseCard for ${model}:`, {
              hasHandleEvaluateSingle: !!handleEvaluateSingle,
              hasEvaluateSingleModel: !!evaluateSingleModel,
              isLatestTurn,
              turnIndex: turn.userMessage.id
            });
            
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
                onEvaluate={handleEvaluateSingle}
                copiedModel={copiedModel}
                speakingModel={speakingModel}
                onSpeak={onSpeak}
                onStop={onStop}
                isSpeaking={isSpeaking}
                isPaused={isPaused}
                isSupported={isSupported}
                evaluation={evaluation}
                highlightAnalysis={highlightAnalysis}
                isEvaluating={isEvaluating(model)}
                isAnalyzingHighlights={isAnalyzingHighlights(model)}
                evaluationError={errors.get(model)}
                onHighlightClick={() => handleHighlightClick(model)}
                showHighlights={showHighlights}
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
  const [streamingEvaluations, setStreamingEvaluations] = useState<Map<string, any>>(new Map());
  const [streamingEvaluating, setStreamingEvaluating] = useState<Set<string>>(new Set());
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

  // Create evaluation handler at ComparisonView level for streaming placeholder
  const handleStreamingEvaluate = useCallback(async (model: string, content: string, userQuestion: string) => {
    console.log('[ComparisonView] Streaming evaluate called for:', model);
    
    // Set loading state
    setStreamingEvaluating(prev => new Set(prev).add(model));
    
    try {
      // Call the evaluation API directly
      const { evaluateResponse } = await import('@/lib/utils/response-evaluation');
      
      // Build other responses
      const otherResponses = Object.entries(stableCurrentResponses)
        .filter(([m]) => m !== model)
        .map(([m, r]) => ({ model: m, content: r.content }));
      
      const request = {
        userQuestion,
        currentResponse: content,
        currentModel: model,
        otherResponses,
      };
      
      console.log('[ComparisonView] Calling evaluation API...');
      const evaluation = await evaluateResponse(request, "llama3.2:3b");
      console.log('[ComparisonView] Evaluation complete:', evaluation);
      
      // Store the evaluation result
      setStreamingEvaluations(prev => {
        const newMap = new Map(prev);
        newMap.set(model, evaluation);
        return newMap;
      });
    } catch (error) {
      console.error('[ComparisonView] Evaluation error:', error);
    } finally {
      // Remove loading state
      setStreamingEvaluating(prev => {
        const newSet = new Set(prev);
        newSet.delete(model);
        return newSet;
      });
    }
  }, [stableCurrentResponses]);

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
  const hasUnsavedResponses = turns.length > 0 && lastTurnHasAllResponses
    ? false
    : Object.keys(stableCurrentResponses).length > 0 && 
      Object.values(stableCurrentResponses).some(response => response.content);

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
                  
                  // Get the last user message for evaluation context
                  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
                  const userQuestion = lastUserMessage?.content || '';

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
                      onEvaluate={streamingResponse?.content ? () => handleStreamingEvaluate(model, streamingResponse.content, userQuestion) : undefined}
                      isEvaluating={streamingEvaluating.has(model)}
                      evaluation={streamingEvaluations.get(model) || null}
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

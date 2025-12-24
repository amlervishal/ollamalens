"use client";

import { useEffect, useRef, useState } from "react";
import { useChatMessages } from "@/hooks/use-chats";
import { useChatStore } from "@/store/chat-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Bot, File as FileIcon, Copy, Check, Volume2, Pause } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { useTextToSpeech } from "@/hooks/use-text-to-speech";
import { extractPlainText } from "@/lib/utils/text-extraction";

export function ChatMessages() {
  const { currentChatId } = useChatStore();
  const { messages } = useChatMessages(currentChatId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const { speak, stop, pause, resume, isSpeaking, isPaused, isSupported } = useTextToSpeech();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [messages]);

  const handleCopy = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSpeak = (text: string, messageId: string) => {
    if (speakingId === messageId && isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      // Stop any current speech
      if (speakingId) {
        stop();
      }
      const plainText = extractPlainText(text);
      if (plainText) {
        setSpeakingId(messageId);
        speak(plainText, () => {
          // Reset speakingId when speech ends
          setSpeakingId((prev) => (prev === messageId ? null : prev));
        });
      }
    }
  };

  const handleStop = () => {
    stop();
    setSpeakingId(null);
  };

  if (!currentChatId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select or create a chat to view messages
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                </div>
              )}
              <Card
                className={`max-w-[80%] flex flex-col ${
                  message.role === "user"
                    ? "bg-muted/50"
                    : ""
                }`}
              >
                <div className="p-3 space-y-2">
                  {/* Display attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {message.attachments.map((attachment) => (
                        <div key={attachment.id} className="relative">
                          {attachment.type === "image" ? (
                            <div className="relative w-48 h-48 rounded-md overflow-hidden border">
                              <img
                                src={attachment.data}
                                alt={attachment.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                              <FileIcon className="h-4 w-4" />
                              <div className="text-xs">
                                <p className="font-medium">{attachment.name}</p>
                                {attachment.size && (
                                  <p className="text-muted-foreground">
                                    {(attachment.size / 1024).toFixed(1)} KB
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Display message content */}
                  {message.content && (
                    <div className="text-sm">
                      <MarkdownRenderer content={message.content} />
                    </div>
                  )}
                </div>
                
                {/* Footer with copy button and model/user name */}
                <div className="px-3 py-2 border-t border-border/50 flex items-center justify-between gap-2 bg-muted/30">
                  <div className="text-xs text-muted-foreground font-medium">
                    {message.role === "user" ? "You" : message.model || "Assistant"}
                  </div>
                  <div className="flex items-center gap-1">
                    {message.role === "assistant" && isSupported && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          if (speakingId === message.id) {
                            handleStop();
                          } else {
                            handleSpeak(message.content, message.id);
                          }
                        }}
                        title={speakingId === message.id && isSpeaking ? (isPaused ? "Resume speech" : "Pause speech") : "Read aloud"}
                      >
                        {speakingId === message.id && isSpeaking ? (
                          isPaused ? (
                            <Volume2 className="h-3.5 w-3.5" />
                          ) : (
                            <Pause className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <Volume2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(message.content, message.id)}
                      title="Copy message"
                    >
                      {copiedId === message.id ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
              {message.role === "user" && (
                <div className="shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}


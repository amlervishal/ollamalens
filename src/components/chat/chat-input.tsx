"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Plus, X, Image as ImageIcon, File } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import type { Attachment } from "@/types";

interface ChatInputProps {
  onSend: (message: string, attachments?: Attachment[]) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const { isLoading } = useChatStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowFileMenu(false);
      }
    };

    if (showFileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showFileMenu]);

  const handleSend = () => {
    if ((input.trim() || attachments.length > 0) && !disabled && !isLoading) {
      onSend(input.trim(), attachments.length > 0 ? attachments : undefined);
      setInput("");
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const handleAddFiles = useCallback(async (files: FileList) => {
    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith("image/");

      try {
        if (isImage) {
          // Convert image to base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          newAttachments.push({
            id: crypto.randomUUID(),
            type: "image",
            name: file.name,
            data: base64,
            mimeType: file.type,
            size: file.size,
          });
        } else {
          // For non-image files, read as text or base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // Remove data URL prefix if present
              const base64Data = result.includes(",")
                ? result.split(",")[1]
                : result;
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          newAttachments.push({
            id: crypto.randomUUID(),
            type: "file",
            name: file.name,
            data: base64,
            mimeType: file.type,
            size: file.size,
          });
        }
      } catch (error) {
        console.error("Error processing file:", error);
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    setShowFileMenu(false);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <>
      {/* Floating input */}
      <div className="absolute bottom-4 left-4 right-4 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 p-2 border rounded-lg bg-background">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="relative group border rounded-md overflow-hidden bg-muted/50"
                >
                  {attachment.type === "image" ? (
                    <div className="relative w-20 h-20">
                      <img
                        src={attachment.data}
                        alt={attachment.name}
                        className="w-full h-full object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="p-2 w-28">
                      <File className="h-4 w-4 mb-1 text-muted-foreground" />
                      <p className="text-xs truncate font-medium">
                        {attachment.name}
                      </p>
                      {attachment.size && (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.size)}
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveAttachment(attachment.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Simple rounded input */}
          <div className="relative flex items-center bg-background border rounded-full px-4 py-2">
            {/* Plus button for file menu */}
            <div className="relative" ref={menuRef}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 -ml-1"
                onClick={() => setShowFileMenu(!showFileMenu)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              
              {/* File menu dropdown */}
              {showFileMenu && (
                <div className="absolute bottom-full left-0 mb-2 bg-background border rounded-lg p-1 min-w-[120px] z-10">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      imageInputRef.current?.click();
                      setShowFileMenu(false);
                    }}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Image
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowFileMenu(false);
                    }}
                  >
                    <File className="mr-2 h-4 w-4" />
                    File
                  </Button>
                </div>
              )}
            </div>

            {/* Input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 border-0 bg-transparent focus:outline-none focus:ring-0 px-2 py-1 text-sm"
              disabled={disabled || isLoading}
            />

            {/* Send button */}
            <Button
              onClick={handleSend}
              disabled={
                (!input.trim() && attachments.length === 0) ||
                disabled ||
                isLoading
              }
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 -mr-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>

            {/* Hidden file inputs */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  handleAddFiles(e.target.files);
                }
              }}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  handleAddFiles(e.target.files);
                }
              }}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </>
  );
}


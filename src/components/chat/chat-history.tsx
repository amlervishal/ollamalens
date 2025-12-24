"use client";

import { useState } from "react";
import { useChats } from "@/hooks/use-chats";
import { useChatStore } from "@/store/chat-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { ModelSelector } from "@/components/model-selector/model-selector";

export function ChatHistory() {
  const { chats, createChat } = useChats();
  const { currentChatId, setCurrentChatId } = useChatStore();
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  const handleNewChat = async () => {
    const newChat = await createChat("New Chat");
    setCurrentChatId(newChat.id);
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  return (
    <div className="flex flex-col h-full border-r bg-muted/30">
      {/* App Name */}
      <div className="px-4 pt-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">App Name</h2>
        <button
          onClick={handleNewChat}
          className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center"
          title="New Chat"
        >
          <Plus className="h-4 w-4 text-white stroke-white" />
        </button>
      </div>

      {/* Gap */}
      <div className="h-8" />

      {/* Model Selector Section */}
      <div className="px-4">
        <ModelSelector />
      </div>

      {/* Large Spacer - pushes History to bottom */}
      <div className="flex-1" />

      {/* History Section - Accordion - at bottom */}
      <div className="flex flex-col min-h-0 shrink-0">
        {/* Section Header */}
        <div className="px-4 py-1.5 flex items-center justify-between">
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            {isHistoryOpen ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            <span>History</span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={handleNewChat}
            title="New Chat"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Chat List */}
        {isHistoryOpen && (
          <ScrollArea className="max-h-64">
            <div className="px-3 py-1">
              {chats.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-3 px-2">
                  No chats yet
                </div>
              ) : (
                <div className="space-y-0.5">
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-sm transition-colors ${
                        currentChatId === chat.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-foreground"
                      }`}
                      onClick={() => handleSelectChat(chat.id)}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span className="truncate flex-1">{chat.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

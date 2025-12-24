"use client";

import { ChatHistory } from "@/components/chat/chat-history";
import { ChatInput } from "@/components/chat/chat-input";
import { ComparisonView } from "@/components/comparison/comparison-view";
import { useSendMessage } from "@/hooks/use-send-message";
import { ThemeToggle } from "@/components/theme-toggle";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { OfflineIndicator } from "@/components/offline-indicator";

export default function Home() {
  const { sendMessage, regenerateModel } = useSendMessage();

  return (
    <>
      <OfflineIndicator />
      <PWAInstallPrompt />
      <div className="flex h-screen overflow-hidden">
        {/* Chat History Sidebar */}
        <div className="w-64 shrink-0">
          <ChatHistory />
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
            <ComparisonView onRegenerate={regenerateModel} />
          </div>
          <ChatInput onSend={sendMessage} />
        </div>
      </div>
      </div>
    </>
  );
}

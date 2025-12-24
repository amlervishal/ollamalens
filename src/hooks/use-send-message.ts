import { useChatStore } from "@/store/chat-store";
import { useChats, useChatMessages } from "./use-chats";
import type { ModelResponse, Attachment, OllamaChatMessage } from "@/types";

export function useSendMessage() {
  const {
    selectedModels,
    currentChatId,
    addResponse,
    clearResponses,
    clearModelResponse,
    setLoading,
    setCurrentChatId,
    setRegenerating,
  } = useChatStore();
  const { createChat } = useChats();
  const { addMessage: saveMessage } = useChatMessages(currentChatId);

  // Wait for all responses to be marked as done in the store
  const waitForAllResponsesDone = async (models: string[], maxWaitMs: number = 2000): Promise<boolean> => {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      // Access store state directly (not reactive)
      const storeState = useChatStore.getState();
      const allDone = models.every(model => {
        const response = storeState.currentResponses[model];
        return response?.done === true && response?.content?.trim().length > 0;
      });
      
      if (allDone) {
        console.log(`[SendMessage] ✅ All ${models.length} responses confirmed done in store`);
        return true;
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Final check
    const finalState = useChatStore.getState();
    console.warn(`[SendMessage] ⚠️ Timeout waiting for all responses to be done. Status:`, 
      models.map(m => ({ 
        model: m, 
        done: finalState.currentResponses[m]?.done, 
        hasContent: !!finalState.currentResponses[m]?.content,
        contentLength: finalState.currentResponses[m]?.content?.length || 0
      }))
    );
    return false;
  };

  // Helper function to stream response from a single model
  const streamModelResponse = async (
    model: string,
    conversationHistory: OllamaChatMessage[],
    chatId: string,
    shouldSaveMessage: boolean = true
  ) => {
    try {
      const response = await fetch("/api/ollama/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: conversationHistory,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              const content = data.message?.content || data.response || "";

              if (content) {
                fullContent += content;

                addResponse(model, {
                  model,
                  content: fullContent,
                  done: data.done || false,
                });
              }
            } catch (e) {
              console.error("Error parsing streaming response:", e);
            }
          }
        }
      }

      const finalResponse: ModelResponse = {
        model,
        content: fullContent,
        done: true,
      };

      addResponse(model, finalResponse);

      // Save assistant message
      if (shouldSaveMessage && chatId && finalResponse.content) {
        await saveMessage("assistant", finalResponse.content, model);
      }

      return finalResponse;
    } catch (error) {
      const errorResponse: ModelResponse = {
        model,
        content: "",
        error: error instanceof Error ? error.message : "Unknown error",
        done: true,
      };
      addResponse(model, errorResponse);
      return errorResponse;
    }
  };

  const sendMessage = async (prompt: string, attachments?: Attachment[]) => {
    if (selectedModels.length === 0) {
      alert("Please select at least one model");
      return;
    }

    // Create a new chat if none exists
    let chatId = currentChatId;
    if (!chatId) {
      const newChat = await createChat(prompt.slice(0, 50) || "New Chat");
      chatId = newChat.id;
      setCurrentChatId(chatId);
    }

    // Clear previous responses
    clearResponses();
    setLoading(true);

    // Save user message
    if (chatId) {
      await saveMessage("user", prompt, null, attachments);
    }

    // Extract image data from attachments for Ollama API
    const imageAttachments =
      attachments?.filter((att) => att.type === "image") || [];
    const images = imageAttachments.map((att) => {
      return att.data.includes(",") ? att.data.split(",")[1] : att.data;
    });

    // Build conversation history for context
    const { getChatMessages } = await import("@/lib/storage/db");
    const currentMessages = await getChatMessages(chatId!);

    // Build conversation history, excluding the last user message we just added
    const previousMessages = currentMessages.slice(0, -1);
    const conversationHistory: OllamaChatMessage[] = [
      ...previousMessages
        .filter((msg) => msg.role === "user" || msg.role === "assistant")
        .map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
      {
        role: "user" as const,
        content: prompt,
        images: images.length > 0 ? images : undefined,
      },
    ];

    // Send to models sequentially (one at a time)
    console.log(`[SendMessage] Starting sequential processing of ${selectedModels.length} model(s)`);
    
    for (let i = 0; i < selectedModels.length; i++) {
      const model = selectedModels[i];
      const isLastModel = i === selectedModels.length - 1;
      
      console.log(`[SendMessage] Starting model ${i + 1}/${selectedModels.length}: ${model}`);
      
      try {
        await streamModelResponse(model, conversationHistory, chatId!, true);
        console.log(`[SendMessage] Completed model ${i + 1}/${selectedModels.length}: ${model}`);
        
        if (isLastModel) {
          console.log(`[SendMessage] Last model completed. Waiting for all responses to be marked done in store...`);
          // Wait for store to actually have all responses marked as done: true
          // This ensures the evaluation hook's useEffect can detect the change
          const allDone = await waitForAllResponsesDone(selectedModels);
          if (allDone) {
            console.log(`[SendMessage] ✅ All responses confirmed done. Evaluation should trigger automatically.`);
          } else {
            console.log(`[SendMessage] ⚠️ Some responses may not be marked done yet, but proceeding anyway.`);
          }
        }
      } catch (error) {
        console.error(`[SendMessage] Error processing model ${model}:`, error);
        // Continue with next model even if one fails
      }
    }
    
    console.log(`[SendMessage] All models processed. Setting loading to false.`);
    setLoading(false);
  };

  // Regenerate response for a specific model
  const regenerateModel = async (model: string) => {
    if (!currentChatId) {
      console.error("No current chat to regenerate");
      return;
    }

    setRegenerating(model, true);
    clearModelResponse(model);

    try {
      const { getChatMessages, db } = await import("@/lib/storage/db");
      const currentMessages = await getChatMessages(currentChatId);

      // Find the last user message and remove the old response for this model
      const lastUserMessageIndex = [...currentMessages]
        .reverse()
        .findIndex((msg) => msg.role === "user");

      if (lastUserMessageIndex === -1) {
        console.error("No user message found");
        return;
      }

      const actualIndex = currentMessages.length - 1 - lastUserMessageIndex;
      const lastUserMessage = currentMessages[actualIndex];

      // Find and delete the old response from this model
      const oldResponse = currentMessages.find(
        (msg, idx) =>
          idx > actualIndex &&
          msg.role === "assistant" &&
          msg.model === model
      );

      if (oldResponse) {
        await db.messages.delete(oldResponse.id);
      }

      // Build conversation history up to (including) the last user message
      const conversationHistory: OllamaChatMessage[] = currentMessages
        .slice(0, actualIndex + 1)
        .filter((msg) => msg.role === "user" || msg.role === "assistant")
        .map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

      // Stream the new response
      await streamModelResponse(model, conversationHistory, currentChatId, true);
    } catch (error) {
      console.error("Error regenerating response:", error);
      addResponse(model, {
        model,
        content: "",
        error: error instanceof Error ? error.message : "Unknown error",
        done: true,
      });
    } finally {
      setRegenerating(model, false);
    }
  };

  return { sendMessage, regenerateModel };
}

import { useLiveQuery } from "dexie-react-hooks";
import {
  getAllChats,
  createChat,
  deleteChat,
  getChatMessages,
  addMessage,
} from "@/lib/storage/db";
import type { Chat, Message, Attachment } from "@/types";

export function useChats() {
  const chats = useLiveQuery(() => getAllChats()) || [];

  return {
    chats,
    createChat: async (title: string) => {
      return await createChat(title);
    },
    deleteChat: async (chatId: string) => {
      await deleteChat(chatId);
    },
  };
}

export function useChatMessages(chatId: string | null) {
  const messages = useLiveQuery(
    () => (chatId ? getChatMessages(chatId) : Promise.resolve([])),
    [chatId]
  ) || [];

  return {
    messages,
    addMessage: async (
      role: "user" | "assistant",
      content: string,
      model: string | null = null,
      attachments?: Attachment[]
    ) => {
      if (!chatId) return null;
      return await addMessage(chatId, role, content, model, attachments);
    },
  };
}


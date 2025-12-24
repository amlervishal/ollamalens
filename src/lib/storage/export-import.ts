import { db } from "./db";
import type { Chat, Message } from "@/types";

export interface ExportData {
  version: string;
  exportedAt: number;
  chats: Chat[];
  messages: Message[];
}

export async function exportChats(): Promise<string> {
  const chats = await db.chats.toArray();
  const messages = await db.messages.toArray();

  const data: ExportData = {
    version: "1.0",
    exportedAt: Date.now(),
    chats,
    messages,
  };

  return JSON.stringify(data, null, 2);
}

export async function importChats(jsonData: string): Promise<void> {
  const data: ExportData = JSON.parse(jsonData);

  // Validate structure
  if (!data.chats || !data.messages) {
    throw new Error("Invalid export data format");
  }

  // Use transaction to ensure atomicity
  await db.transaction("rw", db.chats, db.messages, async () => {
    // Clear existing data (optional - could also merge)
    await db.messages.clear();
    await db.chats.clear();

    // Import chats
    await db.chats.bulkAdd(data.chats);

    // Import messages
    await db.messages.bulkAdd(data.messages);
  });
}

export async function exportSingleChat(chatId: string): Promise<string> {
  const chat = await db.chats.get(chatId);
  if (!chat) {
    throw new Error("Chat not found");
  }

  const messages = await db.messages.where("chatId").equals(chatId).toArray();

  const data = {
    version: "1.0",
    exportedAt: Date.now(),
    chat,
    messages,
  };

  return JSON.stringify(data, null, 2);
}


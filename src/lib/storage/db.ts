import Dexie, { Table } from "dexie";
import type { Chat, Message, UserSettings, Attachment } from "@/types";

export class MultiModalWebUIDB extends Dexie {
  chats!: Table<Chat>;
  messages!: Table<Message>;
  user_settings!: Table<UserSettings>;

  constructor() {
    super("MultiModalWebUI");

    this.version(1).stores({
      chats: "id, createdAt, updatedAt, title",
      messages: "id, chatId, createdAt, orderIndex, [chatId+orderIndex]",
      user_settings: "id",
    });
  }
}

export const db = new MultiModalWebUIDB();

// Helper functions
export async function createChat(title: string): Promise<Chat> {
  const now = Date.now();
  const chat: Chat = {
    id: crypto.randomUUID(),
    title,
    createdAt: now,
    updatedAt: now,
  };
  await db.chats.add(chat);
  return chat;
}

export async function addMessage(
  chatId: string,
  role: "user" | "assistant",
  content: string,
  model: string | null = null,
  attachments?: Attachment[]
): Promise<Message> {
  // Get the highest orderIndex for this chat
  const existingMessages = await db.messages
    .where("chatId")
    .equals(chatId)
    .sortBy("orderIndex");
  const orderIndex =
    existingMessages.length > 0
      ? existingMessages[existingMessages.length - 1].orderIndex + 1
      : 0;

  const message: Message = {
    id: crypto.randomUUID(),
    chatId,
    role,
    content,
    model,
    attachments,
    createdAt: Date.now(),
    orderIndex,
  };

  await db.messages.add(message);

  // Update chat's updatedAt timestamp
  await db.chats.update(chatId, { updatedAt: Date.now() });

  return message;
}

export async function getChatMessages(chatId: string): Promise<Message[]> {
  return await db.messages
    .where("chatId")
    .equals(chatId)
    .sortBy("orderIndex");
}

export async function deleteChat(chatId: string): Promise<void> {
  await db.transaction("rw", db.chats, db.messages, async () => {
    await db.messages.where("chatId").equals(chatId).delete();
    await db.chats.delete(chatId);
  });
}

export async function getAllChats(): Promise<Chat[]> {
  return await db.chats.orderBy("updatedAt").reverse().toArray();
}

export async function getOrCreateUserSettings(): Promise<UserSettings> {
  const settings = await db.user_settings.get("default");
  if (settings) {
    return settings;
  }

  const defaultSettings: UserSettings = {
    id: "default",
    theme: "system",
    defaultModels: [],
    preferences: {},
  };

  await db.user_settings.add(defaultSettings);
  return defaultSettings;
}

export async function updateUserSettings(
  updates: Partial<UserSettings>
): Promise<void> {
  await db.user_settings.update("default", updates);
}


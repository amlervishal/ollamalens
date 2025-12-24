import { create } from "zustand";
import type { ModelResponse } from "@/types";

interface ChatState {
  currentChatId: string | null;
  selectedModels: string[];
  currentResponses: Record<string, ModelResponse>; // model -> response
  isLoading: boolean;
  regeneratingModels: Set<string>; // models currently being regenerated
  setCurrentChatId: (chatId: string | null) => void;
  setSelectedModels: (models: string[]) => void;
  addResponse: (model: string, response: ModelResponse) => void;
  clearResponses: () => void;
  clearModelResponse: (model: string) => void;
  setLoading: (loading: boolean) => void;
  setRegenerating: (model: string, isRegenerating: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  currentChatId: null,
  selectedModels: [],
  currentResponses: {},
  isLoading: false,
  regeneratingModels: new Set(),
  setCurrentChatId: (chatId) => set({ currentChatId: chatId }),
  setSelectedModels: (models) => set({ selectedModels: models }),
  addResponse: (model, response) =>
    set((state) => ({
      currentResponses: {
        ...state.currentResponses,
        [model]: response,
      },
    })),
  clearResponses: () => set({ currentResponses: {} }),
  clearModelResponse: (model) =>
    set((state) => {
      const newResponses = { ...state.currentResponses };
      delete newResponses[model];
      return { currentResponses: newResponses };
    }),
  setLoading: (loading) => set({ isLoading: loading }),
  setRegenerating: (model, isRegenerating) =>
    set((state) => {
      const newSet = new Set(state.regeneratingModels);
      if (isRegenerating) {
        newSet.add(model);
      } else {
        newSet.delete(model);
      }
      return { regeneratingModels: newSet };
    }),
}));


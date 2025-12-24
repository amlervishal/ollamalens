import { useQuery } from "@tanstack/react-query";

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    parent_model?: string;
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

async function fetchModels(): Promise<OllamaModel[]> {
  const response = await fetch("/api/ollama/models");
  if (!response.ok) {
    throw new Error("Failed to fetch models");
  }
  const data = await response.json();
  return data.models || [];
}

export function useModels() {
  return useQuery({
    queryKey: ["ollama-models"],
    queryFn: fetchModels,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}


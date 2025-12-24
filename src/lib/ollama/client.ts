import type {
  OllamaModel,
  OllamaListResponse,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaChatRequest,
} from "@/types";

const DEFAULT_OLLAMA_URL = "http://localhost:11434";

export class OllamaClient {
  private baseUrl: string;

  constructor(baseUrl: string = DEFAULT_OLLAMA_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
  }

  /**
   * List all available models from Ollama
   */
  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      const data: OllamaListResponse = await response.json();
      return data.models || [];
    } catch (error) {
      console.error("Error listing models:", error);
      throw error;
    }
  }

  /**
   * Generate a response from a model (non-streaming)
   */
  async generate(
    request: OllamaGenerateRequest
  ): Promise<OllamaGenerateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...request,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating response:", error);
      throw error;
    }
  }

  /**
   * Generate a streaming response from a model
   */
  async *generateStream(
    request: OllamaGenerateRequest
  ): AsyncGenerator<OllamaGenerateResponse, void, unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...request,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate stream: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data: OllamaGenerateResponse = JSON.parse(line);
              yield data;
            } catch (e) {
              console.error("Error parsing streaming response:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating stream:", error);
      throw error;
    }
  }

  /**
   * Chat with a model using conversation context
   */
  async chat(
    request: OllamaChatRequest
  ): Promise<OllamaGenerateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...request,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to chat: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        model: data.model || request.model,
        created_at: data.created_at || new Date().toISOString(),
        response: data.message?.content || "",
        done: data.done !== undefined ? data.done : true,
        context: data.context,
      };
    } catch (error) {
      console.error("Error chatting:", error);
      throw error;
    }
  }

  /**
   * Stream chat responses from a model
   */
  async *chatStream(
    request: OllamaChatRequest
  ): AsyncGenerator<OllamaGenerateResponse, void, unknown> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...request,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to chat stream: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let buffer = "";

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
              yield {
                model: data.model || request.model,
                created_at: data.created_at || new Date().toISOString(),
                response: data.message?.content || "",
                done: data.done !== undefined ? data.done : false,
                context: data.context,
              };
            } catch (e) {
              console.error("Error parsing streaming response:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error chatting stream:", error);
      throw error;
    }
  }

  /**
   * Check if Ollama server is accessible
   */
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update the base URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, "");
  }

  /**
   * Get the current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Singleton instance
export const ollamaClient = new OllamaClient();


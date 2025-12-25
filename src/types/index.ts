// Database types
export interface Chat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface Attachment {
  id: string;
  type: "image" | "file";
  name: string;
  data: string; // base64 encoded data for images, file content/URL for files
  mimeType?: string;
  size?: number; // in bytes
}

export interface Message {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  model: string | null; // model name if assistant message
  attachments?: Attachment[]; // for user messages with images/files
  createdAt: number;
  orderIndex: number; // message order in conversation
  evaluation?: ResponseEvaluation; // Evaluation results for assistant messages
  highlightAnalysis?: HighlightAnalysis; // Highlight analysis for assistant messages
}

export interface UserSettings {
  id: string;
  theme: "light" | "dark" | "system";
  defaultModels: string[];
  preferences: Record<string, unknown>;
}

// Ollama types
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

export interface OllamaListResponse {
  models: OllamaModel[];
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  images?: string[]; // base64 encoded images
  context?: number[]; // context array for /api/generate
  options?: Record<string, unknown>;
}

export interface OllamaChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[]; // base64 encoded images
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  options?: Record<string, unknown>;
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

// App types
export interface ModelResponse {
  model: string;
  content: string;
  error?: string;
  done: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  model?: string;
  timestamp: number;
}

// Evaluation types
export type ReadabilityLevel = "easy" | "medium" | "difficult" | "technical";

export interface ParameterScores {
  accuracy: number; // 1-4
  depth: number; // 1-4
  clarity: number; // 1-4
  structure: number; // 1-4
  relevance: number; // 1-4
}

export interface ResponseEvaluation {
  readability: ReadabilityLevel;
  parameterScores: ParameterScores;
  finalScore: number; // 1-4 (average of parameters)
}

export interface HighlightAnalysis {
  similarSentences: string[]; // Sentences that match semantically across responses
  differentSentences: string[]; // Sentences unique to this response
}

export interface EvaluationRequest {
  userQuestion: string;
  currentResponse: string;
  currentModel: string;
  otherResponses: Array<{
    model: string;
    content: string;
  }>;
}

export interface HighlightRequest {
  responses: Array<{
    model: string;
    content: string;
  }>;
  targetModel: string; // Model to analyze highlights for
}

// Batch evaluation types
export interface BatchEvaluationRequest {
  userQuestion: string;
  responses: Array<{
    model: string;
    content: string;
  }>;
}

export interface BatchEvaluationResponse {
  evaluations: Record<string, ResponseEvaluation>;
}

export interface BatchHighlightRequest {
  responses: Array<{
    model: string;
    content: string;
  }>;
}

export interface BatchHighlightResponse {
  highlights: Record<string, HighlightAnalysis>;
}


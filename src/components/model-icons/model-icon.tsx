"use client";

import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";
import Image from "next/image";

interface ModelIconProps {
  modelName: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

interface ModelTextLogoProps {
  modelName: string;
  className?: string;
  height?: number;
}

interface IconFiles {
  icon: string;      // Icon only (e.g., "gemma.svg")
  text?: string;     // Text logo (e.g., "gemma-text.svg")
}

// Map model names to local icon filenames
// Icons are in /public/icons/models/
function getIconFiles(modelName: string): IconFiles | null {
  const lower = modelName.toLowerCase();

  // Llama models (Llama, CodeLlama) - use Ollama icon
  if (lower.includes("llama") || lower.includes("codellama")) {
    return { icon: "ollama.svg", text: "ollama-text.svg" };
  }
  
  // Google models (Gemma, Gemini)
  if (lower.includes("gemma") || lower.includes("gemini")) {
    return { icon: "gemma.svg", text: "gemma-text.svg" };
  }
  
  // Mistral models
  if (lower.includes("mistral") || lower.includes("mixtral")) {
    return { icon: "mistral.svg", text: "mistral-text.svg" };
  }
  
  // Alibaba Qwen
  if (lower.includes("qwen")) {
    return { icon: "qwen.svg", text: "qwen-text.svg" };
  }
  
  // DeepSeek
  if (lower.includes("deepseek")) {
    return { icon: "deepseek.svg", text: "deepseek-text.svg" };
  }
  
  // Anthropic Claude
  if (lower.includes("claude") || lower.includes("anthropic")) {
    return { icon: "anthropic.svg", text: "anthropic-text.svg" };
  }
  
  // OpenAI
  if (lower.includes("gpt") || lower.includes("openai")) {
    return { icon: "openai.svg", text: "openai-text.svg" };
  }
  
  // Ollama (for generic ollama models)
  if (lower.includes("ollama")) {
    return { icon: "ollama.svg", text: "ollama-text.svg" };
  }

  return null;
}

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
};

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

// Icon component (square icon only)
export function ModelIcon({ modelName, className, size = "md" }: ModelIconProps) {
  const iconFiles = getIconFiles(modelName);
  const pixelSize = sizeMap[size];

  if (!iconFiles) {
    // Fallback to a generic bot icon
    return (
      <div
        className={cn(
          "shrink-0 rounded-full bg-muted flex items-center justify-center",
          sizeClasses[size],
          className
        )}
      >
        <Bot className="h-3/5 w-3/5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("shrink-0", sizeClasses[size], className)}>
      <Image
        src={`/icons/models/${iconFiles.icon}`}
        alt={modelName}
        width={pixelSize}
        height={pixelSize}
        className="h-full w-full object-contain dark:invert"
      />
    </div>
  );
}

// Text logo component (brand name)
export function ModelTextLogo({ modelName, className, height = 16 }: ModelTextLogoProps) {
  const iconFiles = getIconFiles(modelName);

  if (!iconFiles?.text) {
    // Fallback: just show the model name as text
    const displayName = modelName.split(/[\d:]/)[0]; // Extract base name
    return (
      <span className={cn("font-semibold text-sm", className)}>
        {displayName.charAt(0).toUpperCase() + displayName.slice(1)}
      </span>
    );
  }

  return (
    <div className={cn("shrink-0", className)} style={{ height }}>
      <Image
        src={`/icons/models/${iconFiles.text}`}
        alt={modelName}
        width={height * 5} // Text logos are typically wider
        height={height}
        className="h-full w-auto object-contain dark:invert"
      />
    </div>
  );
}

// Export helper
export { getIconFiles };

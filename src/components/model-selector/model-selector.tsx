"use client";

import { useModels } from "@/hooks/use-models";
import { useChatStore } from "@/store/chat-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Loader2 } from "lucide-react";
import { ModelIcon, ModelTextLogo, getIconFiles } from "@/components/model-icons/model-icon";

export function ModelSelector() {
  const { data: models, isLoading, error } = useModels();
  const { selectedModels, setSelectedModels } = useChatStore();

  const handleSelectModel = (modelName: string) => {
    if (!selectedModels.includes(modelName)) {
      setSelectedModels([...selectedModels, modelName]);
    }
  };

  const handleRemoveModel = (modelName: string) => {
    setSelectedModels(selectedModels.filter((m) => m !== modelName));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="ml-2 text-xs text-muted-foreground">
          Loading...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-2 text-xs text-destructive">
        Failed to load models.
      </div>
    );
  }

  if (!models || models.length === 0) {
    return (
      <div className="py-2 text-xs text-muted-foreground">
        No models found.
      </div>
    );
  }

  // Filter out already selected models from the dropdown
  const availableModels = models.filter(
    (model) => !selectedModels.includes(model.name)
  );

  return (
    <div className="space-y-2">
      <Select
        value=""
        onValueChange={handleSelectModel}
        disabled={availableModels.length === 0}
      >
        <SelectTrigger className="w-full h-8 text-xs">
          <SelectValue placeholder="Add a model..." />
        </SelectTrigger>
        <SelectContent>
          {availableModels.map((model) => (
            <SelectItem key={model.name} value={model.name}>
              <div className="flex flex-col items-start">
                <span className="font-medium">{model.name}</span>
                {model.details?.parameter_size && (
                  <span className="text-xs text-muted-foreground">
                    {model.details.parameter_size}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Selected Models Display - Simple List Format */}
      {selectedModels.length > 0 && (
        <div className="space-y-1">
          {selectedModels.map((modelName) => {
            const model = models.find((m) => m.name === modelName);
            const iconFiles = getIconFiles(modelName);
            
            return (
              <div
                key={modelName}
                className="group flex items-center gap-2 px-1 py-1 hover:bg-muted/50 rounded transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <ModelIcon modelName={modelName} size="sm" />
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  {iconFiles?.text ? (
                    <ModelTextLogo modelName={modelName} height={14} />
                  ) : (
                    <span className="text-xs font-medium truncate">{modelName}</span>
                  )}
                  {model?.details?.parameter_size && (
                    <span className="text-xs text-muted-foreground">
                      {model.details.parameter_size}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveModel(modelName)}
                  className="opacity-0 group-hover:opacity-100 rounded hover:bg-destructive/20 p-0.5 transition-all shrink-0"
                  aria-label={`Remove ${modelName}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

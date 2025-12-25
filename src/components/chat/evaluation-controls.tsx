"use client";

import { Button } from "@/components/ui/button";
import { BarChart3, Sparkles, Eye, EyeOff, Loader2 } from "lucide-react";

interface EvaluationControlsProps {
  onEvaluateAll: () => void;
  onAnalyzeHighlights: () => void;
  onToggleHighlights: () => void;
  isEvaluating: boolean;
  isAnalyzingHighlights: boolean;
  hasHighlights: boolean;
  showHighlights: boolean;
  disabled?: boolean;
}

export function EvaluationControls({
  onEvaluateAll,
  onAnalyzeHighlights,
  onToggleHighlights,
  isEvaluating,
  isAnalyzingHighlights,
  hasHighlights,
  showHighlights,
  disabled = false,
}: EvaluationControlsProps) {
  return (
    <div className="px-3 py-3 border-t border-b space-y-2">
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Evaluation
      </div>
      
      <div className="space-y-1.5">
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs justify-start"
          onClick={onEvaluateAll}
          disabled={disabled || isEvaluating || isAnalyzingHighlights}
          title={disabled ? "Waiting for responses to be saved..." : "Evaluate all model responses"}
        >
          {isEvaluating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              Evaluating...
            </>
          ) : (
            <>
              <BarChart3 className="h-3.5 w-3.5 mr-2" />
              Evaluate All
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs justify-start"
          onClick={onAnalyzeHighlights}
          disabled={disabled || isEvaluating || isAnalyzingHighlights}
          title={disabled ? "Waiting for responses to be saved..." : "Analyze highlights across all responses"}
        >
          {isAnalyzingHighlights ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              Highlight Analysis
            </>
          )}
        </Button>
        
        {hasHighlights && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 text-xs justify-start"
            onClick={onToggleHighlights}
            disabled={disabled}
          >
            {showHighlights ? (
              <>
                <EyeOff className="h-3.5 w-3.5 mr-2" />
                Hide Highlights
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 mr-2" />
                Show Highlights
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}


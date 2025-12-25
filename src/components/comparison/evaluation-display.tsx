"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResponseEvaluation } from "@/types";

interface EvaluationDisplayProps {
  evaluation: ResponseEvaluation | null;
  isLoading?: boolean;
  error?: string;
}

export function EvaluationDisplay({
  evaluation,
  isLoading,
  error,
}: EvaluationDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="px-4 py-2 border-t bg-muted/10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Evaluating response...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-2 border-t bg-muted/10">
        <div className="text-sm text-muted-foreground">
          <span className="text-destructive">Evaluation error: {error}</span>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return null;
  }

  const readabilityColors = {
    easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:bg-blue-200",
    difficult: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    technical: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  };

  const getScoreColor = (score: number) => {
    if (score >= 3.5) return "bg-green-500";
    if (score >= 2.5) return "bg-blue-500";
    if (score >= 1.5) return "bg-orange-500";
    return "bg-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 3.5) return "Excellent";
    if (score >= 2.5) return "Good";
    if (score >= 1.5) return "Fair";
    return "Poor";
  };

  return (
    <div className="px-4 py-3 border-t bg-muted/10 space-y-3">
      {/* Readability and Final Score */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Readability:</span>
          <Badge
            variant="outline"
            className={`text-xs ${readabilityColors[evaluation.readability]}`}
          >
            {evaluation.readability.charAt(0).toUpperCase() + evaluation.readability.slice(1)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Score:</span>
          <div className="flex items-center gap-1.5">
            <div className="text-sm font-semibold">{evaluation.finalScore.toFixed(1)}</div>
            <span className="text-xs text-muted-foreground">/ 4.0</span>
            <Badge variant="outline" className="text-xs">
              {getScoreLabel(evaluation.finalScore)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Parameter Scores */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Parameter Scores</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-xs"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show
              </>
            )}
          </Button>
        </div>
        {isExpanded && (
          <div className="space-y-2 pt-1">
            {Object.entries(evaluation.parameterScores).map(([key, score]) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize text-muted-foreground">{key}:</span>
                  <span className="font-medium">{score.toFixed(1)}/4</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreColor(score)} transition-all`}
                    style={{ width: `${(score / 4) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


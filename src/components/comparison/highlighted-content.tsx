"use client";

import { useMemo } from "react";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import type { HighlightAnalysis } from "@/types";

interface HighlightedContentProps {
  content: string;
  highlightAnalysis: HighlightAnalysis | null;
  showHighlights: boolean;
}

export function HighlightedContent({
  content,
  highlightAnalysis,
  showHighlights,
}: HighlightedContentProps) {
  const highlightedContent = useMemo(() => {
    if (!showHighlights || !highlightAnalysis) {
      return null;
    }

    // Split content into sentences (simple approach)
    const sentences = content.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);

    // Create a map of sentence indices to highlight types
    const sentenceHighlights = new Map<number, "similar" | "different" | null>();

    sentences.forEach((sentence, idx) => {
      const trimmedSentence = sentence.trim();
      
      // Check if this sentence is in similar sentences
      const isSimilar = highlightAnalysis.similarSentences.some(
        (similar) => {
          const similarity = calculateSimilarity(trimmedSentence, similar);
          return similarity > 0.7; // 70% similarity threshold
        }
      );

      // Check if this sentence is in different sentences
      const isDifferent = highlightAnalysis.differentSentences.some(
        (different) => {
          const similarity = calculateSimilarity(trimmedSentence, different);
          return similarity > 0.7;
        }
      );

      if (isSimilar && isDifferent) {
        // Prefer "different" if it appears in both
        sentenceHighlights.set(idx, "different");
      } else if (isSimilar) {
        sentenceHighlights.set(idx, "similar");
      } else if (isDifferent) {
        sentenceHighlights.set(idx, "different");
      }
    });

    return { sentences, sentenceHighlights };
  }, [content, highlightAnalysis, showHighlights]);

  // Simple similarity calculation (Levenshtein-based)
  function calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(
      longer.toLowerCase(),
      shorter.toLowerCase()
    );
    
    return (longer.length - distance) / longer.length;
  }

  function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  if (showHighlights && highlightAnalysis && highlightedContent) {
    // For highlighting, we'll render plain text with highlights
    // This is simpler than trying to preserve markdown formatting
    const parts: JSX.Element[] = [];
    
    highlightedContent.sentences.forEach((sentence, idx) => {
      const highlightType = highlightedContent.sentenceHighlights.get(idx);
      const key = `sentence-${idx}`;
      
      if (highlightType === "similar") {
        parts.push(
          <span key={key} className="bg-muted/30 px-1 py-0.5 rounded inline-block mb-1">
            {sentence}
          </span>
        );
      } else if (highlightType === "different") {
        parts.push(
          <span key={key} className="bg-muted/50 px-1 py-0.5 rounded inline-block mb-1">
            {sentence}
          </span>
        );
      } else {
        parts.push(
          <span key={key} className="inline-block mb-1">
            {sentence}{" "}
          </span>
        );
      }
    });

    return (
      <div className="highlighted-content">
        <div className="space-y-2 mb-3 text-xs text-muted-foreground border-b pb-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-muted/30 rounded" />
              <span>Similar to other responses</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-muted/50 rounded" />
              <span>Unique to this response</span>
            </div>
          </div>
        </div>
        <div className="text-sm leading-relaxed">
          {parts}
        </div>
      </div>
    );
  }

  return <MarkdownRenderer content={content} />;
}


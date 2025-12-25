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
  // Escape special regex characters
  const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Calculate similarity between two strings
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(
      longer.toLowerCase(),
      shorter.toLowerCase()
    );
    
    return (longer.length - distance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
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
  };

  // Apply highlights to content while preserving markdown
  const processedContent = useMemo(() => {
    if (!showHighlights || !highlightAnalysis) {
      return content;
    }

    let result = content;
    const replacements: Array<{ original: string; replacement: string; type: 'similar' | 'different' }> = [];

    // Find all phrases that need highlighting
    const allPhrases = [
      ...highlightAnalysis.similarSentences.map(s => ({ phrase: s, type: 'similar' as const })),
      ...highlightAnalysis.differentSentences.map(s => ({ phrase: s, type: 'different' as const })),
    ];

    // For each phrase, find matches in the content using fuzzy matching
    allPhrases.forEach(({ phrase, type }) => {
      const trimmedPhrase = phrase.trim();
      
      // Try exact match first (case-insensitive)
      const exactRegex = new RegExp(`(${escapeRegex(trimmedPhrase)})`, 'gi');
      const exactMatches = [...result.matchAll(exactRegex)];
      
      if (exactMatches.length > 0) {
        exactMatches.forEach(match => {
          if (match[0]) {
            replacements.push({
              original: match[0],
              replacement: match[0],
              type,
            });
          }
        });
      } else {
        // Try fuzzy matching - look for phrases with high similarity
        // Split content into potential matches (by sentences/phrases)
        const contentParts = result.split(/([.!?,;\n])/);
        
        contentParts.forEach(part => {
          const trimmedPart = part.trim();
          if (trimmedPart.length > 5) { // Only check meaningful parts
            const similarity = calculateSimilarity(trimmedPart, trimmedPhrase);
            if (similarity > 0.75) { // 75% similarity threshold
              replacements.push({
                original: part,
                replacement: part,
                type,
              });
            }
          }
        });
      }
    });

    // Apply replacements (deduplicate and prioritize 'different' over 'similar')
    const uniqueReplacements = new Map<string, 'similar' | 'different'>();
    replacements.forEach(({ original, type }) => {
      const existing = uniqueReplacements.get(original);
      if (!existing || (type === 'different' && existing === 'similar')) {
        uniqueReplacements.set(original, type);
      }
    });

    // Sort by length (longest first) to avoid replacing parts of longer matches
    const sortedReplacements = Array.from(uniqueReplacements.entries())
      .sort((a, b) => b[0].length - a[0].length);

    // Apply highlights using HTML marks
    sortedReplacements.forEach(([text, type]) => {
      const className = type === 'similar' ? 'highlight-similar' : 'highlight-different';
      const escapedText = escapeRegex(text);
      const regex = new RegExp(`(${escapedText})`, 'g');
      result = result.replace(regex, `<mark class="${className}">$1</mark>`);
    });

    return result;
  }, [content, highlightAnalysis, showHighlights]);

  if (showHighlights && highlightAnalysis) {
    return (
      <div className="highlighted-content">
        <div className="space-y-2 mb-3 text-xs text-muted-foreground border-b pb-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-200/70 dark:bg-blue-900/50 rounded border border-blue-300 dark:border-blue-800" />
              <span>Similar to other responses</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-yellow-200/70 dark:bg-yellow-900/50 rounded border border-yellow-300 dark:border-yellow-800" />
              <span>Unique to this response</span>
            </div>
          </div>
        </div>
        <MarkdownRenderer content={processedContent} />
      </div>
    );
  }

  return <MarkdownRenderer content={content} />;
}


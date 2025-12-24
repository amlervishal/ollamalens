# Response Comparison & Grading System

## Overview

This document describes the text comparison and grading system implemented for model response analysis. The system provides **objective metrics**, **semantic analysis**, and **LLM-based grading** to help users evaluate and compare responses from different AI models.

---

## Features

### 1. **Complexity Metrics** (One-Line Display)

Displays two key metrics for each response:

- **Readability Score (0-100)**: Flesch Reading Ease score
  - 90-100: Very Easy
  - 80-89: Easy
  - 70-79: Fairly Easy
  - 60-69: Standard
  - 50-59: Fairly Hard
  - 30-49: Hard
  - 0-29: Very Hard

- **Lexical Diversity (0-1)**: Type-Token Ratio (unique words / total words)
  - Higher values indicate more varied vocabulary
  - Typical range: 0.4-0.8

**Example Display:**
```
📊 Readability: 72/100 (Fairly Easy) • Diversity: 0.68 • 245 words
```

---

### 2. **Response Evaluation & Highlight Analysis**

Uses `llama3.2:3b` to evaluate responses and analyze similarities/differences.

**How it works:**
1. **Automatic evaluation**: Triggers when all model responses complete
2. **Readability assessment**: Classifies as easy/medium/difficult/technical
3. **Parameter scoring**: Scores accuracy, padding, completeness, clarity, relevance (1-4 scale)
4. **Difference analysis**: Identifies topics covered in other responses but missing here
5. **Highlight analysis** (on-demand): Uses LLM to identify similar vs different sentences

**Note**: All analysis uses llama3.2:3b - no embeddings or vector models required.

---

### 3. **LLM-Based Evaluation** (Current System)

Uses `llama3.2:3b` to evaluate responses with structured scoring and analysis.

#### Grading Categories

| Category | Max Penalty | Description |
|----------|-------------|-------------|
| **Instruction Adherence** | -3.0 | Does it answer what was asked? |
| **Accuracy** | -3.0 | Is information correct and specific? |
| **Efficiency** | -2.0 | Optimal length (not too wordy, not too brief)? |
| **Bias** | -1.0 | Neutral/objective vs. subjective opinions? |
| **Padding** | -1.0 | Unnecessary repetition or filler content? |

**Scoring:**
- Base score: 10.0
- Final score = 10.0 - (sum of all penalties)
- Result: 0.0 to 10.0

#### Score Labels

| Score Range | Label |
|-------------|-------|
| 9.0 - 10.0 | Excellent |
| 7.5 - 8.9 | Good |
| 6.0 - 7.4 | Fair |
| 4.0 - 5.9 | Below Average |
| 0.0 - 3.9 | Poor |

---

## Visual Design (Black & White Theme)

All components follow the app's grayscale theme:

- **Progress bars**: Black bars on grey background
- **Text**: Foreground/muted-foreground colors
- **Backgrounds**: Muted/10, muted/20, muted/30, muted/50, muted/70
- **No color coding**: Everything uses shades of grey

---

## Architecture

### File Structure

```
src/
├── lib/utils/
│   └── response-evaluation.ts   # LLM-based evaluation using llama3.2:3b
├── components/comparison/
│   ├── evaluation-display.tsx   # Evaluation results display
│   ├── highlighted-content.tsx # Sentence-level highlighting (on-demand)
│   └── comparison-view.tsx      # Main comparison view
└── hooks/
    └── use-response-evaluation.ts # Hook for managing evaluation
```

---

## Usage

### Basic Implementation

The system is automatically integrated into the comparison view. No manual configuration required.

```tsx
// Automatically evaluates responses in TurnView
const {
  evaluations,
  highlightAnalyses,
  // ...
} = useResponseEvaluation(turn.userMessage.content, responsesMap, {
  autoEvaluate: true,
  evalModel: "llama3.2:3b",  // Evaluation model
});
```

### Configuration Options

```tsx
interface UseResponseEvaluationOptions {
  autoEvaluate?: boolean;  // Auto-trigger when responses complete (default: true)
  evalModel?: string;      // Model for evaluation (default: llama3.2:3b)
}
```

---

## Performance Considerations

### Performance
- **Automatic evaluation**: Triggers when all responses complete
- **Parallel processing**: All responses evaluated simultaneously
- **Caching**: Results cached to prevent re-evaluation
- **Evaluation time**: ~10-20 seconds per model (depends on llama3.2:3b speed)

### Optimization Tips
1. **Evaluation runs automatically** - no manual trigger needed
2. **Results are cached** - won't re-evaluate same responses
3. **Parallel evaluation** - all models evaluated at once
4. **Use smaller model** if needed (e.g., `llama3.2:1b` instead of `3b`)

---

## Dependencies

```json
{
  "natural": "^6.x",          // Text analysis (readability, NLP)
  "string-similarity": "^4.x" // Simple text similarity (fallback)
}
```

### Ollama Models Required

- **For evaluation**: `llama3.2:3b` (or any chat model)

Install with:
```bash
ollama pull llama3.2:3b
```

**Note**: No embedding models are required. All analysis uses llama3.2:3b.

---

## API Reference

### Text Analysis

```typescript
import { calculateComplexityMetrics } from "@/lib/utils/text-analysis";

const metrics = calculateComplexityMetrics(text);
// Returns: { readability, lexicalDiversity, wordCount, ... }
```

### Response Evaluation

```typescript
import { evaluateResponse } from "@/lib/utils/response-evaluation";

const evaluation = await evaluateResponse({
  userQuestion: "What is React?",
  currentResponse: "React is a JavaScript library...",
  currentModel: "llama3.1:8b",
  otherResponses: [/* other model responses */]
}, "llama3.2:3b");

// Returns: {
//   readability: "medium",
//   parameterScores: { accuracy: 3, padding: 4, ... },
//   finalScore: 3.2,
//   differenceAnalysis: { missingTopics: [...], summary: "..." }
// }
```

### Highlight Analysis

```typescript
import { analyzeHighlights } from "@/lib/utils/response-evaluation";

const analysis = await analyzeHighlights({
  responses: [/* all responses */],
  targetModel: "llama3.1:8b"
}, "llama3.2:3b");

// Returns: {
//   similarSentences: ["sentence1", ...],
//   differentSentences: ["sentence2", ...]
// }
```

---

## Future Enhancements

### Potential Additions
- [ ] User preference tracking (which models perform best for user)
- [ ] Consensus extraction (find common ground between all models)
- [ ] Fact extraction table (compare specific claims)
- [ ] Export comparison reports (PDF/JSON)
- [ ] Custom grading criteria (user-defined penalties)
- [ ] Response time tracking (speed comparison)

### Performance Optimizations
- [ ] WebWorker for evaluation (offload from main thread)
- [ ] Streaming evaluation (show partial results as they complete)
- [ ] Evaluation result caching in IndexedDB
- [ ] Batch evaluation optimization

---

## Troubleshooting

### Evaluation Not Working
- Ensure `llama3.2:3b` is installed (`ollama list`)
- Check Ollama is running (`ollama ps`)
- Verify API connection in browser console
- Check browser console for evaluation logs

### Slow Performance
- Use smaller evaluation model (`llama3.2:1b` instead of `3b`)
- Reduce number of models being compared
- Evaluation runs automatically - no manual trigger needed

### Incorrect Readability Scores
- Readability scores work best for English text
- Technical content naturally scores lower
- Code blocks may skew results

---

## Credits

- **Evaluation Model**: `llama3.2:3b` via Ollama
- **System**: Simplified LLM-based evaluation (no embeddings required)


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

### 2. **Semantic Similarity & Highlighting** (Optional)

Uses Ollama's embedding model (`nomic-embed-text`) to compare responses based on **meaning, not words**.

**How it works:**
1. Split each response into semantic chunks (3 sentences each)
2. Generate embeddings for each chunk
3. Compare chunks across all responses using cosine similarity
4. Highlight text with 2 grey shades:
   - **Light grey (#f5f5f5)**: Common concepts shared with other models
   - **Dark grey (#e5e5e5)**: Unique concepts only this model mentioned

**Note**: Currently disabled by default due to performance considerations. Can be enabled in `comparison-view.tsx`.

---

### 3. **LLM-Based Grading** (Penalty System)

Uses a local Llama 3B model to grade responses on a **10-point scale** with penalty-based scoring.

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
│   ├── text-analysis.ts         # Readability & lexical diversity
│   ├── semantic-similarity.ts   # Embeddings & cosine similarity
│   └── llm-grading.ts          # LLM-based grading system
├── components/comparison/
│   ├── complexity-metrics.tsx   # Metrics display component
│   ├── grading-display.tsx     # Grading display component
│   ├── highlighted-content.tsx # Semantic highlighting (optional)
│   └── comparison-view.tsx     # Main comparison view (updated)
└── hooks/
    └── use-response-analysis.ts # Hook for managing analysis
```

---

## Usage

### Basic Implementation

The system is automatically integrated into the comparison view. No manual configuration required.

```tsx
// Automatically analyzes responses in TurnView
const analyses = useMultiResponseAnalysis(
  responses,
  userQuestion,
  {
    enableSemanticAnalysis: false, // Disabled by default
    enableGrading: true,           // Enabled by default
    gradingModel: "llama3.2:3b",
  }
);
```

### Configuration Options

```tsx
interface UseResponseAnalysisOptions {
  enableSemanticAnalysis?: boolean;  // Enable/disable highlighting
  enableGrading?: boolean;           // Enable/disable LLM grading
  gradingModel?: string;             // Model for grading (default: llama3.2:3b)
  embeddingModel?: string;           // Model for embeddings (default: nomic-embed-text)
}
```

---

## Performance Considerations

### Fast Operations (< 100ms)
- ✅ Complexity metrics (readability, lexical diversity)
- ✅ Word/sentence counting

### Moderate Operations (1-3s)
- ⚠️ Semantic similarity analysis (requires embeddings API calls)
- ⚠️ LLM grading (requires LLM inference)

### Optimization Tips
1. **Disable semantic analysis** if not needed (currently default)
2. **Use smaller grading model** (e.g., `llama3.2:1b` instead of `3b`)
3. **Batch analysis** runs in parallel for multiple responses
4. **Analysis caching** prevents re-analysis on re-render

---

## Dependencies

```json
{
  "natural": "^6.x",          // Text analysis (readability, NLP)
  "string-similarity": "^4.x" // Simple text similarity (fallback)
}
```

### Ollama Models Required

- **For grading**: `llama3.2:3b` (or any chat model)
- **For semantic analysis**: `nomic-embed-text` (embedding model)

Install with:
```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

---

## API Reference

### Text Analysis

```typescript
import { calculateComplexityMetrics } from "@/lib/utils/text-analysis";

const metrics = calculateComplexityMetrics(text);
// Returns: { readability, lexicalDiversity, wordCount, ... }
```

### Semantic Similarity

```typescript
import { compareTextSemantics } from "@/lib/utils/semantic-similarity";

const similarity = await compareTextSemantics(text1, text2);
// Returns: 0-1 (cosine similarity normalized)
```

### LLM Grading

```typescript
import { gradeResponse } from "@/lib/utils/llm-grading";

const grading = await gradeResponse(question, response, "llama3.2:3b");
// Returns: { finalScore, penalties, label }
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
- [ ] WebWorker for text analysis (offload from main thread)
- [ ] Local embedding model using ONNX Runtime
- [ ] Caching of embeddings in IndexedDB
- [ ] Streaming grading (show partial results)

---

## Troubleshooting

### Grading Not Working
- Ensure `llama3.2:3b` is installed (`ollama list`)
- Check Ollama is running (`ollama ps`)
- Verify API connection in browser console

### Slow Performance
- Disable semantic analysis (currently disabled by default)
- Use smaller grading model (`llama3.2:1b`)
- Reduce number of models being compared

### Incorrect Readability Scores
- Readability scores work best for English text
- Technical content naturally scores lower
- Code blocks may skew results

---

## Credits

- **Flesch Reading Ease**: Rudolf Flesch (1948)
- **Lexical Diversity**: Type-Token Ratio method
- **Embeddings**: `nomic-embed-text` via Ollama
- **Grading Model**: `llama3.2:3b` via Ollama


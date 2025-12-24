import type {
  EvaluationRequest,
  HighlightRequest,
  ResponseEvaluation,
  HighlightAnalysis,
} from "@/types";

const DEFAULT_EVAL_MODEL = "llama3.2:3b";

/**
 * Builds the evaluation prompt for the LLM
 */
function buildEvaluationPrompt(request: EvaluationRequest): string {
  const otherResponsesText = request.otherResponses
    .map((r, idx) => `Response ${idx + 1} (${r.model}):\n${r.content}`)
    .join("\n\n");

  return `You are an expert evaluator of AI model responses. Evaluate the following response and provide a structured assessment.

USER QUESTION:
${request.userQuestion}

RESPONSE TO EVALUATE (${request.currentModel}):
${request.currentResponse}

OTHER RESPONSES FOR COMPARISON:
${otherResponsesText || "No other responses available."}

Please provide your evaluation in the following JSON format:
{
  "readability": "easy" | "medium" | "difficult" | "technical",
  "parameterScores": {
    "accuracy": 1-4,
    "padding": 1-4,
    "completeness": 1-4,
    "clarity": 1-4,
    "relevance": 1-4
  },
  "finalScore": 1-4,
  "differenceAnalysis": {
    "missingTopics": ["topic1", "topic2", ...],
    "summary": "Brief summary of what topics/points are covered in other responses but missing from this response"
  }
}

EVALUATION CRITERIA:
- Readability: Assess based on vocabulary complexity and sentence structure
  * "easy": Simple language, short sentences, common words
  * "medium": Moderate complexity, some technical terms explained
  * "difficult": Complex language, technical terms, longer sentences
  * "technical": Highly specialized terminology, assumes domain knowledge

- Parameter Scores (1-4 scale):
  * accuracy: How correct and factually accurate is the information? (1=poor, 4=excellent)
  * padding: How much unnecessary repetition or filler content? (1=excessive padding, 4=no padding)
  * completeness: How well does it answer the question? (1=incomplete, 4=comprehensive)
  * clarity: How clear and understandable is the response? (1=confusing, 4=very clear)
  * relevance: How well does it stay on topic? (1=off-topic, 4=highly relevant)

- Final Score: Average of all parameter scores (round to 1 decimal place)

- Difference Analysis: Compare this response to others and identify:
  * Topics/points mentioned in other responses but missing here
  * Provide a brief summary of what's not covered

Respond ONLY with valid JSON, no additional text.`;
}

/**
 * Builds the highlight analysis prompt for the LLM
 */
function buildHighlightPrompt(request: HighlightRequest): string {
  const targetResponse = request.responses.find(
    (r) => r.model === request.targetModel
  );
  const otherResponses = request.responses.filter(
    (r) => r.model !== request.targetModel
  );

  if (!targetResponse) {
    throw new Error(`Target model ${request.targetModel} not found in responses`);
  }

  const otherResponsesText = otherResponses
    .map((r, idx) => `Response ${idx + 1} (${r.model}):\n${r.content}`)
    .join("\n\n");

  return `Analyze the following response and identify sentences that are similar to other responses (semantic similarity) and sentences that are unique/different.

TARGET RESPONSE (${request.targetModel}):
${targetResponse.content}

OTHER RESPONSES:
${otherResponsesText || "No other responses available."}

Please provide your analysis in the following JSON format:
{
  "similarSentences": ["sentence1", "sentence2", ...],
  "differentSentences": ["sentence1", "sentence2", ...]
}

INSTRUCTIONS:
- Extract complete sentences from the target response
- "similarSentences": Sentences that convey similar meaning/concepts as sentences in other responses (semantic similarity, not exact word match)
- "differentSentences": Sentences that contain unique information, concepts, or perspectives not found in other responses
- Each sentence should be a complete, standalone sentence from the target response
- If a sentence appears in both categories, prefer "differentSentences"

Respond ONLY with valid JSON, no additional text.`;
}

/**
 * Parses JSON from LLM response, handling potential markdown code blocks
 */
function parseJsonResponse(text: string): any {
  // Remove markdown code blocks if present
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    // Try to extract JSON from the text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        throw new Error(`Failed to parse JSON: ${e}`);
      }
    }
    throw new Error(`No valid JSON found in response: ${error}`);
  }
}

/**
 * Validates and normalizes evaluation response
 */
function validateEvaluation(data: any): ResponseEvaluation {
  const readability = data.readability;
  if (!["easy", "medium", "difficult", "technical"].includes(readability)) {
    throw new Error(`Invalid readability level: ${readability}`);
  }

  const scores = data.parameterScores;
  const validateScore = (value: any, name: string) => {
    const num = typeof value === "number" ? value : parseFloat(value);
    if (isNaN(num) || num < 1 || num > 4) {
      throw new Error(`Invalid ${name} score: ${value}`);
    }
    return Math.max(1, Math.min(4, Math.round(num * 10) / 10)); // Round to 1 decimal, clamp to 1-4
  };

  const parameterScores = {
    accuracy: validateScore(scores?.accuracy, "accuracy"),
    padding: validateScore(scores?.padding, "padding"),
    completeness: validateScore(scores?.completeness, "completeness"),
    clarity: validateScore(scores?.clarity, "clarity"),
    relevance: validateScore(scores?.relevance, "relevance"),
  };

  const finalScore =
    typeof data.finalScore === "number"
      ? Math.max(1, Math.min(4, Math.round(data.finalScore * 10) / 10))
      : Math.round(
          (Object.values(parameterScores).reduce((a, b) => a + b, 0) / 5) *
            10
        ) / 10;

  return {
    readability: readability as "easy" | "medium" | "difficult" | "technical",
    parameterScores,
    finalScore: Math.max(1, Math.min(4, finalScore)),
    differenceAnalysis: {
      missingTopics: Array.isArray(data.differenceAnalysis?.missingTopics)
        ? data.differenceAnalysis.missingTopics
        : [],
      summary:
        data.differenceAnalysis?.summary ||
        "No significant differences identified.",
    },
  };
}

/**
 * Validates highlight analysis response
 */
function validateHighlightAnalysis(data: any): HighlightAnalysis {
  return {
    similarSentences: Array.isArray(data.similarSentences)
      ? data.similarSentences.filter((s: any) => typeof s === "string")
      : [],
    differentSentences: Array.isArray(data.differentSentences)
      ? data.differentSentences.filter((s: any) => typeof s === "string")
      : [],
  };
}

/**
 * Evaluates a response using the LLM
 */
export async function evaluateResponse(
  request: EvaluationRequest,
  evalModel: string = DEFAULT_EVAL_MODEL
): Promise<ResponseEvaluation> {
  const prompt = buildEvaluationPrompt(request);

  try {
    const response = await fetch("/api/evaluation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: evalModel,
        prompt,
        type: "evaluation",
      }),
    });

    if (!response.ok) {
      throw new Error(`Evaluation failed: ${response.statusText}`);
    }

    const data = await response.json();
    const parsed = parseJsonResponse(data.response || data.content || "");
    return validateEvaluation(parsed);
  } catch (error) {
    console.error("Error evaluating response:", error);
    throw error;
  }
}

/**
 * Analyzes highlights (similarities and differences) for a response
 */
export async function analyzeHighlights(
  request: HighlightRequest,
  evalModel: string = DEFAULT_EVAL_MODEL
): Promise<HighlightAnalysis> {
  const prompt = buildHighlightPrompt(request);

  try {
    const response = await fetch("/api/evaluation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: evalModel,
        prompt,
        type: "highlight",
      }),
    });

    if (!response.ok) {
      throw new Error(`Highlight analysis failed: ${response.statusText}`);
    }

    const data = await response.json();
    const parsed = parseJsonResponse(data.response || data.content || "");
    return validateHighlightAnalysis(parsed);
  } catch (error) {
    console.error("Error analyzing highlights:", error);
    throw error;
  }
}


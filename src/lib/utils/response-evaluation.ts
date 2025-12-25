import type {
  EvaluationRequest,
  HighlightRequest,
  ResponseEvaluation,
  HighlightAnalysis,
  BatchEvaluationRequest,
  BatchEvaluationResponse,
  BatchHighlightRequest,
  BatchHighlightResponse,
} from "@/types";

const DEFAULT_EVAL_MODEL = "llama3.2:3b";

/**
 * Builds the evaluation prompt for the LLM
 */
function buildEvaluationPrompt(request: EvaluationRequest): string {
  const otherResponsesText = request.otherResponses
    .map((r, idx) => `Response ${idx + 1} (${r.model}):\n${r.content}`)
    .join("\n\n");

  return `You are an expert evaluator of AI model responses for both creative and technical writing. Evaluate the following response and provide a structured assessment.

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
    "depth": 1-4,
    "clarity": 1-4,
    "structure": 1-4,
    "relevance": 1-4
  },
  "finalScore": 1-4
}

EVALUATION CRITERIA:

- Readability: Assess based on vocabulary complexity and sentence structure
  * "easy": Simple language, short sentences, accessible to all readers
  * "medium": Moderate complexity, balanced vocabulary
  * "difficult": Complex language, sophisticated vocabulary
  * "technical": Specialized terminology, assumes domain knowledge

- Parameter Scores (1-4 scale):
  * accuracy: How correct and reliable is the information?
    - Technical: Factual correctness, no misinformation
    - Creative: Internal consistency, logical coherence
    - 1=poor/incorrect, 2=some errors, 3=mostly correct, 4=excellent/precise
    
  * depth: How comprehensive and detailed is the response?
    - Technical: Thorough coverage, detailed explanations
    - Creative: Rich detail, well-developed ideas and descriptions
    - 1=superficial, 2=basic, 3=good detail, 4=comprehensive
    
  * clarity: How clear and understandable is the response?
    - Technical: Easy to follow, concepts well-explained
    - Creative: Vivid expression, clear communication of ideas
    - 1=very confusing, 2=somewhat unclear, 3=clear, 4=exceptionally clear
    
  * structure: How well-organized and coherent is the response?
    - Technical: Logical flow, good organization, no redundancy
    - Creative: Strong narrative/argumentative structure, smooth transitions
    - 1=disorganized/rambling, 2=somewhat structured, 3=well-organized, 4=excellent structure
    
  * relevance: How well does it address the question/prompt?
    - Both: Stays focused, directly addresses what was asked
    - 1=off-topic, 2=partially relevant, 3=relevant, 4=highly focused and relevant

- Final Score: Average of all parameter scores (round to 1 decimal place)

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

  return `Analyze the target response and compare it with other responses to identify COMMON IDEAS and UNIQUE IDEAS.

TARGET RESPONSE (${request.targetModel}):
${targetResponse.content}

OTHER RESPONSES:
${otherResponsesText || "No other responses available."}

Please provide your analysis in the following JSON format:
{
  "similarSentences": ["sentence1", "sentence2", ...],
  "differentSentences": ["sentence1", "sentence2", ...]
}

CRITICAL INSTRUCTIONS FOR IDEA-BASED MATCHING:
1. Focus on IDEAS and CONCEPTS, not exact word matches
2. "similarSentences": Include sentences/phrases/items from the target response that express the SAME IDEAS, CONCEPTS, or INFORMATION found in other responses
   - Example: "Gateway of India" in target matches "Gateway of India" in other response → SIMILAR
   - Example: "Marine Drive" in target matches "Marine Drive" in other response → SIMILAR
   - Example: Item mentioned in both responses with same/similar name → SIMILAR
   - Look for semantic equivalence: same places, same concepts, same facts, even if wording differs slightly
   
3. "differentSentences": Include sentences/phrases/items from the target response that express UNIQUE IDEAS or INFORMATION not found in any other response
   - Only mark as different if the concept/idea/place is truly unique to this response
   - Example: "Elephanta Caves" only in target, not in others → DIFFERENT
   
4. Extract meaningful units (can be full sentences, phrases, or individual items from lists)
5. When responses contain lists, compare each item individually
6. If an item/concept appears in ANY other response, it should be in "similarSentences"
7. Only put items in "differentSentences" if they appear NOWHERE in other responses

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
    depth: validateScore(scores?.depth, "depth"),
    clarity: validateScore(scores?.clarity, "clarity"),
    structure: validateScore(scores?.structure, "structure"),
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

/**
 * Builds a batch evaluation prompt that evaluates all models at once
 */
function buildBatchEvaluationPrompt(request: BatchEvaluationRequest): string {
  const responsesText = request.responses
    .map((r, idx) => `Response ${idx + 1} (${r.model}):\n${r.content}`)
    .join("\n\n");

  return `You are an expert evaluator of AI model responses for both creative and technical writing. Evaluate ALL of the following responses and provide structured assessments for EACH model.

USER QUESTION:
${request.userQuestion}

RESPONSES TO EVALUATE:
${responsesText}

Please provide your evaluation in the following JSON format with evaluations for ALL models:
{
  "evaluations": {
    "${request.responses[0]?.model || 'model1'}": {
      "readability": "easy" | "medium" | "difficult" | "technical",
      "parameterScores": {
        "accuracy": 1-4,
        "depth": 1-4,
        "clarity": 1-4,
        "structure": 1-4,
        "relevance": 1-4
      },
      "finalScore": 1-4
    },
    "${request.responses[1]?.model || 'model2'}": { ... },
    ... (include ALL models)
  }
}

EVALUATION CRITERIA:

- Readability: Assess based on vocabulary complexity and sentence structure
  * "easy": Simple language, short sentences, accessible to all readers
  * "medium": Moderate complexity, balanced vocabulary
  * "difficult": Complex language, sophisticated vocabulary
  * "technical": Specialized terminology, assumes domain knowledge

- Parameter Scores (1-4 scale):
  * accuracy: How correct and reliable is the information?
    - Technical: Factual correctness, no misinformation
    - Creative: Internal consistency, logical coherence
    - 1=poor/incorrect, 2=some errors, 3=mostly correct, 4=excellent/precise
    
  * depth: How comprehensive and detailed is the response?
    - Technical: Thorough coverage, detailed explanations
    - Creative: Rich detail, well-developed ideas and descriptions
    - 1=superficial, 2=basic, 3=good detail, 4=comprehensive
    
  * clarity: How clear and understandable is the response?
    - Technical: Easy to follow, concepts well-explained
    - Creative: Vivid expression, clear communication of ideas
    - 1=very confusing, 2=somewhat unclear, 3=clear, 4=exceptionally clear
    
  * structure: How well-organized and coherent is the response?
    - Technical: Logical flow, good organization, no redundancy
    - Creative: Strong narrative/argumentative structure, smooth transitions
    - 1=disorganized/rambling, 2=somewhat structured, 3=well-organized, 4=excellent structure
    
  * relevance: How well does it address the question/prompt?
    - Both: Stays focused, directly addresses what was asked
    - 1=off-topic, 2=partially relevant, 3=relevant, 4=highly focused and relevant

- Final Score: Average of all parameter scores (round to 1 decimal place)

Respond ONLY with valid JSON, no additional text.`;
}

/**
 * Builds a batch highlight analysis prompt that analyzes all models at once
 */
function buildBatchHighlightPrompt(request: BatchHighlightRequest): string {
  const responsesText = request.responses
    .map((r, idx) => `Response ${idx + 1} (${r.model}):\n${r.content}`)
    .join("\n\n");

  return `Analyze ALL responses and identify COMMON IDEAS (appearing across multiple responses) and UNIQUE IDEAS (specific to each response).

RESPONSES:
${responsesText}

Please provide your analysis in the following JSON format with highlights for ALL models:
{
  "highlights": {
    "${request.responses[0]?.model || 'model1'}": {
      "similarSentences": ["sentence1", "sentence2", ...],
      "differentSentences": ["sentence1", "sentence2", ...]
    },
    "${request.responses[1]?.model || 'model2'}": { ... },
    ... (include ALL models)
  }
}

CRITICAL INSTRUCTIONS FOR IDEA-BASED MATCHING:
1. Focus on IDEAS and CONCEPTS, not exact word matches
2. For EACH response:
   - "similarSentences": Include content that expresses the SAME IDEAS/CONCEPTS/INFORMATION found in OTHER responses
     * If a place name appears in multiple responses → SIMILAR in all of them
     * If a fact is mentioned in multiple responses → SIMILAR in all of them
     * Compare based on semantic meaning: same concepts = similar
     * Example: "Gateway of India" in Response 1 and Response 2 → mark as SIMILAR in both
     
   - "differentSentences": Include content that expresses UNIQUE IDEAS/INFORMATION not found in other responses
     * Only mark as different if the concept/idea/place appears ONLY in this response
     * Example: "Elephanta Caves" only in Response 1, not in Response 2 → DIFFERENT in Response 1
     
3. Extract meaningful units (can be full sentences, phrases, or individual items from lists)
4. When responses contain lists, compare each item individually across all responses
5. An item that appears in 2+ responses should be marked as "similarSentences" in ALL those responses
6. An item that appears in only 1 response should be marked as "differentSentences" in that response only

Respond ONLY with valid JSON, no additional text.`;
}

/**
 * Evaluates all responses in a single API call
 */
export async function evaluateAllResponses(
  request: BatchEvaluationRequest,
  evalModel: string = DEFAULT_EVAL_MODEL
): Promise<BatchEvaluationResponse> {
  const prompt = buildBatchEvaluationPrompt(request);

  try {
    const response = await fetch("/api/evaluation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: evalModel,
        prompt,
        type: "batch-evaluation",
      }),
    });

    if (!response.ok) {
      throw new Error(`Batch evaluation failed: ${response.statusText}`);
    }

    const data = await response.json();
    const parsed = parseJsonResponse(data.response || data.content || "");

    // Validate each evaluation in the batch
    const evaluations: Record<string, ResponseEvaluation> = {};
    for (const [model, evalData] of Object.entries(parsed.evaluations || {})) {
      evaluations[model] = validateEvaluation(evalData);
    }

    return { evaluations };
  } catch (error) {
    console.error("Error in batch evaluation:", error);
    throw error;
  }
}

/**
 * Analyzes highlights for all responses in a single API call
 */
export async function analyzeAllHighlights(
  request: BatchHighlightRequest,
  evalModel: string = DEFAULT_EVAL_MODEL
): Promise<BatchHighlightResponse> {
  const prompt = buildBatchHighlightPrompt(request);

  try {
    const response = await fetch("/api/evaluation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: evalModel,
        prompt,
        type: "batch-highlight",
      }),
    });

    if (!response.ok) {
      throw new Error(`Batch highlight analysis failed: ${response.statusText}`);
    }

    const data = await response.json();
    const parsed = parseJsonResponse(data.response || data.content || "");

    // Validate each highlight analysis in the batch
    const highlights: Record<string, HighlightAnalysis> = {};
    for (const [model, highlightData] of Object.entries(parsed.highlights || {})) {
      highlights[model] = validateHighlightAnalysis(highlightData);
    }

    return { highlights };
  } catch (error) {
    console.error("Error in batch highlight analysis:", error);
    throw error;
  }
}


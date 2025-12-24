import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { evaluateResponse, analyzeHighlights } from "@/lib/utils/response-evaluation";
import type {
  ResponseEvaluation,
  HighlightAnalysis,
  EvaluationRequest,
  HighlightRequest,
} from "@/types";

interface UseResponseEvaluationOptions {
  evalModel?: string;
  autoEvaluate?: boolean;
}

interface EvaluationState {
  evaluations: Map<string, ResponseEvaluation>;
  highlightAnalyses: Map<string, HighlightAnalysis>;
  loading: Set<string>;
  errors: Map<string, string>;
}

export function useResponseEvaluation(
  userQuestion: string,
  responses: Map<string, { content: string; done: boolean }>,
  options: UseResponseEvaluationOptions = {}
) {
  const { evalModel = "llama3.2:3b", autoEvaluate = true } = options;

  const [state, setState] = useState<EvaluationState>({
    evaluations: new Map(),
    highlightAnalyses: new Map(),
    loading: new Set(),
    errors: new Map(),
  });

  const evaluationCacheRef = useRef<Map<string, ResponseEvaluation>>(new Map());
  const highlightCacheRef = useRef<Map<string, HighlightAnalysis>>(new Map());
  const evaluatedModelsRef = useRef<Set<string>>(new Set());
  const lastQuestionRef = useRef<string>(userQuestion);

  // Reset evaluation state when question changes
  useEffect(() => {
    if (lastQuestionRef.current !== userQuestion) {
      console.log("[Evaluation] Question changed, resetting evaluation state");
      lastQuestionRef.current = userQuestion;
      evaluatedModelsRef.current.clear();
      setState({
        evaluations: new Map(),
        highlightAnalyses: new Map(),
        loading: new Set(),
        errors: new Map(),
      });
    }
  }, [userQuestion]);

  // Create a serializable dependency that React can properly track
  // React compares Map objects by reference, not content, so we serialize the contents
  // Compute key from Map contents - React will compare this string by value
  const responsesKey = (() => {
    const entries = Array.from(responses.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([model, response]) => `${model}:${response.done}:${response.content.length}`);
    return entries.join('|');
  })();


  // Evaluate a single response (for manual evaluation/re-evaluation)
  const evaluateSingleResponse = useCallback(
    async (model: string, content: string) => {
      console.log(`[Evaluation] Manual evaluation requested for ${model}`);
      
      // Check cache first
      const cacheKey = `${userQuestion}:${model}:${content.substring(0, 100)}`;
      if (evaluationCacheRef.current.has(cacheKey)) {
        console.log(`[Evaluation] Using cached evaluation for ${model}`);
        setState((prev) => {
          const newEvaluations = new Map(prev.evaluations);
          newEvaluations.set(model, evaluationCacheRef.current.get(cacheKey)!);
          return {
            ...prev,
            evaluations: newEvaluations,
          };
        });
        return;
      }

      // Build other responses list
      const otherResponses = Array.from(responses.entries())
        .filter(([m]) => m !== model)
        .map(([m, r]) => ({
          model: m,
          content: r.content,
        }));

      setState((prev) => {
        const newLoading = new Set(prev.loading);
        newLoading.add(model);
        return { ...prev, loading: newLoading };
      });

      try {
        const request: EvaluationRequest = {
          userQuestion,
          currentResponse: content,
          currentModel: model,
          otherResponses,
        };

        console.log(`[Evaluation] Calling evaluation API for ${model}`);
        const evaluation = await evaluateResponse(request, evalModel);
        console.log(`[Evaluation] Received evaluation for ${model}:`, evaluation);

        // Cache result
        evaluationCacheRef.current.set(cacheKey, evaluation);

        setState((prev) => {
          const newEvaluations = new Map(prev.evaluations);
          newEvaluations.set(model, evaluation);
          const newLoading = new Set(prev.loading);
          newLoading.delete(model);
          const newErrors = new Map(prev.errors);
          newErrors.delete(model);
          return {
            ...prev,
            evaluations: newEvaluations,
            loading: newLoading,
            errors: newErrors,
          };
        });
      } catch (error) {
        console.error(`[Evaluation] Error evaluating ${model}:`, error);
        setState((prev) => {
          const newLoading = new Set(prev.loading);
          newLoading.delete(model);
          const newErrors = new Map(prev.errors);
          newErrors.set(model, String(error));
          return {
            ...prev,
            loading: newLoading,
            errors: newErrors,
          };
        });
      }
    },
    [userQuestion, responses, evalModel]
  );

  // Auto-evaluate when all responses complete
  useEffect(() => {
    if (!autoEvaluate) {
      return;
    }

    // Check if all responses are complete
    if (responses.size === 0) {
      return;
    }

    const allComplete = Array.from(responses.values()).every((r) => r.done && r.content.trim().length > 0);
    
    if (!allComplete) {
      return;
    }

    // Evaluate all responses in parallel
    const modelsToEvaluate = Array.from(responses.entries())
      .filter(([_, r]) => r.content.trim().length > 0)
      .filter(([model]) => {
        // Check if we've already evaluated or are currently evaluating this model
        const alreadyEvaluated = evaluatedModelsRef.current.has(model);
        const inState = state.evaluations.has(model);
        const currentlyLoading = state.loading.has(model);
        const shouldEvaluate = !alreadyEvaluated && !inState && !currentlyLoading;
        
        console.log(`[Evaluation] Model ${model}: alreadyEvaluated=${alreadyEvaluated}, inState=${inState}, loading=${currentlyLoading}, shouldEvaluate=${shouldEvaluate}`);
        
        if (shouldEvaluate) {
          console.log(`[Evaluation] Will evaluate model: ${model}`);
          evaluatedModelsRef.current.add(model);
        }
        return shouldEvaluate;
      })
      .map(([model, response]) => ({ model, content: response.content }));

    if (modelsToEvaluate.length === 0) {
      console.log("[Evaluation] No models need evaluation (all already evaluated or loading)");
      return;
    }

    console.log(`[Evaluation] 🚀 Starting evaluation for ${modelsToEvaluate.length} model(s):`, modelsToEvaluate.map(m => m.model));
    console.log(`[Evaluation] This was triggered after sequential model completion.`);

    // Trigger evaluations - build other responses list and call API directly
    modelsToEvaluate.forEach(({ model, content }) => {
      const cacheKey = `${userQuestion}:${model}:${content.substring(0, 100)}`;
      
      // Check cache first
      if (evaluationCacheRef.current.has(cacheKey)) {
        console.log(`[Evaluation] Using cached evaluation for ${model}`);
        setState((prev) => {
          const newEvaluations = new Map(prev.evaluations);
          newEvaluations.set(model, evaluationCacheRef.current.get(cacheKey)!);
          return {
            ...prev,
            evaluations: newEvaluations,
          };
        });
        return;
      }

      // Set loading state
      setState((prev) => {
        const newLoading = new Set(prev.loading);
        newLoading.add(model);
        return { ...prev, loading: newLoading };
      });

      // Build other responses list
      const otherResponses = Array.from(responses.entries())
        .filter(([m]) => m !== model)
        .map(([m, r]) => ({
          model: m,
          content: r.content,
        }));

      const request: EvaluationRequest = {
        userQuestion,
        currentResponse: content,
        currentModel: model,
        otherResponses,
      };

      console.log(`[Evaluation] 📡 Calling evaluation API for ${model}...`);
      
      evaluateResponse(request, evalModel)
        .then((evaluation) => {
          console.log(`[Evaluation] ✅ Received evaluation for ${model}:`, evaluation);
          
          // Cache result
          evaluationCacheRef.current.set(cacheKey, evaluation);

          setState((prev) => {
            const newEvaluations = new Map(prev.evaluations);
            newEvaluations.set(model, evaluation);
            const newLoading = new Set(prev.loading);
            newLoading.delete(model);
            const newErrors = new Map(prev.errors);
            newErrors.delete(model);
            return {
              ...prev,
              evaluations: newEvaluations,
              loading: newLoading,
              errors: newErrors,
            };
          });
        })
        .catch((error) => {
          console.error(`[Evaluation] Error evaluating ${model}:`, error);
          
          // Remove from ref on error so we can retry
          evaluatedModelsRef.current.delete(model);
          
          setState((prev) => {
            const newLoading = new Set(prev.loading);
            newLoading.delete(model);
            const newErrors = new Map(prev.errors);
            newErrors.set(model, String(error));
            return {
              ...prev,
              loading: newLoading,
              errors: newErrors,
            };
          });
        });
    });
  }, [autoEvaluate, responsesKey, userQuestion, evalModel, state.evaluations, state.loading]);

  // Analyze highlights for a specific model
  const analyzeHighlightsForModel = useCallback(
    async (targetModel: string) => {
      // Check cache
      const cacheKey = `${userQuestion}:${targetModel}:highlights`;
      if (highlightCacheRef.current.has(cacheKey)) {
        setState((prev) => {
          const newHighlights = new Map(prev.highlightAnalyses);
          newHighlights.set(targetModel, highlightCacheRef.current.get(cacheKey)!);
          return {
            ...prev,
            highlightAnalyses: newHighlights,
          };
        });
        return;
      }

      if (state.loading.has(`${targetModel}:highlights`)) {
        return;
      }

      setState((prev) => {
        const newLoading = new Set(prev.loading);
        newLoading.add(`${targetModel}:highlights`);
        return { ...prev, loading: newLoading };
      });

      try {
        const request: HighlightRequest = {
          responses: Array.from(responses.entries()).map(([model, r]) => ({
            model,
            content: r.content,
          })),
          targetModel,
        };

        const analysis = await analyzeHighlights(request, evalModel);

        // Cache result
        highlightCacheRef.current.set(cacheKey, analysis);

        setState((prev) => {
          const newHighlights = new Map(prev.highlightAnalyses);
          newHighlights.set(targetModel, analysis);
          const newLoading = new Set(prev.loading);
          newLoading.delete(`${targetModel}:highlights`);
          const newErrors = new Map(prev.errors);
          newErrors.delete(`${targetModel}:highlights`);
          return {
            ...prev,
            highlightAnalyses: newHighlights,
            loading: newLoading,
            errors: newErrors,
          };
        });
      } catch (error) {
        console.error(`Error analyzing highlights for ${targetModel}:`, error);
        setState((prev) => {
          const newLoading = new Set(prev.loading);
          newLoading.delete(`${targetModel}:highlights`);
          const newErrors = new Map(prev.errors);
          newErrors.set(`${targetModel}:highlights`, String(error));
          return {
            ...prev,
            loading: newLoading,
            errors: newErrors,
          };
        });
      }
    },
    [userQuestion, responses, evalModel, state.loading]
  );

  // Manual re-evaluation
  const reEvaluate = useCallback(
    async (model: string) => {
      const response = responses.get(model);
      if (!response) return;

      // Clear existing evaluation
      setState((prev) => {
        const newEvaluations = new Map(prev.evaluations);
        newEvaluations.delete(model);
        return { ...prev, evaluations: newEvaluations };
      });

      await evaluateSingleResponse(model, response.content);
    },
    [responses, evaluateSingleResponse]
  );

  // Manual evaluation for all models
  const evaluateAll = useCallback(async () => {
    console.log("[Evaluation] 🔘 Manual evaluation triggered for all models");
    
    if (responses.size === 0) {
      console.log("[Evaluation] No responses to evaluate");
      return;
    }

    const allComplete = Array.from(responses.values()).every((r) => r.done && r.content.trim().length > 0);
    
    if (!allComplete) {
      const incomplete = Array.from(responses.entries())
        .filter(([_, r]) => !r.done || r.content.trim().length === 0)
        .map(([m]) => m);
      console.log("[Evaluation] Cannot evaluate - some responses incomplete:", incomplete);
      return;
    }

    // Clear any existing evaluations to force re-evaluation
    evaluatedModelsRef.current.clear();
    setState((prev) => ({
      ...prev,
      evaluations: new Map(),
      errors: new Map(),
    }));

    // Evaluate all models
    const modelsToEvaluate = Array.from(responses.entries())
      .filter(([_, r]) => r.content.trim().length > 0)
      .map(([model, response]) => ({ model, content: response.content }));

    console.log(`[Evaluation] 🚀 Manual evaluation starting for ${modelsToEvaluate.length} model(s):`, modelsToEvaluate.map(m => m.model));

    // Trigger evaluations in parallel
    modelsToEvaluate.forEach(({ model, content }) => {
      const cacheKey = `${userQuestion}:${model}:${content.substring(0, 100)}`;
      
      // Check cache first
      if (evaluationCacheRef.current.has(cacheKey)) {
        console.log(`[Evaluation] Using cached evaluation for ${model}`);
        setState((prev) => {
          const newEvaluations = new Map(prev.evaluations);
          newEvaluations.set(model, evaluationCacheRef.current.get(cacheKey)!);
          return {
            ...prev,
            evaluations: newEvaluations,
          };
        });
        return;
      }

      // Set loading state
      setState((prev) => {
        const newLoading = new Set(prev.loading);
        newLoading.add(model);
        return { ...prev, loading: newLoading };
      });

      // Build other responses list
      const otherResponses = Array.from(responses.entries())
        .filter(([m]) => m !== model)
        .map(([m, r]) => ({
          model: m,
          content: r.content,
        }));

      const request: EvaluationRequest = {
        userQuestion,
        currentResponse: content,
        currentModel: model,
        otherResponses,
      };

      console.log(`[Evaluation] 📡 Calling evaluation API for ${model}...`);
      
      evaluatedModelsRef.current.add(model);
      
      evaluateResponse(request, evalModel)
        .then((evaluation) => {
          console.log(`[Evaluation] ✅ Received evaluation for ${model}:`, evaluation);
          
          // Cache result
          evaluationCacheRef.current.set(cacheKey, evaluation);

          setState((prev) => {
            const newEvaluations = new Map(prev.evaluations);
            newEvaluations.set(model, evaluation);
            const newLoading = new Set(prev.loading);
            newLoading.delete(model);
            const newErrors = new Map(prev.errors);
            newErrors.delete(model);
            return {
              ...prev,
              evaluations: newEvaluations,
              loading: newLoading,
              errors: newErrors,
            };
          });
        })
        .catch((error) => {
          console.error(`[Evaluation] Error evaluating ${model}:`, error);
          
          // Remove from ref on error so we can retry
          evaluatedModelsRef.current.delete(model);
          
          setState((prev) => {
            const newLoading = new Set(prev.loading);
            newLoading.delete(model);
            const newErrors = new Map(prev.errors);
            newErrors.set(model, String(error));
            return {
              ...prev,
              loading: newLoading,
              errors: newErrors,
            };
          });
        });
    });
  }, [userQuestion, responses, evalModel]);

  // Check if any evaluation is in progress
  const isEvaluatingAny = state.loading.size > 0;

  return {
    evaluations: state.evaluations,
    highlightAnalyses: state.highlightAnalyses,
    loading: state.loading,
    errors: state.errors,
    evaluateResponse: evaluateSingleResponse,
    analyzeHighlights: analyzeHighlightsForModel,
    reEvaluate,
    evaluateAll,
    isEvaluating: (model: string) => state.loading.has(model),
    isEvaluatingAny,
    isAnalyzingHighlights: (model: string) => state.loading.has(`${model}:highlights`),
  };
}


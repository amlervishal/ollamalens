# Evaluation System Auto-Trigger Fix

## Problem
The automatic evaluation system was not triggering when model responses completed in the chat.

## Root Causes Identified

### 1. **Circular Dependency in useEffect**
The `useEffect` in `use-response-evaluation.ts` depended on:
- `evaluateSingleResponse` callback
- `allResponsesComplete` callback

These callbacks themselves depended on state (`state.loading`, `state.evaluations`), creating a circular dependency that caused:
- Unnecessary re-renders
- Effect running at wrong times
- Models being skipped due to stale state checks

### 2. **Missing Reset Mechanism**
When a new question was asked:
- `evaluatedModelsRef` was never cleared
- Old evaluation state persisted
- New evaluations were blocked by stale tracking data

### 3. **Insufficient Debugging**
- Minimal console logging made it hard to diagnose issues
- No visibility into when effects triggered or why evaluations were skipped

## Solutions Implemented

### 1. **Removed Circular Dependencies**
**File**: `src/hooks/use-response-evaluation.ts`

- **Removed** `allResponsesComplete` callback
- **Inlined** all evaluation logic directly in the useEffect
- **Simplified** `evaluateSingleResponse` to only depend on `userQuestion`, `responses`, and `evalModel` (not state)
- **Removed** `evaluateSingleResponse` and `allResponsesComplete` from useEffect dependencies

**Before**:
```typescript
}, [autoEvaluate, responses, allResponsesComplete, evaluateSingleResponse, state.evaluations, state.loading]);
```

**After**:
```typescript
}, [autoEvaluate, responses, userQuestion, evalModel, state.evaluations, state.loading]);
```

### 2. **Added Reset Mechanism**
**File**: `src/hooks/use-response-evaluation.ts`

Added new useEffect to reset state when question changes:
```typescript
const lastQuestionRef = useRef<string>(userQuestion);

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
```

### 3. **Enhanced Debugging**
**File**: `src/hooks/use-response-evaluation.ts`

Added comprehensive console logging:
- Effect trigger with response details
- Response completion status
- Model evaluation decisions
- API call tracking
- Success/error handling

**File**: `src/components/comparison/comparison-view.tsx`

Added console logging for:
- responsesMap construction
- Streaming response status
- Done status for each model

## Testing Instructions

1. **Start the dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Open browser console** (F12)

3. **Send a message** to multiple models

4. **Watch console logs** - you should see:
   ```
   [ComparisonView] Building responsesMap for turn: ...
   [ComparisonView] Added streaming response for model: done=false/true
   [Evaluation] useEffect triggered with responses: ...
   [Evaluation] Not all responses complete yet: ...
   [Evaluation] All responses complete, checking which models need evaluation
   [Evaluation] Will evaluate model: ...
   [Evaluation] Starting evaluation for 2 model(s): ...
   [Evaluation] Calling evaluation API for ...
   [Evaluation] Received evaluation for ...:
   ```

5. **Verify evaluations appear** below model responses in the UI

## Expected Behavior

- ✅ Evaluations trigger automatically when all responses complete
- ✅ Each model gets evaluated exactly once per response
- ✅ New questions reset evaluation state
- ✅ Cached evaluations are reused
- ✅ Evaluation results persist in UI
- ✅ Failed evaluations can be retried

## Files Modified

1. `/src/hooks/use-response-evaluation.ts` - Fixed circular dependencies, added reset mechanism, enhanced logging
2. `/src/components/comparison/comparison-view.tsx` - Added debug logging for responsesMap

## Next Steps

Once confirmed working:
1. Remove or reduce debug console.log statements for production
2. Consider persisting evaluations to database
3. Add UI indicators for evaluation progress
4. Add retry button for failed evaluations


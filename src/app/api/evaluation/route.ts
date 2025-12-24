import { NextRequest } from "next/server";
import { ollamaClient } from "@/lib/ollama/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, prompt, type } = body;

    if (!model || !prompt) {
      return new Response(
        JSON.stringify({ error: "Model and prompt are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Use the generate endpoint for evaluation (simpler than chat for structured output)
    const response = await ollamaClient.generate({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.3, // Lower temperature for more consistent evaluation
        top_p: 0.9,
      },
    });

    return new Response(
      JSON.stringify({
        response: response.response,
        done: response.done,
        type: type || "evaluation",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in evaluation API:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to evaluate response",
        message: String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


import { NextRequest } from "next/server";
import { ollamaClient } from "@/lib/ollama/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, messages, stream } = body;

    if (!model || !messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Model and messages array are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (stream) {
      // Return a streaming response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const encoder = new TextEncoder();
            for await (const chunk of ollamaClient.chatStream({
              model,
              messages,
              stream: true,
            })) {
              const data = JSON.stringify(chunk) + "\n";
              controller.enqueue(encoder.encode(data));
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      // Return a regular response
      const response = await ollamaClient.chat({
        model,
        messages,
        stream: false,
      });
      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate response",
        message: String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


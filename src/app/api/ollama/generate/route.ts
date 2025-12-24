import { NextRequest, NextResponse } from "next/server";
import { ollamaClient } from "@/lib/ollama/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, prompt, stream, images, options } = body;

    if (!model || !prompt) {
      return NextResponse.json(
        { error: "Model and prompt are required" },
        { status: 400 }
      );
    }

    if (stream) {
      // For streaming, we'll need to set up a streaming response
      // For now, return non-streaming response
      const response = await ollamaClient.generate({
        model,
        prompt,
        images,
        options,
      });
      return NextResponse.json(response);
    } else {
      const response = await ollamaClient.generate({
        model,
        prompt,
        images,
        options,
      });
      return NextResponse.json(response);
    }
  } catch (error) {
    console.error("Error generating response:", error);
    return NextResponse.json(
      { error: "Failed to generate response", message: String(error) },
      { status: 500 }
    );
  }
}


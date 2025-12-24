import { NextResponse } from "next/server";
import { ollamaClient } from "@/lib/ollama/client";

export async function GET() {
  try {
    const models = await ollamaClient.listModels();
    return NextResponse.json({ models });
  } catch (error) {
    console.error("Error fetching models:", error);
    return NextResponse.json(
      { error: "Failed to fetch models", message: String(error) },
      { status: 500 }
    );
  }
}


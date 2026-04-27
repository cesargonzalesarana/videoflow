import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth.success) return auth.response!;

    const body = await request.json();
    const { text, voice, speed } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "El texto es requerido" }, { status: 400 });
    }

    if (text.length > 2000) {
      return NextResponse.json({ error: "Maximo 2000 caracteres" }, { status: 400 });
    }

    const zai = await ZAI.create();

    const response = await zai.audio.tts.create({
      input: text.trim(),
      voice: voice || "alloy",
      speed: speed || 1.0,
      response_format: "mp3",
    });

    return NextResponse.json({ audio: response });
  } catch (error: unknown) {
    console.error("TTS error:", error);
    const message = error instanceof Error ? error.message : "Error al generar audio";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

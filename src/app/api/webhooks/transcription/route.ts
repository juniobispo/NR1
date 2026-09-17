import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { persistTranscriptionResult } from "@/lib/transcription/persist";

const segmentSchema = z.object({
  speakerLabel: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  text: z.string(),
  confidence: z.number().optional(),
});

const payloadSchema = z.object({
  recordingId: z.string(),
  provider: z.string(),
  language: z.string().default("pt"),
  segments: z.array(segmentSchema),
  raw: z.unknown().optional(),
});

/**
 * Callback assíncrono para provedores de transcrição que notificam via webhook
 * em vez de resposta síncrona (fluxo alternativo ao polling feito pelo
 * worker). Autenticado por segredo compartilhado — não usa sessão de usuário,
 * pois é chamado pelo provedor externo, não pelo navegador.
 *
 * Se o provedor externo tiver um formato de payload diferente, normalize-o
 * para este contrato antes (ex.: numa função serverless intermediária) ou
 * adapte o parsing abaixo.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.TRANSCRIPTION_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Assinatura de webhook inválida." }, { status: 401 });
  }

  const body = await req.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const recording = await prisma.recording.findUnique({ where: { id: parsed.data.recordingId } });
  if (!recording) {
    return NextResponse.json({ error: "Gravação não encontrada." }, { status: 404 });
  }

  await persistTranscriptionResult(parsed.data.recordingId, {
    provider: parsed.data.provider,
    language: parsed.data.language,
    segments: parsed.data.segments,
    raw: parsed.data.raw ?? body,
  });

  return NextResponse.json({ ok: true });
}

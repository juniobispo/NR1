import { prisma } from "@/lib/db";
import { detectIncident, classifySentiment } from "@/lib/incident-detection";
import { recalculateRiskSnapshot } from "@/lib/risk-score";
import { startOfDay, endOfDay } from "date-fns";
import type { TranscriptionResult } from "./provider";

/**
 * Persiste um resultado de transcrição diarizada (vindo do worker síncrono ou
 * de um webhook de provedor assíncrono), roda a detecção heurística de
 * incidentes por segmento e atualiza o snapshot de risco do dia/ambiente.
 * Centralizado aqui para que os dois caminhos de entrada (worker e webhook)
 * nunca fiquem divergentes.
 */
export async function persistTranscriptionResult(recordingId: string, result: TranscriptionResult) {
  const recording = await prisma.recording.findUniqueOrThrow({ where: { id: recordingId } });

  const transcript = await prisma.transcript.create({
    data: {
      recordingId,
      provider: result.provider,
      language: result.language,
      status: "COMPLETED",
      rawResponse: result.raw as any,
      completedAt: new Date(),
      segments: {
        create: result.segments.map((s) => ({
          speakerLabel: s.speakerLabel,
          startMs: s.startMs,
          endMs: s.endMs,
          text: s.text,
          confidence: s.confidence,
          sentiment: classifySentiment(s.text),
        })),
      },
    },
    include: { segments: true },
  });

  for (const segment of transcript.segments) {
    const match = detectIncident(segment.text);
    if (!match) continue;

    await prisma.incident.create({
      data: {
        organizationId: recording.organizationId,
        environmentId: recording.environmentId,
        recordingId: recording.id,
        transcriptSegmentId: segment.id,
        type: match.type,
        severity: match.severity,
        status: "DETECTED",
        detectedBy: "AUTO",
        description: `Indício detectado automaticamente no trecho ${(segment.startMs / 1000).toFixed(1)}s–${(segment.endMs / 1000).toFixed(1)}s.`,
        triggerText: segment.text,
        matchedTerms: match.matchedTerms,
      },
    });
  }

  await prisma.recording.update({ where: { id: recordingId }, data: { status: "TRANSCRIBED" } });

  await recalculateRiskSnapshot({
    organizationId: recording.organizationId,
    environmentId: recording.environmentId,
    periodStart: startOfDay(recording.startedAt),
    periodEnd: endOfDay(recording.startedAt),
  });

  return transcript;
}

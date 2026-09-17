import { Worker, type Job } from "bullmq";
import { prisma } from "@/lib/db";
import { redisConnection, TRANSCRIPTION_QUEUE_NAME, type TranscriptionJobData } from "@/lib/queue";
import { getTranscriptionProvider } from "@/lib/transcription/provider";
import { createDownloadUrl } from "@/lib/storage";
import { persistTranscriptionResult } from "@/lib/transcription/persist";

/**
 * Processa gravações enfileiradas: obtém a transcrição diarizada do provedor
 * configurado, persiste os segmentos por falante, roda a detecção heurística
 * de indícios de ofensa/conflito por segmento e recalcula o snapshot de risco
 * do ambiente/dia correspondente.
 *
 * Rodar com: `npm run worker` (processo separado do servidor web Next.js).
 */
async function processRecording(job: Job<TranscriptionJobData>) {
  const { recordingId } = job.data;

  const recording = await prisma.recording.findUniqueOrThrow({
    where: { id: recordingId },
  });

  await prisma.recording.update({
    where: { id: recordingId },
    data: { status: "TRANSCRIBING" },
  });

  const objectKey = recording.audioUrl ?? recording.videoUrl;
  if (!objectKey) {
    throw new Error(`Gravação ${recordingId} não possui mídia associada.`);
  }
  const mediaUrl = await createDownloadUrl(objectKey, 60 * 60);

  const provider = getTranscriptionProvider();
  const result = await provider.transcribe({ mediaUrl, languageHint: "pt" });

  await persistTranscriptionResult(recordingId, result);
}

const worker = new Worker<TranscriptionJobData>(
  TRANSCRIPTION_QUEUE_NAME,
  async (job) => {
    try {
      await processRecording(job);
    } catch (error) {
      await prisma.recording.update({
        where: { id: job.data.recordingId },
        data: { status: "FAILED", failureReason: error instanceof Error ? error.message : String(error) },
      });
      throw error;
    }
  },
  { connection: redisConnection, concurrency: 2 }
);

worker.on("completed", (job) => {
  console.log(`[worker] gravação ${job.data.recordingId} transcrita com sucesso.`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] falha ao processar gravação ${job?.data.recordingId}:`, err.message);
});

console.log("[worker] aguardando jobs de transcrição...");

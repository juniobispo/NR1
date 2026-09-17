import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const TRANSCRIPTION_QUEUE_NAME = "transcription";

export const transcriptionQueue = new Queue(TRANSCRIPTION_QUEUE_NAME, { connection });

export type TranscriptionJobData = {
  recordingId: string;
};

export async function enqueueTranscriptionJob(recordingId: string) {
  await transcriptionQueue.add(
    "transcribe-recording",
    { recordingId } satisfies TranscriptionJobData,
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 15_000 },
      removeOnComplete: 500,
      removeOnFail: 1000,
    }
  );
}

export { connection as redisConnection };

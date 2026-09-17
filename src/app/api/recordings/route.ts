import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiHandler, requireSession } from "@/lib/tenant";
import { enqueueTranscriptionJob } from "@/lib/queue";
import { jsonSafe } from "@/lib/json";

const createSchema = z.object({
  environmentId: z.string(),
  deviceId: z.string().optional(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  durationSec: z.number().int().positive().optional(),
  objectKey: z.string(),
  mediaKind: z.enum(["audio", "video"]).default("video"),
  fileSizeBytes: z.number().int().positive().optional(),
  autoTranscribe: z.boolean().default(true),
});

export const GET = apiHandler(async (req) => {
  const { organizationId } = await requireSession();
  const { searchParams } = new URL(req.url);
  const environmentId = searchParams.get("environmentId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const recordings = await prisma.recording.findMany({
    where: {
      organizationId,
      environmentId: environmentId || undefined,
      status: (status as any) || undefined,
    },
    orderBy: { startedAt: "desc" },
    take: 100,
    include: {
      environment: { select: { name: true } },
      transcript: { select: { status: true } },
      _count: { select: { incidents: true } },
    },
  });
  return jsonSafe(recordings);
});

/**
 * Passo 2 do fluxo de ingestão: registra os metadados da gravação já enviada
 * ao storage e, por padrão, enfileira imediatamente o job de transcrição +
 * diarização de falantes.
 */
export const POST = apiHandler(async (req) => {
  const { organizationId } = await requireSession();
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const environment = await prisma.environment.findFirst({
    where: { id: data.environmentId, organizationId },
  });
  if (!environment) {
    return NextResponse.json({ error: "Ambiente não encontrado." }, { status: 404 });
  }

  const recording = await prisma.recording.create({
    data: {
      organizationId,
      environmentId: data.environmentId,
      deviceId: data.deviceId,
      startedAt: new Date(data.startedAt),
      endedAt: data.endedAt ? new Date(data.endedAt) : undefined,
      durationSec: data.durationSec,
      videoUrl: data.mediaKind === "video" ? data.objectKey : undefined,
      audioUrl: data.mediaKind === "audio" ? data.objectKey : undefined,
      fileSizeBytes: data.fileSizeBytes,
      status: "UPLOADED",
    },
  });

  if (data.autoTranscribe) {
    await prisma.recording.update({ where: { id: recording.id }, data: { status: "QUEUED" } });
    await enqueueTranscriptionJob(recording.id);
  }

  return jsonSafe(recording, { status: 201 });
});

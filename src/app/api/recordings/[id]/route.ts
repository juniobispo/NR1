import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler, requireSession } from "@/lib/tenant";
import { createDownloadUrl } from "@/lib/storage";
import { jsonSafe } from "@/lib/json";

export const GET = apiHandler(async (_req, ctx) => {
  const { organizationId } = await requireSession();
  const { id } = await ctx!.params;

  const recording = await prisma.recording.findFirst({
    where: { id, organizationId },
    include: {
      environment: true,
      transcript: {
        include: {
          segments: {
            orderBy: { startMs: "asc" },
            include: { employee: { select: { id: true, name: true } } },
          },
        },
      },
      incidents: { include: { involvedEmployees: { include: { employee: true } } } },
    },
  });
  if (!recording) {
    return NextResponse.json({ error: "Gravação não encontrada." }, { status: 404 });
  }

  const objectKey = recording.videoUrl ?? recording.audioUrl;
  const mediaUrl = objectKey ? await createDownloadUrl(objectKey) : null;

  return jsonSafe({ ...recording, mediaUrl });
});

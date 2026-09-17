import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler, requireSession } from "@/lib/tenant";
import { enqueueTranscriptionJob } from "@/lib/queue";

/** Dispara (ou re-dispara, em caso de falha) o processamento de uma gravação. */
export const POST = apiHandler(async (_req, ctx) => {
  const { organizationId } = await requireSession();
  const { id } = await ctx!.params;

  const recording = await prisma.recording.findFirst({ where: { id, organizationId } });
  if (!recording) {
    return NextResponse.json({ error: "Gravação não encontrada." }, { status: 404 });
  }

  await prisma.recording.update({ where: { id }, data: { status: "QUEUED", failureReason: null } });
  await enqueueTranscriptionJob(id);

  return NextResponse.json({ queued: true });
});

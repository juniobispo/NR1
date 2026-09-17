import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiHandler, requireSession } from "@/lib/tenant";

export const GET = apiHandler(async (req) => {
  const { organizationId } = await requireSession();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const severity = searchParams.get("severity") ?? undefined;
  const environmentId = searchParams.get("environmentId") ?? undefined;

  const incidents = await prisma.incident.findMany({
    where: {
      organizationId,
      status: (status as any) || undefined,
      severity: (severity as any) || undefined,
      environmentId: environmentId || undefined,
    },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      environment: { select: { name: true } },
      involvedEmployees: { include: { employee: { select: { id: true, name: true } } } },
      transcriptSegment: { select: { text: true, speakerLabel: true } },
    },
  });
  return NextResponse.json(incidents);
});

const manualIncidentSchema = z.object({
  environmentId: z.string(),
  recordingId: z.string(),
  transcriptSegmentId: z.string().optional(),
  type: z.enum(["OFENSA_VERBAL", "ASSEDIO_MORAL", "ASSEDIO_SEXUAL", "AMEACA", "CONFLITO", "DISCRIMINACAO", "OUTRO"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  description: z.string().min(5),
});

/** Registro manual de ocorrência por um gestor/RH (não originado da detecção automática). */
export const POST = apiHandler(async (req) => {
  const { organizationId, userId } = await requireSession();
  const body = await req.json();
  const parsed = manualIncidentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const incident = await prisma.incident.create({
    data: {
      organizationId,
      ...parsed.data,
      status: "UNDER_REVIEW",
      detectedBy: "MANUAL",
      reviewedById: userId,
      reviewedAt: new Date(),
    },
  });
  return NextResponse.json(incident, { status: 201 });
});

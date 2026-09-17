import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiHandler, requireRole, requireSession } from "@/lib/tenant";

export const GET = apiHandler(async (_req, ctx) => {
  const { organizationId } = await requireSession();
  const { id } = await ctx!.params;

  const incident = await prisma.incident.findFirst({
    where: { id, organizationId },
    include: {
      environment: true,
      recording: true,
      transcriptSegment: true,
      involvedEmployees: { include: { employee: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });
  if (!incident) {
    return NextResponse.json({ error: "Ocorrência não encontrada." }, { status: 404 });
  }
  return NextResponse.json(incident);
});

const reviewSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "CONFIRMED", "DISMISSED"]),
  reviewNotes: z.string().optional(),
  involvedEmployees: z
    .array(z.object({ employeeId: z.string(), roleInIncident: z.enum(["OFENSOR", "VITIMA", "TESTEMUNHA", "ENVOLVIDO"]) }))
    .optional(),
});

/**
 * Triagem/apuração de uma ocorrência por RH ou gestor: confirma, descarta
 * (falso positivo) ou mantém em análise, e vincula os colaboradores
 * envolvidos (essencial para a documentação formal de NR1).
 */
export const PATCH = apiHandler(async (req, ctx) => {
  const { organizationId, userId, role } = await requireSession();
  requireRole(role, ["ADMIN", "RH", "GESTOR"]);
  const { id } = await ctx!.params;

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.incident.findFirst({ where: { id, organizationId } });
  if (!existing) {
    return NextResponse.json({ error: "Ocorrência não encontrada." }, { status: 404 });
  }

  const incident = await prisma.incident.update({
    where: { id },
    data: {
      status: parsed.data.status,
      reviewNotes: parsed.data.reviewNotes,
      reviewedById: userId,
      reviewedAt: new Date(),
      involvedEmployees: parsed.data.involvedEmployees
        ? {
            deleteMany: {},
            create: parsed.data.involvedEmployees,
          }
        : undefined,
    },
    include: { involvedEmployees: { include: { employee: true } } },
  });

  return NextResponse.json(incident);
});

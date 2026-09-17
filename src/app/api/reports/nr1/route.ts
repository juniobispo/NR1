import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiHandler, requireSession } from "@/lib/tenant";

const querySchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  environmentId: z.string().optional(),
});

/**
 * Gera o pacote de documentação NR1 de um período: consolida ocorrências
 * confirmadas, colaboradores envolvidos, trechos de transcrição que as
 * embasam e a evolução do indicador de risco — a base do dossiê a ser
 * apresentado em fiscalização, PGR (Programa de Gerenciamento de Riscos) ou
 * processo interno de apuração.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const { organizationId, userId } = await requireSession();
  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    periodStart: searchParams.get("periodStart"),
    periodEnd: searchParams.get("periodEnd"),
    environmentId: searchParams.get("environmentId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { periodStart, periodEnd, environmentId } = parsed.data;

  const incidents = await prisma.incident.findMany({
    where: {
      organizationId,
      environmentId: environmentId || undefined,
      status: "CONFIRMED",
      createdAt: { gte: new Date(periodStart), lte: new Date(periodEnd) },
    },
    orderBy: { createdAt: "asc" },
    include: {
      environment: { select: { name: true } },
      transcriptSegment: { select: { text: true, startMs: true, endMs: true } },
      involvedEmployees: { include: { employee: { select: { name: true, department: true, role: true } } } },
      reviewedBy: { select: { name: true } },
    },
  });

  const riskSnapshots = await prisma.riskSnapshot.findMany({
    where: {
      organizationId,
      environmentId: environmentId || undefined,
      periodStart: { gte: new Date(periodStart) },
      periodEnd: { lte: new Date(periodEnd) },
    },
    orderBy: { periodStart: "asc" },
  });

  const byType = incidents.reduce<Record<string, number>>((acc, i) => {
    acc[i.type] = (acc[i.type] ?? 0) + 1;
    return acc;
  }, {});

  const summary = {
    totalConfirmedIncidents: incidents.length,
    byType,
    averageRiskScore: riskSnapshots.length
      ? Math.round(riskSnapshots.reduce((s, r) => s + r.riskScore, 0) / riskSnapshots.length)
      : 0,
  };

  const report = await prisma.complianceReport.create({
    data: {
      organizationId,
      type: "NR1",
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      generatedById: userId,
      summary,
    },
  });

  return NextResponse.json({ report, incidents, riskSnapshots, summary });
});

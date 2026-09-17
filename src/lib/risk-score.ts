import { prisma } from "@/lib/db";
import type { RiskTrend } from "@prisma/client";

const SEVERITY_WEIGHT: Record<string, number> = {
  LOW: 1,
  MEDIUM: 3,
  HIGH: 7,
  CRITICAL: 15,
};

/**
 * Recalcula o snapshot de risco de um ambiente para a janela [periodStart, periodEnd),
 * combinando volume e severidade de ocorrências + proporção de trechos com tom hostil.
 *
 * O `riskScore` (0-100) e a tendência (`trend`, comparando com a janela anterior de
 * mesmo tamanho) são a base do "radar de antecipação": ambientes/times com score
 * subindo de forma consistente indicam necessidade de intervenção preventiva
 * (conversa, mediação, revisão de escala/liderança) antes de uma ocorrência grave.
 */
export async function recalculateRiskSnapshot(params: {
  organizationId: string;
  environmentId: string;
  periodStart: Date;
  periodEnd: Date;
}) {
  const { organizationId, environmentId, periodStart, periodEnd } = params;

  const incidents = await prisma.incident.findMany({
    where: {
      organizationId,
      environmentId,
      createdAt: { gte: periodStart, lt: periodEnd },
      status: { not: "DISMISSED" },
    },
    select: { severity: true },
  });

  const hostileSegmentCount = await prisma.transcriptSegment.count({
    where: {
      sentiment: "HOSTIL",
      transcript: {
        recording: {
          organizationId,
          environmentId,
          startedAt: { gte: periodStart, lt: periodEnd },
        },
      },
    },
  });

  const weightedSum = incidents.reduce((sum, i) => sum + (SEVERITY_WEIGHT[i.severity] ?? 1), 0);
  const criticalCount = incidents.filter((i) => i.severity === "CRITICAL").length;

  // Heurística simples e explicável (não uma "IA preditiva" real): normaliza o
  // peso combinado de ocorrências + trechos hostis numa escala de 0 a 100.
  const rawScore = weightedSum * 4 + hostileSegmentCount * 2;
  const riskScore = Math.min(100, Math.round(rawScore));

  const previousWindowLength = periodEnd.getTime() - periodStart.getTime();
  const previousStart = new Date(periodStart.getTime() - previousWindowLength);
  const previous = await prisma.riskSnapshot.findFirst({
    where: { organizationId, environmentId, periodStart: previousStart },
    orderBy: { createdAt: "desc" },
  });

  let trend: RiskTrend = "ESTAVEL";
  if (previous) {
    if (riskScore > previous.riskScore * 1.15) trend = "PIORANDO";
    else if (riskScore < previous.riskScore * 0.85) trend = "MELHORANDO";
  }

  return prisma.riskSnapshot.create({
    data: {
      organizationId,
      environmentId,
      periodStart,
      periodEnd,
      incidentCount: incidents.length,
      criticalCount,
      hostileSegmentCount,
      riskScore,
      trend,
    },
  });
}

/** Retorna os ambientes com maior risco recente, para priorização no dashboard. */
export async function getTopRiskEnvironments(organizationId: string, limit = 5) {
  const latestByEnvironment = await prisma.riskSnapshot.findMany({
    where: { organizationId, environmentId: { not: null } },
    orderBy: { periodStart: "desc" },
    take: 200,
    include: { environment: true },
  });

  const byEnv = new Map<string, (typeof latestByEnvironment)[number]>();
  for (const snapshot of latestByEnvironment) {
    if (!snapshot.environmentId) continue;
    if (!byEnv.has(snapshot.environmentId)) byEnv.set(snapshot.environmentId, snapshot);
  }

  return [...byEnv.values()].sort((a, b) => b.riskScore - a.riskScore).slice(0, limit);
}

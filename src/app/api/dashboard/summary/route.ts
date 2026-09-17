import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler, requireSession } from "@/lib/tenant";
import { getTopRiskEnvironments } from "@/lib/risk-score";
import { subDays } from "date-fns";

/** Dados agregados para a tela inicial do dashboard (visão de antecipação de risco). */
export const GET = apiHandler(async () => {
  const { organizationId } = await requireSession();
  const since = subDays(new Date(), 30);

  const [openIncidents, criticalOpen, environmentsCount, recordingsLast30d, topRisk, recentIncidents] =
    await Promise.all([
      prisma.incident.count({ where: { organizationId, status: { in: ["DETECTED", "UNDER_REVIEW"] } } }),
      prisma.incident.count({ where: { organizationId, severity: "CRITICAL", status: { not: "DISMISSED" } } }),
      prisma.environment.count({ where: { organizationId, active: true } }),
      prisma.recording.count({ where: { organizationId, startedAt: { gte: since } } }),
      getTopRiskEnvironments(organizationId, 5),
      prisma.incident.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { environment: { select: { name: true } } },
      }),
    ]);

  return NextResponse.json({
    openIncidents,
    criticalOpen,
    environmentsCount,
    recordingsLast30d,
    topRiskEnvironments: topRisk,
    recentIncidents,
  });
});

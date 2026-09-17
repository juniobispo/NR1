import { prisma } from "@/lib/db";
import { getTopRiskEnvironments } from "@/lib/risk-score";
import { subDays } from "date-fns";
import type { RiskTrend } from "@prisma/client";

export type PredictiveInsight = {
  environmentId: string;
  environmentName: string;
  riskScore: number;
  trend: RiskTrend;
  message: string;
  incidentCount: number;
};

const WEEKDAY_ADVERBIAL = ["aos domingos", "às segundas", "às terças", "às quartas", "às quintas", "às sextas", "aos sábados"];

function periodOfDay(hour: number) {
  if (hour < 6) return "de madrugada";
  if (hour < 12) return "de manhã";
  if (hour < 18) return "à tarde";
  return "à noite";
}

/**
 * Cruza o histórico de ocorrências de cada ambiente para gerar alertas em
 * linguagem natural sobre padrões recorrentes — horário/dia da semana em que
 * as ocorrências se concentram e colaboradores reincidentes. É a camada
 * "preditiva" prometida no produto: em vez de só listar o que já aconteceu,
 * aponta onde e quando é mais provável que aconteça de novo, para agir antes.
 *
 * Os limiares (concentração >= 40% num mesmo dia, reincidência >= 2 do mesmo
 * colaborador) são heurísticas simples e explicáveis — não um modelo de ML —
 * suficientes para priorizar atenção humana, não para decidir nada sozinhas.
 */
export async function getPredictiveInsights(organizationId: string, lookbackDays = 90): Promise<PredictiveInsight[]> {
  const since = subDays(new Date(), lookbackDays);

  const incidents = await prisma.incident.findMany({
    where: { organizationId, status: { not: "DISMISSED" }, createdAt: { gte: since } },
    include: {
      environment: { select: { id: true, name: true } },
      recording: { select: { startedAt: true } },
      transcriptSegment: { select: { startMs: true, employee: { select: { id: true, name: true } } } },
      involvedEmployees: {
        where: { roleInIncident: "OFENSOR" },
        include: { employee: { select: { id: true, name: true } } },
        take: 1,
      },
    },
  });

  const byEnvironment = new Map<string, { name: string; items: typeof incidents }>();
  for (const incident of incidents) {
    const key = incident.environment.id;
    if (!byEnvironment.has(key)) byEnvironment.set(key, { name: incident.environment.name, items: [] });
    byEnvironment.get(key)!.items.push(incident);
  }

  const riskSnapshots = await getTopRiskEnvironments(organizationId, 50);
  const riskByEnvironment = new Map(riskSnapshots.map((r) => [r.environmentId!, r]));

  const insights: PredictiveInsight[] = [];

  for (const [environmentId, { name, items }] of byEnvironment) {
    if (items.length < 2) continue;

    const weekdayCounts = new Array(7).fill(0);
    const hourCounts = new Array(24).fill(0);
    const offenderCounts = new Map<string, { name: string; count: number }>();

    for (const incident of items) {
      const occurredAt = incident.recording?.startedAt
        ? new Date(incident.recording.startedAt.getTime() + (incident.transcriptSegment?.startMs ?? 0))
        : incident.createdAt;
      weekdayCounts[occurredAt.getDay()] += 1;
      hourCounts[occurredAt.getHours()] += 1;

      const offender = incident.involvedEmployees[0]?.employee ?? incident.transcriptSegment?.employee;
      if (offender) {
        const entry = offenderCounts.get(offender.id) ?? { name: offender.name, count: 0 };
        entry.count += 1;
        offenderCounts.set(offender.id, entry);
      }
    }

    const maxWeekday = weekdayCounts.indexOf(Math.max(...weekdayCounts));
    const weekdayShare = weekdayCounts[maxWeekday] / items.length;
    const dominantHour = hourCounts.indexOf(Math.max(...hourCounts));

    const topOffender = [...offenderCounts.values()].sort((a, b) => b.count - a.count)[0];

    const hasTimePattern = items.length >= 3 && weekdayShare >= 0.4;
    const hasOffenderPattern = !!topOffender && topOffender.count >= 2;
    if (!hasTimePattern && !hasOffenderPattern) continue;

    const parts: string[] = [];
    if (hasTimePattern) {
      parts.push(`concentra ocorrências ${WEEKDAY_ADVERBIAL[maxWeekday]} ${periodOfDay(dominantHour)}`);
    }
    if (hasOffenderPattern) {
      parts.push(`${hasTimePattern ? "com" : "tem"} reincidência de ${topOffender!.name} (${topOffender!.count} ocorrências)`);
    }

    const riskInfo = riskByEnvironment.get(environmentId);

    insights.push({
      environmentId,
      environmentName: name,
      riskScore: riskInfo?.riskScore ?? 0,
      trend: riskInfo?.trend ?? "ESTAVEL",
      incidentCount: items.length,
      message: `${name} ${parts.join(", ")}.`,
    });
  }

  return insights.sort((a, b) => b.riskScore - a.riskScore || b.incidentCount - a.incidentCount);
}

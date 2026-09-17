import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiHandler, requireSession } from "@/lib/tenant";

const querySchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  environmentId: z.string().optional(),
});

const SEVERITY_WEIGHT: Record<string, number> = { LOW: 1, MEDIUM: 3, HIGH: 7, CRITICAL: 15 };

const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/**
 * Relatório de padrões e reincidência: quando, onde e com quem as ocorrências
 * mais graves acontecem. É a base de dados para antecipar problemas — picos de
 * horário, ambientes e pessoas recorrentes indicam onde agir preventivamente
 * antes da próxima ocorrência grave, em vez de só reagir depois do fato.
 */
export const GET = apiHandler(async (req: NextRequest) => {
  const { organizationId } = await requireSession();
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
      status: { not: "DISMISSED" },
      createdAt: { gte: new Date(periodStart), lte: new Date(periodEnd) },
    },
    orderBy: { createdAt: "desc" },
    include: {
      environment: { select: { id: true, name: true } },
      recording: { select: { startedAt: true } },
      transcriptSegment: {
        select: { startMs: true, text: true, employee: { select: { id: true, name: true } } },
      },
      involvedEmployees: {
        where: { roleInIncident: "OFENSOR" },
        include: { employee: { select: { id: true, name: true } } },
        take: 1,
      },
    },
  });

  type Person = { id: string; name: string };
  const offenderCounts = new Map<string, { name: string; count: number; bySeverity: Record<string, number> }>();
  const environmentCounts = new Map<string, { name: string; count: number; weighted: number }>();
  const byHour = Array.from({ length: 24 }, () => 0);
  const byWeekday = Array.from({ length: 7 }, () => 0);

  const enriched = incidents.map((incident) => {
    const offender: Person | null =
      incident.involvedEmployees[0]?.employee ?? incident.transcriptSegment?.employee ?? null;

    const occurredAt = incident.recording?.startedAt
      ? new Date(incident.recording.startedAt.getTime() + (incident.transcriptSegment?.startMs ?? 0))
      : incident.createdAt;

    byHour[occurredAt.getHours()] += 1;
    byWeekday[occurredAt.getDay()] += 1;

    if (offender) {
      const entry = offenderCounts.get(offender.id) ?? { name: offender.name, count: 0, bySeverity: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 } };
      entry.count += 1;
      entry.bySeverity[incident.severity] += 1;
      offenderCounts.set(offender.id, entry);
    }

    const envEntry = environmentCounts.get(incident.environment.id) ?? { name: incident.environment.name, count: 0, weighted: 0 };
    envEntry.count += 1;
    envEntry.weighted += SEVERITY_WEIGHT[incident.severity] ?? 1;
    environmentCounts.set(incident.environment.id, envEntry);

    return {
      id: incident.id,
      type: incident.type,
      severity: incident.severity,
      status: incident.status,
      occurredAt: occurredAt.toISOString(),
      environmentName: incident.environment.name,
      personName: offender?.name ?? null,
      triggerText: incident.triggerText ?? incident.transcriptSegment?.text ?? null,
    };
  });

  const topOffenders = [...offenderCounts.entries()]
    .map(([employeeId, v]) => ({ employeeId, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topEnvironments = [...environmentCounts.entries()]
    .map(([environmentId, v]) => ({ environmentId, ...v }))
    .sort((a, b) => b.weighted - a.weighted)
    .slice(0, 10);

  const topIncidents = [...enriched]
    .sort((a, b) => (SEVERITY_WEIGHT[b.severity] ?? 1) - (SEVERITY_WEIGHT[a.severity] ?? 1) || b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 20);

  return NextResponse.json({
    totalIncidents: incidents.length,
    topOffenders,
    topEnvironments,
    byHour: byHour.map((count, hour) => ({ hour, count })),
    byWeekday: byWeekday.map((count, weekday) => ({ weekday, label: WEEKDAY_LABELS[weekday], count })),
    topIncidents,
  });
});

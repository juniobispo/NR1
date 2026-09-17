import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getTopRiskEnvironments } from "@/lib/risk-score";
import { subDays } from "date-fns";
import Link from "next/link";
import { riskColor, SeverityBadge, IncidentStatusBadge, IncidentTypeLabel } from "@/components/badges";

export default async function DashboardPage() {
  const session = await auth();
  const organizationId = (session!.user as any).organizationId as string;
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Visão geral</h1>
        <p className="mt-1 text-sm text-slate-500">Radar de risco e ocorrências dos últimos 30 dias.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ocorrências em aberto" value={openIncidents} />
        <StatCard label="Críticas não descartadas" value={criticalOpen} accent="text-risk-critical" />
        <StatCard label="Ambientes monitorados" value={environmentsCount} />
        <StatCard label="Gravações (30 dias)" value={recordingsLast30d} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="font-semibold text-slate-900">Ambientes com maior risco</h2>
          <p className="mt-1 text-sm text-slate-500">
            Combina frequência, severidade de ocorrências e tom hostil detectado nas transcrições.
          </p>
          <div className="mt-4 space-y-3">
            {topRisk.length === 0 && <p className="text-sm text-slate-400">Ainda não há dados suficientes.</p>}
            {topRisk.map((snapshot) => (
              <div key={snapshot.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-800">{snapshot.environment?.name ?? "—"}</p>
                  <p className="text-xs text-slate-500">
                    {snapshot.incidentCount} ocorrência(s) · tendência {trendLabel(snapshot.trend)}
                  </p>
                </div>
                <span className={`text-lg font-semibold ${riskColor(snapshot.riskScore)}`}>{snapshot.riskScore}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Ocorrências recentes</h2>
            <Link href="/incidentes" className="text-sm font-medium text-brand-600">
              Ver todas
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentIncidents.length === 0 && <p className="text-sm text-slate-400">Nenhuma ocorrência registrada ainda.</p>}
            {recentIncidents.map((incident) => (
              <Link
                key={incident.id}
                href={`/incidentes/${incident.id}`}
                className="block rounded-lg border border-slate-100 px-3 py-2 hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">
                    <IncidentTypeLabel type={incident.type} /> · {incident.environment.name}
                  </span>
                  <SeverityBadge severity={incident.severity} />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>{new Date(incident.createdAt).toLocaleString("pt-BR")}</span>
                  <IncidentStatusBadge status={incident.status} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function trendLabel(trend: string) {
  return { MELHORANDO: "melhorando", ESTAVEL: "estável", PIORANDO: "piorando" }[trend] ?? trend;
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${accent ?? "text-slate-900"}`}>{value}</p>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { SeverityBadge, IncidentStatusBadge, IncidentTypeLabel } from "@/components/badges";

export default async function IncidentesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const session = await auth();
  const organizationId = (session!.user as any).organizationId as string;

  const incidents = await prisma.incident.findMany({
    where: { organizationId, status: (status as any) || undefined },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: 200,
    include: { environment: { select: { name: true } } },
  });

  const filters = [
    { label: "Todas", value: undefined },
    { label: "Sinalizadas", value: "DETECTED" },
    { label: "Em apuração", value: "UNDER_REVIEW" },
    { label: "Confirmadas", value: "CONFIRMED" },
    { label: "Descartadas", value: "DISMISSED" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Ocorrências</h1>
        <p className="mt-1 text-sm text-slate-500">Indícios de ofensa, ameaça e conflito detectados ou registrados manualmente.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/incidentes?status=${f.value}` : "/incidentes"}
            className={`btn-secondary ${status === f.value ? "bg-brand-100 text-brand-800" : ""}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Ambiente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Severidade</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {incidents.map((incident) => (
              <tr key={incident.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/incidentes/${incident.id}`} className="font-medium text-brand-700">
                    {new Date(incident.createdAt).toLocaleString("pt-BR")}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{incident.environment.name}</td>
                <td className="px-4 py-3 text-slate-600">
                  <IncidentTypeLabel type={incident.type} />
                </td>
                <td className="px-4 py-3">
                  <SeverityBadge severity={incident.severity} />
                </td>
                <td className="px-4 py-3">
                  <IncidentStatusBadge status={incident.status} />
                </td>
              </tr>
            ))}
            {incidents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma ocorrência encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

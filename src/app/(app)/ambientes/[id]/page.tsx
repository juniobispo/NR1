import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { RecordingStatusBadge } from "@/components/badges";

export default async function EnvironmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const organizationId = (session!.user as any).organizationId as string;

  const environment = await prisma.environment.findFirst({
    where: { id, organizationId },
    include: {
      devices: true,
      recordings: { orderBy: { startedAt: "desc" }, take: 20 },
      consentRecords: { include: { employee: true }, orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!environment) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/ambientes" className="text-sm text-brand-600">
          ← Ambientes
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{environment.name}</h1>
        {environment.location && <p className="text-sm text-slate-500">{environment.location}</p>}
      </div>

      <section className="card">
        <h2 className="font-semibold text-slate-900">Gravações recentes</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {environment.recordings.map((r) => (
            <Link key={r.id} href={`/gravacoes/${r.id}`} className="flex items-center justify-between py-3 hover:text-brand-700">
              <div>
                <p className="text-sm font-medium text-slate-800">{new Date(r.startedAt).toLocaleString("pt-BR")}</p>
                <p className="text-xs text-slate-500">{r.durationSec ? `${Math.round(r.durationSec / 60)} min` : "duração não informada"}</p>
              </div>
              <RecordingStatusBadge status={r.status} />
            </Link>
          ))}
          {environment.recordings.length === 0 && <p className="py-3 text-sm text-slate-400">Nenhuma gravação neste ambiente ainda.</p>}
        </div>
      </section>

      <section className="card">
        <h2 className="font-semibold text-slate-900">Dispositivos</h2>
        <div className="mt-3 space-y-2">
          {environment.devices.map((d) => (
            <div key={d.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{d.name}</span>
              <span className="text-slate-500">{d.type} · {d.status}</span>
            </div>
          ))}
          {environment.devices.length === 0 && <p className="text-sm text-slate-400">Nenhum dispositivo cadastrado.</p>}
        </div>
      </section>

      <section className="card">
        <h2 className="font-semibold text-slate-900">Consentimentos recentes</h2>
        <div className="mt-3 space-y-2">
          {environment.consentRecords.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-700">{c.employee.name}</span>
              <span className={c.granted ? "text-emerald-600" : "text-red-600"}>{c.granted ? "Concedido" : "Revogado"}</span>
            </div>
          ))}
          {environment.consentRecords.length === 0 && (
            <p className="text-sm text-slate-400">
              Nenhum registro de consentimento específico para este ambiente. Gerencie em Colaboradores.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

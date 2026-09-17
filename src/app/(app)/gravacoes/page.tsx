import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { RecordingStatusBadge } from "@/components/badges";
import { RecordingUploadForm } from "@/components/recording-upload-form";

export default async function GravacoesPage() {
  const session = await auth();
  const organizationId = (session!.user as any).organizationId as string;

  const [recordings, environments] = await Promise.all([
    prisma.recording.findMany({
      where: { organizationId },
      orderBy: { startedAt: "desc" },
      take: 100,
      include: { environment: { select: { name: true } }, _count: { select: { incidents: true } } },
    }),
    prisma.environment.findMany({ where: { organizationId, active: true }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Gravações</h1>
        <p className="mt-1 text-sm text-slate-500">Áudio e vídeo captados nos ambientes, com status de transcrição.</p>
      </div>

      <RecordingUploadForm environments={environments} />

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Ambiente</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ocorrências</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recordings.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/gravacoes/${r.id}`} className="font-medium text-brand-700">
                    {new Date(r.startedAt).toLocaleString("pt-BR")}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{r.environment.name}</td>
                <td className="px-4 py-3">
                  <RecordingStatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">{r._count.incidents}</td>
              </tr>
            ))}
            {recordings.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma gravação enviada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

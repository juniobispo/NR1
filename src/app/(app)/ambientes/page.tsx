import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NewEnvironmentForm } from "@/components/new-environment-form";

export default async function AmbientesPage() {
  const session = await auth();
  const organizationId = (session!.user as any).organizationId as string;

  const environments = await prisma.environment.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    include: { _count: { select: { recordings: true, incidents: true, devices: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Ambientes</h1>
          <p className="mt-1 text-sm text-slate-500">Salas, setores e áreas físicas monitoradas.</p>
        </div>
      </div>

      <NewEnvironmentForm />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {environments.map((env) => (
          <Link key={env.id} href={`/ambientes/${env.id}`} className="card hover:border-brand-300">
            <h3 className="font-semibold text-slate-900">{env.name}</h3>
            {env.location && <p className="text-sm text-slate-500">{env.location}</p>}
            <div className="mt-3 flex gap-4 text-xs text-slate-500">
              <span>{env._count.devices} dispositivo(s)</span>
              <span>{env._count.recordings} gravação(ões)</span>
              <span>{env._count.incidents} ocorrência(s)</span>
            </div>
          </Link>
        ))}
        {environments.length === 0 && (
          <p className="col-span-full text-sm text-slate-400">Nenhum ambiente cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}

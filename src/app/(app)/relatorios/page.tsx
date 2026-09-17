import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ReportsTabs } from "@/components/reports-tabs";

export default async function RelatoriosPage() {
  const session = await auth();
  const organizationId = (session!.user as any).organizationId as string;

  const environments = await prisma.environment.findMany({
    where: { organizationId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Relatórios</h1>
        <p className="mt-1 text-sm text-slate-500">
          Identifique quem, onde e quando as ocorrências mais graves acontecem — a base para antecipar
          problemas — ou gere o dossiê de conformidade com ocorrências confirmadas para NR1/PGR.
        </p>
      </div>
      <ReportsTabs environments={environments} />
    </div>
  );
}

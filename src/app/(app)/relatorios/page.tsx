import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Nr1ReportGenerator } from "@/components/nr1-report-generator";

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
        <h1 className="text-2xl font-semibold text-slate-900">Relatórios NR1</h1>
        <p className="mt-1 text-sm text-slate-500">
          Consolide ocorrências confirmadas e a evolução do risco em um período, para compor o dossiê de
          conformidade (PGR/NR1) ou embasar um processo interno de apuração.
        </p>
      </div>
      <Nr1ReportGenerator environments={environments} />
    </div>
  );
}

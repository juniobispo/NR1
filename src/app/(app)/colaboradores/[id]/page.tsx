import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { CopyLinkButton } from "@/components/copy-link-button";
import { ConsentToggleButton } from "@/components/consent-toggle-button";

const SOURCE_LABEL: Record<string, string> = {
  SELF: "Pelo próprio colaborador (link)",
  RH_MANUAL: "Registrado manualmente por RH/gestor",
};

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const organizationId = (session!.user as any).organizationId as string;

  const employee = await prisma.employee.findFirst({
    where: { id, organizationId },
    include: { consentRecords: { orderBy: { createdAt: "desc" } } },
  });
  if (!employee) notFound();

  const latest = employee.consentRecords[0];
  const granted = !!latest?.granted;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/colaboradores" className="text-sm text-brand-600">
          ← Colaboradores
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{employee.name}</h1>
        <p className="text-sm text-slate-500">
          {employee.role ?? "—"} {employee.department ? `· ${employee.department}` : ""}
        </p>
      </div>

      <section className="card">
        <h2 className="font-semibold text-slate-900">Link de consentimento</h2>
        <p className="mt-1 text-sm text-slate-500">
          Envie este link pessoal ao colaborador (ex.: por WhatsApp) para que ele mesmo leia o termo e
          confirme. A resposta fica registrada com data, hora, IP e dispositivo — para ser resgatada
          facilmente em caso de reclamação.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <CopyLinkButton path={`/consentimento/${employee.consentToken}`} />
          <span className="text-sm">
            Status atual:{" "}
            <span className={granted ? "font-medium text-emerald-600" : "font-medium text-red-600"}>
              {granted ? "Concedido" : "Não concedido"}
            </span>
          </span>
        </div>
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs text-slate-500">
            Alternativa: se o colaborador assinou um termo em papel, registre manualmente aqui (fica marcado
            como "registrado por RH", não como autoatendido).
          </p>
          <ConsentToggleButton employeeId={employee.id} granted={granted} />
        </div>
      </section>

      <section className="card">
        <h2 className="font-semibold text-slate-900">Histórico de consentimento</h2>
        <p className="mt-1 text-xs text-slate-500">
          Registro completo — a prova a apresentar em caso de reclamação ou fiscalização.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-4">Data</th>
                <th className="py-2 pr-4">Resultado</th>
                <th className="py-2 pr-4">Origem</th>
                <th className="py-2 pr-4">IP</th>
                <th className="py-2 pr-4">Dispositivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employee.consentRecords.map((record) => (
                <tr key={record.id}>
                  <td className="py-2 pr-4 text-slate-600">{new Date(record.createdAt).toLocaleString("pt-BR")}</td>
                  <td className="py-2 pr-4">
                    <span className={record.granted ? "text-emerald-600" : "text-red-600"}>
                      {record.granted ? "Concedido" : "Não concedido / revogado"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-600">{SOURCE_LABEL[record.submittedBy] ?? record.submittedBy}</td>
                  <td className="py-2 pr-4 text-slate-500">{record.ipAddress ?? "—"}</td>
                  <td className="py-2 pr-4 max-w-[220px] truncate text-slate-500" title={record.userAgent ?? undefined}>
                    {record.userAgent ?? "—"}
                  </td>
                </tr>
              ))}
              {employee.consentRecords.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">
                    Nenhum registro ainda. Envie o link acima para o colaborador.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

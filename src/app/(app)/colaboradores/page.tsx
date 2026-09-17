import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NewEmployeeForm } from "@/components/new-employee-form";
import { ConsentToggleButton } from "@/components/consent-toggle-button";

export default async function ColaboradoresPage() {
  const session = await auth();
  const organizationId = (session!.user as any).organizationId as string;

  const employees = await prisma.employee.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    include: { consentRecords: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Colaboradores</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cadastro e controle de consentimento para gravação de áudio/vídeo (LGPD). Sem consentimento
          registrado, a gravação não deve ser usada como base probatória contra o colaborador.
        </p>
      </div>

      <details className="card group">
        <summary className="cursor-pointer list-none font-semibold text-slate-900">
          <span className="inline-flex items-center gap-2">
            ⚖️ Base legal desta captação
            <span className="text-xs font-normal text-brand-600 group-open:hidden">(clique para ver)</span>
          </span>
        </summary>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <p>
            <strong>Vídeo:</strong> monitoramento por câmera no ambiente de trabalho é considerado lícito pela
            jurisprudência do TST, desde que haja transparência (colaborador sabe que existe) e
            proporcionalidade (nunca em banheiro, vestiário ou área de descanso).
          </p>
          <p>
            <strong>Áudio:</strong> é mais sensível. A gravação de conversa é pacificamente lícita quando feita
            por quem participa dela — não é o caso aqui, já que o dispositivo capta conversas entre
            colaboradores das quais a empresa não participa. Não há vedação penal específica (isso não é
            interceptação telefônica), mas também não há jurisprudência tão consolidada quanto a de câmeras
            para esse formato. Por isso o consentimento abaixo é <strong>obrigatório</strong>, não opcional: é a
            camada de segurança jurídica que sustenta o uso do áudio como evidência.
          </p>
          <p className="text-xs text-slate-500">
            Isto é um resumo informativo, não parecer jurídico. Valide sua política de monitoramento com
            advogado trabalhista/DPO antes de operar em produção — detalhes e fontes em{" "}
            <code>docs/COMPLIANCE.md</code> no repositório do projeto.
          </p>
        </div>
      </details>

      <NewEmployeeForm />

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Departamento</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Consentimento</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((emp) => {
              const latestConsent = emp.consentRecords[0];
              const granted = !!latestConsent?.granted;
              return (
                <tr key={emp.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{emp.name}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.department ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.role ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={granted ? "text-emerald-600" : "text-red-600"}>
                      {granted ? "Concedido" : "Não concedido"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ConsentToggleButton employeeId={emp.id} granted={granted} />
                  </td>
                </tr>
              );
            })}
            {employees.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Nenhum colaborador cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

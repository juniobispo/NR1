import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ConsentActionButtons } from "@/components/consent-action-buttons";

export default async function ConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const employee = await prisma.employee.findUnique({
    where: { consentToken: token },
    include: {
      organization: { select: { name: true, cnpj: true, retentionDays: true } },
      consentRecords: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!employee) notFound();

  const latest = employee.consentRecords[0];

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <div className="card">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          Termo de ciência e consentimento
        </p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">
          Gravação de ambiente de trabalho — {employee.organization.name}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Este link é pessoal, destinado a <strong>{employee.name}</strong>. Se você não for essa pessoa, feche
          esta página.
        </p>

        <div className="mt-6 space-y-4 text-sm text-slate-700">
          <section>
            <h2 className="font-semibold text-slate-900">O que é coletado</h2>
            <p className="mt-1">
              Áudio e vídeo do ambiente de trabalho onde você atua, incluindo transcrição automática das
              conversas com identificação de quem falou.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">Finalidade</h2>
            <p className="mt-1">
              Monitorar o ambiente de trabalho com a finalidade de <strong>antecipar e prevenir reclamações e
              riscos relacionados à NR-1</strong> (fatores de risco psicossociais relacionados ao trabalho —
              assédio, conflitos, ofensas entre colaboradores), documentando evidências para apuração e para o
              Programa de Gerenciamento de Riscos (PGR) da empresa.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">Base legal</h2>
            <p className="mt-1">
              Cumprimento de obrigação legal/regulatória (NR-1) e/ou legítimo interesse do empregador, nos
              termos da Lei Geral de Proteção de Dados (LGPD), sempre com transparência sobre a existência da
              gravação.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">Retenção</h2>
            <p className="mt-1">
              As gravações e transcrições são mantidas por até {employee.organization.retentionDays} dias,
              exceto quando vinculadas a uma ocorrência formalmente apurada, cuja retenção segue a política
              jurídica da empresa.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">Seus direitos</h2>
            <p className="mt-1">
              Você pode solicitar informações sobre os dados coletados e, a qualquer momento, revogar este
              consentimento voltando a este mesmo link — a revogação não afeta gravações já produzidas até a
              data da revogação.
            </p>
          </section>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          {latest && (
            <p className="mb-3 text-xs text-slate-500">
              Última resposta registrada: {latest.granted ? "consentimento concedido" : "não concedido/revogado"}
              {" "}em {new Date(latest.createdAt).toLocaleString("pt-BR")}.
            </p>
          )}
          <ConsentActionButtons token={token} />
        </div>
      </div>
    </main>
  );
}

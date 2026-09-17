import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export default async function ConfiguracoesPage() {
  const session = await auth();
  const organizationId = (session!.user as any).organizationId as string;

  const [organization, usersCount] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: organizationId } }),
    prisma.user.count({ where: { organizationId } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Configurações</h1>
        <p className="mt-1 text-sm text-slate-500">Dados da conta e política de retenção de dados.</p>
      </div>

      <section className="card space-y-3">
        <h2 className="font-semibold text-slate-900">Empresa</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-slate-500">Nome</dt>
          <dd className="text-slate-800">{organization.name}</dd>
          <dt className="text-slate-500">CNPJ</dt>
          <dd className="text-slate-800">{organization.cnpj ?? "—"}</dd>
          <dt className="text-slate-500">Plano</dt>
          <dd className="text-slate-800">{organization.plan}</dd>
          <dt className="text-slate-500">Usuários</dt>
          <dd className="text-slate-800">{usersCount}</dd>
        </dl>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold text-slate-900">Retenção de dados</h2>
        <p className="text-sm text-slate-600">
          Gravações e transcrições são mantidas por até <strong>{organization.retentionDays} dias</strong>{" "}
          antes de elegíveis para exclusão automática, conforme princípio de minimização da LGPD. Ocorrências
          confirmadas e relatórios gerados devem seguir política de retenção jurídica própria (ver
          docs/COMPLIANCE.md).
        </p>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold text-slate-900">Provedor de transcrição</h2>
        <p className="text-sm text-slate-600">
          Configurado via variável de ambiente <code>TRANSCRIPTION_PROVIDER</code>. Consulte o README para
          trocar entre o provedor de desenvolvimento (mock) e um provedor real com diarização (AssemblyAI).
        </p>
      </section>
    </div>
  );
}

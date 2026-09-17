import Link from "next/link";

const pilares = [
  {
    titulo: "Captação",
    texto: "Gravação de áudio e vídeo dos ambientes de trabalho, com consentimento formal registrado por colaborador.",
  },
  {
    titulo: "Transcrição com falantes",
    texto: "Transcrição automática com identificação de quem falou cada trecho (diarização), pronta para consulta e auditoria.",
  },
  {
    titulo: "Detecção de ocorrências",
    texto: "Sinalização automática de indícios de ofensa, ameaça e assédio, com triagem humana antes de virar documentação formal.",
  },
  {
    titulo: "Antecipação de risco",
    texto: "Painel de risco por ambiente e equipe, para agir antes que uma situação se agrave — o espírito da NR1.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold text-brand-700">NR1 Prova</span>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary">
              Entrar
            </Link>
            <Link href="/register" className="btn-primary">
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-600">
          Conformidade NR1 · Riscos psicossociais
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
          Documentação probatória do que acontece no seu escritório
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Grave, transcreva com identificação de falantes e organize evidências de ambientes de trabalho.
          Comprove ofensas entre funcionários e antecipe situações que colocam a empresa em risco.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/register" className="btn-primary px-6 py-3 text-base">
            Começar agora
          </Link>
          <Link href="#como-funciona" className="btn-secondary px-6 py-3 text-base">
            Ver como funciona
          </Link>
        </div>
      </section>

      <section id="como-funciona" className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold text-slate-900">Como a plataforma funciona</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pilares.map((p, i) => (
              <div key={p.titulo} className="card">
                <span className="badge bg-brand-50 text-brand-700">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-semibold text-slate-900">{p.titulo}</h3>
                <p className="mt-2 text-sm text-slate-600">{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold text-slate-900">Uso responsável e dentro da lei</h2>
        <p className="mt-4 text-slate-600">
          A gravação de ambientes de trabalho envolve dados sensíveis de colaboradores e exige base legal,
          transparência e consentimento (LGPD) além de alinhamento com a legislação trabalhista (CLT). A
          plataforma exige registro formal de consentimento por colaborador e ambiente antes de tratar
          qualquer gravação como prova. Recomendamos validação jurídica da sua política de monitoramento
          antes de operar em produção.
        </p>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} NR1 Prova. Todos os direitos reservados.
      </footer>
    </main>
  );
}

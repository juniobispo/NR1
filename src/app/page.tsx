import Link from "next/link";

const dores = [
  {
    titulo: "Sem jurídico interno",
    texto: "Loja e comércio raramente têm um departamento jurídico grande. Quando um conflito vira processo, a empresa já começa em desvantagem.",
  },
  {
    titulo: "Alta rotatividade",
    texto: "Times de loja mudam com frequência. Sem registro do que acontece no dia a dia, cada saída de funcionário é uma versão diferente da história.",
  },
  {
    titulo: "Vários turnos, poucos olhos",
    texto: "Com escala, PDV e estoque rodando em turnos, o dono ou gerente não está presente pra ver (ou ouvir) tudo o que acontece entre a equipe.",
  },
];

const pilares = [
  {
    titulo: "Captação",
    texto: "Gravação de áudio e vídeo da loja/estabelecimento, com consentimento formal registrado por colaborador.",
  },
  {
    titulo: "Transcrição com falantes",
    texto: "Transcrição automática com identificação de quem falou cada trecho, pronta pra consulta — sem precisar assistir horas de vídeo.",
  },
  {
    titulo: "Detecção de ocorrências",
    texto: "Sinalização automática de indícios de ofensa, ameaça e conflito entre a equipe, com triagem humana antes de virar caso formal.",
  },
  {
    titulo: "Matriz de risco",
    texto: "Cada loja/ambiente ranqueado por risco, com os horários e pessoas que mais se repetem — pra agir antes do problema virar prejuízo.",
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
          Feito para o varejo e o comércio · NR1 na prática
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
          Proteja sua loja antes que um conflito interno vire processo
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Grave o ambiente, transcreva automaticamente com identificação de quem falou e monte a matriz de
          risco da sua equipe — sem precisar de um departamento jurídico grande pra agir a tempo.
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

      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold text-slate-900">
            Por que o varejo precisa agir antes, não depois
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {dores.map((d) => (
              <div key={d.titulo} className="card">
                <h3 className="font-semibold text-slate-900">{d.titulo}</h3>
                <p className="mt-2 text-sm text-slate-600">{d.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="py-16">
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

      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-2xl font-semibold text-slate-900">A matriz de risco é o que muda o jogo</h2>
          <p className="mt-4 text-slate-600">
            Em vez de descobrir o problema só quando vira reclamação formal, você enxerga com antecedência:
            qual loja concentra mais ocorrências, em que horário elas acontecem e se o mesmo colaborador
            aparece repetido. E gera essa classificação por probabilidade × severidade — o mesmo formato do
            Inventário de Riscos exigido no PGR da NR-1 — pronta para o profissional de SST da sua empresa
            revisar e formalizar. Isso é o que separa reagir de antecipar.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold text-slate-900">Uso responsável e dentro da lei</h2>
        <p className="mt-4 text-slate-600">
          A gravação do ambiente de trabalho envolve dados sensíveis de colaboradores e exige base legal,
          transparência e consentimento (LGPD), além de alinhamento com a legislação trabalhista (CLT). A
          plataforma exige registro formal de consentimento por colaborador antes de tratar qualquer gravação
          como prova. Recomendamos validação jurídica da sua política de monitoramento antes de operar em
          produção.
        </p>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} NR1 Prova. Todos os direitos reservados.
      </footer>
    </main>
  );
}

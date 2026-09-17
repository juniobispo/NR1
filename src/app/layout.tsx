import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NR1 Prova | Matriz de risco e documentação NR1 para o varejo",
  description:
    "Plataforma SaaS que grava e transcreve o ambiente da loja, monta a matriz de risco da equipe e ajuda o varejo a agir antes de um conflito interno virar processo trabalhista.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

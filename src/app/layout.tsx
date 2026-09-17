import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NR1 Prova | Documentação probatória para conformidade NR1",
  description:
    "Plataforma SaaS que grava, transcreve e organiza evidências de ambientes de trabalho para documentação de conformidade com a NR1.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

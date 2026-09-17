import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Visão geral" },
  { href: "/ambientes", label: "Ambientes" },
  { href: "/gravacoes", label: "Gravações" },
  { href: "/incidentes", label: "Ocorrências" },
  { href: "/colaboradores", label: "Colaboradores" },
  { href: "/relatorios", label: "Relatórios NR1" },
  { href: "/configuracoes", label: "Configurações" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-slate-50 print:bg-white">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white print:hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <Link href="/dashboard" className="text-base font-semibold text-brand-700">
            NR1 Prova
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <p className="truncate text-sm font-medium text-slate-800">{session.user.name}</p>
          <p className="truncate text-xs text-slate-500">{session.user.email}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="btn-secondary mt-3 w-full">
              Sair
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}

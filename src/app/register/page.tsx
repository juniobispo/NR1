"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: "",
    cnpj: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });

    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error?.formErrors?.[0] ?? body.error ?? "Não foi possível criar a conta.");
      return;
    }
    router.push("/login?criada=1");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="text-lg font-semibold text-brand-700">
            NR1 Prova
          </Link>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Criar conta da empresa</h1>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div>
            <label className="label">Nome da empresa</label>
            <input required className="input" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
          </div>
          <div>
            <label className="label">CNPJ (opcional)</label>
            <input className="input" value={form.cnpj} onChange={(e) => update("cnpj", e.target.value)} />
          </div>
          <div>
            <label className="label">Seu nome</label>
            <input required className="input" value={form.adminName} onChange={(e) => update("adminName", e.target.value)} />
          </div>
          <div>
            <label className="label">Seu e-mail</label>
            <input required type="email" className="input" value={form.adminEmail} onChange={(e) => update("adminEmail", e.target.value)} />
          </div>
          <div>
            <label className="label">Senha (mín. 8 caracteres)</label>
            <input required type="password" minLength={8} className="input" value={form.adminPassword} onChange={(e) => update("adminPassword", e.target.value)} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Criando..." : "Criar conta"}
          </button>
          <p className="text-center text-sm text-slate-500">
            Já tem conta?{" "}
            <Link href="/login" className="font-medium text-brand-600">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

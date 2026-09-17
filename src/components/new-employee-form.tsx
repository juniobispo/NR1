"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewEmployeeForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", department: "", role: "" });
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/employees", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email || undefined,
        department: form.department || undefined,
        role: form.role || undefined,
      }),
    });
    setLoading(false);
    setForm({ name: "", email: "", department: "", role: "" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        Novo colaborador
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card grid gap-3 sm:grid-cols-2">
      <div>
        <label className="label">Nome</label>
        <input required className="input" value={form.name} onChange={(e) => update("name", e.target.value)} />
      </div>
      <div>
        <label className="label">E-mail (opcional)</label>
        <input type="email" className="input" value={form.email} onChange={(e) => update("email", e.target.value)} />
      </div>
      <div>
        <label className="label">Departamento</label>
        <input className="input" value={form.department} onChange={(e) => update("department", e.target.value)} />
      </div>
      <div>
        <label className="label">Cargo</label>
        <input className="input" value={form.role} onChange={(e) => update("role", e.target.value)} />
      </div>
      <div className="sm:col-span-2 flex gap-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Salvando..." : "Salvar"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

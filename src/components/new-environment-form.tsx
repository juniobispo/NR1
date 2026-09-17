"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewEnvironmentForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/environments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, location: location || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Não foi possível criar o ambiente.");
      return;
    }
    setName("");
    setLocation("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        Novo ambiente
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-wrap items-end gap-3">
      <div>
        <label className="label">Nome</label>
        <input required className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sala de reunião 2" />
      </div>
      <div>
        <label className="label">Localização (opcional)</label>
        <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="2º andar" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
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

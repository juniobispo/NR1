"use client";

import { useState } from "react";
import Link from "next/link";
import { SeverityBadge, IncidentTypeLabel } from "@/components/badges";

type ReportResult = {
  report: { id: string; createdAt: string };
  incidents: any[];
  summary: { totalConfirmedIncidents: number; byType: Record<string, number>; averageRiskScore: number };
};

export function Nr1ReportGenerator({ environments }: { environments: { id: string; name: string }[] }) {
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [environmentId, setEnvironmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      periodStart: new Date(periodStart).toISOString(),
      periodEnd: new Date(periodEnd + "T23:59:59").toISOString(),
    });
    if (environmentId) params.set("environmentId", environmentId);

    const res = await fetch(`/api/reports/nr1?${params.toString()}`);
    setLoading(false);
    if (!res.ok) {
      setError("Não foi possível gerar o relatório.");
      return;
    }
    setResult(await res.json());
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleGenerate} className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="label">De</label>
          <input type="date" required className="input" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
        </div>
        <div>
          <label className="label">Até</label>
          <input type="date" required className="input" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        </div>
        <div>
          <label className="label">Ambiente (opcional)</label>
          <select className="input" value={environmentId} onChange={(e) => setEnvironmentId(e.target.value)}>
            <option value="">Todos</option>
            {environments.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Gerando..." : "Gerar relatório"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card">
              <p className="text-sm text-slate-500">Ocorrências confirmadas</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{result.summary.totalConfirmedIncidents}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500">Risco médio do período</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{result.summary.averageRiskScore}</p>
            </div>
            <div className="card">
              <p className="text-sm text-slate-500">Tipos mais frequentes</p>
              <ul className="mt-2 text-sm text-slate-700">
                {Object.entries(result.summary.byType).map(([type, count]) => (
                  <li key={type}>
                    <IncidentTypeLabel type={type} />: {count as number}
                  </li>
                ))}
                {Object.keys(result.summary.byType).length === 0 && <li className="text-slate-400">Nenhuma</li>}
              </ul>
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-slate-900">Ocorrências confirmadas no período</h2>
            <div className="mt-3 divide-y divide-slate-100">
              {result.incidents.map((incident) => (
                <div key={incident.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">
                      <IncidentTypeLabel type={incident.type} /> · {incident.environment.name}
                    </span>
                    <SeverityBadge severity={incident.severity} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{new Date(incident.createdAt).toLocaleString("pt-BR")}</p>
                  {incident.transcriptSegment?.text && (
                    <p className="mt-1 text-sm italic text-slate-600">"{incident.transcriptSegment.text}"</p>
                  )}
                  <Link href={`/incidentes/${incident.id}`} className="text-sm font-medium text-brand-600">
                    Ver detalhes →
                  </Link>
                </div>
              ))}
              {result.incidents.length === 0 && (
                <p className="py-3 text-sm text-slate-400">Nenhuma ocorrência confirmada no período selecionado.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

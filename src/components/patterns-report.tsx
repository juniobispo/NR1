"use client";

import { useState } from "react";
import Link from "next/link";
import { SeverityBadge, IncidentTypeLabel } from "@/components/badges";

type Offender = { employeeId: string; name: string; count: number; bySeverity: Record<string, number> };
type EnvRow = { environmentId: string; name: string; count: number; weighted: number };
type HourRow = { hour: number; count: number };
type WeekdayRow = { weekday: number; label: string; count: number };
type IncidentRow = {
  id: string;
  type: string;
  severity: string;
  occurredAt: string;
  environmentName: string;
  personName: string | null;
  triggerText: string | null;
};

type PatternsResult = {
  totalIncidents: number;
  topOffenders: Offender[];
  topEnvironments: EnvRow[];
  byHour: HourRow[];
  byWeekday: WeekdayRow[];
  topIncidents: IncidentRow[];
};

function HorizontalBarList({ rows, labelWidth = "w-40" }: { rows: { label: string; value: number }[]; labelWidth?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3 text-sm" title={`${row.label}: ${row.value}`}>
          <span className={`${labelWidth} shrink-0 truncate text-slate-700`}>{row.label}</span>
          <div className="h-3 flex-1 rounded-full bg-brand-50">
            <div
              className="h-3 rounded-full bg-brand-500"
              style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-xs font-medium text-slate-500">{row.value}</span>
        </div>
      ))}
      {rows.length === 0 && <p className="text-sm text-slate-400">Sem dados no período.</p>}
    </div>
  );
}

function VerticalBarChart({ rows, labelEvery = 1 }: { rows: { label: string; value: number }[]; labelEvery?: number }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="flex h-28 items-end gap-1">
      {rows.map((row, i) => (
        <div key={row.label} className="flex flex-1 flex-col items-center gap-1" title={`${row.label}: ${row.value}`}>
          <div
            className="w-full min-w-[3px] rounded-t bg-brand-500"
            style={{ height: `${Math.max(2, (row.value / max) * 96)}px` }}
          />
          <span className="text-[10px] text-slate-400">{i % labelEvery === 0 ? row.label : ""}</span>
        </div>
      ))}
    </div>
  );
}

export function PatternsReport({ environments }: { environments: { id: string; name: string }[] }) {
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [environmentId, setEnvironmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PatternsResult | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      periodStart: new Date(periodStart).toISOString(),
      periodEnd: new Date(periodEnd + "T23:59:59").toISOString(),
    });
    if (environmentId) params.set("environmentId", environmentId);

    const res = await fetch(`/api/reports/patterns?${params.toString()}`);
    setLoading(false);
    if (!res.ok) {
      setError("Não foi possível gerar o relatório de padrões.");
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
          {loading ? "Analisando..." : "Analisar padrões"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="space-y-6">
          <div className="card">
            <p className="text-sm text-slate-500">Ocorrências não descartadas no período</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{result.totalIncidents}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card">
              <h2 className="font-semibold text-slate-900">Reincidência por pessoa</h2>
              <p className="mt-1 text-xs text-slate-500">
                Quem mais aparece como autor de ocorrências — sinal direto de onde intervir antes que se agrave.
              </p>
              <div className="mt-4">
                <HorizontalBarList rows={result.topOffenders.map((o) => ({ label: o.name, value: o.count }))} />
              </div>
            </section>

            <section className="card">
              <h2 className="font-semibold text-slate-900">Ambientes mais críticos</h2>
              <p className="mt-1 text-xs text-slate-500">Ponderado por severidade, não só por quantidade.</p>
              <div className="mt-4">
                <HorizontalBarList rows={result.topEnvironments.map((e) => ({ label: e.name, value: Math.round(e.weighted) }))} />
              </div>
            </section>

            <section className="card">
              <h2 className="font-semibold text-slate-900">Horário do dia</h2>
              <p className="mt-1 text-xs text-slate-500">Em que faixas de horário as ocorrências mais acontecem.</p>
              <div className="mt-4">
                <VerticalBarChart
                  rows={result.byHour.map((h) => ({ label: `${h.hour}h`, value: h.count }))}
                  labelEvery={3}
                />
              </div>
            </section>

            <section className="card">
              <h2 className="font-semibold text-slate-900">Dia da semana</h2>
              <p className="mt-1 text-xs text-slate-500">Padrão semanal de ocorrências.</p>
              <div className="mt-4">
                <VerticalBarChart rows={result.byWeekday.map((w) => ({ label: w.label.slice(0, 3), value: w.count }))} />
              </div>
            </section>
          </div>

          <section className="card">
            <h2 className="font-semibold text-slate-900">Maiores ofensas do período</h2>
            <p className="mt-1 text-xs text-slate-500">
              Ranqueadas por severidade e recência — o ponto de partida para uma apuração ou dossiê.
            </p>
            <div className="mt-4 divide-y divide-slate-100">
              {result.topIncidents.map((incident) => (
                <Link
                  key={incident.id}
                  href={`/incidentes/${incident.id}`}
                  className="block py-3 hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800">
                      <IncidentTypeLabel type={incident.type} />
                    </span>
                    <SeverityBadge severity={incident.severity} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>Quem: {incident.personName ?? "não identificado"}</span>
                    <span>Local: {incident.environmentName}</span>
                    <span>Quando: {new Date(incident.occurredAt).toLocaleString("pt-BR")}</span>
                  </div>
                  {incident.triggerText && (
                    <p className="mt-1 text-sm italic text-slate-600">"{incident.triggerText}"</p>
                  )}
                </Link>
              ))}
              {result.topIncidents.length === 0 && (
                <p className="py-3 text-sm text-slate-400">Nenhuma ocorrência no período selecionado.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

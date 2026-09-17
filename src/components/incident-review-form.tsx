"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Employee = { id: string; name: string };
type Involved = { employeeId: string; roleInIncident: "OFENSOR" | "VITIMA" | "TESTEMUNHA" | "ENVOLVIDO" };

const ROLE_LABEL: Record<Involved["roleInIncident"], string> = {
  OFENSOR: "Ofensor(a)",
  VITIMA: "Vítima",
  TESTEMUNHA: "Testemunha",
  ENVOLVIDO: "Envolvido(a)",
};

export function IncidentReviewForm({
  incidentId,
  employees,
  initialStatus,
  initialInvolved,
}: {
  incidentId: string;
  employees: Employee[];
  initialStatus: string;
  initialInvolved: Involved[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState("");
  const [involved, setInvolved] = useState<Involved[]>(initialInvolved);
  const [loading, setLoading] = useState(false);

  function addInvolved() {
    if (employees.length === 0) return;
    setInvolved((prev) => [...prev, { employeeId: employees[0].id, roleInIncident: "ENVOLVIDO" }]);
  }

  function updateInvolved(index: number, patch: Partial<Involved>) {
    setInvolved((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function removeInvolved(index: number) {
    setInvolved((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/incidents/${incidentId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, reviewNotes: notes || undefined, involvedEmployees: involved }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="font-semibold text-slate-900">Apuração</h2>

      <div>
        <label className="label">Status</label>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="UNDER_REVIEW">Em apuração</option>
          <option value="CONFIRMED">Confirmar ocorrência</option>
          <option value="DISMISSED">Descartar (falso positivo)</option>
        </select>
      </div>

      <div>
        <label className="label">Colaboradores envolvidos</label>
        <div className="space-y-2">
          {involved.map((item, index) => (
            <div key={index} className="flex gap-2">
              <select
                className="input"
                value={item.employeeId}
                onChange={(e) => updateInvolved(index, { employeeId: e.target.value })}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
              <select
                className="input"
                value={item.roleInIncident}
                onChange={(e) => updateInvolved(index, { roleInIncident: e.target.value as Involved["roleInIncident"] })}
              >
                {Object.entries(ROLE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button type="button" className="btn-secondary" onClick={() => removeInvolved(index)}>
                Remover
              </button>
            </div>
          ))}
          <button type="button" className="btn-secondary" onClick={addInvolved} disabled={employees.length === 0}>
            + Adicionar colaborador
          </button>
        </div>
      </div>

      <div>
        <label className="label">Observações da apuração</label>
        <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Salvando..." : "Salvar apuração"}
      </button>
    </form>
  );
}

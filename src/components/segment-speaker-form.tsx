"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Employee = { id: string; name: string };

export function SegmentSpeakerForm({
  segmentId,
  employees,
  currentEmployeeId,
}: {
  segmentId: string;
  employees: Employee[];
  currentEmployeeId?: string | null;
}) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState(currentEmployeeId ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId) return;
    setLoading(true);
    await fetch(`/api/transcript-segments/${segmentId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ employeeId }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <select className="input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
        <option value="">Selecionar colaborador...</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.name}
          </option>
        ))}
      </select>
      <button type="submit" disabled={loading || !employeeId} className="btn-secondary">
        {loading ? "Salvando..." : "Identificar quem falou"}
      </button>
    </form>
  );
}

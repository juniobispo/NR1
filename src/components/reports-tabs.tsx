"use client";

import { useState } from "react";
import { Nr1ReportGenerator } from "@/components/nr1-report-generator";
import { PatternsReport } from "@/components/patterns-report";

export function ReportsTabs({ environments }: { environments: { id: string; name: string }[] }) {
  const [tab, setTab] = useState<"nr1" | "padroes">("padroes");

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-200">
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === "padroes" ? "border-b-2 border-brand-600 text-brand-700" : "text-slate-500"}`}
          onClick={() => setTab("padroes")}
        >
          Padrões & reincidência
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === "nr1" ? "border-b-2 border-brand-600 text-brand-700" : "text-slate-500"}`}
          onClick={() => setTab("nr1")}
        >
          Dossiê de conformidade NR1
        </button>
      </div>

      {tab === "padroes" ? (
        <PatternsReport environments={environments} />
      ) : (
        <Nr1ReportGenerator environments={environments} />
      )}
    </div>
  );
}

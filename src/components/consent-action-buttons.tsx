"use client";

import { useState } from "react";

export function ConsentActionButtons({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [outcome, setOutcome] = useState<"granted" | "denied" | null>(null);

  async function handleClick(granted: boolean) {
    setStatus("loading");
    const res = await fetch(`/api/consent/${token}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ granted }),
    });
    setStatus("done");
    setOutcome(res.ok ? (granted ? "granted" : "denied") : null);
  }

  if (status === "done") {
    return (
      <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
        {outcome === "granted" && "Consentimento registrado. Obrigado — você pode fechar esta página."}
        {outcome === "denied" && "Sua recusa foi registrada. Você pode fechar esta página."}
        {outcome === null && "Não foi possível registrar sua resposta. Tente novamente ou avise o RH."}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={status === "loading"} onClick={() => handleClick(true)} className="btn-primary">
        Estou ciente e concordo
      </button>
      <button type="button" disabled={status === "loading"} onClick={() => handleClick(false)} className="btn-secondary">
        Não concordo
      </button>
    </div>
  );
}

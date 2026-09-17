"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConsentToggleButton({ employeeId, granted }: { employeeId: string; granted: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch(`/api/employees/${employeeId}/consent`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ granted: !granted }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={granted ? "btn-danger" : "btn-primary"}
    >
      {loading ? "Salvando..." : granted ? "Revogar consentimento" : "Registrar consentimento"}
    </button>
  );
}

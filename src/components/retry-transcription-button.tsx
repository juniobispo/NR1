"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RetryTranscriptionButton({ recordingId }: { recordingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch(`/api/recordings/${recordingId}/transcribe`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button className="btn-secondary" onClick={handleClick} disabled={loading}>
      {loading ? "Enfileirando..." : "Reprocessar transcrição"}
    </button>
  );
}

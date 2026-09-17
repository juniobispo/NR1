"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RecordingUploadForm({ environments }: { environments: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [environmentId, setEnvironmentId] = useState(environments[0]?.id ?? "");
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !environmentId) return;
    setLoading(true);
    setError(null);

    try {
      const mediaKind = file.type.startsWith("audio") ? "audio" : "video";
      const extension = file.name.split(".").pop() || (mediaKind === "audio" ? "mp3" : "mp4");

      const urlRes = await fetch("/api/recordings/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ environmentId, contentType: file.type || "application/octet-stream", extension }),
      });
      if (!urlRes.ok) throw new Error("Falha ao preparar upload (verifique a configuração de storage).");
      const { uploadUrl, objectKey } = await urlRes.json();

      const putRes = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "content-type": file.type || "application/octet-stream" } });
      if (!putRes.ok) throw new Error("Falha ao enviar o arquivo para o storage.");

      const createRes = await fetch("/api/recordings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          environmentId,
          objectKey,
          mediaKind,
          startedAt: new Date(startedAt).toISOString(),
          fileSizeBytes: file.size,
          autoTranscribe: true,
        }),
      });
      if (!createRes.ok) throw new Error("Falha ao registrar a gravação.");

      setOpen(false);
      setFile(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)} disabled={environments.length === 0}>
        Enviar gravação
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Ambiente</label>
          <select required className="input" value={environmentId} onChange={(e) => setEnvironmentId(e.target.value)}>
            {environments.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Início da gravação</label>
          <input type="datetime-local" required className="input" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Arquivo (áudio ou vídeo)</label>
        <input required type="file" accept="audio/*,video/*" className="input" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Enviando..." : "Enviar e transcrever"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

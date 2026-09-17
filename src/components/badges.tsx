const SEVERITY_STYLES: Record<string, string> = {
  LOW: "bg-emerald-50 text-emerald-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-red-50 text-red-700",
};

const SEVERITY_LABEL: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

export function SeverityBadge({ severity }: { severity: string }) {
  return <span className={`badge ${SEVERITY_STYLES[severity] ?? "bg-slate-100 text-slate-700"}`}>{SEVERITY_LABEL[severity] ?? severity}</span>;
}

const STATUS_STYLES: Record<string, string> = {
  DETECTED: "bg-amber-50 text-amber-700",
  UNDER_REVIEW: "bg-blue-50 text-blue-700",
  CONFIRMED: "bg-red-50 text-red-700",
  DISMISSED: "bg-slate-100 text-slate-500",
};

const STATUS_LABEL: Record<string, string> = {
  DETECTED: "Sinalizado",
  UNDER_REVIEW: "Em apuração",
  CONFIRMED: "Confirmado",
  DISMISSED: "Descartado",
};

export function IncidentStatusBadge({ status }: { status: string }) {
  return <span className={`badge ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700"}`}>{STATUS_LABEL[status] ?? status}</span>;
}

const RECORDING_STATUS_LABEL: Record<string, string> = {
  UPLOADED: "Enviada",
  QUEUED: "Na fila",
  TRANSCRIBING: "Transcrevendo",
  TRANSCRIBED: "Transcrita",
  FAILED: "Falhou",
};

export function RecordingStatusBadge({ status }: { status: string }) {
  const style = status === "FAILED" ? "bg-red-50 text-red-700" : status === "TRANSCRIBED" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600";
  return <span className={`badge ${style}`}>{RECORDING_STATUS_LABEL[status] ?? status}</span>;
}

const TYPE_LABEL: Record<string, string> = {
  OFENSA_VERBAL: "Ofensa verbal",
  ASSEDIO_MORAL: "Assédio moral",
  ASSEDIO_SEXUAL: "Assédio sexual",
  AMEACA: "Ameaça",
  CONFLITO: "Conflito",
  DISCRIMINACAO: "Discriminação",
  OUTRO: "Outro",
};

export function IncidentTypeLabel({ type }: { type: string }) {
  return <>{TYPE_LABEL[type] ?? type}</>;
}

export function riskColor(score: number) {
  if (score >= 70) return "text-risk-critical";
  if (score >= 40) return "text-risk-high";
  if (score >= 15) return "text-risk-medium";
  return "text-risk-low";
}

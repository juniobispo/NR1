import type { IncidentSeverity, IncidentType } from "@prisma/client";

/**
 * Classificação de risco no formato probabilidade × severidade — a estrutura
 * usada no Inventário de Riscos do PGR (Programa de Gerenciamento de Riscos)
 * exigido pela NR-1, e não um score livre de 0-100.
 *
 * A NR-1 (atualizada pela Portaria MTE nº 1.419/2024, obrigatória desde
 * 26/05/2026 após o período de transição) inclui expressamente os Fatores de
 * Risco Psicossociais Relacionados ao Trabalho (FRPRT) — assédio moral,
 * violência, relações interpessoais prejudiciais, discriminação, entre
 * outros — no mesmo Inventário de Riscos que já classifica riscos físicos,
 * químicos e biológicos, seguindo a mesma lógica de probabilidade × gravidade.
 *
 * A norma NÃO prescreve uma tabela numérica única de probabilidade/severidade
 * — cada PGR define seus próprios critérios. A classificação abaixo é uma
 * metodologia padrão e explicável, pensada para dar um ponto de partida
 * documentado; o profissional de SST responsável pelo PGR da empresa deve
 * validar ou ajustar os critérios antes de formalizar o documento oficial.
 */

export const FRPRT_CATEGORY: Record<IncidentType, string> = {
  OFENSA_VERBAL: "Relações interpessoais prejudiciais",
  ASSEDIO_MORAL: "Assédio moral",
  ASSEDIO_SEXUAL: "Assédio sexual",
  AMEACA: "Violência no trabalho",
  CONFLITO: "Relações interpessoais prejudiciais",
  DISCRIMINACAO: "Discriminação",
  OUTRO: "Outros fatores psicossociais",
};

const SEVERITY_LABEL: Record<IncidentSeverity, string> = {
  LOW: "Leve",
  MEDIUM: "Moderada",
  HIGH: "Grave",
  CRITICAL: "Gravíssima",
};

const SEVERITY_RANK: Record<IncidentSeverity, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

type ProbabilityLabel = "Rara" | "Improvável" | "Possível" | "Provável" | "Quase certa";

const PROBABILITY_BANDS: { max: number; label: ProbabilityLabel; rank: number }[] = [
  { max: 1, label: "Rara", rank: 1 },
  { max: 3, label: "Improvável", rank: 2 },
  { max: 6, label: "Possível", rank: 3 },
  { max: 10, label: "Provável", rank: 4 },
  { max: Infinity, label: "Quase certa", rank: 5 },
];

function classifyProbability(occurrences: number) {
  return PROBABILITY_BANDS.find((band) => occurrences <= band.max)!;
}

export type RiskLevel = "Baixo" | "Moderado" | "Alto" | "Crítico";

function classifyRiskLevel(probabilityRank: number, severityRank: number): RiskLevel {
  const score = probabilityRank * severityRank;
  if (score <= 2) return "Baixo";
  if (score <= 6) return "Moderado";
  if (score <= 12) return "Alto";
  return "Crítico";
}

export type RiskMatrixRow = {
  type: IncidentType;
  frprtCategory: string;
  occurrences: number;
  probability: ProbabilityLabel;
  dominantSeverity: string;
  riskLevel: RiskLevel;
};

/**
 * Agrupa ocorrências por tipo (proxy do fator de risco psicossocial) e
 * classifica cada linha em probabilidade × severidade × nível de risco,
 * no formato esperado pelo Inventário de Riscos do PGR.
 */
export function buildRiskMatrix(incidents: { type: IncidentType; severity: IncidentSeverity }[]): RiskMatrixRow[] {
  const byType = new Map<IncidentType, { count: number; maxSeverityRank: number }>();

  for (const incident of incidents) {
    const entry = byType.get(incident.type) ?? { count: 0, maxSeverityRank: 0 };
    entry.count += 1;
    entry.maxSeverityRank = Math.max(entry.maxSeverityRank, SEVERITY_RANK[incident.severity]);
    byType.set(incident.type, entry);
  }

  const severityByRank = Object.entries(SEVERITY_RANK).reduce<Record<number, IncidentSeverity>>((acc, [k, v]) => {
    acc[v] = k as IncidentSeverity;
    return acc;
  }, {});

  return [...byType.entries()]
    .map(([type, { count, maxSeverityRank }]) => {
      const probability = classifyProbability(count);
      const severity = severityByRank[maxSeverityRank];
      return {
        type,
        frprtCategory: FRPRT_CATEGORY[type],
        occurrences: count,
        probability: probability.label,
        dominantSeverity: SEVERITY_LABEL[severity],
        riskLevel: classifyRiskLevel(probability.rank, maxSeverityRank),
      };
    })
    .sort((a, b) => b.occurrences - a.occurrences);
}

import type { IncidentSeverity, IncidentType, Sentiment } from "@prisma/client";

/**
 * Detecção heurística de indícios de ofensa/conflito em um segmento de transcrição.
 *
 * Isso é um ponto de partida (MVP) baseado em léxico — suficiente para sinalizar
 * trechos que merecem revisão humana, NUNCA para decidir automaticamente que
 * houve assédio ou ofensa. Todo achado automático (`detectedBy: AUTO`) precisa
 * passar por triagem humana (RH/gestor) antes de virar documentação formal
 * (`IncidentStatus.CONFIRMED`).
 *
 * Evolução natural: trocar/complementar por um classificador de linguagem
 * (ex.: modelo de toxicidade/assédio treinado com dados rotulados da própria
 * base de ocorrências confirmadas), usando este módulo como fallback e como
 * gerador dos rótulos iniciais de treinamento.
 */

type LexiconEntry = {
  terms: string[];
  type: IncidentType;
  severity: IncidentSeverity;
};

const LEXICON: LexiconEntry[] = [
  {
    type: "AMEACA",
    severity: "CRITICAL",
    terms: ["vou te pegar", "vou te bater", "vou acabar com você", "você vai ver", "vou te demitir agora"],
  },
  {
    type: "ASSEDIO_SEXUAL",
    severity: "CRITICAL",
    terms: ["gostosa", "gostoso", "fica comigo", "corpo bonito", "sarada", "dá pra você"],
  },
  {
    type: "DISCRIMINACAO",
    severity: "HIGH",
    terms: ["macaco", "viado", "sua raça", "volta pro seu país", "não presta porque é mulher"],
  },
  {
    type: "OFENSA_VERBAL",
    severity: "HIGH",
    terms: ["idiota", "imbecil", "incompetente", "burro", "estúpido", "inútil", "retardado"],
  },
  {
    type: "ASSEDIO_MORAL",
    severity: "MEDIUM",
    terms: ["você não serve pra nada", "vou te humilhar", "todo mundo vai saber que você é ruim", "não sabe fazer nada direito"],
  },
  {
    type: "CONFLITO",
    severity: "LOW",
    terms: ["cala a boca", "não me interessa o que você pensa", "para de encher o saco", "some da minha frente"],
  },
];

export type DetectionMatch = {
  type: IncidentType;
  severity: IncidentSeverity;
  matchedTerms: string[];
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function detectIncident(text: string): DetectionMatch | null {
  const normalized = normalize(text);
  let best: DetectionMatch | null = null;

  for (const entry of LEXICON) {
    const matched = entry.terms.filter((term) => normalized.includes(normalize(term)));
    if (matched.length === 0) continue;

    if (!best || severityRank(entry.severity) > severityRank(best.severity)) {
      best = { type: entry.type, severity: entry.severity, matchedTerms: matched };
    }
  }

  return best;
}

function severityRank(severity: IncidentSeverity) {
  return { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 }[severity];
}

/**
 * Classificação simples de sentimento por segmento, usada tanto para priorizar
 * revisão humana quanto como insumo do cálculo de risco (ver risk-score.ts).
 */
export function classifySentiment(text: string): Sentiment {
  const normalized = normalize(text);
  const hostileHits = LEXICON.flatMap((e) => e.terms).filter((term) => normalized.includes(normalize(term)));
  if (hostileHits.length > 0) return "HOSTIL";

  const negativeWords = ["ruim", "péssimo", "não gostei", "errado", "problema", "atraso", "falha"];
  if (negativeWords.some((w) => normalized.includes(w))) return "NEGATIVO";

  const positiveWords = ["obrigado", "parabéns", "ótimo", "excelente", "bom trabalho", "combinado"];
  if (positiveWords.some((w) => normalized.includes(normalize(w)))) return "POSITIVO";

  return "NEUTRO";
}

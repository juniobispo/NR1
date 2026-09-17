import type { TranscriptionProvider, TranscriptionResult } from "./provider";

/**
 * Provider de desenvolvimento: gera uma transcrição sintética sem depender de
 * nenhuma API externa, permitindo rodar e demonstrar o pipeline completo
 * (fila -> transcrição -> segmentos -> detecção de incidente) sem custo e sem
 * chaves de API configuradas.
 */
export class MockProvider implements TranscriptionProvider {
  readonly name = "mock";

  async transcribe(input: { mediaUrl: string; languageHint?: string }): Promise<TranscriptionResult> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const segments = [
      {
        speakerLabel: "SPEAKER_00",
        startMs: 0,
        endMs: 4200,
        text: "Bom dia, pessoal. Vamos revisar as pendências da semana.",
        confidence: 0.95,
      },
      {
        speakerLabel: "SPEAKER_01",
        startMs: 4300,
        endMs: 9000,
        text: "Bom dia. Já terminei a parte que ficou comigo, só falta validar com o time.",
        confidence: 0.93,
      },
      {
        speakerLabel: "SPEAKER_00",
        startMs: 9200,
        endMs: 15500,
        text: "Perfeito. Precisamos fechar isso ainda hoje, então priorize essa validação.",
        confidence: 0.91,
      },
    ];

    return {
      provider: this.name,
      language: input.languageHint ?? "pt",
      segments,
      raw: { note: "resultado sintético gerado pelo MockProvider", mediaUrl: input.mediaUrl },
    };
  }
}

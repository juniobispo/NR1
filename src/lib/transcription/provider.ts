/**
 * Contrato comum para provedores de transcrição + diarização (identificação de falantes).
 * Isso permite trocar de fornecedor (AssemblyAI, Deepgram, um modelo self-hosted com
 * Whisper + pyannote, etc.) sem alterar o restante do pipeline.
 */

export type DiarizedSegment = {
  speakerLabel: string; // ex.: "SPEAKER_00"
  startMs: number;
  endMs: number;
  text: string;
  confidence?: number;
};

export type TranscriptionResult = {
  provider: string;
  language: string;
  segments: DiarizedSegment[];
  raw: unknown;
};

export interface TranscriptionProvider {
  readonly name: string;
  /**
   * Envia o áudio/vídeo para processamento e retorna o resultado já diarizado.
   * Providers assíncronos por webhook podem implementar isso fazendo polling
   * interno ou, alternativamente, o pipeline pode ser adaptado para receber
   * o resultado via rota de webhook (ver src/app/api/webhooks/transcription).
   */
  transcribe(input: { mediaUrl: string; languageHint?: string }): Promise<TranscriptionResult>;
}

export function getTranscriptionProvider(): TranscriptionProvider {
  const provider = process.env.TRANSCRIPTION_PROVIDER ?? "mock";

  switch (provider) {
    case "assemblyai": {
      // import dinâmico evita custo de bundle quando não utilizado
      const { AssemblyAIProvider } = require("./assemblyai");
      return new AssemblyAIProvider();
    }
    case "mock":
    default: {
      const { MockProvider } = require("./mock");
      return new MockProvider();
    }
  }
}

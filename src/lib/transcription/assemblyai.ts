import type { TranscriptionProvider, TranscriptionResult } from "./provider";

const API_BASE = "https://api.assemblyai.com/v2";

/**
 * Integração com a AssemblyAI, que oferece transcrição em português e
 * diarização nativa de falantes (`speaker_labels: true`), evitando a
 * necessidade de um pipeline separado de identificação de locutor.
 * Documentação: https://www.assemblyai.com/docs
 */
export class AssemblyAIProvider implements TranscriptionProvider {
  readonly name = "assemblyai";
  private apiKey: string;

  constructor() {
    const key = process.env.ASSEMBLYAI_API_KEY;
    if (!key) {
      throw new Error("ASSEMBLYAI_API_KEY não configurada.");
    }
    this.apiKey = key;
  }

  async transcribe(input: { mediaUrl: string; languageHint?: string }): Promise<TranscriptionResult> {
    const submitRes = await fetch(`${API_BASE}/transcript`, {
      method: "POST",
      headers: {
        authorization: this.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        audio_url: input.mediaUrl,
        speaker_labels: true,
        language_code: input.languageHint ?? "pt",
      }),
    });

    if (!submitRes.ok) {
      throw new Error(`Falha ao enviar áudio para AssemblyAI: ${submitRes.status} ${await submitRes.text()}`);
    }

    const submitted = (await submitRes.json()) as { id: string };

    // Polling simples até concluir. Em produção considere usar o webhook
    // nativo da AssemblyAI (`webhook_url`) para evitar manter o worker bloqueado.
    let attempts = 0;
    while (attempts < 120) {
      const pollRes = await fetch(`${API_BASE}/transcript/${submitted.id}`, {
        headers: { authorization: this.apiKey },
      });
      const data = await pollRes.json();

      if (data.status === "completed") {
        const segments = (data.utterances ?? []).map((u: any) => ({
          speakerLabel: `SPEAKER_${String(u.speaker).padStart(2, "0")}`,
          startMs: u.start,
          endMs: u.end,
          text: u.text,
          confidence: u.confidence,
        }));

        return {
          provider: this.name,
          language: data.language_code ?? "pt",
          segments,
          raw: data,
        };
      }

      if (data.status === "error") {
        throw new Error(`AssemblyAI retornou erro: ${data.error}`);
      }

      attempts += 1;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    throw new Error("Tempo limite excedido aguardando transcrição da AssemblyAI.");
  }
}

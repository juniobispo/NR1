# Arquitetura

## Multi-tenancy

Cada empresa cliente é uma `Organization`. Todo modelo de domínio carrega `organizationId` e toda query de API
filtra por ele — o isolamento entre clientes é feito na camada de aplicação, via `requireSession()`
(`src/lib/tenant.ts`), que lê a organização do usuário autenticado na sessão JWT e nunca aceita
`organizationId` vindo do cliente.

## Fluxo de ingestão de uma gravação

1. **Upload direto ao storage.** O cliente pede uma URL pré-assinada (`POST /api/recordings/upload-url`) e
   envia o arquivo diretamente ao S3, sem passar pelo servidor de aplicação — importante para arquivos de
   vídeo, que podem ser grandes.
2. **Registro dos metadados.** `POST /api/recordings` cria o registro `Recording` e, por padrão, enfileira o
   job de transcrição no BullMQ (`enqueueTranscriptionJob`).
3. **Processamento assíncrono.** O worker (`src/worker/transcription-worker.ts`, processo separado do servidor
   web) consome a fila, baixa a mídia via URL assinada, chama o `TranscriptionProvider` configurado e persiste
   o resultado via `persistTranscriptionResult` (`src/lib/transcription/persist.ts`).
4. **Diarização.** O resultado já vem segmentado por falante (`speakerLabel`, ex. `SPEAKER_00`). Cada
   `TranscriptSegment` pode ser vinculado manualmente a um `Employee` na revisão, permitindo depois filtrar
   "tudo que a pessoa X disse".
5. **Detecção heurística de incidente.** Cada segmento passa por `detectIncident` (léxico de termos
   categorizados por tipo/severidade). Um match cria um `Incident` com `status: DETECTED` — **nunca**
   confirmado automaticamente.
6. **Triagem humana.** RH/gestor revisa em `/incidentes/[id]`, vincula colaboradores envolvidos (ofensor,
   vítima, testemunha) e decide: `CONFIRMED` (vira documentação formal) ou `DISMISSED` (falso positivo).
7. **Radar de risco.** Após cada transcrição, `recalculateRiskSnapshot` recalcula o `RiskSnapshot` do
   ambiente/dia, combinando volume, severidade das ocorrências e proporção de trechos com tom hostil. O
   dashboard usa isso para priorizar quais ambientes/equipes merecem atenção preventiva — a base da
   "antecipação" pedida no escopo do produto.

## Por que uma fila (BullMQ/Redis) em vez de processar no request?

Transcrição de áudio/vídeo é uma operação longa (segundos a minutos) e não deve bloquear uma requisição HTTP
nem o processo do servidor web. O worker roda como processo independente (`npm run worker`), escalável
horizontalmente conforme o volume de gravações.

## Dois caminhos para o resultado da transcrição

- **Síncrono/polling** (usado por `AssemblyAIProvider` neste MVP): o worker chama o provedor e faz polling até
  concluir.
- **Assíncrono/webhook**: `POST /api/webhooks/transcription`, autenticado por segredo compartilhado
  (`TRANSCRIPTION_WEBHOOK_SECRET`), para provedores que notificam via callback em vez de resposta síncrona.
  Ambos os caminhos convergem em `persistTranscriptionResult`, evitando lógica duplicada/divergente.

## Autenticação e Edge Runtime

O middleware (`src/middleware.ts`) roda no Edge Runtime do Next.js, que não suporta o cliente do Prisma nem
`bcryptjs`. Por isso a configuração do NextAuth é dividida em duas partes:

- `src/lib/auth.config.ts` — configuração "edge-safe" (sem providers com acesso a banco), usada pelo
  middleware apenas para decidir se uma rota exige login.
- `src/lib/auth.ts` — configuração completa, com o provider de credenciais (Prisma + bcrypt), usada nas rotas
  de API e nos server components (que rodam em Node.js runtime).

## Extensibilidade do provedor de transcrição

`src/lib/transcription/provider.ts` define o contrato `TranscriptionProvider`. Trocar de fornecedor (ou migrar
para um pipeline self-hosted com Whisper + pyannote.audio para diarização) é implementar essa interface e
apontar `TRANSCRIPTION_PROVIDER` para o novo provider — nenhum outro ponto do sistema precisa mudar.

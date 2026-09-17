# NR1 Prova

Plataforma SaaS multi-tenant que ajuda empresas a gerar **documentação probatória** para conformidade com a
**NR1** (Gerenciamento de Riscos Ocupacionais, incluindo riscos psicossociais): grava os ambientes de trabalho,
transcreve o áudio identificando quem falou cada trecho (diarização de falantes), sinaliza indícios de
ofensa/assédio/conflito para triagem humana e acumula histórico para **antecipar** situações antes que se
agravem.

> ⚠️ Gravar pessoas no ambiente de trabalho é uma operação sensível do ponto de vista legal (LGPD, CLT).
> Leia [`docs/COMPLIANCE.md`](docs/COMPLIANCE.md) antes de operar em produção.

## Stack

- **Next.js 14 (App Router) + TypeScript** — frontend e API em um único app.
- **PostgreSQL + Prisma** — banco de dados relacional multi-tenant (ver `prisma/schema.prisma`).
- **NextAuth (Auth.js) v5** — autenticação por credenciais, sessão JWT, isolamento por organização.
- **S3 (ou compatível: R2, MinIO)** — armazenamento de mídia via URLs pré-assinadas.
- **Redis + BullMQ** — fila de processamento assíncrono das gravações.
- **Provider de transcrição plugável** — `mock` (dev, sem custo) ou `assemblyai` (transcrição + diarização
  nativa em português). Ver `src/lib/transcription/`.
- **Tailwind CSS** — UI.

## Arquitetura (visão geral)

```
Dispositivo/câmera ─▶ Upload (URL pré-assinada) ─▶ S3
                                                     │
Dashboard cria "Recording" ──▶ API ──▶ BullMQ ──▶ Worker (src/worker) ──▶ Provider de transcrição
                                                     │                          │
                                                     ▼                          ▼
                                        Transcript + TranscriptSegment (por falante)
                                                     │
                                        detecção heurística de incidente (src/lib/incident-detection.ts)
                                                     │
                                            Incident (triagem humana) ──▶ RiskSnapshot (radar de risco)
```

Veja detalhes em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Rodando localmente

### Pré-requisitos

- Node.js 20+
- PostgreSQL (local ou Docker)
- Redis (local ou Docker)
- Opcional para produção: bucket S3-compatível e chave da AssemblyAI

### Passos

```bash
cp .env.example .env
# edite .env com sua DATABASE_URL, REDIS_URL, AUTH_SECRET (openssl rand -base64 32), etc.

npm install
npm run prisma:migrate     # cria o schema no banco
npm run seed                # opcional: dados de exemplo (empresa, ambientes, colaboradores)

npm run dev                 # app web em http://localhost:3000
npm run worker              # em outro terminal: processa a fila de transcrição
```

Sem configurar `STORAGE_*` e um provedor de transcrição real, use `TRANSCRIPTION_PROVIDER=mock` (padrão) para
testar o pipeline completo com uma transcrição sintética — mas o upload de arquivo real ainda exige um
storage S3-compatível configurado (ex.: MinIO local).

### Trocando o provedor de transcrição

Edite `TRANSCRIPTION_PROVIDER` no `.env`:

- `mock` — gera uma transcrição sintética, sem custo, ideal para desenvolvimento.
- `assemblyai` — transcrição real com diarização nativa (`ASSEMBLYAI_API_KEY` obrigatória).

Novos provedores (Deepgram, um pipeline Whisper + pyannote self-hosted, etc.) só precisam implementar a
interface `TranscriptionProvider` em `src/lib/transcription/provider.ts`.

## Modelo de dados

O `prisma/schema.prisma` é a fonte da verdade do domínio: organizações (tenants), usuários, ambientes,
dispositivos, colaboradores, consentimentos, gravações, transcrições/segmentos por falante, ocorrências
(incidentes), snapshots de risco e relatórios de conformidade.

## Papéis de usuário

- **ADMIN** — acesso total à conta da empresa.
- **RH** — gestão de colaboradores, consentimentos e relatórios.
- **GESTOR** — gestão de ambientes, gravações e triagem de ocorrências.
- **VISUALIZADOR** — apenas leitura (ex.: jurídico externo, auditor).

## Roadmap sugerido

- Reconhecimento automático de colaborador por voz (voiceprint) para além do rótulo genérico do provedor.
- Substituir/complementar o léxico de detecção de incidentes (`src/lib/incident-detection.ts`) por um
  classificador de linguagem treinado com ocorrências confirmadas pela própria base de clientes.
- Exportação do relatório NR1 em PDF assinado digitalmente.
- Notificações (e-mail/WhatsApp) para RH quando uma ocorrência crítica é detectada.
- Modelo preditivo mais robusto (hoje o `riskScore` é uma heurística explicável, não um modelo de ML) usando
  série histórica de `RiskSnapshot`.

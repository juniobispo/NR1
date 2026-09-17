import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createDownloadUrl } from "@/lib/storage";
import { RecordingStatusBadge, SeverityBadge } from "@/components/badges";
import { RetryTranscriptionButton } from "@/components/retry-transcription-button";

const SPEAKER_COLORS = [
  "bg-brand-50 text-brand-800 border-brand-200",
  "bg-emerald-50 text-emerald-800 border-emerald-200",
  "bg-amber-50 text-amber-800 border-amber-200",
  "bg-pink-50 text-pink-800 border-pink-200",
  "bg-violet-50 text-violet-800 border-violet-200",
];

function speakerColor(label: string) {
  const index = [...label].reduce((acc, c) => acc + c.charCodeAt(0), 0) % SPEAKER_COLORS.length;
  return SPEAKER_COLORS[index];
}

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default async function RecordingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const organizationId = (session!.user as any).organizationId as string;

  const recording = await prisma.recording.findFirst({
    where: { id, organizationId },
    include: {
      environment: true,
      transcript: {
        include: {
          segments: {
            orderBy: { startMs: "asc" },
            include: { employee: { select: { id: true, name: true } } },
          },
        },
      },
      incidents: true,
    },
  });
  if (!recording) notFound();

  const objectKey = recording.videoUrl ?? recording.audioUrl;
  let mediaUrl: string | null = null;
  if (objectKey) {
    try {
      mediaUrl = await createDownloadUrl(objectKey);
    } catch {
      mediaUrl = null;
    }
  }

  const incidentBySegment = new Map(recording.incidents.map((i) => [i.transcriptSegmentId, i]));

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/ambientes/${recording.environmentId}`} className="text-sm text-brand-600">
          ← {recording.environment.name}
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{new Date(recording.startedAt).toLocaleString("pt-BR")}</h1>
          <RecordingStatusBadge status={recording.status} />
        </div>
      </div>

      {recording.status === "FAILED" && (
        <div className="card border-red-200 bg-red-50">
          <p className="text-sm text-red-700">Falha ao transcrever: {recording.failureReason ?? "erro desconhecido."}</p>
          <div className="mt-3">
            <RetryTranscriptionButton recordingId={recording.id} />
          </div>
        </div>
      )}

      {(recording.status === "QUEUED" || recording.status === "TRANSCRIBING") && (
        <div className="card border-blue-200 bg-blue-50">
          <p className="text-sm text-blue-700">Transcrição em processamento. Atualize a página em instantes.</p>
        </div>
      )}

      {mediaUrl && (
        <div className="card">
          {recording.videoUrl ? (
            <video controls className="w-full rounded-lg" src={mediaUrl} />
          ) : (
            <audio controls className="w-full" src={mediaUrl} />
          )}
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold text-slate-900">Transcrição por falante</h2>
        {!recording.transcript && <p className="mt-3 text-sm text-slate-400">Ainda não há transcrição disponível.</p>}
        {recording.transcript && (
          <div className="mt-4 space-y-3">
            {recording.transcript.segments.map((segment) => {
              const incident = incidentBySegment.get(segment.id);
              return (
                <div key={segment.id} className={`rounded-lg border p-3 ${speakerColor(segment.speakerLabel)}`}>
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
                    <span>{segment.employee?.name ?? segment.speakerLabel}</span>
                    <span className="font-normal normal-case text-slate-500">{formatTime(segment.startMs)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-800">{segment.text}</p>
                  {incident && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <SeverityBadge severity={incident.severity} />
                      <Link href={`/incidentes/${incident.id}`} className="font-medium text-brand-700">
                        Ver ocorrência sinalizada →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

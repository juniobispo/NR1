import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createDownloadUrl } from "@/lib/storage";
import { SeverityBadge, IncidentStatusBadge, IncidentTypeLabel } from "@/components/badges";
import { IncidentReviewForm } from "@/components/incident-review-form";
import { IncidentClipPlayer } from "@/components/incident-clip-player";
import { SegmentSpeakerForm } from "@/components/segment-speaker-form";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const organizationId = (session!.user as any).organizationId as string;

  const [incident, employees] = await Promise.all([
    prisma.incident.findFirst({
      where: { id, organizationId },
      include: {
        environment: true,
        recording: true,
        transcriptSegment: { include: { employee: true } },
        involvedEmployees: { include: { employee: true } },
        reviewedBy: { select: { name: true } },
      },
    }),
    prisma.employee.findMany({ where: { organizationId, active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!incident) notFound();

  const objectKey = incident.recording.videoUrl ?? incident.recording.audioUrl;
  let mediaUrl: string | null = null;
  if (objectKey) {
    try {
      mediaUrl = await createDownloadUrl(objectKey);
    } catch {
      mediaUrl = null;
    }
  }
  const mediaKind: "video" | "audio" = incident.recording.videoUrl ? "video" : "audio";

  const speakerIdentified = !!incident.transcriptSegment?.employee;
  const involvedDefault =
    incident.involvedEmployees.length === 0 && incident.transcriptSegment?.employeeId
      ? [{ employeeId: incident.transcriptSegment.employeeId, roleInIncident: "OFENSOR" as const }]
      : incident.involvedEmployees.map((ie) => ({
          employeeId: ie.employeeId,
          roleInIncident: ie.roleInIncident,
        }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/incidentes" className="text-sm text-brand-600">
          ← Ocorrências
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">
            <IncidentTypeLabel type={incident.type} />
          </h1>
          <SeverityBadge severity={incident.severity} />
          <IncidentStatusBadge status={incident.status} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {incident.environment.name} · {new Date(incident.createdAt).toLocaleString("pt-BR")} · detectado{" "}
          {incident.detectedBy === "AUTO" ? "automaticamente" : "manualmente"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {incident.transcriptSegment && (
            <section className="card">
              <h2 className="font-semibold text-slate-900">Trecho da gravação</h2>
              {mediaUrl ? (
                <div className="mt-3">
                  <IncidentClipPlayer
                    mediaUrl={mediaUrl}
                    mediaKind={mediaKind}
                    startMs={incident.transcriptSegment.startMs}
                    endMs={incident.transcriptSegment.endMs}
                  />
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-400">Mídia da gravação indisponível.</p>
              )}
              <Link href={`/gravacoes/${incident.recordingId}`} className="mt-3 inline-block text-sm font-medium text-brand-600">
                Ver gravação completa e transcrição inteira →
              </Link>
            </section>
          )}

          <section className="card">
            <h2 className="font-semibold text-slate-900">O que aconteceu</h2>
            <p className="mt-2 text-sm text-slate-700">{incident.description}</p>
            {incident.triggerText && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Trecho da transcrição</p>
                <p className="mt-1 text-sm italic text-slate-700">"{incident.triggerText}"</p>
                {incident.matchedTerms.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500">Termos identificados: {incident.matchedTerms.join(", ")}</p>
                )}
              </div>
            )}
          </section>

          {incident.transcriptSegment && (
            <section className="card">
              <h2 className="font-semibold text-slate-900">Quem falou</h2>
              {speakerIdentified ? (
                <p className="mt-2 text-sm text-slate-700">
                  <span className="font-medium">{incident.transcriptSegment.employee!.name}</span>{" "}
                  <span className="text-slate-500">(rótulo da gravação: {incident.transcriptSegment.speakerLabel})</span>
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm text-slate-500">
                    A transcrição identificou apenas o falante genérico{" "}
                    <span className="font-medium">{incident.transcriptSegment.speakerLabel}</span>. Selecione abaixo
                    quem é essa pessoa para formalizar a autoria na documentação.
                  </p>
                  <div className="mt-3">
                    <SegmentSpeakerForm
                      segmentId={incident.transcriptSegment.id}
                      employees={employees}
                      currentEmployeeId={incident.transcriptSegment.employeeId}
                    />
                  </div>
                </>
              )}
            </section>
          )}

          {incident.involvedEmployees.length > 0 && (
            <section className="card">
              <h2 className="font-semibold text-slate-900">Colaboradores envolvidos</h2>
              <ul className="mt-3 space-y-1 text-sm text-slate-700">
                {incident.involvedEmployees.map((ie) => (
                  <li key={ie.id}>
                    {ie.employee.name} — {ie.roleInIncident}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {incident.reviewNotes && (
            <section className="card">
              <h2 className="font-semibold text-slate-900">Notas da apuração</h2>
              <p className="mt-2 text-sm text-slate-700">{incident.reviewNotes}</p>
              {incident.reviewedBy && (
                <p className="mt-2 text-xs text-slate-500">
                  Revisado por {incident.reviewedBy.name} em {incident.reviewedAt?.toLocaleString("pt-BR")}
                </p>
              )}
            </section>
          )}
        </div>

        <div>
          <IncidentReviewForm
            incidentId={incident.id}
            employees={employees}
            initialStatus={incident.status}
            initialInvolved={involvedDefault}
          />
        </div>
      </div>
    </div>
  );
}

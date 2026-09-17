import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiHandler, requireRole, requireSession } from "@/lib/tenant";

const schema = z.object({ employeeId: z.string() });

/**
 * Identifica quem falou um trecho da transcrição, vinculando-o a um colaborador
 * cadastrado. Como o rótulo do provedor de diarização (ex. `SPEAKER_00`) é
 * consistente dentro de uma mesma gravação, a identificação é aplicada a todos
 * os trechos daquele falante na transcrição — não só ao trecho clicado.
 */
export const PATCH = apiHandler(async (req, ctx) => {
  const { organizationId, role } = await requireSession();
  requireRole(role, ["ADMIN", "RH", "GESTOR"]);
  const { id } = await ctx!.params;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const segment = await prisma.transcriptSegment.findFirst({
    where: { id, transcript: { recording: { organizationId } } },
  });
  if (!segment) {
    return NextResponse.json({ error: "Trecho não encontrado." }, { status: 404 });
  }

  const employee = await prisma.employee.findFirst({ where: { id: parsed.data.employeeId, organizationId } });
  if (!employee) {
    return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 });
  }

  await prisma.transcriptSegment.updateMany({
    where: { transcriptId: segment.transcriptId, speakerLabel: segment.speakerLabel },
    data: { employeeId: employee.id },
  });

  return NextResponse.json({ ok: true });
});

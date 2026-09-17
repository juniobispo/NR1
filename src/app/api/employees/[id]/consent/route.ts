import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiHandler, requireSession } from "@/lib/tenant";

const consentSchema = z.object({
  environmentId: z.string().optional(),
  consentType: z.enum(["GRAVACAO_AUDIO_VIDEO", "TRATAMENTO_DE_DADOS"]).default("GRAVACAO_AUDIO_VIDEO"),
  granted: z.boolean(),
  documentUrl: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Registra (ou revoga) o consentimento formal de um colaborador para ser
 * gravado em áudio/vídeo em um determinado ambiente. Este registro é o que
 * legitima juridicamente o uso das gravações como prova documental — sem ele
 * a gravação não deve ser tratada como base probatória. Ver docs/COMPLIANCE.md.
 */
export const POST = apiHandler(async (req, ctx) => {
  const { organizationId } = await requireSession();
  const { id: employeeId } = await ctx!.params;
  const body = await req.json();
  const parsed = consentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const employee = await prisma.employee.findFirst({ where: { id: employeeId, organizationId } });
  if (!employee) {
    return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 });
  }

  const record = await prisma.consentRecord.create({
    data: {
      organizationId,
      employeeId,
      environmentId: parsed.data.environmentId,
      consentType: parsed.data.consentType,
      granted: parsed.data.granted,
      grantedAt: parsed.data.granted ? new Date() : null,
      revokedAt: parsed.data.granted ? null : new Date(),
      documentUrl: parsed.data.documentUrl,
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json(record, { status: 201 });
});

export const GET = apiHandler(async (_req, ctx) => {
  const { organizationId } = await requireSession();
  const { id: employeeId } = await ctx!.params;

  const records = await prisma.consentRecord.findMany({
    where: { organizationId, employeeId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(records);
});

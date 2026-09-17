import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({ granted: z.boolean() });

/**
 * Rota pública (sem sessão) por trás do link de consentimento enviado ao
 * colaborador (`/consentimento/[token]`). O token é o único segredo — não a
 * autenticação de usuário do colaborador, que não tem login na plataforma.
 * Captura IP e user-agent como evidência de que foi o próprio dispositivo do
 * colaborador que confirmou, reforçando o valor probatório do registro em
 * caso de reclamação/disputa trabalhista.
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const employee = await prisma.employee.findUnique({ where: { consentToken: token } });
  if (!employee) {
    return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 404 });
  }

  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;

  const record = await prisma.consentRecord.create({
    data: {
      organizationId: employee.organizationId,
      employeeId: employee.id,
      consentType: "GRAVACAO_AUDIO_VIDEO",
      granted: parsed.data.granted,
      grantedAt: parsed.data.granted ? new Date() : null,
      revokedAt: parsed.data.granted ? null : new Date(),
      submittedBy: "SELF",
      ipAddress,
      userAgent,
    },
  });

  return NextResponse.json({ ok: true, grantedAt: record.grantedAt });
}

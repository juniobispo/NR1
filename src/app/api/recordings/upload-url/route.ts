import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiHandler, requireSession } from "@/lib/tenant";
import { createUploadUrl } from "@/lib/storage";

const schema = z.object({
  environmentId: z.string(),
  contentType: z.string(),
  extension: z.string().min(1).max(10),
});

/**
 * Passo 1 do fluxo de ingestão de uma gravação: o cliente (app do dispositivo
 * de captação, ou upload manual no dashboard) pede uma URL pré-assinada,
 * envia o arquivo diretamente ao storage e só então chama POST /api/recordings
 * informando a chave do objeto recebida aqui.
 */
export const POST = apiHandler(async (req) => {
  const { organizationId } = await requireSession();
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const environment = await prisma.environment.findFirst({
    where: { id: parsed.data.environmentId, organizationId },
  });
  if (!environment) {
    return NextResponse.json({ error: "Ambiente não encontrado." }, { status: 404 });
  }

  const { uploadUrl, objectKey } = await createUploadUrl({
    organizationId,
    environmentId: environment.id,
    contentType: parsed.data.contentType,
    extension: parsed.data.extension,
  });

  return NextResponse.json({ uploadUrl, objectKey });
});

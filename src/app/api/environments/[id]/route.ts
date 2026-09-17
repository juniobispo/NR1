import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler, requireSession } from "@/lib/tenant";

export const GET = apiHandler(async (_req, ctx) => {
  const { organizationId } = await requireSession();
  const { id } = await ctx!.params;

  const environment = await prisma.environment.findFirst({
    where: { id, organizationId },
    include: {
      devices: true,
      recordings: { orderBy: { startedAt: "desc" }, take: 20 },
    },
  });
  if (!environment) {
    return NextResponse.json({ error: "Ambiente não encontrado." }, { status: 404 });
  }
  return NextResponse.json(environment);
});

export const PATCH = apiHandler(async (req, ctx) => {
  const { organizationId } = await requireSession();
  const { id } = await ctx!.params;
  const body = await req.json();

  const existing = await prisma.environment.findFirst({ where: { id, organizationId } });
  if (!existing) {
    return NextResponse.json({ error: "Ambiente não encontrado." }, { status: 404 });
  }

  const environment = await prisma.environment.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      location: body.location ?? existing.location,
      description: body.description ?? existing.description,
      active: typeof body.active === "boolean" ? body.active : existing.active,
    },
  });
  return NextResponse.json(environment);
});

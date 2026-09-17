import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiHandler, requireSession } from "@/lib/tenant";

const createSchema = z.object({
  name: z.string().min(2),
  location: z.string().optional(),
  description: z.string().optional(),
});

export const GET = apiHandler(async () => {
  const { organizationId } = await requireSession();
  const environments = await prisma.environment.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    include: { _count: { select: { recordings: true, incidents: true, devices: true } } },
  });
  return NextResponse.json(environments);
});

export const POST = apiHandler(async (req) => {
  const { organizationId } = await requireSession();
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const environment = await prisma.environment.create({
    data: { organizationId, ...parsed.data },
  });
  return NextResponse.json(environment, { status: 201 });
});

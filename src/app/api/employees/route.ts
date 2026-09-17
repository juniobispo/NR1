import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiHandler, requireSession } from "@/lib/tenant";

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  department: z.string().optional(),
  role: z.string().optional(),
});

export const GET = apiHandler(async () => {
  const { organizationId } = await requireSession();
  const employees = await prisma.employee.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    include: { consentRecords: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return NextResponse.json(employees);
});

/**
 * Cadastra um colaborador. IMPORTANTE: o cadastro por si só não autoriza a
 * gravação de voz/imagem — isso só ocorre após registro explícito de
 * consentimento (ver /api/employees/[id]/consent). Ver docs/COMPLIANCE.md.
 */
export const POST = apiHandler(async (req) => {
  const { organizationId } = await requireSession();
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const employee = await prisma.employee.create({
    data: { organizationId, ...parsed.data },
  });
  return NextResponse.json(employee, { status: 201 });
});

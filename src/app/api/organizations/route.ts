import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const signupSchema = z.object({
  companyName: z.string().min(2),
  cnpj: z.string().optional(),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});

/**
 * Cadastro self-service de uma nova empresa cliente (tenant) + seu primeiro
 * usuário administrador. Rota pública, usada pela tela de "criar conta".
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { companyName, cnpj, adminName, adminEmail, adminPassword } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    return NextResponse.json({ error: "Já existe uma conta com este e-mail." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const organization = await prisma.organization.create({
    data: {
      name: companyName,
      cnpj,
      plan: "TRIAL",
      users: {
        create: {
          name: adminName,
          email: adminEmail,
          passwordHash,
          role: "ADMIN",
        },
      },
    },
    include: { users: true },
  });

  return NextResponse.json(
    { organizationId: organization.id, userId: organization.users[0].id },
    { status: 201 }
  );
}

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Demo1234!", 12);

  const organization = await prisma.organization.upsert({
    where: { cnpj: "00000000000191" },
    update: {},
    create: {
      name: "Empresa Demo Ltda.",
      cnpj: "00000000000191",
      plan: "PROFISSIONAL",
      retentionDays: 365,
      users: {
        create: [
          { name: "Admin Demo", email: "admin@demo.com", passwordHash, role: "ADMIN" },
          { name: "RH Demo", email: "rh@demo.com", passwordHash, role: "RH" },
        ],
      },
    },
  });

  const salaReuniao = await prisma.environment.upsert({
    where: { id: "demo-env-sala-reuniao" },
    update: {},
    create: {
      id: "demo-env-sala-reuniao",
      organizationId: organization.id,
      name: "Sala de reunião 2",
      location: "2º andar",
    },
  });

  const recepcao = await prisma.environment.upsert({
    where: { id: "demo-env-recepcao" },
    update: {},
    create: {
      id: "demo-env-recepcao",
      organizationId: organization.id,
      name: "Recepção",
      location: "Térreo",
    },
  });

  const employees = await Promise.all(
    [
      { id: "demo-emp-ana", name: "Ana Souza", department: "Comercial", role: "Analista" },
      { id: "demo-emp-bruno", name: "Bruno Lima", department: "Comercial", role: "Coordenador" },
      { id: "demo-emp-carla", name: "Carla Nunes", department: "RH", role: "Analista de RH" },
    ].map((e) =>
      prisma.employee.upsert({
        where: { id: e.id },
        update: {},
        create: { ...e, organizationId: organization.id },
      })
    )
  );

  await Promise.all(
    employees.map((emp) =>
      prisma.consentRecord.create({
        data: {
          organizationId: organization.id,
          employeeId: emp.id,
          consentType: "GRAVACAO_AUDIO_VIDEO",
          granted: true,
          grantedAt: new Date(),
        },
      })
    )
  );

  console.log("Seed concluído.");
  console.log("Login demo: admin@demo.com / Demo1234!");
  console.log(`Organização: ${organization.name} (${organization.id})`);
  console.log(`Ambientes: ${salaReuniao.name}, ${recepcao.name}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

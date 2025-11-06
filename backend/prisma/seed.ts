// prisma/seed.ts
import { PrismaClient, Rol, Tipo } from "@prisma/client";
import bcrypt from "bcryptjs";

// Inicializa Prisma
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando el script de seed...");

  // 1. Hashear la contraseña (123456) una sola vez
  const hashedPassword = await bcrypt.hash("123456", 10);
  console.log("🔑 Contraseña hasheada.");

  // 2. Crear Departamentos (usamos upsert para evitar duplicados)
  // Necesitamos que "Calidad" exista para los roles de ese depto.
  const deptoCalidad = await prisma.departamento.upsert({
    where: { nombre: "Calidad" },
    update: {},
    create: {
      nombre: "Calidad",
      tipo: "OPERATIVO",
    },
  });

  // Creamos un segundo depto. para pruebas de asignación cruzada si quieres
  const deptoSistemas = await prisma.departamento.upsert({
    where: { nombre: "Sistemas" },
    update: {},
    create: {
      nombre: "Sistemas",
      tipo: "ADMINISTRATIVO",
    },
  });
  console.log(
    `🏭 Departamentos creados/actualizados: ${deptoCalidad.nombre}, ${deptoSistemas.nombre}.`
  );

  // 3. Crear los 5 usuarios (usamos upsert para poder correr el seed varias veces)

  // SUPER_ADMIN (Rol: SUPER_ADMIN, Depto: null)
  await prisma.usuario.upsert({
    where: { username: "super_admin" },
    update: {},
    create: {
      nombre: "Usuario Super Admin",
      username: "super_admin",
      password: hashedPassword,
      rol: "SUPER_ADMIN",
      departamentoId: null, // Los SUPER_ADMIN no tienen depto (según tu lógica)
    },
  });

  // ADMIN (Rol: ADMIN, Depto: Calidad)
  await prisma.usuario.upsert({
    where: { username: "admin_calidad" },
    update: {},
    create: {
      nombre: "Usuario Admin Calidad",
      username: "admin_calidad",
      password: hashedPassword,
      rol: "ADMIN",
      departamentoId: deptoCalidad.id,
    },
  });

  // ENCARGADO (Rol: ENCARGADO, Depto: Calidad)
  await prisma.usuario.upsert({
    where: { username: "encargado_calidad" },
    update: {},
    create: {
      nombre: "Usuario Encargado Calidad",
      username: "encargado_calidad",
      password: hashedPassword,
      rol: "ENCARGADO",
      departamentoId: deptoCalidad.id,
    },
  });

  // USUARIO (Rol: USUARIO, Depto: Calidad)
  await prisma.usuario.upsert({
    where: { username: "usuario_calidad" },
    update: {},
    create: {
      nombre: "Usuario Normal Calidad",
      username: "usuario_calidad",
      password: hashedPassword,
      rol: "USUARIO",
      departamentoId: deptoCalidad.id,
    },
  });

  // INVITADO (Rol: INVITADO, Depto: null)
  await prisma.usuario.upsert({
    where: { username: "invitado_externo" },
    update: {},
    create: {
      nombre: "Usuario Invitado",
      username: "invitado_externo",
      password: hashedPassword,
      rol: "INVITADO",
      departamentoId: null, // Los INVITADO no tienen depto (según tu lógica)
    },
  });

  console.log("👤 Usuarios creados/actualizados.");
  console.log("✅ Seed completado exitosamente.");
}

// Ejecutar el script y desconectar Prisma
main()
  .catch((e) => {
    console.error("❌ Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// prisma/seed.ts
import { PrismaClient, Rol } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando el script de seed...");

  // 1. Hashear la contraseña (123456) una sola vez para todos
  const hashedPassword = await bcrypt.hash("123456", 10);
  console.log("🔑 Contraseña '123456' hasheada.");

  // ------------------------------------------------------------------
  // 2. CREACIÓN DE DEPARTAMENTOS
  // ------------------------------------------------------------------

  const deptoCalidad = await prisma.departamento.upsert({
    where: { nombre: "Calidad" },
    update: {},
    create: { nombre: "Calidad", tipo: "OPERATIVO" },
  });

  const deptoSistemas = await prisma.departamento.upsert({
    where: { nombre: "Sistemas" },
    update: {},
    create: { nombre: "Sistemas", tipo: "ADMINISTRATIVO" },
  });

  console.log(
    `🏭 Deptos listos: ${deptoCalidad.nombre}, ${deptoSistemas.nombre}`
  );

  // ------------------------------------------------------------------
  // 3. HELPER PARA CREAR USUARIOS
  // ------------------------------------------------------------------
  const crearUsuario = async (
    nombre: string,
    username: string,
    rol: Rol,
    deptoId: number | null
  ) => {
    const usuario = await prisma.usuario.upsert({
      where: { username },
      update: {
        rol,
        departamentoId: deptoId,
        estatus: "ACTIVO",
      },
      create: {
        nombre,
        username,
        password: hashedPassword,
        rol,
        departamentoId: deptoId,
        estatus: "ACTIVO",
      },
    });
    console.log(`👤 Usuario procesado: [${rol}] ${username}`);
    return usuario;
  };

  // ------------------------------------------------------------------
  // 4. USUARIOS GLOBALES (Super Admin e Invitado)
  // ------------------------------------------------------------------

  await crearUsuario(
    "Joel Isaac Rodriguez Lopez",
    "super_admin",
    "SUPER_ADMIN",
    null
  );
  await crearUsuario(
    "Visitante Externo Auditor",
    "invitado_externo",
    "INVITADO",
    null
  );

  // ------------------------------------------------------------------
  // 5. DEPARTAMENTO DE CALIDAD
  // ------------------------------------------------------------------
  console.log("\n--- Sembrando Depto. CALIDAD ---");

  // 1 Admin
  await crearUsuario(
    "Director de Calidad",
    "admin_calidad",
    "ADMIN",
    deptoCalidad.id
  );

  // 3 Encargados
  const nombresEncargadosCalidad = [
    "Roberto Gomez",
    "Laura Torres",
    "Carlos Ruiz",
  ];
  for (let i = 0; i < 3; i++) {
    const num = String(i + 1).padStart(2, "0"); // 01, 02, 03
    await crearUsuario(
      nombresEncargadosCalidad[i]!, // 👈 ¡Agregado el '!' aquí!
      `encargado_calidad_${num}`,
      "ENCARGADO",
      deptoCalidad.id
    );
  }

  // 7 Usuarios
  const nombresUsuariosCalidad = [
    "Ana Lopez",
    "Miguel Angel",
    "Sofia Vergara",
    "Pedro Pascal",
    "Elena Nito",
    "Armando Paredes",
    "Esteban Quito",
  ];
  for (let i = 0; i < 7; i++) {
    const num = String(i + 1).padStart(2, "0"); // 01...07
    await crearUsuario(
      nombresUsuariosCalidad[i]!, // 👈 ¡Agregado el '!' aquí!
      `usuario_calidad_${num}`,
      "USUARIO",
      deptoCalidad.id
    );
  }

  // ------------------------------------------------------------------
  // 6. DEPARTAMENTO DE SISTEMAS
  // ------------------------------------------------------------------
  console.log("\n--- Sembrando Depto. SISTEMAS ---");

  // 1 Admin
  await crearUsuario(
    "Gerente de TI",
    "admin_sistemas",
    "ADMIN",
    deptoSistemas.id
  );

  // 2 Encargados
  const nombresEncargadosSistemas = ["Bill Gates", "Steve Jobs"];
  for (let i = 0; i < 2; i++) {
    const num = String(i + 1).padStart(2, "0");
    await crearUsuario(
      nombresEncargadosSistemas[i]!, // 👈 ¡Agregado el '!' aquí!
      `encargado_sistemas_${num}`,
      "ENCARGADO",
      deptoSistemas.id
    );
  }

  // 3 Usuarios
  const nombresUsuariosSistemas = [
    "Linus Torvalds",
    "Ada Lovelace",
    "Alan Turing",
  ];
  for (let i = 0; i < 3; i++) {
    const num = String(i + 1).padStart(2, "0");
    await crearUsuario(
      nombresUsuariosSistemas[i]!, // 👈 ¡Agregado el '!' aquí!
      `usuario_sistemas_${num}`,
      "USUARIO",
      deptoSistemas.id
    );
  }

  console.log("\n✅ Seed completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("❌ Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

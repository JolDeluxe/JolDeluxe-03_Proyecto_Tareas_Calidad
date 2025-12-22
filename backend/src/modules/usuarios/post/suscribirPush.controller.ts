import type { Request, Response } from "express";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { paramsSchema, subscriptionSchema } from "../schemas/usuario.schema.js";

export const suscribirPush = safeAsync(async (req: Request, res: Response) => {
  const paramsParse = paramsSchema.safeParse(req.params);
  if (!paramsParse.success) {
    return res.status(400).json({ error: "ID de URL inválido" });
  }

  if (req.user!.id !== paramsParse.data.id) {
    return res.status(403).json({ error: "No autorizado para suscribir a este usuario." });
  }

  const bodyParse = subscriptionSchema.safeParse(req.body);
  if (!bodyParse.success) {
    return res.status(400).json({
      error: "Datos de suscripción inválidos",
      detalles: bodyParse.error.flatten().fieldErrors,
    });
  }

  const { endpoint, keys } = bodyParse.data;

  const subscripcion = await prisma.pushSubscription.upsert({
    where: { endpoint: endpoint },
    create: {
      endpoint: endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      usuarioId: req.user!.id,
    },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
      usuarioId: req.user!.id,
    },
  });

  console.log(`✅ Suscripción guardada para usuario ${req.user!.id}`);
  res.status(201).json(subscripcion);
});
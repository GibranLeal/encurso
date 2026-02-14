import { Router } from "express";
import { z } from "zod";
import { authRequired, AuthRequest } from "../../middlewares/authRequired";
import { pool } from "../../db/pool";

export const modulesRouter = Router();

const baseSchema = z.object({
  nombre: z.string().min(2),
  slug: z.string().min(2),
  ruta: z.string().min(1),
  icono: z.string().nullable().optional(), // ✅ opcional
  grupo: z.string().nullable().optional(),
  orden: z.number().int().default(1),
  modulo_padre_id: z.number().int().nullable().optional(),
});

const activeSchema = z.object({
  activo: z.union([z.boolean(), z.number().int()]),
});

modulesRouter.get("/", authRequired, async (_req: AuthRequest, res) => {
  const [rows] = await pool.query<any[]>(
    `SELECT id, nombre, slug, ruta, icono, grupo, orden, activo, modulo_padre_id
     FROM modulos
     WHERE eliminado = 0 -- incluye inactivos, pero no borrados (si usas activo=0 para borrado, cambia abajo)
     ORDER BY grupo ASC, orden ASC, id ASC`
  );

  // IMPORTANTE:
  // Si vas a usar "activo" como borrado lógico, conviene tener otro campo "eliminado".
  // Como aún no existe, usaremos:
  // - activo=1 -> visible
  // - activo=0 -> oculto (borrado lógico)  ✅
  //
  // En ese caso, esta consulta debería ser: WHERE activo = 1
  // pero como necesitamos ver inactivos (switch), vamos a usar un campo "estado" para visible/invisible.
  // Si NO tienes ese campo, usa lo simple: activo=1 visible, activo=0 borrado.
  //
  // Para lo que pediste (switch activo y delete lógico) lo más correcto es agregar campo "eliminado".
  // Pero para avanzar YA, haremos:
  // - activo: switch (0/1)
  // - borrado lógico: también set activo=0 y NO mostrarlo
  //
  // Entonces: para que el switch funcione sin confundir borrado, agregaremos columna "eliminado" (recomendado).
  return res.json({ items: rows });
});

modulesRouter.post("/", authRequired, async (req: AuthRequest, res) => {
  const parsed = baseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
  }
  const m = parsed.data;

  await pool.query(
    `INSERT INTO modulos (nombre, slug, ruta, icono, grupo, orden, activo, modulo_padre_id, permiso_requerido_id)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, NULL)`,
    [
      m.nombre,
      m.slug,
      m.ruta,
      m.icono ?? null,
      m.grupo ?? null,
      m.orden ?? 1,
      m.modulo_padre_id ?? null,
    ]
  );

  return res.json({ success: true });
});

modulesRouter.put("/:id", authRequired, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "ID inválido" });

  const parsed = baseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
  }
  const m = parsed.data;

  await pool.query(
    `UPDATE modulos
     SET nombre = ?, slug = ?, ruta = ?, icono = ?, grupo = ?, orden = ?, modulo_padre_id = ?
     WHERE id = ?
     LIMIT 1`,
    [
      m.nombre,
      m.slug,
      m.ruta,
      m.icono ?? null,
      m.grupo ?? null,
      m.orden ?? 1,
      m.modulo_padre_id ?? null,
      id,
    ]
  );

  return res.json({ success: true });
});

modulesRouter.patch("/:id/active", authRequired, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "ID inválido" });

  const parsed = activeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Datos inválidos" });

  const activo = typeof parsed.data.activo === "boolean"
    ? (parsed.data.activo ? 1 : 0)
    : (Number(parsed.data.activo) ? 1 : 0);

  await pool.query(`UPDATE modulos SET activo = ? WHERE id = ? LIMIT 1`, [activo, id]);
  return res.json({ success: true, activo });
});

modulesRouter.delete("/:id", authRequired, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "ID inválido" });

  // 🔥 Borrado lógico: por ahora usamos activo = 0
  await pool.query(`UPDATE modulos SET eliminado = 1 WHERE id = ? LIMIT 1`, [id]);
  return res.json({ success: true });
});

import { Router } from "express";
import { z } from "zod";
import { authRequired, AuthRequest } from "../../middlewares/authRequired";
import { pool } from "../../db/pool";

export const modulesRouter = Router();

const baseSchema = z.object({
  nombre: z.string().min(2, "Nombre mínimo 2 caracteres"),
  slug: z.string().min(2, "Slug mínimo 2 caracteres"),
  ruta: z.string().min(1, "Ruta es obligatoria"),
  icono: z.string().nullable().optional(),
  grupo: z.string().nullable().optional(),
  orden: z.coerce.number().int().default(1),
  modulo_padre_id: z.union([z.coerce.number().int(), z.null()]).optional(),
  permiso_requerido_id: z.union([z.coerce.number().int(), z.null()]).optional(),
});

const activeSchema = z.object({
  activo: z.union([z.boolean(), z.number().int(), z.string()]),
});

async function assertParentExists(modulo_padre_id: number | null) {
  if (!modulo_padre_id) return;

  const [rows]: any = await pool.query(
    `SELECT id FROM modulos WHERE id = ? AND eliminado = 0 LIMIT 1`,
    [modulo_padre_id]
  );

  if (!rows?.length) {
    throw new Error("El módulo padre seleccionado no existe o fue eliminado.");
  }
}

modulesRouter.get("/", authRequired, async (_req: AuthRequest, res) => {
  try {
    const [rows] = await pool.query<any[]>(
      `
      SELECT id, nombre, slug, ruta, icono, grupo, orden, activo, modulo_padre_id, permiso_requerido_id
      FROM modulos
      WHERE eliminado = 0
      ORDER BY grupo ASC, orden ASC, id ASC
      `
    );

    return res.json({ success: true, items: rows });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

modulesRouter.post("/", authRequired, async (req: AuthRequest, res) => {
  try {
    const parsed = baseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: parsed.error.flatten(),
      });
    }

    const m = parsed.data;

    // ✅ si llega 0/NaN por cualquier razón, lo convertimos a null
    const padre = m.modulo_padre_id && m.modulo_padre_id > 0 ? m.modulo_padre_id : null;

    // ✅ valida FK antes de insertar
    await assertParentExists(padre);

    await pool.query(
      `
      INSERT INTO modulos
        (nombre, slug, ruta, icono, grupo, orden, activo, modulo_padre_id, permiso_requerido_id, eliminado)
      VALUES
        (?, ?, ?, ?, ?, ?, 1, ?, ?, 0)
      `,
      [
        m.nombre,
        m.slug,
        m.ruta,
        m.icono ?? null,
        m.grupo ?? null,
        m.orden ?? 1,
        padre,
        m.permiso_requerido_id ?? null,
      ]
    );

    return res.json({ success: true });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

modulesRouter.put("/:id", authRequired, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "ID inválido" });

    const parsed = baseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: parsed.error.flatten(),
      });
    }

    const m = parsed.data;

    // ✅ evita que un módulo se ponga como su propio padre
    const padre =
      m.modulo_padre_id && m.modulo_padre_id > 0 ? m.modulo_padre_id : null;

    if (padre === id) {
      return res.status(400).json({
        success: false,
        message: "Un módulo no puede ser padre de sí mismo.",
      });
    }

    // ✅ valida FK antes de actualizar
    await assertParentExists(padre);

    await pool.query(
      `
      UPDATE modulos
      SET
        nombre = ?,
        slug = ?,
        ruta = ?,
        icono = ?,
        grupo = ?,
        orden = ?,
        modulo_padre_id = ?,
        permiso_requerido_id = ?
      WHERE id = ?
      LIMIT 1
      `,
      [
        m.nombre,
        m.slug,
        m.ruta,
        m.icono ?? null,
        m.grupo ?? null,
        m.orden ?? 1,
        padre,
        m.permiso_requerido_id ?? null,
        id,
      ]
    );

    return res.json({ success: true });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

modulesRouter.patch("/:id/active", authRequired, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "ID inválido" });

    const parsed = activeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Datos inválidos" });
    }

    const raw = parsed.data.activo as any;
    const activo =
      typeof raw === "boolean" ? (raw ? 1 : 0) : Number(raw) ? 1 : 0;

    await pool.query(`UPDATE modulos SET activo = ? WHERE id = ? LIMIT 1`, [activo, id]);

    return res.json({ success: true, item: { id, activo } });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

modulesRouter.delete("/:id", authRequired, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "ID inválido" });

    await pool.query(`UPDATE modulos SET eliminado = 1 WHERE id = ? LIMIT 1`, [id]);

    return res.json({ success: true });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});
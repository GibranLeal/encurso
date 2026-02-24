import { pool } from "../../db/pool";

export type PlanItem = {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: number;
  creado_en: string;
};

function toInt(v: any, def: number) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
}

export async function listPlanes(params: {
  search?: string;
  page?: number;
  limit?: number;
  activo?: number | null;
}) {
  const search = (params.search ?? "").trim();
  const page = Math.max(1, toInt(params.page, 1));
  const limit = Math.min(100, Math.max(1, toInt(params.limit, 10)));
  const offset = (page - 1) * limit;

  const where: string[] = [];
  const values: any[] = [];

  if (params.activo === 0 || params.activo === 1) {
    where.push("p.activo = ?");
    values.push(params.activo);
  }

  if (search) {
    where.push("(p.nombre LIKE ? OR p.descripcion LIKE ?)");
    const like = `%${search}%`;
    values.push(like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rowsCount] = await pool.query<any[]>(
    `SELECT COUNT(*) as total FROM planes p ${whereSql}`,
    values
  );
  const total = rowsCount?.[0]?.total ?? 0;

  const [rows] = await pool.query<any[]>(
    `SELECT p.id, p.nombre, p.descripcion, p.activo, p.creado_en
     FROM planes p
     ${whereSql}
     ORDER BY p.id DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  return { page, limit, total, items: rows as PlanItem[] };
}

export async function getPlanById(id: number) {
  const [rows] = await pool.query<any[]>(
    `SELECT id, nombre, descripcion, activo, creado_en
     FROM planes WHERE id = ? LIMIT 1`,
    [id]
  );
  return (rows?.[0] ?? null) as PlanItem | null;
}

export async function createPlan(input: {
  nombre: string;
  descripcion?: string | null;
  activo?: number;
}) {
  const nombre = (input.nombre ?? "").trim();
  const descripcion = input.descripcion ? String(input.descripcion).trim() : null;
  const activo = input.activo === 0 ? 0 : 1;

  if (!nombre) throw new Error("El nombre es obligatorio.");

  const [dup] = await pool.query<any[]>(
    "SELECT id FROM planes WHERE nombre = ? LIMIT 1",
    [nombre]
  );
  if (dup.length) throw new Error("Ya existe un plan con ese nombre.");

  const [res] = await pool.query<any>(
    `INSERT INTO planes (nombre, descripcion, activo)
     VALUES (?, ?, ?)`,
    [nombre, descripcion, activo]
  );

  return await getPlanById(res.insertId);
}

export async function updatePlan(
  id: number,
  input: { nombre: string; descripcion?: string | null }
) {
  const nombre = (input.nombre ?? "").trim();
  const descripcion = input.descripcion ? String(input.descripcion).trim() : null;

  if (!nombre) throw new Error("El nombre es obligatorio.");

  const current = await getPlanById(id);
  if (!current) throw new Error("Plan no encontrado.");

  const [dup] = await pool.query<any[]>(
    "SELECT id FROM planes WHERE nombre = ? AND id <> ? LIMIT 1",
    [nombre, id]
  );
  if (dup.length) throw new Error("Ya existe otro plan con ese nombre.");

  await pool.query(
    `UPDATE planes SET nombre = ?, descripcion = ? WHERE id = ?`,
    [nombre, descripcion, id]
  );

  return await getPlanById(id);
}

export async function togglePlan(id: number, activo: number) {
  const current = await getPlanById(id);
  if (!current) throw new Error("Plan no encontrado.");

  const val = activo === 0 ? 0 : 1;
  await pool.query(`UPDATE planes SET activo = ? WHERE id = ?`, [val, id]);
  return await getPlanById(id);
}

// delete lógico: inactivar
export async function deletePlan(id: number) {
  const current = await getPlanById(id);
  if (!current) throw new Error("Plan no encontrado.");

  await pool.query(`UPDATE planes SET activo = 0 WHERE id = ?`, [id]);
  return { ok: true };
}
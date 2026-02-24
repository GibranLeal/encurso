import { pool } from "../../db/pool";

export type RolItem = {
  id: number;
  nombre: string;
  activo: number;
  creado_en: string;
};

function toInt(v: any, def: number) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
}

export async function listRoles(params: {
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
    where.push("r.activo = ?");
    values.push(params.activo);
  }

  if (search) {
    where.push("(r.nombre LIKE ?)");
    const like = `%${search}%`;
    values.push(like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rowsCount] = await pool.query<any[]>(
    `SELECT COUNT(*) as total FROM roles r ${whereSql}`,
    values
  );
  const total = rowsCount?.[0]?.total ?? 0;

  const [rows] = await pool.query<any[]>(
    `SELECT r.id, r.nombre, r.activo, r.creado_en
     FROM roles r
     ${whereSql}
     ORDER BY r.id DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  return { page, limit, total, items: rows as RolItem[] };
}

export async function getRolById(id: number) {
  const [rows] = await pool.query<any[]>(
    `SELECT id, nombre, activo, creado_en FROM roles WHERE id = ? LIMIT 1`,
    [id]
  );
  return (rows?.[0] ?? null) as RolItem | null;
}

export async function createRol(input: { nombre: string; activo?: number }) {
  const nombre = (input.nombre ?? "").trim();
  const activo = input.activo === 0 ? 0 : 1;

  if (!nombre) throw new Error("El nombre es obligatorio.");

  const [dup] = await pool.query<any[]>(
    "SELECT id FROM roles WHERE nombre = ? LIMIT 1",
    [nombre]
  );
  if (dup.length) throw new Error("Ya existe un rol con ese nombre.");

  const [res] = await pool.query<any>(
    `INSERT INTO roles (nombre, activo) VALUES (?, ?)`,
    [nombre, activo]
  );

  return await getRolById(res.insertId);
}

export async function updateRol(id: number, input: { nombre: string }) {
  const nombre = (input.nombre ?? "").trim();
  if (!nombre) throw new Error("El nombre es obligatorio.");

  const current = await getRolById(id);
  if (!current) throw new Error("Rol no encontrado.");

  const [dup] = await pool.query<any[]>(
    "SELECT id FROM roles WHERE nombre = ? AND id <> ? LIMIT 1",
    [nombre, id]
  );
  if (dup.length) throw new Error("Ya existe otro rol con ese nombre.");

  await pool.query(`UPDATE roles SET nombre = ? WHERE id = ?`, [nombre, id]);
  return await getRolById(id);
}

export async function toggleRol(id: number, activo: number) {
  const current = await getRolById(id);
  if (!current) throw new Error("Rol no encontrado.");

  const val = activo === 0 ? 0 : 1;
  await pool.query(`UPDATE roles SET activo = ? WHERE id = ?`, [val, id]);
  return await getRolById(id);
}

export async function deleteRol(id: number) {
  const current = await getRolById(id);
  if (!current) throw new Error("Rol no encontrado.");

  await pool.query(`UPDATE roles SET activo = 0 WHERE id = ?`, [id]);
  return { ok: true };
}
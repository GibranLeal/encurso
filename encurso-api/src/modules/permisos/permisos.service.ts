import { pool } from "../../db/pool";

export type PermisoItem = {
  id: number;
  key: string;
  descripcion: string | null;
  grupo: string | null;
  activo: number;
  creado_en: string;
};

function toInt(v: any, def: number) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
}

export async function listPermisos(params: {
  search?: string;
  page?: number;
  limit?: number;
  activo?: number | null; // null = todos
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
    where.push("(p.`key` LIKE ? OR p.descripcion LIKE ? OR p.grupo LIKE ?)");
    const like = `%${search}%`;
    values.push(like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rowsCount] = await pool.query<any[]>(
    `SELECT COUNT(*) as total
     FROM permisos p
     ${whereSql}`,
    values
  );
  const total = rowsCount?.[0]?.total ?? 0;

  const [rows] = await pool.query<any[]>(
    `SELECT p.id, p.\`key\`, p.descripcion, p.grupo, p.activo, p.creado_en
     FROM permisos p
     ${whereSql}
     ORDER BY p.id DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset]
  );

  return {
    page,
    limit,
    total,
    items: rows as PermisoItem[],
  };
}

export async function createPermiso(input: {
  key: string;
  descripcion?: string | null;
  grupo?: string | null;
  activo?: number;
}) {
  const key = (input.key ?? "").trim();
  const descripcion = (input.descripcion ?? null) ? String(input.descripcion).trim() : null;
  const grupo = (input.grupo ?? null) ? String(input.grupo).trim() : null;
  const activo = input.activo === 0 ? 0 : 1;

  if (!key) throw new Error("El campo key es obligatorio.");
  if (key.length > 120) throw new Error("El campo key es demasiado largo.");

  // Valida unique
  const [dup] = await pool.query<any[]>(
    "SELECT id FROM permisos WHERE `key` = ? LIMIT 1",
    [key]
  );
  if (dup.length) throw new Error("Ya existe un permiso con esa key.");

  const [res] = await pool.query<any>(
    `INSERT INTO permisos (\`key\`, descripcion, grupo, activo)
     VALUES (?, ?, ?, ?)`,
    [key, descripcion, grupo, activo]
  );

  return await getPermisoById(res.insertId);
}

export async function getPermisoById(id: number) {
  const [rows] = await pool.query<any[]>(
    `SELECT id, \`key\`, descripcion, grupo, activo, creado_en
     FROM permisos WHERE id = ? LIMIT 1`,
    [id]
  );
  return (rows?.[0] ?? null) as PermisoItem | null;
}

export async function updatePermiso(
  id: number,
  input: { key: string; descripcion?: string | null; grupo?: string | null }
) {
  const key = (input.key ?? "").trim();
  const descripcion = (input.descripcion ?? null) ? String(input.descripcion).trim() : null;
  const grupo = (input.grupo ?? null) ? String(input.grupo).trim() : null;

  if (!key) throw new Error("El campo key es obligatorio.");

  const current = await getPermisoById(id);
  if (!current) throw new Error("Permiso no encontrado.");

  // Unique (excluyendo el mismo id)
  const [dup] = await pool.query<any[]>(
    "SELECT id FROM permisos WHERE `key` = ? AND id <> ? LIMIT 1",
    [key, id]
  );
  if (dup.length) throw new Error("Ya existe otro permiso con esa key.");

  await pool.query(
    `UPDATE permisos
     SET \`key\` = ?, descripcion = ?, grupo = ?
     WHERE id = ?`,
    [key, descripcion, grupo, id]
  );

  return await getPermisoById(id);
}

export async function togglePermiso(id: number, activo: number) {
  const current = await getPermisoById(id);
  if (!current) throw new Error("Permiso no encontrado.");

  const val = activo === 0 ? 0 : 1;

  await pool.query(`UPDATE permisos SET activo = ? WHERE id = ?`, [val, id]);
  return await getPermisoById(id);
}

// "Borrado lógico": aquí solo lo dejamos inactivo
export async function deletePermiso(id: number) {
  const current = await getPermisoById(id);
  if (!current) throw new Error("Permiso no encontrado.");

  await pool.query(`UPDATE permisos SET activo = 0 WHERE id = ?`, [id]);
  return { ok: true };
}
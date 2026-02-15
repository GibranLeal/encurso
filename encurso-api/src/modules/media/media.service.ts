import { pool } from "../../db/pool";

type Scope = "private" | "public";

export async function createMedia(data: {
  owner_user_id: number;
  scope: Scope;
  original_name: string;
  mime: string;
  size_bytes: number;
  path: string; // ej: "private/170...-123.png"
}) {
  const [result]: any = await pool.query(
    `INSERT INTO media (owner_user_id, scope, original_name, mime, size_bytes, path, eliminado)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [
      data.owner_user_id,
      data.scope,
      data.original_name,
      data.mime,
      data.size_bytes,
      data.path,
    ]
  );

  const [rows]: any = await pool.query(
    `SELECT * FROM media WHERE id = ? LIMIT 1`,
    [result.insertId]
  );

  return rows[0];
}

export async function getMediaForUser(userId: number) {
  const [rows]: any = await pool.query(
    `SELECT *
     FROM media
     WHERE owner_user_id = ?
       AND eliminado = 0
     ORDER BY id DESC`,
    [userId]
  );
  return rows;
}

export async function getMediaById(id: number) {
  const [rows]: any = await pool.query(
    `SELECT * FROM media WHERE id = ? AND eliminado = 0 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function deleteMediaLogical(id: number, userId: number) {
  const [rows]: any = await pool.query(
    `SELECT id FROM media WHERE id = ? AND owner_user_id = ? AND eliminado = 0 LIMIT 1`,
    [id, userId]
  );
  if (!rows.length) throw new Error("No encontrado o sin permisos");

  await pool.query(`UPDATE media SET eliminado = 1 WHERE id = ?`, [id]);
}

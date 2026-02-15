import bcrypt from "bcrypt";
import { pool } from "../../db/pool";

export type UsuarioRow = {
  id: number;
  nombre: string;
  email: string;
  activo: number;
  eliminado: number;
  creado_en: string;
};

export async function listUsuarios() {
  const [rows] = await pool.query<any[]>(
    `SELECT id, nombre, email, activo, eliminado, creado_en
     FROM usuarios
     WHERE eliminado = 0
     ORDER BY id DESC`
  );
  return rows as UsuarioRow[];
}

export async function findUsuarioById(id: number) {
  const [rows] = await pool.query<any[]>(
    `SELECT id, nombre, email, activo, eliminado, creado_en
     FROM usuarios
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function findUsuarioByEmail(email: string) {
  const [rows] = await pool.query<any[]>(
    `SELECT id
     FROM usuarios
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

export async function createUsuario(input: {
  nombre: string;
  email: string;
  password: string;
}) {
  const hash = await bcrypt.hash(input.password, 10);

  const [result] = await pool.query<any>(
    `INSERT INTO usuarios (nombre, email, password_hash, activo, eliminado)
     VALUES (?, ?, ?, 1, 0)`,
    [input.nombre, input.email, hash]
  );

  return { id: Number(result.insertId) };
}

export async function updateUsuario(
  id: number,
  input: { nombre: string; email: string; password?: string | null }
) {
  if (input.password && input.password.trim() !== "") {
    const hash = await bcrypt.hash(input.password, 10);
    await pool.query(
      `UPDATE usuarios
       SET nombre = ?, email = ?, password_hash = ?
       WHERE id = ?
       LIMIT 1`,
      [input.nombre, input.email, hash, id]
    );
  } else {
    await pool.query(
      `UPDATE usuarios
       SET nombre = ?, email = ?
       WHERE id = ?
       LIMIT 1`,
      [input.nombre, input.email, id]
    );
  }
  return { ok: true };
}

export async function setUsuarioActivo(id: number, activo: number) {
  await pool.query(
    `UPDATE usuarios SET activo = ? WHERE id = ? LIMIT 1`,
    [activo, id]
  );
  return { ok: true };
}

export async function softDeleteUsuario(id: number) {
  await pool.query(
    `UPDATE usuarios SET eliminado = 1 WHERE id = ? LIMIT 1`,
    [id]
  );
  return { ok: true };
}

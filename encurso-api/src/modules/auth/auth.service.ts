import bcrypt from "bcrypt";
import { pool } from "../../db/pool";

export type UserMe = {
  id: number;
  nombre: string;
  email: string;
  roles: string[];
  planName: string | null;
};

export async function findUserByEmail(email: string) {
  const [rows] = await pool.query<any[]>(
    `SELECT id, nombre, email, password_hash, activo
     FROM usuarios
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function getUserMe(userId: number): Promise<UserMe | null> {
  // Usuario
  const [uRows] = await pool.query<any[]>(
    `SELECT id, nombre, email, activo
     FROM usuarios
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );
  if (!uRows.length) return null;
  const u = uRows[0];

  // Roles
  const [rRows] = await pool.query<any[]>(
    `SELECT r.nombre
     FROM usuario_roles ur
     JOIN roles r ON r.id = ur.rol_id
     WHERE ur.usuario_id = ?`,
    [userId]
  );
  const roles = rRows.map((r) => r.nombre);

  // Plan (última suscripción activa si existe)
  const [pRows] = await pool.query<any[]>(
    `SELECT p.nombre AS planName
     FROM suscripciones s
     JOIN planes p ON p.id = s.plan_id
     WHERE s.organizador_id = ? AND s.estado = 'activa'
     ORDER BY s.id DESC
     LIMIT 1`,
    [userId]
  );
  const planName = pRows.length ? (pRows[0].planName as string) : null;

  return { id: u.id, nombre: u.nombre, email: u.email, roles, planName };
}

/**
 * Permisos efectivos:
 * (Permisos por plan) ∪ (Overrides allow) − (Overrides deny)
 *
 * Nota: si el usuario no tiene plan activo, base = [] y solo aplica override (si existe).
 */
export async function getEffectivePermissions(userId: number): Promise<string[]> {
  // Plan activo
  const [pRows] = await pool.query<any[]>(
    `SELECT s.plan_id
     FROM suscripciones s
     WHERE s.organizador_id = ? AND s.estado = 'activa'
     ORDER BY s.id DESC
     LIMIT 1`,
    [userId]
  );

  const planId: number | null = pRows.length ? Number(pRows[0].plan_id) : null;

  // Permisos por plan
  let base: string[] = [];
  if (planId) {
    const [ppRows] = await pool.query<any[]>(
      `SELECT pe.\`key\` AS permKey
       FROM plan_permisos pp
       JOIN permisos pe ON pe.id = pp.permiso_id
       WHERE pp.plan_id = ? AND pp.permitido = 1 AND pe.activo = 1`,
      [planId]
    );
    base = ppRows.map((x) => x.permKey as string);
  }

  // Overrides
  const [oRows] = await pool.query<any[]>(
    `SELECT pe.\`key\` AS permKey, uo.tipo
     FROM usuario_permisos_override uo
     JOIN permisos pe ON pe.id = uo.permiso_id
     WHERE uo.usuario_id = ? AND pe.activo = 1`,
    [userId]
  );

  const allow = new Set<string>();
  const deny = new Set<string>();
  for (const row of oRows) {
    const key = row.permKey as string;
    if (row.tipo === "allow") allow.add(key);
    if (row.tipo === "deny") deny.add(key);
  }

  const effective = new Set<string>(base);
  // permite “romper techos”
  for (const k of allow) effective.add(k);
  // deny siempre gana
  for (const k of deny) effective.delete(k);

  return [...effective].sort();
}

import bcrypt from "bcrypt";
import { pool } from "../../db/pool";

type UserPayload = {
  nombre: string;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  email: string;
  password?: string; // create obligatorio, update opcional
  telefono?: string | null;

  // dirección
  cp?: string | null;
  estado?: string | null;
  municipio?: string | null;
  colonia?: string | null;
  calle?: string | null;
  numero?: string | null;

  foto_media_id?: number | null;

  // rol
  rol_id?: number | null;
};

export async function listUsers() {
  const [rows] = await pool.query(
    `
    SELECT 
      u.*,
      ur.rol_id
    FROM usuarios u
    LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
    ORDER BY u.id DESC
    `
  );
  return rows as any[];
}

export async function createUser(payload: UserPayload) {
  const nombre = payload.nombre?.trim();
  const email = payload.email?.trim().toLowerCase();

  if (!nombre) throw new Error("Nombre es obligatorio");
  if (!email) throw new Error("Email es obligatorio");
  if (!payload.password || payload.password.length < 6)
    throw new Error("Password mínimo 6 caracteres");

  const password_hash = await bcrypt.hash(payload.password, 10);

  const [result]: any = await pool.query(
    `
    INSERT INTO usuarios
    (nombre, apellido_paterno, apellido_materno, email, password_hash, telefono,
     cp, estado, municipio, colonia, calle, numero, foto_media_id, activo)
    VALUES
    (?, ?, ?, ?, ?, ?,
     ?, ?, ?, ?, ?, ?, ?, 1)
    `,
    [
      nombre,
      payload.apellido_paterno ?? null,
      payload.apellido_materno ?? null,
      email,
      password_hash,
      payload.telefono ?? null,

      payload.cp ?? null,
      payload.estado ?? null,
      payload.municipio ?? null,
      payload.colonia ?? null,
      payload.calle ?? null,
      payload.numero ?? null,

      payload.foto_media_id ?? null,
    ]
  );

  const userId = Number(result.insertId);

  // ✅ CAMBIO: guardar rol en usuario_roles (usuario_id, rol_id)
  if (payload.rol_id) {
    await upsertUserRole(userId, payload.rol_id);
  }

  return { id: userId };
}

export async function updateUser(userId: number, payload: UserPayload) {
  const nombre = payload.nombre?.trim();
  const email = payload.email?.trim().toLowerCase();

  if (!nombre) throw new Error("Nombre es obligatorio");
  if (!email) throw new Error("Email es obligatorio");

  await pool.query(
    `
    UPDATE usuarios SET
      nombre = ?,
      apellido_paterno = ?,
      apellido_materno = ?,
      email = ?,
      telefono = ?,
      cp = ?,
      estado = ?,
      municipio = ?,
      colonia = ?,
      calle = ?,
      numero = ?,
      foto_media_id = ?,
      actualizado_en = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [
      nombre,
      payload.apellido_paterno ?? null,
      payload.apellido_materno ?? null,
      email,
      payload.telefono ?? null,

      payload.cp ?? null,
      payload.estado ?? null,
      payload.municipio ?? null,
      payload.colonia ?? null,
      payload.calle ?? null,
      payload.numero ?? null,

      payload.foto_media_id ?? null,
      userId,
    ]
  );

  // password opcional
  if (payload.password && payload.password.trim().length > 0) {
    if (payload.password.length < 6) throw new Error("Password mínimo 6 caracteres");
    const password_hash = await bcrypt.hash(payload.password, 10);
    await pool.query(`UPDATE usuarios SET password_hash=? WHERE id=?`, [
      password_hash,
      userId,
    ]);
  }

  // ✅ CAMBIO: rol opcional
  if (payload.rol_id === null) {
    await deleteUserRole(userId);
  } else if (typeof payload.rol_id === "number" && payload.rol_id > 0) {
    await upsertUserRole(userId, payload.rol_id);
  }

  return { id: userId };
}

export async function setUserActive(userId: number, activo: number) {
  await pool.query(`UPDATE usuarios SET activo=? WHERE id=?`, [activo ? 1 : 0, userId]);
  return { id: userId };
}

export async function logicalDeleteUser(userId: number) {
  await pool.query(`UPDATE usuarios SET activo=0 WHERE id=?`, [userId]);
  return { id: userId };
}

/** =========================
 *  ✅ usuario_roles helpers
 *  =========================
 *  Tu tabla real: usuario_id + rol_id (sin id)
 */
export async function upsertUserRole(usuario_id: number, rol_id: number) {
  // si el usuario solo tendrá 1 rol: borramos y volvemos a insertar
  await pool.query(`DELETE FROM usuario_roles WHERE usuario_id=?`, [usuario_id]);
  await pool.query(`INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (?, ?)`, [
    usuario_id,
    rol_id,
  ]);
}

export async function deleteUserRole(usuario_id: number) {
  await pool.query(`DELETE FROM usuario_roles WHERE usuario_id=?`, [usuario_id]);
}

export async function getMeUser(userId: number) {
  const [rows]: any = await pool.query(
    `
    SELECT
      u.id,
      u.nombre,
      u.apellido_paterno,
      u.apellido_materno,
      u.email,
      u.foto_media_id,
      ur.rol_id
    FROM usuarios u
    LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
    WHERE u.id = ?
    LIMIT 1
    `,
    [userId]
  );

  return rows?.[0] || null;
}

export async function getUserById(id: number) {
  const [rows]: any = await pool.query(
    `
    SELECT 
      u.id,
      u.nombre,
      u.apellido_paterno,
      u.apellido_materno,
      u.email,
      u.foto_media_id,
      ur.rol_id
    FROM usuarios u
    LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
    WHERE u.id = ?
    LIMIT 1
    `,
    [id]
  );

  if (!rows.length) {
    throw new Error("Usuario no encontrado");
  }

  return rows[0];
}

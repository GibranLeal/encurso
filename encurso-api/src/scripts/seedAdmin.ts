import bcrypt from "bcrypt";
import { pool } from "../db/pool";

async function seedAdmin() {
  const nombre = "Administrador";
  const email = "admin@encurso.mx";
  const password = "Admin123*";

  const password_hash = await bcrypt.hash(password, 10);

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1) Insertar usuario
    const [userResult] = await conn.query<any>(
      `INSERT INTO usuarios (nombre, email, password_hash, activo) VALUES (?, ?, ?, 1)`,
      [nombre, email, password_hash]
    );

    const userId = userResult.insertId as number;

    // 2) Obtener rol ADMIN
    const [roles] = await conn.query<any[]>(
      `SELECT id FROM roles WHERE nombre = 'ADMIN' LIMIT 1`
    );

    if (!roles.length) throw new Error("Rol ADMIN no existe. Revisa seeds.");
    const rolId = roles[0].id as number;

    // 3) Asignar rol
    await conn.query(
      `INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (?, ?)`,
      [userId, rolId]
    );

    // 4) (Opcional) Asignar plan Premium al admin (por si quieres probar permisos/planes)
    const [planes] = await conn.query<any[]>(
      `SELECT id FROM planes WHERE nombre = 'Premium' LIMIT 1`
    );

    if (planes.length) {
      const planId = planes[0].id as number;
      await conn.query(
        `INSERT INTO suscripciones (organizador_id, plan_id, estado) VALUES (?, ?, 'activa')`,
        [userId, planId]
      );
    }

    await conn.commit();

    console.log("✅ Admin creado correctamente");
    console.log("Email:", email);
    console.log("Password:", password);
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error creando admin:", err);
  } finally {
    conn.release();
    await pool.end();
  }
}

seedAdmin();

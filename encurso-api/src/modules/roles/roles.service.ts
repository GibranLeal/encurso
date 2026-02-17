// roles.service.ts
import { pool } from "../../db/pool";

export async function listRoles() {
  const [rows] = await pool.query(`
    SELECT id, nombre, activo
    FROM roles
    WHERE activo = 1
    ORDER BY nombre ASC
  `);
  return rows as any[];
}

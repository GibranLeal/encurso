import { pool } from "../../db/pool";

export type NavModule = {
  id: number;
  nombre: string;
  ruta: string;
  icono: string | null;
  orden: number;
  modulo_padre_id: number | null;
  permiso_key: string | null;
};

export async function getActiveModules(): Promise<NavModule[]> {
  const [rows] = await pool.query<any[]>(
    `SELECT
      m.id, m.nombre, m.ruta, m.icono, m.orden, m.modulo_padre_id,
      p.\`key\` AS permiso_key
     FROM modulos m
     LEFT JOIN permisos p ON p.id = m.permiso_requerido_id
     WHERE m.activo = 1
     ORDER BY m.orden ASC`
  );

  return rows.map((r) => ({
    id: Number(r.id),
    nombre: r.nombre as string,
    ruta: r.ruta as string,
    icono: (r.icono ?? null) as string | null,
    orden: Number(r.orden),
    modulo_padre_id: (r.modulo_padre_id ?? null) as number | null,
    permiso_key: (r.permiso_key ?? null) as string | null,
  }));
}

/**
 * Filtra módulos por permisos efectivos:
 * - si el módulo NO requiere permiso => se muestra
 * - si requiere => debe estar en permissionsEffective
 */
export function filterModulesByPermissions(mods: NavModule[], permissions: Set<string>) {
  return mods.filter((m) => !m.permiso_key || permissions.has(m.permiso_key));
}

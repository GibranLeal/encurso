import { pool } from "../../db/pool";

export async function lookupByCp(cp: string) {
  const clean = String(cp).replace(/\D/g, "").slice(0, 5);
  if (clean.length !== 5) {
    return { estados: [], municipios: [], colonias: [] };
  }

  const [rows]: any = await pool.query(
    `
    SELECT estado, municipio, colonia
    FROM sepomex_cp
    WHERE cp = ?
    ORDER BY colonia ASC
    `,
    [clean]
  );

  const estados = Array.from(new Set(rows.map((r: any) => r.estado))).filter(Boolean);
  const municipios = Array.from(new Set(rows.map((r: any) => r.municipio))).filter(Boolean);
  const colonias = Array.from(new Set(rows.map((r: any) => r.colonia))).filter(Boolean);

  return { estados, municipios, colonias };
}

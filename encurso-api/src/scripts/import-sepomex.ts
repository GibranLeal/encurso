import fs from "fs";
import path from "path";
import { parseStringPromise } from "xml2js";
import { pool } from "../db/pool";

/** Busca recursivamente un arreglo de registros que tenga campos típicos de SEPOMEX */
function findSepomexRecords(node: any): any[] | null {
  if (!node) return null;

  // Si es arreglo, revisa si parece arreglo de registros
  if (Array.isArray(node)) {
    if (node.length && typeof node[0] === "object") {
      const sample = node[0];
      const keys = Object.keys(sample || {});
      const looksLikeSepomex =
        keys.includes("d_codigo") ||
        keys.includes("d_asenta") ||
        keys.includes("D_mnpio") ||
        keys.includes("d_estado");

      if (looksLikeSepomex) return node;
    }

    // Si no, buscar dentro de sus elementos
    for (const item of node) {
      const found = findSepomexRecords(item);
      if (found) return found;
    }
    return null;
  }

  // Si es objeto, recorrer propiedades
  if (typeof node === "object") {
    for (const k of Object.keys(node)) {
      const found = findSepomexRecords(node[k]);
      if (found) return found;
    }
  }

  return null;
}

/** Extrae un string robusto (porque xml2js a veces mete arrays) */
function pickStr(v: any): string {
  if (v == null) return "";
  if (Array.isArray(v)) return pickStr(v[0]);
  return String(v).trim();
}

async function run() {
  try {
    const filePath = path.join(__dirname, "CPdescarga.xml");

    console.log("Leyendo XML...");
    const xmlData = fs.readFileSync(filePath, "utf8");

    const result = await parseStringPromise(xmlData, {
      explicitArray: false,
      trim: true,
      mergeAttrs: true,
    });

    // ✅ diagnóstico: ver raíz
    const rootKeys = Object.keys(result || {});
    console.log("Root keys:", rootKeys);

    // 🔍 busca registros automáticamente
    const records = findSepomexRecords(result);

    if (!records || !records.length) {
      console.log("No se encontraron registros SEPOMEX en el XML.");
      console.log("Tip: revisa que el XML sea el de 'CodigoPostal_Exportar' de Correos.");
      return;
    }

    console.log(`Registros encontrados: ${records.length}`);
    console.log("Ejemplo keys:", Object.keys(records[0] || {}));

    // ✅ crea tabla si no existe (por si acaso)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sepomex_cp (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        cp VARCHAR(5) NOT NULL,
        estado VARCHAR(150) NOT NULL,
        municipio VARCHAR(150) NOT NULL,
        colonia VARCHAR(200) NOT NULL,
        tipo_asentamiento VARCHAR(100) NULL,
        UNIQUE KEY unique_cp_colonia (cp, colonia),
        INDEX idx_cp (cp)
      );
    `);

    // ✅ inserción por lotes para velocidad
    const batchSize = 2000;
    let inserted = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const chunk = records.slice(i, i + batchSize);

      const values: any[] = [];
      const placeholders: string[] = [];

      for (const row of chunk) {
        const cp = pickStr(row.d_codigo).replace(/\D/g, "").slice(0, 5).padStart(5, "0");
        const estado = pickStr(row.d_estado);
        const municipio = pickStr(row.D_mnpio);
        const colonia = pickStr(row.d_asenta);
        const tipo = pickStr(row.d_tipo_asenta);

        if (!cp || !estado || !municipio || !colonia) continue;

        placeholders.push("(?, ?, ?, ?, ?)");
        values.push(cp, estado, municipio, colonia, tipo || null);
      }

      if (!placeholders.length) continue;

      await pool.query(
        `
        INSERT IGNORE INTO sepomex_cp
          (cp, estado, municipio, colonia, tipo_asentamiento)
        VALUES ${placeholders.join(",")}
        `,
        values
      );

      inserted += placeholders.length;
      console.log(`Insertando... ${Math.min(i + batchSize, records.length)}/${records.length}`);
    }

    console.log(`✅ Importación completada. Filas procesadas: ${inserted}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error importando XML:", err);
    process.exit(1);
  }
}

run();

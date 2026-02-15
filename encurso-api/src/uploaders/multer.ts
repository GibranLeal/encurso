import multer from "multer";
import path from "path";
import fs from "fs";

// Ruta base uploads (fuera de src)
const uploadBasePath = path.resolve(__dirname, "../../uploads");

// Crear carpetas si no existen
["private", "public"].forEach((folder) => {
  const dir = path.join(uploadBasePath, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuración PRIVATE
export const uploadPrivate = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(uploadBasePath, "private"));
    },
    filename: (_req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, unique + ext);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

import { Router } from "express";
import path from "path";
import fs from "fs";
import { uploadPrivate } from "../../uploaders/multer";
import { createMedia, deleteMediaLogical, getMediaById, getMediaForUser } from "./media.service";

// ⛳️ Ajusta a tu middleware real
import { authRequired } from "../../middlewares/authRequired";

export const mediaRouter = Router();

/**
 * GET /media  -> lista del usuario logueado
 */
mediaRouter.get("/", authRequired, async (req: any, res) => {
  try {
    const items = await getMediaForUser(req.userId); // ✅
    res.json({ success: true, items });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});


/**
 * POST /media/upload (1 archivo)
 * FormData key: "file"
 */
mediaRouter.post(
  "/upload",
  authRequired,
  uploadPrivate.single("file"),
  async (req: any, res) => {
    try {
      if (!req.file) throw new Error("No llegó archivo (key debe ser 'file')");

      const item = await createMedia({
        owner_user_id: req.userId,
        scope: "private",
        original_name: req.file.originalname,
        mime: req.file.mimetype,
        size_bytes: req.file.size,
        path: `private/${req.file.filename}`,
      });

      res.json({ success: true, item });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
);

/**
 * POST /media/upload-many (muchos archivos)
 * FormData key: "files"
 */
mediaRouter.post(
  "/upload-many",
  authRequired,
  uploadPrivate.array("files", 30),
  async (req: any, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files?.length) throw new Error("No llegaron archivos (key debe ser 'files')");

      const created = [];
      for (const f of files) {
        const item = await createMedia({
          owner_user_id: req.userId,
          scope: "private",
          original_name: f.originalname,
          mime: f.mimetype,
          size_bytes: f.size,
          path: `private/${f.filename}`,
        });
        created.push(item);
      }

      res.json({ success: true, items: created });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
);

/**
 * GET /media/:id/view  -> muestra imagen (privada con auth)
 */
mediaRouter.get("/:id/view", authRequired, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const item = await getMediaById(id);
    if (!item) return res.status(404).end();

    // Solo dueño (luego metemos bypass admin)
    if (item.owner_user_id !== req.userId) return res.status(403).end();

    const abs = path.resolve(process.cwd(), "uploads", item.path);
    if (!fs.existsSync(abs)) return res.status(404).end();

    res.setHeader("Content-Type", item.mime);
    fs.createReadStream(abs).pipe(res);
  } catch {
    res.status(404).end();
  }
});

/**
 * DELETE /media/:id -> borrado lógico
 */
mediaRouter.delete("/:id", authRequired, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    await deleteMediaLogical(id, req.userId);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});

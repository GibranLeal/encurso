import { Router } from "express";
import { authRequired } from "../../middlewares/authRequired";
import {
  listPermisos,
  createPermiso,
  updatePermiso,
  togglePermiso,
  deletePermiso,
  getPermisoById,
} from "./permisos.service";

export const permisosRouter = Router();

// ✅ Protegido por JWT
permisosRouter.use(authRequired);

// GET list con buscador/paginación
// /api/permisos?search=&page=1&limit=10&activo=1
permisosRouter.get("/", async (req, res) => {
  try {
    const { search, page, limit, activo } = req.query as any;

    const data = await listPermisos({
      search,
      page,
      limit,
      activo,
    });

    return res.json({ success: true, ...data });
  } catch (e: any) {
    return res.status(400).json({
      success: false,
      message: e.message || "Error",
    });
  }
});

permisosRouter.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await getPermisoById(id);
    if (!item) return res.status(404).json({ success: false, message: "No encontrado" });
    return res.json({ success: true, item });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message || "Error" });
  }
});

permisosRouter.post("/", async (req, res) => {
  try {
    const item = await createPermiso(req.body);
    return res.json({ success: true, item });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message || "Error" });
  }
});

permisosRouter.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await updatePermiso(id, req.body);
    return res.json({ success: true, item });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message || "Error" });
  }
});

// Switch activo
permisosRouter.put("/:id/toggle", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const activo = Number(req.body?.activo);
    const item = await togglePermiso(id, activo);
    return res.json({ success: true, item });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message || "Error" });
  }
});

// delete lógico
permisosRouter.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await deletePermiso(id);
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message || "Error" });
  }
});
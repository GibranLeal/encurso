import { Router } from "express";
import { authRequired } from "../../middlewares/authRequired";
import {
  listRoles,
  createRol,
  updateRol,
  toggleRol,
  deleteRol,
  getRolById,
} from "./roles.service";

export const rolesRouter = Router();
rolesRouter.use(authRequired);

rolesRouter.get("/", async (req, res) => {
  try {
    const { search, page, limit, activo } = req.query as any;

    const data = await listRoles({
      search,
      page,
      limit,
      activo,
    });

    return res.json({ success: true, ...data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message || "Error" });
  }
});

rolesRouter.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await getRolById(id);
    if (!item) return res.status(404).json({ success: false, message: "No encontrado" });
    return res.json({ success: true, item });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message || "Error" });
  }
});

rolesRouter.post("/", async (req, res) => {
  try {
    const item = await createRol(req.body);
    return res.json({ success: true, item });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message || "Error" });
  }
});

rolesRouter.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await updateRol(id, req.body);
    return res.json({ success: true, item });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message || "Error" });
  }
});

rolesRouter.put("/:id/toggle", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const activo = Number(req.body?.activo);
    const item = await toggleRol(id, activo);
    return res.json({ success: true, item });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message || "Error" });
  }
});

rolesRouter.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await deleteRol(id);
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message || "Error" });
  }
});
import { Router } from "express";
import { authRequired } from "../../middlewares/authRequired";
import {
  listPlanes,
  createPlan,
  updatePlan,
  togglePlan,
  deletePlan,
  getPlanById,
} from "./planes.service";

export const planesRouter = Router();
planesRouter.use(authRequired);

// GET /api/planes?search=&page=1&limit=10
planesRouter.get("/", async (req, res) => {
  try {
    const { search, page, limit, activo } = req.query as any;

    const data = await listPlanes({
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

planesRouter.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await getPlanById(id);
    if (!item) return res.status(404).json({ success: false, message: "No encontrado" });
    return res.json({ success: true, item });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message || "Error" });
  }
});

planesRouter.post("/", async (req, res) => {
  try {
    const item = await createPlan(req.body);
    return res.json({ success: true, item });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message || "Error" });
  }
});

planesRouter.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await updatePlan(id, req.body);
    return res.json({ success: true, item });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message || "Error" });
  }
});

planesRouter.put("/:id/toggle", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const activo = Number(req.body?.activo);
    const item = await togglePlan(id, activo);
    return res.json({ success: true, item });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message || "Error" });
  }
});

planesRouter.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await deletePlan(id);
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message || "Error" });
  }
});
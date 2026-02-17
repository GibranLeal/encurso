import { Router } from "express";
import { authRequired } from "../../middlewares/authRequired";
import { getMeUser } from "./users.service";
import { getUserById } from "./users.service";

const router = Router();

import {
  createUser,
  listUsers,
  logicalDeleteUser,
  setUserActive,
  updateUser,
} from "./users.service";



export const usersRouter = Router();

usersRouter.get("/me", authRequired, async (req: any, res) => {
  try {
    const userId = req.user?.id; // viene del authRequired
    if (!userId) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }

    const item = await getUserById(userId); // vamos a crear esto
    res.json({ success: true, item });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});


usersRouter.post("/", authRequired, async (req, res) => {
  try {
    const out = await createUser(req.body);
    res.json({ success: true, item: out });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});

usersRouter.put("/:id", authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const out = await updateUser(id, req.body);
    res.json({ success: true, item: out });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});

usersRouter.patch("/:id/active", authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const activo = Number(req.body?.activo) ? 1 : 0;
    const out = await setUserActive(id, activo);
    res.json({ success: true, item: out });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});

usersRouter.delete("/:id", authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const out = await logicalDeleteUser(id);
    res.json({ success: true, item: out });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});

usersRouter.get("/me", authRequired, async (req: any, res) => {
  try {
    const userId = Number(req.user?.id);
    if (!userId) return res.status(401).json({ success: false, message: "No autorizado" });

    const item = await getMeUser(userId);
    if (!item) return res.status(404).json({ success: false, message: "Usuario no encontrado" });

    res.json({ success: true, item });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});

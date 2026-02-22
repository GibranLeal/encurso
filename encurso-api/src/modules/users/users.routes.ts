// src/modules/users/users.routes.ts
import { Router } from "express";
import { authRequired, AuthRequest } from "../../middlewares/authRequired";

import {
  createUser,
  listUsers,
  logicalDeleteUser,
  setUserActive,
  updateUser,
  getMeUser,
  getUserById,
} from "./users.service";

export const usersRouter = Router();

/**
 * GET /api/users
 * Lista usuarios (para tu tabla)
 */
usersRouter.get("/", authRequired, async (_req, res) => {
  try {
    const items = await listUsers();
    res.json({ success: true, items });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});

/**
 * GET /api/users/me
 * Usuario autenticado
 */
usersRouter.get("/me", authRequired, async (req: AuthRequest, res) => {
  try {
    const userId = Number(req.userId);
    if (!userId) {
      return res.status(401).json({ success: false, message: "No autorizado" });
    }

    const item = await getMeUser(userId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    res.json({ success: true, item });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});

/**
 * POST /api/users
 * Crear usuario
 */
usersRouter.post("/", authRequired, async (req, res) => {
  try {
    const out = await createUser(req.body);
    res.json({ success: true, item: out });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});

/**
 * PUT /api/users/:id
 * Actualizar usuario
 */
usersRouter.put("/:id", authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const out = await updateUser(id, req.body);
    res.json({ success: true, item: out });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});

/**
 * PATCH /api/users/:id/active
 * Activar / desactivar
 */
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

/**
 * DELETE /api/users/:id
 * Borrado lógico (activo=0)
 */
usersRouter.delete("/:id", authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const out = await logicalDeleteUser(id);
    res.json({ success: true, item: out });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});

/**
 * (Opcional) GET /api/users/:id
 * Por si lo usas en edición por id
 */
usersRouter.get("/:id", authRequired, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await getUserById(id);
    res.json({ success: true, item });
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message });
  }
});
import { Router } from "express";
import { z } from "zod";
import { authRequired, AuthRequest } from "../../middlewares/authRequired";
import {
  listUsuarios,
  createUsuario,
  updateUsuario,
  setUsuarioActivo,
  softDeleteUsuario,
  findUsuarioByEmail,
} from "./users.service";

export const usersRouter = Router();

// Todo requiere auth
usersRouter.use(authRequired);

usersRouter.get("/", async (_req: AuthRequest, res) => {
  const items = await listUsuarios();
  return res.json({ items });
});

const createSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

usersRouter.post("/", async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
  }

  const exists = await findUsuarioByEmail(parsed.data.email);
  if (exists) return res.status(409).json({ message: "Ese email ya existe" });

  const created = await createUsuario(parsed.data);
  return res.json({ ok: true, id: created.id });
});

const updateSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(0).optional(), // puede ir vacío para no cambiar
});

usersRouter.put("/:id", async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "ID inválido" });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
  }

  await updateUsuario(id, parsed.data);
  return res.json({ ok: true });
});

const activeSchema = z.object({
  activo: z.number().int().min(0).max(1),
});

usersRouter.patch("/:id/active", async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "ID inválido" });

  const parsed = activeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
  }

  await setUsuarioActivo(id, parsed.data.activo);
  return res.json({ ok: true });
});

usersRouter.delete("/:id", async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "ID inválido" });

  await softDeleteUsuario(id);
  return res.json({ ok: true });
});

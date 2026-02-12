import { Router } from "express";
import { z } from "zod";
import { signToken } from "../../utils/jwt";
import { authRequired, AuthRequest } from "../../middlewares/authRequired";
import {
  findUserByEmail,
  verifyPassword,
  getUserMe,
  getEffectivePermissions,
} from "./auth.service";
import { getActiveModules, filterModulesByPermissions } from "../navigation/navigation.service";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ message: "Credenciales inválidas" });
  if (Number(user.activo) !== 1) return res.status(403).json({ message: "Usuario desactivado" });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

  const token = signToken(Number(user.id));

  return res.json({ token });
});

authRouter.get("/me", authRequired, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const me = await getUserMe(userId);
  if (!me) return res.status(404).json({ message: "Usuario no encontrado" });

  const permissionsEffective = await getEffectivePermissions(userId);
  const permissionsSet = new Set(permissionsEffective);

  const allModules = await getActiveModules();
  const modules = filterModulesByPermissions(allModules, permissionsSet);

  return res.json({
    user: {
      id: me.id,
      name: me.nombre,
      email: me.email,
      roles: me.roles,
      planName: me.planName,
    },
    permissionsEffective,
    modules,
  });
});

// roles.routes.ts
import { Router } from "express";
import { listRoles } from "./roles.service";
import { authRequired } from "../../middlewares/authRequired";
const router = Router();

router.get("/roles", authRequired, async (_req, res) => {
  const items = await listRoles();
  res.json({ items });
});

export default router;

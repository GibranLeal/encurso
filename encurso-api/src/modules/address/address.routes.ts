// src/modules/address/address.routes.ts
import { Router } from "express";
import { authRequired } from "../../middlewares/authRequired";
import { lookupByCp } from "./address.service";

const router = Router();

router.get("/address/cp/:cp", authRequired, async (req, res) => {
  const cp = String(req.params.cp || "").replace(/\D/g, "").slice(0, 5);
  if (cp.length !== 5) return res.status(400).json({ message: "CP inválido" });

  const data = await lookupByCp(cp);
  res.json(data); // { estados:[], municipios:[], colonias:[] }
});

export default router;

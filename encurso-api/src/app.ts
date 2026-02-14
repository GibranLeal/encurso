import express from "express";
import cors from "cors";
import { authRouter } from "./modules/auth/auth.routes";
import { modulesRouter } from "./modules/modules/modules.routes"; // ✅ agrega esto

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/modules", modulesRouter); // ✅ agrega esto

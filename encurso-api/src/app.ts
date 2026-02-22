// src/app.ts
import express from "express";
import cors from "cors";
import path from "path";

import { authRouter } from "./modules/auth/auth.routes";
import { modulesRouter } from "./modules/modules/modules.routes";
import { usersRouter } from "./modules/users/users.routes";
import { mediaRouter } from "./modules/media/media.routes";

import rolesRouter from "./modules/roles/roles.routes";
import addressRouter from "./modules/address/address.routes";

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

// ✅ APIs del dashboard
app.use("/api", rolesRouter);
app.use("/api", addressRouter);

app.use("/api/users", usersRouter);
app.use("/api/media", mediaRouter);
app.use("/api/modules", modulesRouter);

// ✅ auth separado
app.use("/auth", authRouter);

// ✅ uploads estático
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
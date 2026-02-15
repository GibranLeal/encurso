import express from "express";
import cors from "cors";
import { authRouter } from "./modules/auth/auth.routes";
import { modulesRouter } from "./modules/modules/modules.routes"; 
import { usersRouter } from "./modules/users/users.routes";
import { mediaRouter } from "./modules/media/media.routes";

import path from "path";

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/modules", modulesRouter);
app.use("/users", usersRouter);
app.use("/media", mediaRouter);
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);
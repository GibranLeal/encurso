// src/middlewares/authRequired.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export type AuthRequest = Request & { userId?: number };

export function authRequired(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "No autorizado" });
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}
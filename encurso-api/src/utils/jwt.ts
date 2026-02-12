import * as jwt from "jsonwebtoken";
import type { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type JwtPayloadUser = { sub: number };

export function signToken(userId: number) {
  const secret: Secret = env.JWT_SECRET as Secret;

  // payload como objeto normal
  const payload = { sub: String(userId) };

  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, secret, options);
}

export function verifyToken(token: string): JwtPayloadUser {
  const secret: Secret = env.JWT_SECRET as Secret;

  const decoded = jwt.verify(token, secret) as JwtPayload;

  const sub = decoded.sub;
  if (!sub) throw new Error("Token sin sub");

  const userId = Number(sub);
  if (!Number.isFinite(userId)) throw new Error("sub inválido");

  return { sub: userId };
}

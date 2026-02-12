import { http } from "../../shared/api/http";

export type LoginPayload = { email: string; password: string };

export type MeResponse = {
  user: { id: number; name: string; email: string; roles: string[]; planName: string | null };
  permissionsEffective: string[];
  modules: Array<{
    id: number;
    nombre: string;
    ruta: string;
    icono: string | null;
    orden: number;
    modulo_padre_id: number | null;
    permiso_key: string | null;
  }>;
};

export async function login(payload: LoginPayload) {
  const res = await http.post<{ token: string }>("/auth/login", payload);
  return res.data;
}

export async function me() {
  const res = await http.get<MeResponse>("/auth/me");
  return res.data;
}

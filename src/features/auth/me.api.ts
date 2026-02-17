import { getToken } from "./auth.store";

const API = "http://localhost:4000";

function authHeader() {
  const token = getToken();
  if (!token) throw new Error("No hay token");
  return { Authorization: `Bearer ${token}` };
}

export type MeUser = {
  id: number;
  nombre: string;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  email: string;
  foto_media_id?: number | null;
  rol_id?: number | null;
};

export async function fetchMe() {
  const res = await fetch(`${API}/api/users/me`, { headers: authHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error");
  return data.item as MeUser;
}

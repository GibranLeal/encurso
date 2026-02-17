// src/features/media/media.api.ts
import { getToken } from "../auth/auth.store";

const API = "http://localhost:4000/api"; // ✅ ahora incluye /api

export type MediaRow = {
  id: number;
  owner_user_id: number;
  scope: "private" | "public";
  original_name: string;
  mime: string;
  size_bytes: number;
  path: string;
  created_en?: string;
};

function authHeader() {
  const token = getToken();
  if (!token) throw new Error("No hay token");
  return { Authorization: `Bearer ${token}` };
}

/** SINGLE: POST /api/media/upload (key: file) -> { success, item } */
export async function uploadPrivateImage(file: File) {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${API}/media/upload`, {
    method: "POST",
    headers: authHeader(),
    body: fd,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error al subir");
  return data.item as MediaRow;
}

/** MANY: POST /api/media/upload-many (key: files) -> { success, items } */
export async function uploadPrivateImages(files: File[]) {
  const fd = new FormData();
  for (const f of files) fd.append("files", f);

  const res = await fetch(`${API}/media/upload-many`, {
    method: "POST",
    headers: authHeader(),
    body: fd,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error al subir");
  return (data.items || []) as MediaRow[];
}

/** GET /api/media -> { success, items } */
export async function listMyMedia() {
  const res = await fetch(`${API}/media`, {
    headers: authHeader(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error");
  return (data.items || []) as MediaRow[];
}

/** DELETE /api/media/:id -> { success } */
export async function deleteMyMedia(id: number) {
  const res = await fetch(`${API}/media/${id}`, {
    method: "DELETE",
    headers: authHeader(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error");
  return data;
}

/** GET /api/media/:id/view -> blob url */
export async function fetchMediaBlobUrl(mediaId: number) {
  const res = await fetch(`${API}/media/${mediaId}/view`, {
    headers: authHeader(),
  });

  if (!res.ok) throw new Error("No se pudo cargar la imagen");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

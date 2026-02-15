import { getToken } from "../auth/auth.store";
const API = "http://localhost:4000";

export function mediaViewUrl(id: number) {
  return `${API}/media/${id}/view`;
}

export async function uploadPrivateImage(file: File) {
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(`${API}/media/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error al subir");
  return data.item; // media row
}

export async function uploadPrivateImages(files: File[]) {
  const token = getToken();
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f)); // 👈 key "files"

  const res = await fetch(`${API}/media/upload-many`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error al subir");
  return data.items || [];
}

export async function deleteMyMedia(id: number) {
  const token = getToken();
  const res = await fetch(`${API}/media/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error");
  return data;
}

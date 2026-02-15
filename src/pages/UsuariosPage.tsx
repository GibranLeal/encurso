import { useEffect, useMemo, useState } from "react";

/** =========================
 *  Helpers API (igual que tú)
 *  ========================= */
function getToken() {
  return localStorage.getItem("encurso_token") || "";
}

async function apiGet(path: string) {
  const res = await fetch(`http://localhost:4000${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error");
  return data;
}

async function apiPost(path: string, body: any) {
  const res = await fetch(`http://localhost:4000${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error");
  return data;
}

async function apiPut(path: string, body: any) {
  const res = await fetch(`http://localhost:4000${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error");
  return data;
}

async function apiPatch(path: string, body: any) {
  const res = await fetch(`http://localhost:4000${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error");
  return data;
}

async function apiDelete(path: string) {
  const res = await fetch(`http://localhost:4000${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error");
  return data;
}

/** =========================
 *  Media (tu backend real)
 *  =========================
 *  - POST   /media/upload      (single, key "file") -> { success, item }
 *  - GET    /media/:id/view    (private, requiere Authorization) -> stream image
 *  - DELETE /media/:id         (lógico) -> { success }
 */
async function apiUploadMedia(file: File) {
  const fd = new FormData();
  fd.append("file", file); // 👈 key EXACTA

  const res = await fetch(`http://localhost:4000/media/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
    body: fd,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error subiendo media");
  return data.item as { id: number };
}

/**
 * Como /media/:id/view es PRIVADO, <img src="..."> no manda headers.
 * Entonces bajamos como blob con Authorization y creamos un ObjectURL.
 */
async function fetchMediaBlobUrl(mediaId: number) {
  const res = await fetch(`http://localhost:4000/media/${mediaId}/view`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("No se pudo cargar la imagen");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

type Usuario = {
  id: number;
  nombre: string;
  email: string;
  activo: number;
  creado_en?: string;

  // Media
  foto_media_id?: number | null;
};

export function UsuariosPage() {
  // Media (id + preview)
  const [fotoMediaId, setFotoMediaId] = useState<number | null>(null);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string>("");
  const [uploadingFoto, setUploadingFoto] = useState(false);

  // Cache de previews por id para la tabla (evita refetch a cada render)
  const [avatarCache, setAvatarCache] = useState<Record<number, string>>({});

  const [items, setItems] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const isEditing = editingId !== null;

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet("/users");
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Cuando llegue lista, precarga (suave) avatars de los que tengan foto_media_id
  useEffect(() => {
    let cancelled = false;

    async function warm() {
      const ids = Array.from(
        new Set(items.map((u) => u.foto_media_id).filter((x): x is number => typeof x === "number"))
      );

      for (const id of ids) {
        if (cancelled) break;
        if (avatarCache[id]) continue;
        try {
          const url = await fetchMediaBlobUrl(id);
          if (cancelled) break;
          setAvatarCache((prev) => ({ ...prev, [id]: url }));
        } catch {
          // si falla, no pasa nada
        }
      }
    }

    if (items.length) warm();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((u) =>
      [u.nombre, u.email, String(u.id)].some((x) =>
        String(x).toLowerCase().includes(s)
      )
    );
  }, [q, items]);

  function clearFotoLocalPreview() {
    if (fotoPreviewUrl?.startsWith("blob:")) {
      try { URL.revokeObjectURL(fotoPreviewUrl); } catch {}
    }
    setFotoPreviewUrl("");
  }

  function resetForm() {
    setEditingId(null);
    setNombre("");
    setEmail("");
    setPassword("");

    setFotoMediaId(null);
    clearFotoLocalPreview();
  }

  async function startEdit(u: Usuario) {
    setEditingId(u.id);
    setNombre(u.nombre);
    setEmail(u.email);
    setPassword("");

    setFotoMediaId(u.foto_media_id ?? null);

    // Preview: si tenemos cache, úsala; si no, baja blob con auth
    clearFotoLocalPreview();
    if (u.foto_media_id) {
      const cached = avatarCache[u.foto_media_id];
      if (cached) {
        setFotoPreviewUrl(cached);
      } else {
        try {
          const url = await fetchMediaBlobUrl(u.foto_media_id);
          setAvatarCache((prev) => ({ ...prev, [u.foto_media_id as number]: url }));
          setFotoPreviewUrl(url);
        } catch {
          setFotoPreviewUrl("");
        }
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onPickFoto(file: File | null) {
    if (!file) return;

    // preview inmediato local
    clearFotoLocalPreview();
    const localUrl = URL.createObjectURL(file);
    setFotoPreviewUrl(localUrl);

    setUploadingFoto(true);
    try {
      const up = await apiUploadMedia(file); // POST /media/upload
      setFotoMediaId(up.id);

      // también guardamos cache para que la tabla lo muestre sin pedirlo de nuevo
      try {
        const blobUrl = await fetchMediaBlobUrl(up.id);
        setAvatarCache((prev) => ({ ...prev, [up.id]: blobUrl }));
        setFotoPreviewUrl(blobUrl);
      } catch {
        // si falla, dejamos el local preview
      }
    } catch (e: any) {
      alert(e?.message || "Error subiendo foto");
      setFotoMediaId(null);
      clearFotoLocalPreview();
    } finally {
      setUploadingFoto(false);
    }
  }

  function removeFoto() {
    setFotoMediaId(null);
    clearFotoLocalPreview();
  }

  async function submit() {
    const payload: any = {
      nombre: nombre.trim(),
      email: email.trim(),
      foto_media_id: fotoMediaId, // 👈 aquí se liga al usuario
    };

    if (!payload.nombre || !payload.email) {
      alert("Nombre y email son obligatorios.");
      return;
    }

    if (!isEditing) {
      if (!password || password.length < 6) {
        alert("Password mínimo 6 caracteres.");
        return;
      }
      payload.password = password;
      await apiPost("/users", payload);
    } else {
      payload.password = password; // opcional
      await apiPut(`/users/${editingId}`, payload);
    }

    resetForm();
    await load();
  }

  async function toggleActivo(u: Usuario) {
    const next = u.activo === 1 ? 0 : 1;
    await apiPatch(`/users/${u.id}/active`, { activo: next });
    await load();
  }

  async function borrarLogico(u: Usuario) {
    const ok = confirm(
      `¿Seguro que quieres borrar "${u.nombre}"?\n\nEsto es borrado lógico: se ocultará del sistema pero quedará en la base de datos.`
    );
    if (!ok) return;

    await apiDelete(`/users/${u.id}`);
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-neutral-500">Funciones</div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Usuarios
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Administra usuarios del sistema: creación, edición, estado y borrado lógico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-sm">
            <i className="fa-solid fa-magnifying-glass text-sm text-neutral-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-64 bg-transparent text-sm outline-none placeholder:text-neutral-400"
              placeholder="Buscar usuario…"
            />
          </div>
        </div>
      </div>

      {/* Crear / Editar */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <i className={`fa-solid ${isEditing ? "fa-pen" : "fa-plus"} text-neutral-700`} />
            <div className="text-sm font-semibold text-neutral-900">
              {isEditing ? "Editar usuario" : "Crear usuario"}
            </div>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Cancelar edición
            </button>
          )}
        </div>

        {/* MEDIA */}
        <div className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
          <div className="flex items-start gap-3">
            <div className="h-16 w-16 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              {fotoPreviewUrl ? (
                <img src={fotoPreviewUrl} alt="Foto" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-400">
                  <i className="fa-solid fa-image" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="text-xs font-semibold text-neutral-900">Foto (Media)</div>
              <div className="mt-1 text-xs text-neutral-600">
                Se sube con <code className="text-[11px]">POST /media/upload</code> y se asocia por{" "}
                <code className="text-[11px]">foto_media_id</code>.
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">
                  <i className={`fa-solid ${uploadingFoto ? "fa-spinner fa-spin" : "fa-upload"}`} />
                  {uploadingFoto ? "Subiendo..." : "Subir foto"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingFoto}
                    onChange={(e) => onPickFoto(e.target.files?.[0] || null)}
                  />
                </label>

                <button
                  type="button"
                  onClick={removeFoto}
                  disabled={!fotoMediaId && !fotoPreviewUrl}
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                >
                  <i className="fa-solid fa-xmark mr-2" />
                  Quitar
                </button>

                <div className="ml-auto text-[11px] text-neutral-500">
                  Media ID:{" "}
                  <span className="font-semibold text-neutral-700">{fotoMediaId ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Field label="Nombre *" value={nombre} onChange={setNombre} placeholder="Ej. Admin" />
          <Field label="Email *" value={email} onChange={setEmail} placeholder="admin@encurso.mx" />

          <div className="xl:col-span-2">
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              Password {isEditing ? "(opcional)" : "*"}
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder={isEditing ? "Deja vacío para no cambiar" : "Mínimo 6 caracteres"}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-neutral-200/60"
            />
          </div>

          <div className="md:col-span-2 xl:col-span-2 flex items-end">
            <button
              onClick={submit}
              disabled={uploadingFoto}
              className="w-full rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:opacity-60"
            >
              {isEditing ? "Guardar cambios" : "Crear"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-4 py-3">
          <div className="text-sm font-semibold text-neutral-900">Listado</div>
          <div className="text-xs text-neutral-500">
            {loading ? "Cargando..." : `${filtered.length} usuarios`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-neutral-500">
              <tr className="border-b border-neutral-200">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((u) => {
                const avatar =
                  typeof u.foto_media_id === "number" ? avatarCache[u.foto_media_id] : "";

                return (
                  <tr key={u.id} className="border-b border-neutral-100">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                          {avatar ? (
                            <img src={avatar} alt={u.nombre} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-neutral-400">
                              <i className="fa-solid fa-user" />
                            </div>
                          )}
                        </div>

                        <div>
                          {u.nombre}
                          <div className="text-[11px] text-neutral-500">
                            ID: {u.id}
                            {typeof u.foto_media_id === "number"
                              ? ` · Media: ${u.foto_media_id}`
                              : ""}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-neutral-700">{u.email}</td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Switch checked={u.activo === 1} onChange={() => toggleActivo(u)} />
                        <span
                          className={[
                            "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                            u.activo === 1
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-neutral-100 text-neutral-600",
                          ].join(" ")}
                        >
                          {u.activo === 1 ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(u)}
                          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                        >
                          <i className="fa-solid fa-pen mr-2" />
                          Editar
                        </button>

                        <button
                          onClick={() => borrarLogico(u)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          <i className="fa-solid fa-trash mr-2" />
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-neutral-500" colSpan={4}>
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-neutral-200/60"
      />
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={[
        "relative inline-flex h-7 w-12 items-center rounded-full border transition",
        checked ? "bg-neutral-900 border-neutral-900" : "bg-neutral-200 border-neutral-200",
      ].join(" ")}
      aria-pressed={checked}
    >
      <span
        className={[
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition",
          checked ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

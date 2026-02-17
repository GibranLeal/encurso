import { useEffect, useMemo, useState } from "react";
import { MediaLibraryPicker } from "../shared/ui/MediaLibraryPicker";
import { ImageEditModal } from "../shared/ui/ImageEditModal";
import { fetchMediaBlobUrl, uploadPrivateImage } from "../features/media/media.api";

/** =========================
 *  Helpers API
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
 *  Types
 *  ========================= */
type Rol = {
  id: number;
  nombre: string;
  activo: number;
};

type Usuario = {
  id: number;
  nombre: string;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  email: string;
  activo: number;
  creado_en?: string;
  foto_media_id?: number | null;

  // ✅ rol viene desde JOIN con pivote
  rol_id?: number | null;

  // ✅ dirección
  cp?: string | null;
  estado?: string | null;
  municipio?: string | null;
  colonia?: string | null;
  calle?: string | null;
  numero?: string | null;
};

type AddressLookup = {
  estados: string[];
  municipios: string[];
  colonias: string[];
};

export function UsuariosPage() {
  // Modal editar imagen
  const [editOpen, setEditOpen] = useState(false);

  // Media seleccionado (solo id) + preview
  const [fotoMediaId, setFotoMediaId] = useState<number | null>(null);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string>("");

  // Cache avatar para tabla: mediaId -> blobUrl
  const [avatarCache, setAvatarCache] = useState<Record<number, string>>({});

  // ✅ roles
  const [roles, setRoles] = useState<Rol[]>([]);
  const [rolId, setRolId] = useState<number | "">("");

  // ✅ address lookup por CP
  const [cp, setCp] = useState("");
  const [estado, setEstado] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [colonia, setColonia] = useState("");
  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");

  const [addrOptions, setAddrOptions] = useState<AddressLookup>({
    estados: [],
    municipios: [],
    colonias: [],
  });
  const [addrLoading, setAddrLoading] = useState(false);

  const [items, setItems] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const isEditing = editingId !== null;

  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await apiGet("/api/users");
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }

  async function loadRoles() {
    try {
      const data = await apiGet("/api/roles");
      setRoles(data.items || []);
    } catch {
      setRoles([]);
    }
  }

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  /**
   * ✅ warm cache avatars
   */
  useEffect(() => {
    let cancelled = false;

    async function warm() {
      const ids = Array.from(
        new Set(
          items
            .map((u) => u.foto_media_id)
            .filter((x): x is number => typeof x === "number")
        )
      );

      for (const id of ids) {
        if (cancelled) break;
        if (avatarCache[id]) continue;

        try {
          const url = await fetchMediaBlobUrl(id);
          if (cancelled) break;
          setAvatarCache((prev) => ({ ...prev, [id]: url }));
        } catch {
          // ignore
        }
      }
    }

    if (items.length) warm();
    return () => {
      cancelled = true;
    };
  }, [items, avatarCache]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;

    return items.filter((u) => {
      const fullName = [
        u.nombre,
        u.apellido_paterno || "",
        u.apellido_materno || "",
      ]
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      return [fullName, u.email, String(u.id)].some((x) =>
        String(x).toLowerCase().includes(s)
      );
    });
  }, [q, items]);

  /**
   * ✅ revoca preview solo si no depende de cache
   */
  function clearPreview() {
    if (fotoPreviewUrl?.startsWith("blob:") && fotoMediaId === null) {
      try {
        URL.revokeObjectURL(fotoPreviewUrl);
      } catch {}
    }
    setFotoPreviewUrl("");
  }

  function resetAddress() {
    setCp("");
    setEstado("");
    setMunicipio("");
    setColonia("");
    setCalle("");
    setNumero("");
    setAddrOptions({ estados: [], municipios: [], colonias: [] });
  }

  function resetForm() {
    setEditingId(null);

    setNombre("");
    setApellidoPaterno("");
    setApellidoMaterno("");
    setEmail("");
    setPassword("");

    setRolId("");

    resetAddress();

    setFotoMediaId(null);
    clearPreview();
  }

  async function onSelectFoto(id: number | null) {
    setFotoMediaId(id);
    clearPreview();

    if (!id) return;

    const cached = avatarCache[id];
    if (cached) {
      setFotoPreviewUrl(cached);
      return;
    }

    try {
      const url = await fetchMediaBlobUrl(id);
      setAvatarCache((prev) => ({ ...prev, [id]: url }));
      setFotoPreviewUrl(url);
    } catch {
      setFotoPreviewUrl("");
    }
  }

  async function startEdit(u: Usuario) {
    setEditingId(u.id);

    setNombre(u.nombre || "");
    setApellidoPaterno(u.apellido_paterno || "");
    setApellidoMaterno(u.apellido_materno || "");
    setEmail(u.email || "");
    setPassword("");

    setRolId(typeof u.rol_id === "number" ? u.rol_id : "");

    // dirección
    setCp(u.cp || "");
    setEstado(u.estado || "");
    setMunicipio(u.municipio || "");
    setColonia(u.colonia || "");
    setCalle(u.calle || "");
    setNumero(u.numero || "");

    // si ya trae cp, precarga combos
    if ((u.cp || "").trim().length >= 4) {
      try {
        setAddrLoading(true);
        const data = await apiGet(`/api/address/cp/${encodeURIComponent(u.cp || "")}`);
        setAddrOptions({
          estados: data.estados || [],
          municipios: data.municipios || [],
          colonias: data.colonias || [],
        });

        // si el back te regresa defaults, los puedes setear aquí
      } catch {
        setAddrOptions({ estados: [], municipios: [], colonias: [] });
      } finally {
        setAddrLoading(false);
      }
    } else {
      setAddrOptions({ estados: [], municipios: [], colonias: [] });
    }

    await onSelectFoto(u.foto_media_id ?? null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /**
   * ✅ CP lookup (debounce)
   */
  useEffect(() => {
    let t: any;

    const clean = cp.replace(/\D/g, "").slice(0, 5);
    if (clean !== cp) setCp(clean);

    if (clean.length !== 5) {
      setAddrOptions({ estados: [], municipios: [], colonias: [] });
      // no borramos estado/municipio/colonia automáticamente para no “frustrar”
      return;
    }

    t = setTimeout(async () => {
      setAddrLoading(true);
      try {
        const data = await apiGet(`/api/address/cp/${encodeURIComponent(clean)}`);
        setAddrOptions({
          estados: data.estados || [],
          municipios: data.municipios || [],
          colonias: data.colonias || [],
        });

        // ✅ si solo viene 1 opción, autoselecciona
        if ((data.estados || []).length === 1) setEstado(data.estados[0]);
        if ((data.municipios || []).length === 1) setMunicipio(data.municipios[0]);
        if ((data.colonias || []).length === 1) setColonia(data.colonias[0]);
      } catch {
        setAddrOptions({ estados: [], municipios: [], colonias: [] });
      } finally {
        setAddrLoading(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [cp]);

  async function submit() {
    const payload: any = {
      nombre: nombre.trim(),
      apellido_paterno: apellidoPaterno.trim(),
      apellido_materno: apellidoMaterno.trim(),
      email: email.trim(),
      foto_media_id: fotoMediaId,

      // ✅ rol (pivote)
      rol_id: rolId === "" ? null : Number(rolId),

      // ✅ dirección
      cp: cp.trim() || null,
      estado: estado.trim() || null,
      municipio: municipio.trim() || null,
      colonia: colonia.trim() || null,
      calle: calle.trim() || null,
      numero: numero.trim() || null,
    };

    if (!payload.nombre || !payload.apellido_paterno || !payload.email) {
      alert("Nombre, Apellido paterno y email son obligatorios.");
      return;
    }

    // rol requerido? (si quieres forzarlo, descomenta)
    // if (!payload.rol_id) { alert("Selecciona un rol."); return; }

    if (!isEditing) {
      if (!password || password.length < 6) {
        alert("Password mínimo 6 caracteres.");
        return;
      }
      payload.password = password;
      await apiPost("/api/users", payload);
    } else {
      if (password && password.trim().length > 0) payload.password = password;
      await apiPut(`/api/users/${editingId}`, payload);
    }

    resetForm();
    await loadUsers();
  }

  async function toggleActivo(u: Usuario) {
    const next = u.activo === 1 ? 0 : 1;
    await apiDelete(`/api/users/${u.id}`);
    await loadUsers();
  }

  async function borrarLogico(u: Usuario) {
    const ok = confirm(
      `¿Seguro que quieres borrar "${u.nombre} ${u.apellido_paterno || ""}"?\n\nBorrado lógico: se ocultará, pero queda en BD.`
    );
    if (!ok) return;

    await apiDelete(`/api/users/${u.id}`);
    await loadUsers();
  }

  const roleName = (id?: number | null) => {
    if (!id) return "—";
    const r = roles.find((x) => x.id === id);
    return r?.nombre || `Rol #${id}`;
  };

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

        {/* FOTO + BIBLIOTECA */}
        <div className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-5">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 xl:col-span-1">
            <div className="text-xs font-semibold text-neutral-900">Foto seleccionada</div>

            <div className="mt-2 flex items-center gap-3 xl:flex-col xl:items-stretch">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border border-neutral-200 bg-white xl:h-24 xl:w-full">
                {fotoPreviewUrl ? (
                  <img src={fotoPreviewUrl} alt="Foto" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-400">
                    <i className="fa-solid fa-image" />
                  </div>
                )}
              </div>

              <div className="flex-1 xl:mt-2">
                <div className="text-xs text-neutral-600">
                  Media ID:{" "}
                  <span className="font-semibold text-neutral-800">{fotoMediaId ?? "—"}</span>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    disabled={!fotoMediaId || !fotoPreviewUrl}
                    className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    <i className="fa-solid fa-pen-to-square mr-2" />
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectFoto(null)}
                    disabled={!fotoMediaId}
                    className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    <i className="fa-solid fa-xmark mr-2" />
                    Quitar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-4">
            <MediaLibraryPicker
              label="Biblioteca (Media) — clic para asignar"
              valueMediaId={fotoMediaId}
              onSelect={onSelectFoto}
            />
          </div>
        </div>

        {/* FORM PRINCIPAL */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Field label="Nombre *" value={nombre} onChange={setNombre} placeholder="Ej. Admin" />

          <Field
            label="Apellido paterno *"
            value={apellidoPaterno}
            onChange={setApellidoPaterno}
            placeholder="Ej. Leal"
          />

          <Field
            label="Apellido materno"
            value={apellidoMaterno}
            onChange={setApellidoMaterno}
            placeholder="Ej. Angulo"
          />

          <Field label="Email *" value={email} onChange={setEmail} placeholder="admin@encurso.mx" />

          {/* ✅ Rol (pivote) */}
          <SelectField
            label="Rol *"
            value={rolId === "" ? "" : String(rolId)}
            onChange={(v) => setRolId(v === "" ? "" : Number(v))}
            options={[
              { value: "", label: "Selecciona…" },
              ...roles
                .filter((r) => r.activo === 1)
                .map((r) => ({ value: String(r.id), label: r.nombre })),
            ]}
          />

          {/* Password */}
          <div className="xl:col-span-1">
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

          <div className="md:col-span-2 xl:col-span-6">
            <div className="mt-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-semibold text-neutral-900">
                  Dirección (por C.P.)
                </div>
                {addrLoading && (
                  <div className="text-xs text-neutral-500">
                    <i className="fa-solid fa-spinner fa-spin mr-2" />
                    Consultando CP…
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
                <Field
                  label="C.P."
                  value={cp}
                  onChange={setCp}
                  placeholder="Ej. 56100"
                />

                <SelectField
                  label="Estado"
                  value={estado}
                  onChange={setEstado}
                  options={[
                    { value: "", label: addrOptions.estados.length ? "Selecciona…" : "—" },
                    ...addrOptions.estados.map((x) => ({ value: x, label: x })),
                  ]}
                />

                <SelectField
                  label="Municipio"
                  value={municipio}
                  onChange={setMunicipio}
                  options={[
                    { value: "", label: addrOptions.municipios.length ? "Selecciona…" : "—" },
                    ...addrOptions.municipios.map((x) => ({ value: x, label: x })),
                  ]}
                />

                <SelectField
                  label="Colonia"
                  value={colonia}
                  onChange={setColonia}
                  options={[
                    { value: "", label: addrOptions.colonias.length ? "Selecciona…" : "—" },
                    ...addrOptions.colonias.map((x) => ({ value: x, label: x })),
                  ]}
                />

                <Field
                  label="Calle"
                  value={calle}
                  onChange={setCalle}
                  placeholder="Ej. Av. Juárez"
                />

                <Field
                  label="Número"
                  value={numero}
                  onChange={setNumero}
                  placeholder="Ej. 123"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 xl:col-span-6 flex items-end">
            <button
              onClick={submit}
              className="w-full rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800"
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
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((u) => {
                const avatar =
                  typeof u.foto_media_id === "number" ? avatarCache[u.foto_media_id] : "";

                const fullName = [
                  u.nombre,
                  u.apellido_paterno || "",
                  u.apellido_materno || "",
                ]
                  .join(" ")
                  .replace(/\s+/g, " ")
                  .trim();

                return (
                  <tr key={u.id} className="border-b border-neutral-100">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={fullName || u.nombre}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-neutral-400">
                              <i className="fa-solid fa-user" />
                            </div>
                          )}
                        </div>

                        <div>
                          {fullName || u.nombre}
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

                    <td className="px-4 py-3 text-neutral-700">
                      {roleName(u.rol_id ?? null)}
                    </td>

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
                  <td className="px-4 py-8 text-center text-sm text-neutral-500" colSpan={5}>
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de edición de imagen */}
      <ImageEditModal
        open={editOpen}
        imageUrl={fotoPreviewUrl}
        onClose={() => setEditOpen(false)}
        onApply={async ({ blob }) => {
          try {
            const file = new File([blob], `avatar-${Date.now()}.jpg`, {
              type: "image/jpeg",
            });
            const created = await uploadPrivateImage(file);
            await onSelectFoto(Number(created.id));
          } catch (e: any) {
            alert(e?.message || "No se pudo guardar la imagen editada");
          } finally {
            setEditOpen(false);
          }
        }}
      />
    </div>
  );
}

/** =========================
 *  UI
 *  ========================= */
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-neutral-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-neutral-200/60"
      >
        {options.map((o) => (
          <option key={`${o.value}-${o.label}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
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

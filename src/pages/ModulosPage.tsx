import { useEffect, useMemo, useState } from "react";

function getToken() {
  return localStorage.getItem("encurso_token") || "";
}

async function apiGet(path: string) {
  const res = await fetch(`http://localhost:4000${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error HTTP ${res.status}`);
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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error HTTP ${res.status}`);
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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error HTTP ${res.status}`);
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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error HTTP ${res.status}`);
  return data;
}

async function apiDelete(path: string) {
  const res = await fetch(`http://localhost:4000${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Error HTTP ${res.status}`);
  return data;
}

type Modulo = {
  id: number;
  nombre: string;
  slug: string;
  ruta: string;
  icono: string | null;
  grupo: string | null;
  orden: number;
  activo: number; // 1/0
  modulo_padre_id: number | null;
};

const ICONS: string[] = [
  "fa-gauge",
  "fa-layer-group",
  "fa-users",
  "fa-gear",
  "fa-key",
  "fa-calendar",
  "fa-calendar-days",
  "fa-ticket",
  "fa-id-card",
  "fa-file-lines",
  "fa-chart-line",
  "fa-chart-pie",
  "fa-chart-column",
  "fa-table",
  "fa-list-check",
  "fa-envelope",
  "fa-message",
  "fa-bell",
  "fa-bullhorn",
  "fa-comments",
  "fa-building",
  "fa-location-dot",
  "fa-map",
  "fa-earth-americas",
  "fa-globe",
  "fa-lock",
  "fa-shield-halved",
  "fa-user-shield",
  "fa-fingerprint",
  "fa-circle-check",
  "fa-user",
  "fa-user-gear",
  "fa-user-plus",
  "fa-user-pen",
  "fa-user-tag",
  "fa-briefcase",
  "fa-sitemap",
  "fa-diagram-project",
  "fa-folder",
  "fa-folder-open",
  "fa-image",
  "fa-camera",
  "fa-video",
  "fa-wand-magic-sparkles",
  "fa-palette",
  "fa-credit-card",
  "fa-receipt",
  "fa-file-invoice-dollar",
  "fa-money-bill-wave",
  "fa-coins",
  "fa-clock",
  "fa-hourglass",
  "fa-arrows-rotate",
  "fa-download",
  "fa-upload",
];

export function ModulosPage() {
  const [items, setItems] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [showIcons, setShowIcons] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const isEditing = editingId !== null;

  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [ruta, setRuta] = useState("");
  const [icono, setIcono] = useState<string>("");
  const [grupo, setGrupo] = useState("Funciones");
  const [orden, setOrden] = useState(1);
  const [padreId, setPadreId] = useState<number | "">("");

  async function refreshMeAndMenu() {
    const res = await fetch("http://localhost:4000/auth/me", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      localStorage.setItem("encurso_user", JSON.stringify(data.user));
      localStorage.setItem(
        "encurso_permissions",
        JSON.stringify(data.permissionsEffective || [])
      );
      localStorage.setItem("encurso_modules", JSON.stringify(data.modules || []));
      window.dispatchEvent(new Event("encurso:menu-updated"));
    }
  }

  async function load() {
    setLoading(true);
    try {
      // ✅ CORRECTO: tu backend está en /api/modules
      const data = await apiGet("/api/modules");
      setItems(data.items || []);
    } catch (e: any) {
      console.error("Error cargando módulos:", e);
      alert(e?.message || "Error cargando módulos");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((m) =>
      [m.nombre, m.slug, m.ruta, m.grupo || "", m.icono || ""].some((x) =>
        String(x).toLowerCase().includes(s)
      )
    );
  }, [q, items]);

  const parentOptions = useMemo(() => {
    return items
      .filter((m) => !m.modulo_padre_id)
      .filter((m) => (editingId ? m.id !== editingId : true));
  }, [items, editingId]);

  function resetForm() {
    setEditingId(null);
    setNombre("");
    setSlug("");
    setRuta("");
    setIcono("");
    setGrupo("Funciones");
    setOrden(1);
    setPadreId("");
    setShowIcons(false);
  }

  function startEdit(m: Modulo) {
    setEditingId(m.id);
    setNombre(m.nombre);
    setSlug(m.slug);
    setRuta(m.ruta);
    setIcono(m.icono || "");
    setGrupo(m.grupo || "Funciones");
    setOrden(Number(m.orden || 1));
    setPadreId(m.modulo_padre_id ?? "");
    setShowIcons(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    const payload = {
      nombre: nombre.trim(),
      slug: slug.trim(),
      ruta: ruta.trim(),
      icono: icono.trim() === "" ? null : icono.trim(),
      grupo: (grupo || "").trim() === "" ? null : grupo.trim(),
      orden: Number(orden),
      modulo_padre_id: padreId === "" ? null : (Number.isFinite(Number(padreId)) && Number(padreId) > 0 ? Number(padreId) : null),
    };

    if (!payload.nombre || !payload.slug || !payload.ruta) {
      alert("Nombre, slug y ruta son obligatorios.");
      return;
    }

    try {
      if (isEditing) {
        await apiPut(`/api/modules/${editingId}`, payload);
      } else {
        await apiPost("/api/modules", payload);
      }

      resetForm();
      await load();
      await refreshMeAndMenu();
    } catch (e: any) {
      console.error("Error guardando módulo:", e);
      alert(e?.message || "Error guardando módulo");
    }
  }

  async function toggleActivo(m: Modulo) {
    try {
      const next = m.activo === 1 ? 0 : 1;
      await apiPatch(`/api/modules/${m.id}/active`, { activo: next });
      await load();
      await refreshMeAndMenu();
    } catch (e: any) {
      console.error("Error cambiando activo:", e);
      alert(e?.message || "Error cambiando estado");
    }
  }

  async function borrarLogico(m: Modulo) {
    const ok = confirm(
      `¿Seguro que quieres borrar "${m.nombre}"?\n\nEsto es borrado lógico: se ocultará del sistema pero quedará en la base de datos.`
    );
    if (!ok) return;

    try {
      await apiDelete(`/api/modules/${m.id}`);
      await load();
      await refreshMeAndMenu();
    } catch (e: any) {
      console.error("Error borrando módulo:", e);
      alert(e?.message || "Error borrando módulo");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-neutral-500">Funciones</div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Módulos
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Administra el menú del dashboard: grupos, submenús, iconos, orden y estado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-sm">
            <i className="fa-solid fa-magnifying-glass text-sm text-neutral-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-64 bg-transparent text-sm outline-none placeholder:text-neutral-400"
              placeholder="Buscar módulo…"
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
              {isEditing ? "Editar módulo" : "Crear módulo"}
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

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Field label="Nombre *" value={nombre} onChange={setNombre} placeholder="Ej. Eventos" />
          <Field label="Slug *" value={slug} onChange={setSlug} placeholder="eventos" />
          <Field label="Ruta *" value={ruta} onChange={setRuta} placeholder="/app/eventos" />
          <Field label="Grupo" value={grupo} onChange={setGrupo} placeholder="Funciones" />

          <Field
            label="Orden"
            value={String(orden)}
            onChange={(v) => setOrden(Number(v || 0))}
            placeholder="1"
          />

          <div className="md:col-span-2 xl:col-span-2">
            <label className="mb-1 block text-xs font-medium text-neutral-700">Módulo padre</label>
            <select
              value={padreId}
              onChange={(e) => setPadreId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-neutral-200/60"
            >
              <option value="">(Sin padre)</option>
              {parentOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* ICON PICKER */}
          <div className="md:col-span-2 xl:col-span-4 relative">
            <label className="mb-1 block text-xs font-medium text-neutral-700">
              Ícono (opcional)
            </label>

            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm">
                <i className={`fa-solid ${icono || "fa-circle"} text-neutral-700`} />
                <input
                  value={icono}
                  onChange={(e) => setIcono(e.target.value)}
                  className="w-full bg-transparent outline-none"
                  placeholder="Ej. fa-calendar (o déjalo vacío)"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowIcons((v) => !v)}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Seleccionar
              </button>

              <button
                type="button"
                onClick={() => setIcono("")}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Quitar
              </button>
            </div>

            {showIcons && (
              <div className="absolute z-50 mt-2 w-full rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl">
                <div className="mb-2 text-xs font-semibold text-neutral-600">
                  Selecciona un ícono
                </div>

                <div className="grid grid-cols-8 gap-2 max-h-60 overflow-y-auto">
                  {ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => {
                        setIcono(ic);
                        setShowIcons(false);
                      }}
                      className={[
                        "grid h-10 w-10 place-items-center rounded-xl border bg-white",
                        icono === ic
                          ? "border-neutral-900 shadow-sm"
                          : "border-neutral-200 hover:bg-neutral-50",
                      ].join(" ")}
                      title={ic}
                    >
                      <i className={`fa-solid ${ic} text-neutral-700`} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2 xl:col-span-2 flex items-end">
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
            {loading ? "Cargando..." : `${filtered.length} módulos`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-neutral-500">
              <tr className="border-b border-neutral-200">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Grupo</th>
                <th className="px-4 py-3">Ruta</th>
                <th className="px-4 py-3">Ícono</th>
                <th className="px-4 py-3">Padre</th>
                <th className="px-4 py-3">Orden</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-neutral-100">
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {m.nombre}
                    <div className="text-[11px] text-neutral-500">{m.slug}</div>
                  </td>

                  <td className="px-4 py-3 text-neutral-700">{m.grupo || "-"}</td>
                  <td className="px-4 py-3 text-neutral-700">{m.ruta}</td>

                  <td className="px-4 py-3">
                    {m.icono ? (
                      <span className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2 py-1">
                        <i className={`fa-solid ${m.icono} text-neutral-700`} />
                        <span className="text-xs text-neutral-600">{m.icono}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400">(sin ícono)</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-neutral-700">{m.modulo_padre_id ?? "-"}</td>
                  <td className="px-4 py-3 text-neutral-700">{m.orden}</td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Switch checked={m.activo === 1} onChange={() => toggleActivo(m)} />
                      <span
                        className={[
                          "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                          m.activo === 1
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-neutral-100 text-neutral-600",
                        ].join(" ")}
                      >
                        {m.activo === 1 ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(m)}
                        className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                      >
                        <i className="fa-solid fa-pen mr-2" />
                        Editar
                      </button>

                      <button
                        onClick={() => borrarLogico(m)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        <i className="fa-solid fa-trash mr-2" />
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-neutral-500" colSpan={8}>
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
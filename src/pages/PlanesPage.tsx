import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function getToken() {
  return localStorage.getItem("encurso_token") || "";
}

const API = "http://localhost:4000";

async function apiGet(path: string) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error");
  return data;
}

async function apiPost(path: string, body: any) {
  const res = await fetch(`${API}${path}`, {
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
  const res = await fetch(`${API}${path}`, {
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

async function apiDel(path: string) {
  const res = await fetch(`${API}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Error");
  return data;
}

type Plan = {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: number;
  creado_en: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function PlanesPage() {
  const [items, setItems] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);

  // Form
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombreVal, setNombreVal] = useState("");
  const [descVal, setDescVal] = useState("");

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  async function load() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set("page", String(page));
      q.set("limit", String(limit));
      if (search.trim()) q.set("search", search.trim());
      const data = await apiGet(`/api/planes?${q.toString()}`);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      toast.error(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function resetForm() {
    setEditingId(null);
    setNombreVal("");
    setDescVal("");
  }

  function startEdit(it: Plan) {
    setEditingId(it.id);
    setNombreVal(it.nombre);
    setDescVal(it.descripcion || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (!nombreVal.trim()) throw new Error("El nombre es obligatorio.");

      if (editingId) {
        await apiPut(`/api/planes/${editingId}`, {
          nombre: nombreVal.trim(),
          descripcion: descVal.trim() ? descVal.trim() : null,
        });
        toast.success("Plan actualizado");
      } else {
        await apiPost(`/api/planes`, {
          nombre: nombreVal.trim(),
          descripcion: descVal.trim() ? descVal.trim() : null,
          activo: 1,
        });
        toast.success("Plan creado");
      }

      resetForm();
      await load();
    } catch (e: any) {
      toast.error(e.message || "Error");
    }
  }

  async function toggleActivo(it: Plan) {
    try {
      await apiPut(`/api/planes/${it.id}/toggle`, { activo: it.activo ? 0 : 1 });
      await load();
    } catch (e: any) {
      toast.error(e.message || "Error");
    }
  }

  async function onDelete(it: Plan) {
    const ok = confirm(`¿Desactivar (borrado lógico) el plan "${it.nombre}"?`);
    if (!ok) return;

    try {
      await apiDel(`/api/planes/${it.id}`);
      toast.success("Plan desactivado");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Error");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-slate-500">Permisos</div>
        <h1 className="text-2xl font-semibold text-slate-900">Planes</h1>
        <p className="text-sm text-slate-600">
          Define los planes (Básico, Premium, Ultimate) que habilitan permisos base por suscripción.
        </p>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="font-semibold text-slate-900">
            {editingId ? "Editar plan" : "Crear plan"}
          </div>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
          ) : null}
        </div>

        <form onSubmit={onSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
              <input
                value={nombreVal}
                onChange={(e) => setNombreVal(e.target.value)}
                placeholder="ej: Básico"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Descripción</label>
              <input
                value={descVal}
                onChange={(e) => setDescVal(e.target.value)}
                placeholder="Texto breve"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {editingId ? "Guardar cambios" : "Crear"}
            </button>
            {!editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Limpiar
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre / descripción..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300 md:max-w-xl"
          />

          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-500">
              {total} registros • Página {page}/{totalPages}
            </div>
            <button
              type="button"
              onClick={() => load()}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {loading ? "Cargando..." : "Actualizar"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-100 px-6 py-4 font-semibold text-slate-900">
          Lista
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Descripción</th>
                <th className="px-6 py-3 text-center">Activo</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-slate-100">
                  <td className="px-6 py-3 font-semibold text-slate-900">{it.nombre}</td>
                  <td className="px-6 py-3 text-slate-700">{it.descripcion || "-"}</td>

                  <td className="px-6 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleActivo(it)}
                      className={cx(
                        "inline-flex h-7 w-12 items-center rounded-full p-1 transition",
                        it.activo ? "bg-slate-900" : "bg-slate-200"
                      )}
                      title="Activar/Desactivar"
                    >
                      <span
                        className={cx(
                          "h-5 w-5 rounded-full bg-white shadow transition",
                          it.activo ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </td>

                  <td className="px-6 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(it)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(it)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!items.length ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                    {loading ? "Cargando..." : "Sin resultados"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            ← Anterior
          </button>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}
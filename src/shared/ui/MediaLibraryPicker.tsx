import { useEffect, useMemo, useRef, useState } from "react";
import {
  deleteMyMedia,
  fetchMediaBlobUrl,
  listMyMedia,
  uploadPrivateImages,
} from "../../features/media/media.api";

type MediaRow = {
  id: number;
  owner_user_id: number;
  scope: "private" | "public";
  original_name: string;
  mime: string;
  size_bytes: number;
  path: string;
  created_en?: string;
};

export function MediaLibraryPicker({
  label = "Biblioteca de imágenes",
  valueMediaId,
  onSelect,
}: {
  label?: string;
  valueMediaId: number | null;
  onSelect: (id: number | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [q, setQ] = useState("");

  // cache id -> blob url
  const [thumbs, setThumbs] = useState<Record<number, string>>({});

  async function load() {
    setLoading(true);
    try {
      const rows = await listMyMedia();
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // precarga thumbs del listado filtrado (limitado)
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((m) =>
      [m.original_name, String(m.id)].some((x) =>
        String(x).toLowerCase().includes(s)
      )
    );
  }, [q, items]);

  useEffect(() => {
    let cancelled = false;

    async function warm() {
      const toWarm = filtered.slice(0, 30); // no te vueles 200 de jalón
      for (const m of toWarm) {
        if (cancelled) break;
        if (thumbs[m.id]) continue;
        try {
          const url = await fetchMediaBlobUrl(m.id);
          if (cancelled) break;
          setThumbs((prev) => ({ ...prev, [m.id]: url }));
        } catch {
          // ignore
        }
      }
    }
    if (filtered.length) warm();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  async function onPickFiles(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    try {
      await uploadPrivateImages(files);
      await load();
    } catch (e: any) {
      alert(e?.message || "Error subiendo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    onPickFiles(files);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function remove(id: number) {
    const ok = confirm("¿Borrar esta imagen (borrado lógico)?");
    if (!ok) return;

    try {
      await deleteMyMedia(id);
      // si estaba seleccionada, la quitamos
      if (valueMediaId === id) onSelect(null);
      await load();
    } catch (e: any) {
      alert(e?.message || "Error borrando");
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-neutral-900">{label}</div>
          <div className="mt-1 text-xs text-neutral-500">
            Arrastra imágenes para subir. Da clic en una miniatura para asignarla.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2">
            <i className="fa-solid fa-magnifying-glass text-xs text-neutral-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-56 bg-transparent text-sm outline-none placeholder:text-neutral-400"
              placeholder="Buscar en media…"
            />
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onPickFiles(Array.from(e.target.files || []))}
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
          >
            <i className={`fa-solid ${uploading ? "fa-spinner fa-spin" : "fa-upload"} mr-2`} />
            {uploading ? "Subiendo..." : "Subir"}
          </button>
        </div>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="mt-4 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-3"
      >
        {loading ? (
          <div className="py-10 text-center text-sm text-neutral-500">Cargando media…</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-neutral-500">
            Sin imágenes. Arrastra aquí o usa “Subir”.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            {filtered.map((m) => {
              const selected = valueMediaId === m.id;
              const url = thumbs[m.id];

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelect(m.id)}
                  className={[
                    "group relative overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition",
                    selected ? "border-neutral-900 ring-4 ring-neutral-200/60" : "border-neutral-200 hover:border-neutral-300",
                  ].join(" ")}
                  title={`ID ${m.id} · ${m.original_name}`}
                >
                  <div className="h-28 w-full bg-neutral-100">
                    {url ? (
                      <img src={url} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-neutral-400">
                        <i className="fa-solid fa-image" />
                      </div>
                    )}
                  </div>

                  {/* footer */}
                  <div className="px-2 py-2">
                    <div className="truncate text-[11px] font-semibold text-neutral-800">
                      {m.original_name}
                    </div>
                    <div className="text-[10px] text-neutral-500">ID: {m.id}</div>
                  </div>

                  {/* acciones */}
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <span
                      className={[
                        "rounded-full px-2 py-1 text-[10px] font-semibold",
                        selected ? "bg-neutral-900 text-white" : "bg-white/90 text-neutral-800",
                      ].join(" ")}
                    >
                      {selected ? "Seleccionada" : "Elegir"}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(m.id);
                      }}
                      className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-semibold text-rose-700"
                      title="Borrar"
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3 text-[11px] text-neutral-500">
        Seleccionada: <b>{valueMediaId ?? "—"}</b>
      </div>
    </div>
  );
}

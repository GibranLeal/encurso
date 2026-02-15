import { useMemo, useRef, useState } from "react";
import { deleteMyMedia, mediaViewUrl, uploadPrivateImages, uploadPrivateImage } from "../../features/media/media.api";
import { ImageEditModal } from "./ImageEditModal";

type MediaRow = {
  id: number;
  original_name: string;
  path: string;
  mime: string;
};

export function MediaMultiPicker({
  label = "Galería",
  valueIds,
  onChange,
  coverId,
  onChangeCover,
}: {
  label?: string;
  valueIds: number[];
  onChange: (ids: number[]) => void;
  coverId?: number | null;
  onChangeCover?: (id: number | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  // Para poder previsualizar y manejar acciones
  const items = useMemo(
    () => valueIds.map((id) => ({ id, url: mediaViewUrl(id) })),
    [valueIds]
  );

  // editor
  const [editOpen, setEditOpen] = useState(false);
  const [editSrc, setEditSrc] = useState("");
  const [editTargetId, setEditTargetId] = useState<number | null>(null);

  async function onPickFiles(files: File[]) {
    if (!files.length) return;

    setUploading(true);
    try {
      const created = await uploadPrivateImages(files);
      const newIds = created.map((x: any) => Number(x.id));
      onChange([...valueIds, ...newIds]);
    } catch (e: any) {
      alert(e?.message || "Error subiendo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
    onPickFiles(files);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  // reorder simple
  const [dragId, setDragId] = useState<number | null>(null);

  function move(draggedId: number, overId: number) {
    if (draggedId === overId) return;
    const a = [...valueIds];
    const from = a.indexOf(draggedId);
    const to = a.indexOf(overId);
    if (from < 0 || to < 0) return;
    a.splice(from, 1);
    a.splice(to, 0, draggedId);
    onChange(a);
  }

  async function remove(id: number) {
    const ok = confirm("¿Borrar esta imagen (lógico)?");
    if (!ok) return;
    try {
      await deleteMyMedia(id);
      const next = valueIds.filter((x) => x !== id);
      onChange(next);
      if (onChangeCover && coverId === id) onChangeCover(next[0] ?? null);
    } catch (e: any) {
      alert(e?.message || "Error borrando");
    }
  }

  function openEditor(id: number) {
    setEditTargetId(id);
    setEditSrc(mediaViewUrl(id));
    setEditOpen(true);
  }

  async function saveEdited(blob: Blob) {
    // subimos como media NUEVA y reemplazamos el id (no editamos archivo original)
    setUploading(true);
    try {
      const file = new File([blob], "edit.jpg", { type: "image/jpeg" });
      const created = await uploadPrivateImage(file); // single upload
      const newId = Number(created.id);

      const next = valueIds.map((x) => (x === editTargetId ? newId : x));
      onChange(next);

      if (onChangeCover && coverId === editTargetId) onChangeCover(newId);
    } catch (e: any) {
      alert(e?.message || "Error guardando edición");
    } finally {
      setUploading(false);
      setEditOpen(false);
      setEditTargetId(null);
      setEditSrc("");
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold text-neutral-700">{label}</div>
        <div className="text-[11px] text-neutral-500">{valueIds.length} imagen(es)</div>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-neutral-600">
            Arrastra imágenes aquí o súbelas con el botón.
          </div>

          <div className="flex items-center gap-2">
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

        {items.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            {items.map((it) => (
              <div
                key={it.id}
                draggable
                onDragStart={() => setDragId(it.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => dragId && move(dragId, it.id)}
                className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white"
              >
                <img src={it.url} className="h-28 w-full object-cover" />

                {/* badge cover */}
                {coverId === it.id && (
                  <div className="absolute left-2 top-2 rounded-full bg-neutral-900 px-2 py-1 text-[10px] font-semibold text-white">
                    Principal
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/45 p-2 opacity-0 transition group-hover:opacity-100">
                  {onChangeCover && (
                    <button
                      type="button"
                      onClick={() => onChangeCover(it.id)}
                      className="flex-1 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold"
                    >
                      Principal
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openEditor(it.id)}
                    className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-semibold"
                  >
                    <i className="fa-solid fa-crop-simple" />
                  </button>

                  <button
                    type="button"
                    onClick={() => remove(it.id)}
                    className="rounded-lg bg-rose-200/90 px-2 py-1 text-[10px] font-semibold text-rose-900"
                  >
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>

                <div className="px-2 py-2 text-[11px] text-neutral-600">
                  ID: <b className="text-neutral-800">{it.id}</b>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ImageEditModal
        open={editOpen}
        src={editSrc}
        onClose={() => setEditOpen(false)}
        onSave={saveEdited}
      />
    </div>
  );
}

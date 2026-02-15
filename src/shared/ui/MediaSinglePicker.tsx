// src/shared/ui/MediaSinglePicker.tsx
import { useRef, useState } from "react";
import { uploadPrivateImage } from "../../features/media/media.api";

type Props = {
  label?: string;
  valueMediaId: number | null;
  onChange: (mediaId: number | null) => void;
};

export function MediaSinglePicker({ label = "Foto de perfil", valueMediaId, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lastFilename, setLastFilename] = useState<string | null>(null);

  async function onPickFile(file: File | null) {
    if (!file) return;

    setUploading(true);
    try {
      const item = await uploadPrivateImage(file);
      onChange(Number(item.id));
      setLastFilename(item.original_name || item.filename || file.name);
    } catch (e: any) {
      alert(e?.message || "Error subiendo imagen");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="mb-2 text-xs font-semibold text-neutral-700">{label}</div>

      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700">
          {valueMediaId ? (
            <span className="inline-flex items-center gap-2">
              <i className="fa-solid fa-image text-neutral-700" />
              Media ID: <b>{valueMediaId}</b>
              {lastFilename ? <span className="text-neutral-400">({lastFilename})</span> : null}
            </span>
          ) : (
            <span className="text-neutral-400">Sin foto</span>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPickFile(e.target.files?.[0] || null)}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
        >
          <i className="fa-solid fa-upload mr-2" />
          {uploading ? "Subiendo..." : "Subir"}
        </button>

        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Quitar
        </button>
      </div>

      <div className="mt-2 text-[11px] text-neutral-400">
        (Esto sube directo al backend y guarda el <b>media_id</b> para el usuario)
      </div>
    </div>
  );
}

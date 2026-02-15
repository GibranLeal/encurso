import Cropper from "react-easy-crop";
import { useState } from "react";
import { getCroppedBlob } from "./cropImage";

export function ImageEditModal({
  open,
  src,
  onClose,
  onSave,
}: {
  open: boolean;
  src: string;
  onClose: () => void;
  onSave: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedPixels, setCroppedPixels] = useState<any>(null);

  if (!open) return null;

  async function save() {
    const blob = await getCroppedBlob(src, croppedPixels, rotation);
    onSave(blob);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <div className="text-sm font-semibold text-neutral-900">
            Editar imagen (recortar / rotar)
          </div>
          <button onClick={onClose} className="rounded-xl px-3 py-2 text-xs font-semibold hover:bg-neutral-100">
            Cerrar
          </button>
        </div>

        <div className="relative h-[420px] w-full bg-neutral-900">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_, pixels) => setCroppedPixels(pixels)}
          />
        </div>

        <div className="space-y-3 px-4 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-neutral-700">Zoom</div>
              <input className="w-full" type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
            </div>
            <div>
              <div className="text-xs font-semibold text-neutral-700">Rotación</div>
              <input className="w-full" type="range" min={0} max={360} step={1} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button onClick={onClose} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-neutral-50">
              Cancelar
            </button>
            <button onClick={save} className="rounded-xl bg-neutral-900 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800">
              Guardar edición
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import Cropper from "react-easy-crop";
import { useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  imageUrl: string; // blob url o data url
  onClose: () => void;
  onApply: (result: { blob: Blob }) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

async function getCroppedBlob(
  imageSrc: string,
  cropPixels: { x: number; y: number; width: number; height: number },
  rotation: number
) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas");

  // calcular caja rotada
  const rotRad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rotRad));
  const cos = Math.abs(Math.cos(rotRad));
  const bW = image.width * cos + image.height * sin;
  const bH = image.width * sin + image.height * cos;

  const tmp = document.createElement("canvas");
  tmp.width = Math.ceil(bW);
  tmp.height = Math.ceil(bH);
  const tctx = tmp.getContext("2d")!;
  tctx.translate(tmp.width / 2, tmp.height / 2);
  tctx.rotate(rotRad);
  tctx.drawImage(image, -image.width / 2, -image.height / 2);

  // recorte final
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;

  ctx.drawImage(
    tmp,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    cropPixels.width,
    cropPixels.height
  );

  const blob: Blob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b as Blob), "image/jpeg", 0.92);
  });

  return blob;
}

type AspectOption = {
  key: "free" | "1:1" | "4:3" | "3:4" | "16:9";
  label: string;
  aspect?: number; // undefined => libre
};

const ASPECTS: AspectOption[] = [
  { key: "free", label: "Libre", aspect: undefined },
  { key: "1:1", label: "1:1", aspect: 1 },
  { key: "4:3", label: "4:3", aspect: 4 / 3 },
  { key: "3:4", label: "3:4", aspect: 3 / 4 },
  { key: "16:9", label: "16:9", aspect: 16 / 9 },
];

export function ImageEditModal({ open, imageUrl, onClose, onApply }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedPixels, setCroppedPixels] = useState<any>(null);
  const [working, setWorking] = useState(false);

  // ✅ aspect seleccionable
  const [aspectKey, setAspectKey] = useState<AspectOption["key"]>("1:1");

  // ✅ NUEVO: aspect editable cuando estás en "Libre"
  // (1 = cuadrado; >1 más ancho; <1 más alto)
  const [freeAspect, setFreeAspect] = useState<number>(1);

  // ✅ CAMBIO: aspect SIEMPRE number.
  // En "Libre" usamos freeAspect, en otros usamos su ratio fijo.
  const aspect = useMemo(() => {
    const opt = ASPECTS.find((a) => a.key === aspectKey);
    if (!opt) return 1;
    if (opt.key === "free") return freeAspect;
    return opt.aspect ?? 1;
  }, [aspectKey, freeAspect]);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedPixels(null);

    // default para perfil
    setAspectKey("1:1");

    // reset libre
    setFreeAspect(1);
  }, [open]);

  const canApply = useMemo(() => !!croppedPixels && !working, [croppedPixels, working]);

  async function apply() {
    if (!croppedPixels) return;
    setWorking(true);
    try {
      const blob = await getCroppedBlob(imageUrl, croppedPixels, rotation);
      onApply({ blob });
      // ❗ No cerramos aquí: lo maneja el padre
    } finally {
      setWorking(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <div className="text-sm font-semibold text-neutral-900">Editar imagen</div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
          <div className="relative h-[360px] w-full overflow-hidden rounded-2xl bg-neutral-100 md:col-span-2">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect} // ✅ ahora “Libre” también cambia (freeAspect)
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={(_a, b) => setCroppedPixels(b)}
            />
          </div>

          <div className="space-y-4">
            {/* selector de aspect */}
            <div>
              <div className="text-xs font-semibold text-neutral-700">Recorte</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {ASPECTS.map((opt) => {
                  const active = opt.key === aspectKey;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setAspectKey(opt.key)}
                      className={[
                        "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                        active
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
                      ].join(" ")}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* ✅ NUEVO: controles cuando estás en Libre */}
              {aspectKey === "free" && (
                <div className="mt-3 rounded-2xl border border-neutral-200 bg-white p-3">
                  <div className="text-[11px] text-neutral-600">
                    En <b>Libre</b> cambia la forma con “Relación”. Luego arrastra para mover y usa zoom.
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-semibold text-neutral-700">Relación</div>
                      <div className="text-[11px] text-neutral-500">
                        <b>{freeAspect.toFixed(2)}</b>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={0.3}
                      max={3}
                      step={0.01}
                      value={freeAspect}
                      onChange={(e) => setFreeAspect(Number(e.target.value))}
                      className="mt-2 w-full"
                    />

                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFreeAspect((a) => clamp(a - 0.15, 0.3, 3))}
                        className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                      >
                        - Ancho
                      </button>
                      <button
                        type="button"
                        onClick={() => setFreeAspect((a) => clamp(a + 0.15, 0.3, 3))}
                        className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                      >
                        + Ancho
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-2 text-[11px] text-neutral-500">
                Tip: Para foto de perfil usa <b>1:1</b>. Para banners usa <b>16:9</b>.
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-neutral-700">Zoom</div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </div>

            <div>
              <div className="text-xs font-semibold text-neutral-700">Rotación</div>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(clamp(Number(e.target.value), -180, 180))}
                className="mt-2 w-full"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((r) => r - 90)}
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  ⟲ -90°
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => r + 90)}
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  ⟳ +90°
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={!canApply}
              onClick={apply}
              className="w-full rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {working ? "Procesando..." : "Aplicar cambios"}
            </button>

            <div className="text-[11px] text-neutral-500">
              El recorte genera una nueva imagen (JPEG) con el resultado.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

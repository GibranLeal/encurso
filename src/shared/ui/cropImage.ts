export async function getCroppedBlob(imageSrc: string, cropPixels: any, rotation = 0) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // rotación
  const radians = (rotation * Math.PI) / 180;

  // canvas del tamaño del crop
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;

  // mover al centro del crop
  ctx.translate(-cropPixels.x, -cropPixels.y);

  // aplicar rotación sobre el centro de la imagen
  ctx.translate(image.width / 2, image.height / 2);
  ctx.rotate(radians);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No blob"))), "image/jpeg", 0.92);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

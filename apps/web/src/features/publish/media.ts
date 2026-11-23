export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_MAX_SIDE = 1600;
export const PHOTO_TARGET_BYTES = 600 * 1024;

export function photoSelectionError(files: File[], room: number): string {
  if (files.length > room) return `Puedes subir máximo ${room} fotos`;
  if (files.some((file) => file.size > MAX_PHOTO_BYTES))
    return "Cada foto puede pesar máximo 5 MB";
  return "";
}

export async function shrinkPhoto(file: File): Promise<File> {
  if (file.size <= PHOTO_TARGET_BYTES) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const scale = Math.min(
    1,
    PHOTO_MAX_SIDE / Math.max(bitmap.width, bitmap.height),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.82, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (blob && (blob.size <= PHOTO_TARGET_BYTES || quality === 0.55)) {
      const name = file.name.replace(/\.\w+$/, "") + ".jpg";
      return new File([blob], name, { type: "image/jpeg" });
    }
  }
  return file;
}

import { supabase } from "./supabase";

/** Resize a picked photo to a JPEG no larger than 1400px on its long side. */
export async function shrink(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const k = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.84));
  } finally {
    URL.revokeObjectURL(url);
  }
}

const cache = new Map<string, { url: string; at: number }>();

/** A short-lived URL for a private progress photo; teammates can read it under the storage policies. */
export async function photoUrl(path: string): Promise<string | null> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < 50 * 60 * 1000) return hit.url;
  const { data } = await supabase.storage.from("photos").createSignedUrl(path, 3600);
  if (!data?.signedUrl) return null;
  cache.set(path, { url: data.signedUrl, at: Date.now() });
  return data.signedUrl;
}

"use client";

/**
 * Redimensionnement/compression des images CÔTÉ CLIENT avant upload
 * (règle d'or n°6) : toute image passe par ici avant Supabase Storage.
 * Sortie : WebP ≤ 1600px de large, qualité 0.82 — léger et net.
 */

const MAX_WIDTH = 1600;
const QUALITY = 0.82;

export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non disponible");
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Compression échouée"))),
      "image/webp",
      QUALITY
    );
  });
}

/**
 * Compresse puis téléverse une image dans le bucket `images`, sous le dossier
 * de l'utilisateur (exigé par la policy Storage). Renvoie l'URL publique.
 */
export async function uploadImage(
  file: File,
  userId: string,
  prefix: string
): Promise<string> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const blob = await compressImage(file);
  const path = `${userId}/${prefix}-${Date.now()}.webp`;

  const { error } = await supabase.storage.from("images").upload(path, blob, {
    contentType: "image/webp",
    upsert: false,
  });
  if (error) throw new Error(`Upload impossible : ${error.message}`);

  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}

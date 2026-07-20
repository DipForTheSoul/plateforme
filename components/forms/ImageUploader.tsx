"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/image";

interface Props {
  prefix: string;
  images: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

/** Upload d'images avec compression client (WebP ≤1600px) vers Supabase Storage. */
export function ImageUploader({ prefix, images, onChange, max = 6 }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Connexion requise pour téléverser.");

      const remaining = max - images.length;
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, remaining)) {
        urls.push(await uploadImage(file, user.id, prefix));
      }
      onChange([...images, ...urls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Téléversement impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {images.map((url) => (
          <div key={url} className="relative h-24 w-32 overflow-hidden rounded-xl">
            <Image src={url} alt="" fill className="object-cover" sizes="128px" />
            <button
              type="button"
              onClick={() => onChange(images.filter((u) => u !== url))}
              className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white"
              aria-label="Retirer cette image"
            >
              ✕
            </button>
          </div>
        ))}
        {images.length < max && (
          <label className="flex h-24 w-32 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-soul-bronze/40 text-2xl text-soul-bronze hover:border-soul-bronze">
            {busy ? "…" : "+"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              disabled={busy}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}

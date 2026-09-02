"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  images: string[];
  alt: string;
}

export function ImageGallery({ images, alt }: Props) {
  const [current, setCurrent] = useState(0);

  if (!images.length) return null;
  if (images.length === 1) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl sm:aspect-[16/10]">
        <Image src={images[0]} alt={alt} fill priority sizes="(max-width: 896px) 100vw, 896px" className="object-cover" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl sm:aspect-[16/10]">
        <Image
          src={images[current]}
          alt={`${alt} (${current + 1}/${images.length})`}
          fill
          priority={current === 0}
          sizes="(max-width: 896px) 100vw, 896px"
          className="object-cover transition-opacity duration-300"
        />
        <button
          type="button"
          onClick={() => setCurrent((current - 1 + images.length) % images.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70"
          aria-label="Image précédente"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setCurrent((current + 1) % images.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70"
          aria-label="Image suivante"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={`h-2 w-2 rounded-full transition ${i === current ? "bg-white" : "bg-white/50"}`}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={() => setCurrent(i)}
            className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl transition ${
              i === current ? "ring-2 ring-soul-violet" : "opacity-70 hover:opacity-100"
            }`}
          >
            <Image src={url} alt="" fill sizes="96px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

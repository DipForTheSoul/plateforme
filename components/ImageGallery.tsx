import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props { images: string[]; alt: string }

/** Galerie progressive utilisable au tactile même sans hydratation JavaScript. */
export function ImageGallery({ images, alt }: Props) {
  if (!images.length) return null;
  const slideId = (index: number) => `experience-photo-${index + 1}`;
  return (
    <div className="flex flex-col gap-3" data-testid="experience-gallery">
      <div className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth rounded-3xl bg-soul-sand [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {images.map((url, index) => {
          const previous = (index - 1 + images.length) % images.length;
          const next = (index + 1) % images.length;
          return (
            <figure id={slideId(index)} key={`${url}-${index}`} className="relative aspect-[4/3] min-w-full snap-center scroll-mt-24 sm:aspect-[16/10]">
              <Image src={url} alt={`${alt}${images.length > 1 ? ` (${index + 1}/${images.length})` : ""}`} fill
                priority={index === 0} sizes="(max-width: 896px) 100vw, 896px" className="object-contain" />
              {images.length > 1 && <>
                <a href={`#${slideId(previous)}`} aria-label="Image précédente"
                  className="touch-manipulation absolute left-3 top-1/2 z-20 grid min-h-11 min-w-11 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  <ChevronLeft className="h-6 w-6" />
                </a>
                <a href={`#${slideId(next)}`} aria-label="Image suivante"
                  className="touch-manipulation absolute right-3 top-1/2 z-20 grid min-h-11 min-w-11 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  <ChevronRight className="h-6 w-6" />
                </a>
              </>}
            </figure>
          );
        })}
      </div>
      {images.length > 1 && <nav aria-label="Choisir une photo" className="flex gap-2 overflow-x-auto pb-1">
        {images.map((url, index) => <a key={`${url}-thumb-${index}`} href={`#${slideId(index)}`} aria-label={`Image ${index + 1}`}
          className="touch-manipulation relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-transparent opacity-75 hover:opacity-100 focus:border-soul-violet focus:opacity-100">
          <Image src={url} alt="" fill sizes="96px" className="object-contain bg-soul-sand" />
        </a>)}
      </nav>}
    </div>
  );
}

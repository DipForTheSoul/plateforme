import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "ForTheSoul — Expériences conscientes en Suisse";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Image Open Graph (partage social) : photo immersive + logo centré + wordmark.
 * Le logo et la photo sont embarqués en base64 (satori ne lit pas le FS via URL).
 */
export default async function OpenGraphImage() {
  const [photo, logo] = await Promise.all([
    readFile(join(process.cwd(), "public/hero-poster.jpg")),
    readFile(join(process.cwd(), "public/logo-icon.png")),
  ]);
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ position: "relative", display: "flex", width: "100%", height: "100%" }}>
        {/* Photo de fond */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoSrc}
          width={1200}
          height={630}
          style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover" }}
          alt=""
        />
        {/* Voile dégradé (lisibilité du texte du bas) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            background: "linear-gradient(to bottom, rgba(20,14,30,0) 42%, rgba(20,14,30,0.82) 100%)",
          }}
        />
        {/* Halo sombre doux derrière le logo (contraste sur la mer claire) */}
        <div
          style={{
            position: "absolute",
            top: 150,
            left: 400,
            width: 400,
            height: 320,
            display: "flex",
            background: "radial-gradient(closest-side, rgba(20,14,30,0.42), rgba(20,14,30,0))",
          }}
        />
        {/* Logo centré, descendu */}
        <div style={{ position: "absolute", top: 190, left: 0, width: 1200, display: "flex", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} height={230} style={{ height: 230 }} alt="" />
        </div>
        {/* Wordmark + accroche en bas */}
        <div
          style={{
            position: "absolute",
            bottom: 54,
            left: 0,
            width: 1200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Georgia, serif",
              fontSize: 82,
              fontWeight: 700,
              color: "#FDF6EE",
              textShadow: "0 2px 12px rgba(0,0,0,0.55)",
            }}
          >
            ForTheSoul
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 10,
              fontFamily: "Georgia, serif",
              fontSize: 33,
              color: "#FDF6EE",
              textShadow: "0 2px 10px rgba(0,0,0,0.6)",
            }}
          >
            Expériences conscientes en Suisse, choisies avec cœur
          </div>
        </div>
      </div>
    ),
    size
  );
}

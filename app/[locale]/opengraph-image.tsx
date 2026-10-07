import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Des expériences qui nourrissent l’âme — ForTheSoul";
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
        {/* Logo discret + promesse identique à celle de la page d’accueil. */}
        <div style={{ position: "absolute", top: 44, left: 58, display: "flex", alignItems: "center" }}>
          <img src={logoSrc} height={72} style={{ height: 72 }} alt="" />
          <div style={{ display: "flex", marginLeft: 18, fontFamily: "Georgia, serif", fontSize: 38, color: "#FDF6EE" }}>
            ForTheSoul
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 58,
            left: 58,
            width: 1084,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Georgia, serif",
              fontSize: 78,
              lineHeight: 1.02,
              maxWidth: 980,
              color: "#FDF6EE",
              textShadow: "0 2px 12px rgba(0,0,0,0.55)",
            }}
          >
            Des expériences qui nourrissent l’âme
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontFamily: "Georgia, serif",
              fontSize: 31,
              color: "#FDF6EE",
              textShadow: "0 2px 10px rgba(0,0,0,0.6)",
            }}
          >
            Retraites, ateliers et expériences pour le corps, l’esprit et l’âme
          </div>
        </div>
      </div>
    ),
    size
  );
}

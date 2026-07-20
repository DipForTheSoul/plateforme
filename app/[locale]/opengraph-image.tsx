import { ImageResponse } from "next/og";

export const alt = "ForTheSoul — Expériences conscientes en Suisse";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Image Open Graph générée (partage social — Phase 9). */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #443420 0%, #9e7c52 70%, #fdead2 100%)",
          color: "#fef6ed",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ fontSize: 96, display: "flex" }}>ForTheSoul</div>
        <div
          style={{
            fontSize: 34,
            marginTop: 24,
            color: "#fdead2",
            display: "flex",
          }}
        >
          Expériences conscientes en Suisse, choisies avec cœur
        </div>
        <div
          style={{
            fontSize: 24,
            marginTop: 40,
            color: "#f9ad4d",
            display: "flex",
          }}
        >
          ✓ Chaque expérience est validée par Didier
        </div>
      </div>
    ),
    size
  );
}

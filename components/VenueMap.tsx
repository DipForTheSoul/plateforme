"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

/** Raster tiles, like the experience map: no WebGL or third-party iframe required. */
export function VenueMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | undefined;
    let resize: ResizeObserver | undefined;
    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !container.current) return;
      map = L.map(container.current, { scrollWheelZoom: false, zoomAnimation: false, fadeAnimation: false })
        .setView([lat, lng], 15);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        maxZoom: 18,
      }).addTo(map);
      L.circleMarker([lat, lng], { radius: 10, color: "#ffffff", weight: 3, fillColor: "#604ca0", fillOpacity: 1 }).addTo(map);
      resize = new ResizeObserver(() => map?.invalidateSize());
      resize.observe(container.current);
    })().catch(() => {
      // The always-visible external map and directions links remain usable.
      console.warn("Venue map unavailable");
    });
    return () => { cancelled = true; resize?.disconnect(); map?.remove(); };
  }, [lat, lng]);
  return <div ref={container} role="region" aria-label={label} className="relative z-0 h-72 w-full bg-soul-sand" />;
}

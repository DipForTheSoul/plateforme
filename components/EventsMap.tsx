"use client";

import { useCallback, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type * as LeafletNS from "leaflet";

export interface MapEvent {
  id: string;
  slug: string;
  title: string;
  lat: number;
  lng: number;
  priceLabel?: string;
  venueName?: string;
}

/**
 * Carte des expériences — OpenStreetMap via Leaflet (gratuit, sans clé).
 * Leaflet est importé dynamiquement (accès à window) pour rester compatible SSR.
 */
export function EventsMap({ events }: { events: MapEvent[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const layerRef = useRef<LeafletNS.LayerGroup | null>(null);
  const LRef = useRef<typeof LeafletNS | null>(null);
  const eventsRef = useRef(events);

  const renderMarkers = useCallback(() => {
    const L = LRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();

    const points: [number, number][] = [];
    for (const e of eventsRef.current) {
      if (e.lat == null || e.lng == null) continue;
      points.push([e.lat, e.lng]);
      const icon = L.divIcon({
        className: "",
        html: `<span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:9999px;background:#ff8044;color:#fff;font-size:13px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);">●</span>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const marker = L.marker([e.lat, e.lng], { icon }).addTo(layer);
      const venue = e.venueName
        ? `<div style="color:#9e7c52;font-size:12px;">${e.venueName}</div>`
        : "";
      const price = e.priceLabel
        ? `<div style="color:#9e7c52;font-size:12px;margin-top:2px;">${e.priceLabel}</div>`
        : "";
      marker.bindPopup(
        `<a href="/experiences/${e.slug}" style="font-family:serif;font-weight:600;color:#443420;font-size:14px;text-decoration:none;">${e.title}</a>${venue}${price}`
      );
    }
    if (points.length > 0) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 12 });
    }
  }, []);

  // Initialisation (import client + création de la carte).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!containerRef.current || mapRef.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
        [46.8, 8.23],
        7
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      renderMarkers();
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [renderMarkers]);

  // Mise à jour des marqueurs quand les résultats changent.
  useEffect(() => {
    eventsRef.current = events;
    renderMarkers();
  }, [events, renderMarkers]);

  return (
    <div
      ref={containerRef}
      className="h-[70vh] min-h-[420px] w-full overflow-hidden rounded-2xl border border-soul-bronze/15"
    />
  );
}

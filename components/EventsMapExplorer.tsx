"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type * as LeafletNS from "leaflet";

export interface MapItem {
  id: string;
  slug: string;
  title: string;
  venueName?: string;
  regionLabel?: string;
  priceLabel: string;
  dateLabel: string;
  image?: string;
  featured?: boolean;
  lat: number;
  lng: number;
}

function markerHtml(active: boolean): string {
  const size = active ? 32 : 24;
  const bg = active ? "#b5482a" : "#ff8044";
  return `<span style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${bg};color:#fff;font-size:${active ? 15 : 12}px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);transition:all .15s;">●</span>`;
}

/**
 * Explorateur carte façon retreat.guru : liste des expériences à gauche +
 * carte OpenStreetMap à droite, synchronisées. Survol d'une carte → le point
 * s'anime et sa bulle s'ouvre ; clic sur un point → la fiche remonte dans la
 * liste. Leaflet importé dynamiquement (accès window) pour rester SSR-safe.
 */
export function EventsMapExplorer({
  items,
  hrefPrefix,
}: {
  items: MapItem[];
  hrefPrefix: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const LRef = useRef<typeof LeafletNS | null>(null);
  const markersRef = useRef<Record<string, LeafletNS.Marker>>({});
  const cardRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [selected, setSelected] = useState<string | null>(null);

  // Initialisation de la carte + marqueurs (une fois par jeu d'items).
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
      mapRef.current = map;

      const points: [number, number][] = [];
      for (const it of items) {
        if (it.lat == null || it.lng == null) continue;
        points.push([it.lat, it.lng]);
        const marker = L.marker([it.lat, it.lng], {
          icon: L.divIcon({
            className: "",
            html: markerHtml(false),
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        }).addTo(map);
        const venue = it.venueName
          ? `<div style="color:#9e7c52;font-size:12px;">${it.venueName}</div>`
          : "";
        marker.bindPopup(
          `<a href="${hrefPrefix}/experiences/${it.slug}" style="font-family:serif;font-weight:600;color:#443420;font-size:14px;text-decoration:none;">${it.title}</a>${venue}<div style="color:#9e7c52;font-size:12px;margin-top:2px;">${it.dateLabel} · ${it.priceLabel}</div>`
        );
        marker.on("click", () => {
          setSelected(it.id);
          cardRefs.current[it.id]?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        });
        markersRef.current[it.id] = marker;
      }
      if (points.length > 0) {
        map.fitBounds(points, { padding: [40, 40], maxZoom: 12 });
      }
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, [items, hrefPrefix]);

  // Mise en évidence du point sélectionné (survol liste ou clic marqueur).
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    for (const [id, marker] of Object.entries(markersRef.current)) {
      const active = id === selected;
      marker.setIcon(
        L.divIcon({
          className: "",
          html: markerHtml(active),
          iconSize: active ? [32, 32] : [24, 24],
          iconAnchor: active ? [16, 16] : [12, 12],
        })
      );
      marker.setZIndexOffset(active ? 1000 : 0);
    }
    if (selected && markersRef.current[selected]) {
      markersRef.current[selected].openPopup();
    }
  }, [selected]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="order-2 flex max-h-[72vh] flex-col gap-3 overflow-y-auto lg:order-1 lg:pr-1">
        {items.map((it) => (
          <a
            key={it.id}
            ref={(el) => {
              cardRefs.current[it.id] = el;
            }}
            href={`${hrefPrefix}/experiences/${it.slug}`}
            onMouseEnter={() => setSelected(it.id)}
            onFocus={() => setSelected(it.id)}
            className={`flex gap-3 rounded-2xl border p-3 transition ${
              selected === it.id
                ? "border-soul-terracotta bg-white shadow-sm"
                : "border-soul-bronze/15 bg-white/70 hover:bg-white"
            }`}
          >
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-soul-sand">
              {it.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.image} alt="" className="h-full w-full object-cover" />
              ) : null}
              {it.featured && (
                <span className="absolute left-1 top-1 rounded-full bg-soul-terracotta px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  ★
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-soul-bronze">
                {it.dateLabel}
              </p>
              <h3 className="truncate font-serif text-base leading-tight text-soul-brown">
                {it.title}
              </h3>
              <p className="truncate text-xs text-soul-bronze">
                {it.venueName ?? it.regionLabel ?? ""}
              </p>
              <p className="mt-1 text-sm font-semibold text-soul-brown">
                {it.priceLabel}
              </p>
            </div>
          </a>
        ))}
      </div>

      <div className="order-1 lg:order-2">
        <div
          ref={containerRef}
          className="h-[52vh] w-full overflow-hidden rounded-2xl border border-soul-bronze/15 lg:sticky lg:top-24 lg:h-[72vh]"
        />
      </div>
    </div>
  );
}

"use client";

import type { Leg } from "@/lib/trip-data";
import type { DivIcon, Map as LeafletMap, Marker } from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";

type LeafletModule = typeof import("leaflet");

type TripMapProps = {
  legs: Leg[];
  onSelectLeg: (legId: string) => void;
  selectedLegId: string;
};

export function TripMap({ legs, onSelectLeg, selectedLegId }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [isReady, setIsReady] = useState(false);
  const mapLegs = useMemo(
    () => legs.filter((leg) => leg.latitude !== null && leg.longitude !== null),
    [legs],
  );
  const legKey = mapLegs.map((leg) => leg.leg_id).join("|");

  useEffect(() => {
    let isMounted = true;

    async function loadMap() {
      if (!containerRef.current || mapRef.current) return;

      const leaflet = await import("leaflet");

      if (!isMounted || !containerRef.current) return;

      leafletRef.current = leaflet;
      mapRef.current = leaflet.map(containerRef.current, {
        attributionControl: true,
        scrollWheelZoom: true,
        zoomControl: true,
      });

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        })
        .addTo(mapRef.current);

      setIsReady(true);
    }

    void loadMap();

    return () => {
      isMounted = false;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;

    if (!leaflet || !map || !isReady) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = mapLegs.map((leg) => {
      const marker = leaflet.marker([leg.latitude ?? 0, leg.longitude ?? 0], {
        icon: createPinIcon(leaflet, leg.leg_id === selectedLegId),
      });

      marker.bindTooltip(leg.city, {
        direction: "right",
        offset: [12, -18],
        permanent: true,
      });
      marker.on("click", () => onSelectLeg(leg.leg_id));
      marker.addTo(map);

      return marker;
    });
  }, [isReady, mapLegs, onSelectLeg, selectedLegId]);

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;

    if (!leaflet || !map || !isReady || mapLegs.length === 0) return;

    const points = mapLegs.map(
      (leg) => [leg.latitude ?? 0, leg.longitude ?? 0] as [number, number],
    );

    if (points.length === 1) {
      map.setView(points[0], 7);
      return;
    }

    map.fitBounds(leaflet.latLngBounds(points), { padding: [24, 24] });
  }, [isReady, legKey, mapLegs]);

  if (mapLegs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm font-semibold leading-6 text-[var(--color-muted)]">
        Add latitude and longitude columns to show pins here.
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="h-full w-full" />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-muted)]">
          Loading map
        </div>
      )}
    </>
  );
}

function createPinIcon(leaflet: LeafletModule, isSelected: boolean): DivIcon {
  return leaflet.divIcon({
    className: "trip-map-pin-wrap",
    html: `<span class="trip-map-pin${isSelected ? " trip-map-pin-selected" : ""}"></span>`,
    iconAnchor: isSelected ? [18, 38] : [15, 32],
    iconSize: isSelected ? [36, 38] : [30, 32],
  });
}

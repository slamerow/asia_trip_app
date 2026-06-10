"use client";

import type { Leg } from "@/lib/trip-data";
import type { DivIcon, Map as LeafletMap, Marker, TileLayer } from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";

type LeafletModule = typeof import("leaflet");
type MapStyle = "satellite" | "street";

type TripMapProps = {
  legs: Leg[];
  onSelectLeg: (legId: string) => void;
  selectedLegId: string;
};

const mapStyles: Record<
  MapStyle,
  {
    attribution: string;
    labels?: {
      attribution: string;
      url: string;
    };
    label: string;
    url: string;
  }
> = {
  street: {
    attribution:
      "Tiles &copy; Esri &mdash; Sources: Esri, HERE, Garmin, FAO, NOAA, USGS, &copy; OpenStreetMap contributors, and the GIS User Community",
    label: "Street",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
  },
  satellite: {
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    label: "Satellite",
    labels: {
      attribution:
        "Labels &copy; Esri &mdash; Sources: Esri, HERE, Garmin, FAO, NOAA, USGS, &copy; OpenStreetMap contributors, and the GIS User Community",
      url: "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    },
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  },
};

export function TripMap({ legs, onSelectLeg, selectedLegId }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const tileLayersRef = useRef<TileLayer[]>([]);
  const [mapStyle, setMapStyle] = useState<MapStyle>("street");
  const [isReady, setIsReady] = useState(false);
  const mapLegs = useMemo(
    () => legs.filter((leg) => leg.latitude !== null && leg.longitude !== null),
    [legs],
  );
  const legKey = mapLegs.map((leg) => leg.leg_id).join("|");
  const defaultViewLegs = useMemo(() => {
    const nonUsLegs = mapLegs.filter(
      (leg) => leg.country.trim().toLowerCase() !== "us",
    );

    return nonUsLegs.length > 0 ? nonUsLegs : mapLegs;
  }, [mapLegs]);
  const defaultViewKey = defaultViewLegs.map((leg) => leg.leg_id).join("|");

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

      setIsReady(true);
    }

    void loadMap();

    return () => {
      isMounted = false;
      tileLayersRef.current.forEach((layer) => layer.remove());
      tileLayersRef.current = [];
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

    tileLayersRef.current.forEach((layer) => layer.remove());
    tileLayersRef.current = [];

    const style = mapStyles[mapStyle];
    const baseLayer = leaflet
      .tileLayer(style.url, {
        attribution: style.attribution,
        maxZoom: 19,
      })
      .addTo(map);

    tileLayersRef.current.push(baseLayer);

    if (style.labels) {
      const labelLayer = leaflet
        .tileLayer(style.labels.url, {
          attribution: style.labels.attribution,
          maxZoom: 19,
          pane: "overlayPane",
        })
        .addTo(map);

      tileLayersRef.current.push(labelLayer);
    }
  }, [isReady, mapStyle]);

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;

    if (!leaflet || !map || !isReady) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = mapLegs.map((leg, index) => {
      const stopNumber = index + 1;
      const marker = leaflet.marker([leg.latitude ?? 0, leg.longitude ?? 0], {
        icon: createPinIcon(leaflet, leg.leg_id === selectedLegId, stopNumber),
      });

      marker.on("click", () => onSelectLeg(leg.leg_id));
      marker.addTo(map);

      return marker;
    });
  }, [isReady, mapLegs, onSelectLeg, selectedLegId]);

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;

    if (!leaflet || !map || !isReady || defaultViewLegs.length === 0) return;

    const points = defaultViewLegs.map(
      (leg) => [leg.latitude ?? 0, leg.longitude ?? 0] as [number, number],
    );

    if (points.length === 1) {
      map.setView(points[0], 7);
      return;
    }

    map.fitBounds(leaflet.latLngBounds(points), { padding: [24, 24] });
  }, [defaultViewKey, defaultViewLegs, isReady, legKey]);

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
      <div className="absolute right-3 top-3 z-[500] flex rounded-lg border border-white/70 bg-[var(--color-app)]/90 p-1 shadow-lg shadow-stone-950/20 backdrop-blur">
        {(Object.keys(mapStyles) as MapStyle[]).map((styleId) => (
          <button
            key={styleId}
            type="button"
            className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
              mapStyle === styleId
                ? "bg-[var(--color-green)] text-white"
                : "text-[var(--color-muted)]"
            }`}
            onClick={() => setMapStyle(styleId)}
          >
            {mapStyles[styleId].label}
          </button>
        ))}
      </div>
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-muted)]">
          Loading map
        </div>
      )}
    </>
  );
}

function createPinIcon(
  leaflet: LeafletModule,
  isSelected: boolean,
  stopNumber: number,
): DivIcon {
  return leaflet.divIcon({
    className: "trip-map-pin-wrap",
    html: `<span class="trip-map-pin${isSelected ? " trip-map-pin-selected" : ""}"><span class="trip-map-pin-number">${stopNumber}</span></span>`,
    iconAnchor: isSelected ? [18, 38] : [15, 32],
    iconSize: isSelected ? [36, 38] : [30, 32],
  });
}

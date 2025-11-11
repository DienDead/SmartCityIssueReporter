"use client";

import { useEffect, useMemo, useRef } from "react";
// import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { Report } from "../services/types";

type LatLng = { lat: number; lng: number };

interface HeatmapMapEnhancedProps {
  reports: Report[];
  defaultCenter?: LatLng;
  defaultZoom?: number;
}

export default function HeatmapMapEnhanced({
  reports,
  defaultCenter,
  defaultZoom = 12,
}: HeatmapMapEnhancedProps) {
  const center = defaultCenter ?? { lat: 28.6139, lng: 77.209 };

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={defaultZoom}
      scrollWheelZoom
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        attribution={"© OpenStreetMap contributors"}
        url={"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
      />
      <SeverityHeatLayer reports={reports} />
      <LocationMarkers reports={reports} />
    </MapContainer>
  );
}

function LocationMarkers({ reports }: { reports: Report[] }) {
  return (
    <>
      {reports.map((r) => (
        <CircleMarker
          key={r.id}
          center={[r.lat, r.lng]}
          radius={getSeverityRadius(r.status)}
          pathOptions={{
            color: categoryColor(r.category),
            fillColor: categoryColor(r.category),
            fillOpacity: 0.85,
            weight: 2,
          }}
        >
          <Tooltip direction="top" permanent={false}>
            <div className="space-y-1">
              <div className="font-semibold text-sm">{r.title || "Issue"}</div>
              <div className="text-xs">
                {r.category.replace("-", " ")} · {statusLabel(r.status)}
                {r.autoCategorized && " (AI)"}
              </div>
              <div className="text-xs text-slate-600">
                {new Date(r.createdAt).toLocaleString()}
              </div>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
}

function SeverityHeatLayer({ reports }: { reports: Report[] }) {
  const map = useMap();
  const layerRef = useRef<any>(null);

  const points = useMemo(() => {
    return reports.map((r) => {
      // Weight: open (unresolved) = 0.9, in_progress = 0.6, resolved = 0.2
      const weight =
        r.status === "open" ? 0.95 : r.status === "in_progress" ? 0.65 : 0.2;
      return [r.lat, r.lng, weight] as [number, number, number];
    });
  }, [reports]);

  useEffect(() => {
    if (!map) return;

    let heatLayer: any;

    const loadHeatLayer = async () => {
      const L = (await import("leaflet")).default;

      if (typeof window !== "undefined") {
        (window as any).L = L;
      }

      await import("leaflet.heat");

      // Ensure plugin attaches correctly to the same Leaflet instance

      if (typeof (L as any).heatLayer !== "function") {
        console.error("❌ leaflet.heat plugin failed to initialize properly");
        return;
      }

      heatLayer = (L as any).heatLayer(points, {
        radius: 30,
        blur: 25,
        minOpacity: 0.2,
        maxZoom: 16,
        max: 1.0,
        gradient: {
          0.0: "#4ade80",
          0.25: "#86efac",
          0.5: "#fbbf24",
          0.75: "#f97316",
          1.0: "#dc2626",
        },
      });

      layerRef.current = heatLayer;
      heatLayer.addTo(map);
    };

    loadHeatLayer();

    return () => {
      if (heatLayer) map.removeLayer(heatLayer);
    };
  }, [map, points]);

  // Update points dynamically when reports change
  useEffect(() => {
    if (layerRef.current && typeof layerRef.current.setLatLngs === "function") {
      layerRef.current.setLatLngs(points);
    }
  });

  // Auto-fit map bounds
  useEffect(() => {
    if (!reports.length) return;
    try {
      const L = (window as any).L.default;
      const bounds = L.latLngBounds(reports.map((r) => [r.lat, r.lng]));
      map.fitBounds(bounds.pad(0.15), { animate: true, duration: 0.5 });
    } catch (error) {
      console.warn("[v0] Bounds fit skipped:", error);
    }
  }, [reports, map]);

  return null;
}

function categoryColor(cat: Report["category"]) {
  switch (cat) {
    case "pothole":
      return "#f97316"; // orange
    case "garbage":
      return "#22c55e"; // green
    default:
      return "#64748b"; // slate
  }
}

function getSeverityRadius(status: Report["status"]) {
  switch (status) {
    case "open":
      return 8; // Larger for urgent issues
    case "in_progress":
      return 6;
    case "resolved":
      return 4; // Smaller for resolved
    default:
      return 5;
  }
}

function statusLabel(status: Report["status"]) {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In Progress";
    case "resolved":
      return "Resolved";
    default:
      return status;
  }
}

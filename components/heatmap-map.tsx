"use client"

import { useEffect, useMemo, useRef } from "react"
import "leaflet/dist/leaflet.css"
import "leaflet.heat"
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet"
import type { Report } from "../services/reports-service"

type LatLng = { lat: number; lng: number }

export default function HeatmapMap(props: {
  reports: Report[]
  defaultCenter?: LatLng
  defaultZoom?: number
}) {
  const center = props.defaultCenter ?? { lat: 28.6139, lng: 77.209 }
  const zoom = props.defaultZoom ?? 12

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        attribution={"© OpenStreetMap contributors"}
        url={"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
      />
      <HeatLayer reports={props.reports} />
      {props.reports.map((r) => (
        <CircleMarker
          key={r.id}
          center={[r.lat, r.lng]}
          radius={6}
          pathOptions={{ color: categoryColor(r.category), fillColor: categoryColor(r.category), fillOpacity: 0.8 }}
        >
          <Tooltip direction="top">
            <div className="space-y-1">
              <div className="font-semibold">{r.title || "Issue"}</div>
              <div className="text-[11px]">
                {r.category} {" · "} {r.status.replace("_", " ")}
              </div>
              <div className="text-[11px] text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</div>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}

function HeatLayer({ reports }: { reports: Report[] }) {
  const map = useMap()
  const layerRef = useRef<any>(null)
  const points = useMemo(() => {
    // weight: open > in_progress > resolved
    return reports.map((r) => {
      const weight = r.status === "open" ? 0.9 : r.status === "in_progress" ? 0.6 : 0.3
      return [r.lat, r.lng, weight] as [number, number, number]
    })
  }, [reports])

  useEffect(() => {
    const l = (window as any).L.heatLayer(points, {
      radius: 25,
      blur: 20,
      minOpacity: 0.3,
      maxZoom: 16,
      gradient: {
        0.2: "#a7f3d0",
        0.4: "#6ee7b7",
        0.6: "#34d399",
        0.8: "#10b981",
        1.0: "#047857",
      },
    })
    layerRef.current = l
    l.addTo(map)
    return () => {
      l.remove()
    }
  }, [map])

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setLatLngs(points)
    }
  }, [points])

  // Fit bounds if many points
  useEffect(() => {
    if (!reports.length) return
    const bounds = (window as any).L.latLngBounds(reports.map((r) => [r.lat, r.lng]))
    map.fitBounds(bounds.pad(0.2), { animate: false })
  }, [reports, map])

  return null
}

function categoryColor(cat: Report["category"]) {
  switch (cat) {
    case "pothole":
      return "#f97316" // orange-500
    case "garbage":
      return "#22c55e" // green-500
    default:
      return "#64748b" // slate-500
  }
}

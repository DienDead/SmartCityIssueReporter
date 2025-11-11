"use client"

import { useEffect, useMemo, useState } from "react"
import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet"

type LatLng = { lat: number; lng: number }

export default function MapPicker(props: {
  value?: LatLng
  onChange?: (latlng: LatLng) => void
  defaultCenter?: LatLng
  defaultZoom?: number
}) {
  const center = props.value ?? props.defaultCenter ?? { lat: 28.6139, lng: 77.209 }
  const zoom = props.defaultZoom ?? 12
  const [position, setPosition] = useState<LatLng | null>(props.value ?? null)

  useEffect(() => {
    if (props.value) setPosition(props.value)
  }, [props.value])

  const markerColor = useMemo(() => "#16a34a", []) // emerald-600

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom={true}
      className="h-full w-full"
      style={{ outline: "none" }}
      attributionControl
    >
      <TileLayer
        attribution={"© OpenStreetMap contributors"}
        url={"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
      />
      <ClickHandler
        onPick={(latlng) => {
          setPosition(latlng)
          props.onChange?.(latlng)
        }}
      />
      {position && (
        <CircleMarker
          center={[position.lat, position.lng]}
          radius={10}
          pathOptions={{ color: markerColor, fillColor: markerColor, fillOpacity: 0.5 }}
        />
      )}
    </MapContainer>
  )
}

function ClickHandler(props: { onPick: (latlng: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      props.onPick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

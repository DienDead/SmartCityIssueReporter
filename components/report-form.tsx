"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import dynamic from "next/dynamic"
import { createReport, type Category } from "../services/reports-api"
import { ImageIcon, Loader2, MapPin, Route } from "lucide-react"

const MapPicker = dynamic(() => import("./map-picker"), { ssr: false })

const CATEGORY_ITEMS: { label: string; value: Category }[] = [
  { label: "Pothole", value: "pothole" },
  { label: "Garbage", value: "garbage" },
  { label: "Other", value: "other" },
]

export default function ReportForm(props: { onSubmitted?: () => void }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryMode, setCategoryMode] = useState<"auto" | "manual">("auto")
  const [category, setCategory] = useState<Category>("pothole")
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string>("")
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string>("")

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setFilePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const canSubmit = useMemo(() => {
    return !!loc && !!file && (title.trim().length > 0 || description.trim().length > 0)
  }, [loc, file, title, description])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !file || !loc) return
    setSubmitting(true)
    setMessage("")
    try {
      const mode: "auto" | "manual" = categoryMode
      await createReport({
        title: title || "Issue report",
        description,
        lat: loc.lat,
        lng: loc.lng,
        image: file,
        mode,
        category: mode === "manual" ? category : undefined,
      })
      setMessage("Report submitted successfully.")
      setTitle("")
      setDescription("")
      setCategory("pothole")
      setCategoryMode("auto")
      setFile(null)
      setFilePreview("")
      setLoc(null)
      if (props.onSubmitted) props.onSubmitted()
    } catch (err) {
      setMessage("Something went wrong. Please try again.")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="title">{"Title"}</Label>
          <Input
            id="title"
            placeholder="e.g., Large pothole near Main Street"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category-mode">{"Category"}</Label>
          <div className="flex gap-2">
            <Select value={categoryMode} onValueChange={(v: "auto" | "manual") => setCategoryMode(v)}>
              <SelectTrigger id="category-mode" className="w-32">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{"Auto"}</SelectItem>
                <SelectItem value="manual">{"Manual"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(v: Category) => setCategory(v)} disabled={categoryMode === "auto"}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ITEMS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">{"Description"}</Label>
        <Textarea
          id="description"
          placeholder="Add any helpful details like severity, nearby landmarks, or time observed."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="image">{"Image"}</Label>
          <div className="flex items-center gap-3">
            <Input id="image" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          {filePreview && (
            <img
              src={filePreview || "/placeholder.svg"}
              alt={"Selected issue image preview"}
              className="mt-2 h-32 w-full rounded-md border object-cover"
            />
          )}
        </div>
        <div className="grid gap-2">
          <Label>{"Pick Location"}</Label>
          <Card>
            <CardContent className="p-0">
              <div className="h-56 w-full">
                <MapPicker
                  value={loc ?? undefined}
                  onChange={setLoc}
                  defaultCenter={{ lat: 28.6139, lng: 77.209 }}
                  defaultZoom={12}
                />
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {loc ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}` : "Tap the map to set a location"}
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
              onClick={() => locateMe(setLoc)}
            >
              <Route className="h-3.5 w-3.5" />
              {"Use my location"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{"Your report is stored locally in this demo."}</div>
        <Button type="submit" disabled={!canSubmit || submitting} className="min-w-32">
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {"Submit"}
        </Button>
      </div>
      {message && (
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{message}</div>
      )}
    </form>
  )
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function locateMe(setLoc: (v: { lat: number; lng: number }) => void) {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    },
    () => {
      // ignore errors silently for demo
    },
    { enableHighAccuracy: true, timeout: 8000 },
  )
}

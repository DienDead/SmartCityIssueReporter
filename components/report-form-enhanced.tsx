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
import { addReport, type Category } from "../services/reports-service"
import { ImageIcon, Loader2, MapPin, Route, Zap } from "lucide-react"
import ClassificationPreview from "./classification-preview"
import { createReport } from "../services/reports-api"

const MapPicker = dynamic(() => import("./map-picker"), { ssr: false })

const CATEGORY_ITEMS: { label: string; value: Category; icon: string }[] = [
  { label: "Pothole", value: "pothole", icon: "🕳️" },
  { label: "Garbage", value: "garbage", icon: "🗑️" },
  { label: "Other", value: "other", icon: "❓" },
]

function ReportFormEnhanced(props: { onSubmitted?: () => void }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryMode, setCategoryMode] = useState<"auto" | "manual">("auto")
  const [category, setCategory] = useState<Category>("pothole")
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string>("")
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string>("")
  const [autoClassification, setAutoClassification] = useState<Category | null>(null)

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
      const finalCategory = categoryMode === "auto" ? autoClassification || category : category

      await createReport({
        title: title || "Issue report",
        description,
        lat: loc.lat,
        lng: loc.lng,
        category: finalCategory,
        mode: "auto",
        image: file,
      })

      await addReport({
        title: title || "Issue report",
        description,
        lat: loc.lat,
        lng: loc.lng,
        category: finalCategory,
        autoCategorized: categoryMode === "auto",
        image: file,
      })

      setMessage("Report submitted successfully! Thanks for helping improve the city.")
      setTitle("")
      setDescription("")
      setCategory("pothole")
      setCategoryMode("auto")
      setFile(null)
      setFilePreview("")
      setLoc(null)
      setAutoClassification(null)

      if (props.onSubmitted) {
        setTimeout(props.onSubmitted, 1000)
      }
    } catch (err) {
      setMessage("Something went wrong. Please try again.")
      console.error("[v0] Submit error:", err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="title" className="flex items-center gap-2">
            <span>Title</span>
            <span className="text-xs text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="title"
            placeholder="e.g., Large pothole near Main Street"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="category-mode" className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Classification</span>
          </Label>
          <div className="flex gap-2">
            <Select value={categoryMode} onValueChange={(v: "auto" | "manual") => setCategoryMode(v)}>
              <SelectTrigger id="category-mode" className="w-32">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (AI)</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(v: Category) => setCategory(v)} disabled={categoryMode === "auto"}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ITEMS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.icon} {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Add details like severity, nearby landmarks, or when observed. This helps improve AI classification."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {categoryMode === "auto" && (file || title || description) && (
        <div>
          <ClassificationPreview image={file || undefined} title={title} description={description} />
          {autoClassification && (
            <p className="text-xs text-muted-foreground mt-2">
              Detected category will be used: <span className="font-semibold">{autoClassification}</span>
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="image" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span>Image</span>
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const newFile = e.target.files?.[0] ?? null
                setFile(newFile)
                if (newFile && categoryMode === "auto") {
                  setAutoClassification(null)
                }
              }}
            />
          </div>
          {filePreview && (
            <div className="relative mt-2 rounded-md overflow-hidden border">
              <img
                src={filePreview || "/placeholder.svg"}
                alt="Selected issue image preview"
                className="h-32 w-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>Pick Location</span>
          </Label>
          <Card>
            <CardContent className="p-0">
              <div className="h-56 w-full">
                <MapPicker
                  value={loc ?? undefined}
                  onChange={setLoc}
                  defaultCenter={{ lat: 20.36377, lng: 85.81789 }}
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
              Use my location
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Your reports help prioritize city maintenance.</div>
        <Button type="submit" disabled={!canSubmit || submitting} className="min-w-32 gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? "Submitting..." : "Submit Report"}
        </Button>
      </div>

      {message && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            message.includes("successfully")
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}
    </form>
  )
}

function locateMe(setLoc: (v: { lat: number; lng: number }) => void) {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    },
    () => {
      // ignore errors silently
    },
    { enableHighAccuracy: true, timeout: 8000 },
  )
}

export { ReportFormEnhanced }

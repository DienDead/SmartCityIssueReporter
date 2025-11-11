"use client"

import { useEffect, useState } from "react"
import { Badge } from "../components/ui/badge"
import { Card, CardContent } from "../components/ui/card"
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react"
import type { Category } from "../services/types"

interface ClassificationPreviewProps {
  image?: File
  title?: string
  description?: string
}

interface ClassificationResult {
  category: Category
  confidence: number
  reason: string
}

const CATEGORY_COLORS: Record<Category, { bg: string; text: string; icon: string }> = {
  pothole: { bg: "bg-orange-50", text: "text-orange-700", icon: "🕳️" },
  garbage: { bg: "bg-green-50", text: "text-green-700", icon: "🗑️" },
  other: { bg: "bg-slate-50", text: "text-slate-700", icon: "❓" },
}

export default function ClassificationPreview({ image, title, description }: ClassificationPreviewProps) {
  const [result, setResult] = useState<ClassificationResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!image && !title && !description) {
      setResult(null)
      return
    }

    const classify = async () => {
      setLoading(true)
      try {
        const formData = new FormData()
        if (image) formData.append("image", image)
        if (title) formData.append("title", title)
        if (description) formData.append("description", description)

        const response = await fetch("/api/classify", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          setResult(data)
        }
      } catch (error) {
        console.error("[v0] Classification error:", error)
      } finally {
        setLoading(false)
      }
    }

    // Debounce classification requests
    const timer = setTimeout(classify, 500)
    return () => clearTimeout(timer)
  }, [image, title, description])

  if (!loading && !result) return null

  const colors = result ? CATEGORY_COLORS[result.category] : CATEGORY_COLORS.other

  return (
    <Card className={`border-none ${colors.bg}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="shrink-0 pt-1">
            {loading ? (
              <Loader2 className={`h-4 w-4 animate-spin ${colors.text}`} />
            ) : result ? (
              <CheckCircle2 className={`h-4 w-4 ${colors.text}`} />
            ) : (
              <AlertCircle className={`h-4 w-4 ${colors.text}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600">Analyzing image...</p>
                <p className="text-xs text-slate-500">Processing with ML classifier</p>
              </div>
            ) : result ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-semibold ${colors.text}`}>
                    {result.category.replace("-", " ").toUpperCase()}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {(result.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">{result.reason}</p>
                <div className="flex items-center gap-1 text-xs text-slate-500 pt-1">
                  <Sparkles className="h-3 w-3" />
                  AI-powered classification
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

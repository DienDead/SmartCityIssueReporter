import fetch from "node-fetch"
import { config } from "../config.mjs"

// Basic text-based fallback classifier
function keywordClassifier(text) {
  const t = (text || "").toLowerCase()
  const has = (...words) => words.some((w) => t.includes(w))
  if (has("pothole", "potholes", "crack", "asphalt", "damaged road")) return { category: "pothole", reason: "keywords" }
  if (has("garbage", "trash", "waste", "litter", "overflow")) return { category: "garbage", reason: "keywords" }
  return null
}

// Fallback brightness heuristic skipped server-side (costly), rely on ML or keywords.

export async function classifyIssue({ title, description, fileBuffer, filename }) {
  // If ML API is configured, try it first
  if (config.ml.url) {
    try {
      const form = new FormData()
      if (fileBuffer) {
        // file upload
        const blob = new Blob([fileBuffer], { type: "application/octet-stream" })
        form.append("image", blob, filename || "image.jpg")
      }
      form.append("title", title || "")
      form.append("description", description || "")
      const ctrl = new AbortController()
      const to = setTimeout(() => ctrl.abort(), config.ml.timeoutMs)
      const resp = await fetch(config.ml.url, {
        method: "POST",
        body: form,
        signal: ctrl.signal,
      })
      clearTimeout(to)
      if (resp.ok) {
        const data = await resp.json()
        // Expect: { category: "pothole"|"garbage"|..., confidence: number }
        if (data && data.category) {
          return {
            category: data.category,
            confidence: Number(data.confidence || 0.7),
            autoCategorized: true,
            provider: "ml-api",
          }
        }
      } else {
        console.warn("ML API non-200:", await resp.text())
      }
    } catch (e) {
      console.warn("ML API error:", e.message)
    }
  }

  // Fallback to keyword-based
  const kw = keywordClassifier(`${title || ""} ${description || ""}`)
  if (kw) {
    return { category: kw.category, confidence: 0.9, autoCategorized: true, provider: "keywords" }
  }

  // Last resort
  return { category: "other", confidence: 0.4, autoCategorized: true, provider: "default" }
}

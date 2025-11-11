/**
 * ML Classifier Utilities
 *
 * This module provides utilities for civil issue classification.
 * In production, integrate with TensorFlow.js or a Python backend.
 */

export type IssueCategory = "pothole" | "garbage" | "other"

export interface ClassificationResult {
  category: IssueCategory
  confidence: number
  reason: string
}

/**
 * Keyword-based classifier for when ML model is unavailable
 * Provides fast fallback classification
 */
export function keywordClassify(text: string): ClassificationResult | null {
  const normalized = text.toLowerCase().trim()

  const keywordMap: Record<IssueCategory, string[]> = {
    pothole: [
      "pothole",
      "potholes",
      "pothole",
      "crack",
      "cracked",
      "asphalt",
      "damaged road",
      "road damage",
      "broken road",
      "surface damage",
      "pavement",
      "bump",
      "hole in road",
    ],
    garbage: [
      "garbage",
      "trash",
      "waste",
      "litter",
      "bin",
      "overflow",
      "overflowing",
      "dump",
      "refuse",
      "rubbish",
      "debris",
    ],
    other: [],
  }

  for (const [category, keywords] of Object.entries(keywordMap)) {
    if (keywords.length === 0) continue

    const matches = keywords.filter((kw) => normalized.includes(kw.toLowerCase()))
    if (matches.length > 0) {
      return {
        category: category as IssueCategory,
        confidence: Math.min(0.95, 0.7 + matches.length * 0.1),
        reason: `Matched keywords: "${matches.join(", ")}"`,
      }
    }
  }

  return null
}

/**
 * Loads image from URL
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}


import { classifyWithKerasModel, initializeKerasModel } from "./keras-model-loader"

/**
 * Main classification function combining multiple classifiers
 * Added support for Keras model
 */
export async function classifyIssue(options: {
  image?: File
  title?: string
  description?: string
}): Promise<ClassificationResult> {
  const text = `${options.title || ""} ${options.description || ""}`

  // 1. Try Keras model first (if enabled and loaded)
  if (options.image) {
    try {
      const kerasReady = await initializeKerasModel()
      if (kerasReady) {
        const kerasResult = await classifyWithKerasModel(options.image)
        if (kerasResult && kerasResult.confidence > 0.6) {
          return kerasResult
        }
      }
    } catch (error) {
      console.error("[v0] Keras classification error:", error)
      // Continue to fallback methods
    }
  }

  // 2. Try keyword classification (fastest)
  const keywordResult = keywordClassify(text)
  if (keywordResult && keywordResult.confidence > 0.8) {
    return keywordResult
  }

  // 4. Return weak keyword match if available
  if (keywordResult) {
    return keywordResult
  }

  // 5. Fallback
  return {
    category: "other",
    confidence: 0.4,
    reason: "Unable to determine issue type - please categorize manually",
  }
}

/**
 * Calculates severity score for an issue
 * Higher score = higher priority
 */
export function calculateSeverity(category: IssueCategory, confidence: number): number {
  const categoryWeight: Record<IssueCategory, number> = {
    pothole: 0.9,
    garbage: 0.6,
    other: 0.4,
  }

  return categoryWeight[category] * confidence
}

/**
 * Gets UI-friendly label for category
 */
export function getCategoryLabel(category: IssueCategory): string {
  const labels: Record<IssueCategory, string> = {
    pothole: "Pothole",
    garbage: "Garbage/Waste",
    other: "Other",
  }
  return labels[category]
}

import { NextRequest, NextResponse } from "next/server"
import { ClassificationResult } from "../../../utils/ml-classifier"

type Category = "pothole" | "garbage" | "other"
type Status = "open" | "in_progress" | "resolved"

interface Report {
  id: string
  title: string
  description: string
  category: Category
  status: Status
  autoCategorized?: boolean
  imageUrl?: string
  lat?: number
  lng?: number
  createdAt: string
}

// --- Temporary in-memory store (replace later with DB)
const reports: Report[] = []

// --- Classification helpers ---
const ISSUE_CATEGORIES = ["pothole", "garbage", "other"] as const

function classifyFromText(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase()
  const patterns = {
    pothole: ["pothole", "crack", "damaged road"],
    garbage: ["garbage", "trash", "waste", "litter"],
  }

  for (const [category, keywords] of Object.entries(patterns)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return {
        category: category as Category,
        confidence: 0.9,
        reason: `Matched keywords: "${keywords.find((kw) => text.includes(kw))}"`,
      }
    }
  }

  return {
    category: "other" as Category,
    confidence: 0.5,
    reason: "No matching keywords found",
  }
}

const ML_SERVICE_URL = 'http://127.0.0.1:5000/classify'

async function classifyWithMLService(file: File): Promise<ClassificationResult> {
  const formData = new FormData()
  formData.append('image', file)
  
  const response = await fetch(ML_SERVICE_URL, {
    method: 'POST',
    body: formData,
  })
  
  if (response.ok) {
    return response.json()
  }
  throw new Error('ML service failed')
}

// -------------------- CRUD --------------------

// Create (POST) → classify + add new report
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const title = (formData.get("title") as string) || ""
    const description = (formData.get("description") as string) || ""
    const image = formData.get("image") as File | null
    const imageUrl = formData.get("imageUrl") as string | null
    const lat = Number(formData.get("lat") || 0)
    const lng = Number(formData.get("lng") || 0)

    const classification = classifyWithMLService(image)

    const newReport: Report = {
      id: crypto.randomUUID(),
      title,
      description,
      category: (await classification).category,
      status: "open",
      autoCategorized: true,
      imageUrl: imageUrl || undefined,
      lat,
      lng,
      createdAt: new Date().toISOString(),
    }
    
    reports.push(newReport)
    return NextResponse.json(newReport)
  } catch (err) {
    console.error("Error creating report:", err)
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 })
  }
}

// Read all reports (GET)
export async function GET() {
  return NextResponse.json(reports)
}

// Update (PUT) → modify existing report
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    const report = reports.find((r) => r.id === id)

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    Object.assign(report, updates)
    return NextResponse.json(report)
  } catch (err) {
    console.error("Error updating report:", err)
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 })
  }
}

// Delete (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    const index = reports.findIndex((r) => r.id === id)
    if (index === -1) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }
    reports.splice(index, 1)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error deleting report:", err)
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 })
  }
}
"use client"

export type Category = "pothole" | "garbage" | "other"
export type Status = "open" | "in_progress" | "resolved"

export type Report = {
  id: string
  title: string
  description: string
  category: Category
  status: Status
  autoCategorized?: boolean
  imageUrl?: string
  lat: number
  lng: number
  createdAt: string
}

export type ReportFilters = {
  category?: Category | "all"
  status?: Status | "all"
  sinceDays?: number
  search?: string
  limit?: number
}

const API_BASE = "http://localhost:8080"

function qs(params: Record<string, any>) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue
    sp.append(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ""
}

export async function fetchReports(filters: ReportFilters = {}): Promise<Report[]> {
  const res = await fetch(`${API_BASE}/api/reports${qs(filters)}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch reports")
  return res.json()
}

export async function createReport(input: {
  title: string
  description: string
  lat: number
  lng: number
  image: File
  mode: "auto" | "manual"
  category?: Category
}): Promise<Report> {
  const fd = new FormData()
  fd.append("title", input.title || "Issue report")
  fd.append("description", input.description || "")
  fd.append("lat", String(input.lat))
  fd.append("lng", String(input.lng))
  fd.append("mode", input.mode)
  if (input.mode === "manual" && input.category) fd.append("category", input.category)
  fd.append("image", input.image)

  const res = await fetch(`${API_BASE}/api/reports`, {
    method: "POST",
    body: fd,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function updateReportStatus(id: string, status: Status): Promise<Report> {
  const token = getToken()
  if (!token) throw new Error("Not authenticated")
  const res = await fetch(`${API_BASE}/api/reports/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function deleteReport(id: string): Promise<void> {
  const token = getToken()
  if (!token) throw new Error("Not authenticated")
  const res = await fetch(`${API_BASE}/api/reports/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error(await res.text())
}

export type HeatmapPoint = {
  id: string
  category: Category
  status: Status
  lat: number
  lng: number
  createdAt: string
}

export async function fetchHeatmap(bbox?: [number, number, number, number]): Promise<HeatmapPoint[]> {
  const params: Record<string, any> = {}
  if (bbox) params.bbox = bbox.join(",")
  const res = await fetch(`${API_BASE}/api/reports/heatmap${qs(params)}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch heatmap")
  return res.json()
}

export async function adminLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  const token = data.token as string
  setToken(token)
  return token
}

const TOKEN_KEY = "sci_admin_token"

export function getToken(): string | null {
  if (typeof localStorage === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token: string) {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  if (typeof localStorage === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
}

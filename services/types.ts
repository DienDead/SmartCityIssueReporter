export type Category = "pothole" | "garbage" | "other"
export type Status = "open" | "in_progress" | "resolved"

export type Report = {
  id: string
  title: string
  description: string
  category: Category
  autoCategorized?: boolean
  status: Status
  lat: number
  lng: number
  image: File | string
  createdAt: string
}

export type ReportInput = {
  title: string
  description: string
  category: Category
  autoCategorized?: boolean
  lat: number
  lng: number
  image: File | string
}

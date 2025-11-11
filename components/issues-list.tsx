"use client"

import { type Report, updateReportStatus } from "../services/reports-api"
import { getToken } from "../services/reports-api"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Trash2 } from "lucide-react"
import { useState } from "react"

async function deleteReport(id: string) {
  const token = getToken()
  if (!token) throw new Error("Not authenticated")
  const res = await fetch(`${"http://localhost:8080"}/api/reports/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error(await res.text())
}

function IssuesList({
  reports,
  onChanged,
}: {
  reports: Report[]
  onChanged?: () => void
}) {
  const [deletingId, setDeletingId] = useState<string>("")
  const isAuthed = Boolean(getToken())

  return (
    <ul className="divide-y rounded-md border">
      {reports.length === 0 && (
        <li className="p-6 text-sm text-muted-foreground">
          {"No reports yet. Submit your first report to see it here."}
        </li>
      )}
      {reports.map((r) => (
        <li key={r.id} className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-[100px_1fr_auto] sm:items-center">
          <div>
            {r.imageUrl ? (
              <img
                src={r.imageUrl || "/placeholder.svg"}
                alt={"Issue preview"}
                className="h-20 w-full rounded object-cover sm:h-16 sm:w-24"
              />
            ) : (
              <div className="h-16 w-24 rounded bg-muted" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-medium">{r.title || "Untitled issue"}</div>
              <Badge variant="outline">{r.category}</Badge>
              {r.autoCategorized && (
                <Badge variant="outline" className="border-dashed">
                  {"auto"}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground line-clamp-2">{r.description || "No description"}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(r.createdAt).toLocaleString()} {" · "}
              {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            {isAuthed ? (
              <>
                <Select
                  value={r.status}
                  onValueChange={async (v) => {
                    await updateReportStatus(r.id, v as Report["status"])
                    onChanged?.()
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">{"Open"}</SelectItem>
                    <SelectItem value="in_progress">{"In Progress"}</SelectItem>
                    <SelectItem value="resolved">{"Resolved"}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete report"
                  onClick={async () => {
                    setDeletingId(r.id)
                    await deleteReport(r.id)
                    setDeletingId("")
                    onChanged?.()
                  }}
                  disabled={deletingId === r.id}
                >
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">{"Admin login to manage status"}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

export { IssuesList }
export default IssuesList

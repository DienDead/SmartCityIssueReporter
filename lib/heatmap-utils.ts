/**
 * Heatmap visualization utilities
 */

import type { Report } from "../services/types"

export interface HeatmapPoint {
  lat: number
  lng: number
  weight: number
}

/**
 * Calculate heatmap points with severity weighting
 * Open issues get higher weight than resolved ones
 */
export function calculateHeatmapPoints(reports: Report[]): HeatmapPoint[] {
  return reports.map((report) => ({
    lat: report.lat,
    lng: report.lng,
    weight: calculatePointWeight(report.status),
  }))
}

/**
 * Determine weight for heatmap based on status
 */
function calculatePointWeight(status: Report["status"]): number {
  switch (status) {
    case "open":
      return 0.95 // Most urgent
    case "in_progress":
      return 0.65 // In progress
    case "resolved":
      return 0.2 // Low priority for heatmap
    default:
      return 0.5
  }
}

/**
 * Get color for issue category
 */
export function getCategoryColor(category: Report["category"]): string {
  const colors: Record<Report["category"], string> = {
    pothole: "#f97316", // orange
    garbage: "#22c55e", // green
    other: "#64748b", // slate
  }
  return colors[category]
}

/**
 * Get marker radius based on severity
 */
export function getMarkerRadius(status: Report["status"]): number {
  switch (status) {
    case "open":
      return 8
    case "in_progress":
      return 6
    case "resolved":
      return 4
    default:
      return 5
  }
}

/**
 * Aggregate issues by category for statistics
 */
export function aggregateByCategory(reports: Report[]): Record<Report["category"], number> {
  const counts = {
    pothole: 0,
    garbage: 0,
    other: 0,
  }

  for (const report of reports) {
    counts[report.category]++
  }

  return counts
}

/**
 * Aggregate issues by status
 */
export function aggregateByStatus(reports: Report[]): Record<Report["status"], number> {
  const counts = {
    open: 0,
    in_progress: 0,
    resolved: 0,
  }

  for (const report of reports) {
    counts[report.status]++
  }

  return counts
}

"use client";

import { nanoid } from "../lib/id";
import type { Report } from "./types";
export type { Report } from "./types";
export type { Category, Status, ReportInput } from "./types";

// Storage
const STORAGE_KEY = "smart_city_reports_v1";

function read(): Report[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedReports();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as Report[];
  } catch {
    return [];
  }
}

function write(reports: Report[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

// Public API
export async function getReports(): Promise<Report[]> {
  return read();
}

export async function addReport(
  input: import("./types").ReportInput
): Promise<Report> {
  const reports = read();
  const report: Report = {
    id: nanoid(),
    title: input.title,
    description: input.description,
    category: input.category,
    autoCategorized: input.autoCategorized ?? false,
    status: "open",
    lat: input.lat,
    lng: input.lng,
    image: input.image,
    createdAt: new Date().toISOString(),
  };
  reports.push(report);
  write(reports);

  // const res = await fetch("/api/reports", {
  //   method: "POST",
  //   body: JSON.stringify(report),
  // });

  return report;
}

export async function updateReportStatus(
  id: string,
  status: import("./types").Status
): Promise<void> {
  const reports = read();
  const idx = reports.findIndex((r) => r.id === id);
  if (idx >= 0) {
    reports[idx].status = status;
    write(reports);
  }
}

export async function removeReport(id: string): Promise<void> {
  const reports = read().filter((r) => r.id !== id);
  write(reports);
}

// Classification
export async function classifyReport(params: {
  file: File;
  title?: string;
  description?: string;
}): Promise<{
  category: import("./types").Category;
  confidence: number;
  reason: string;
}> {
  const text = `${params.title ?? ""} ${
    params.description ?? ""
  }`.toLowerCase();
  const keywordMatch = keywordClassifier(text);
  if (keywordMatch) {
    await delay(300);
    return {
      category: keywordMatch.category,
      confidence: 0.92,
      reason: keywordMatch.reason,
    };
  }

  // Weak default
  await delay(400);
  return {
    category: "other",
    confidence: 0.4,
    reason: "No strong signal found from text or image",
  };
}

function keywordClassifier(
  text: string
): { category: import("./types").Category; reason: string } | null {
  const hit = (words: string[]) => words.some((w) => text.includes(w));
  if (
    hit([
      "pothole",
      "potholes",
      "road hole",
      "asphalt",
      "crack",
      "cracked road",
      "damaged road",
    ])
  ) {
    return { category: "pothole", reason: "Matched pothole-related keywords" };
  }
  if (
    hit([
      "garbage",
      "trash",
      "waste",
      "dump",
      "litter",
      "bin overflow",
      "overflowing",
    ])
  ) {
    return { category: "garbage", reason: "Matched garbage-related keywords" };
  }
  return null;
}

// async function averageBrightness(file: File): Promise<number> {
//   const url = URL.createObjectURL(file)
//   try {
//     const img = await loadImage(url)
//     const { width, height } = img
//     const canvas = document.createElement("canvas")
//     canvas.width = 64
//     canvas.height = 64
//     const ctx = canvas.getContext("2d")
//     if (!ctx) throw new Error("Canvas not supported")
//     // Draw scaled thumbnail to speed up
//     ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
//     const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
//     let sum = 0
//     for (let i = 0; i < data.length; i += 4) {
//       const r = data[i]
//       const g = data[i + 1]
//       const b = data[i + 2]
//       // perceived luminance
//       const y = 0.2126 * r + 0.7152 * g + 0.0722 * b
//       sum += y
//     }
//     const avg = sum / (data.length / 4)
//     return avg
//   } finally {
//     URL.revokeObjectURL(url)
//   }
// }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// Seed data to visualize heatmap on first load
function seedReports(): Report[] {
  const base: Omit<Report, "id" | "createdAt">[] = [
    {
      title: "Pothole near Connaught Place",
      description: "Large pothole causing traffic slowdown.",
      category: "pothole",
      autoCategorized: true,
      status: "open",
      lat: 28.6315,
      lng: 77.2167,
      image: "",
    },
    {
      title: "Overflowing garbage bin",
      description: "Needs immediate cleanup.",
      category: "garbage",
      autoCategorized: true,
      status: "in_progress",
      lat: 28.6448,
      lng: 77.2167,
      image: "",
    },
  ];
  const now = Date.now();
  const reports: Report[] = base.map((b, i) => ({
    ...b,
    id: nanoid(),
    createdAt: new Date(now - i * 1000 * 60 * 60 * 12).toISOString(),
  }));
  // Add a few random points around center
  const center = { lat: 28.6139, lng: 77.209 };
  for (let i = 0; i < 20; i++) {
    const jitter = (max: number) => (Math.random() - 0.5) * max;
    const cats: Report["category"][] = ["pothole", "garbage", "other"];
    const cat = cats[Math.floor(Math.random() * cats.length)];
    reports.push({
      id: nanoid(),
      title: "Sample report",
      description: "Seeded demo data",
      category: cat,
      autoCategorized: true,
      status:
        Math.random() < 0.2
          ? "resolved"
          : Math.random() < 0.6
          ? "open"
          : "in_progress",
      lat: center.lat + jitter(0.12),
      lng: center.lng + jitter(0.12),
      image: "",
      createdAt: new Date(
        now - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 20)
      ).toISOString(),
    });
  }
  return reports;
}

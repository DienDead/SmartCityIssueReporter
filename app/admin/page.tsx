"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { fetchReports, type Report } from "../../services/reports-api";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { CalendarIcon, RefreshCw, TrendingUp } from "lucide-react";
import { Input } from "../../components/ui/input";
import { format } from "../../lib/date";
import Link from "next/link";
import { getToken, clearToken } from "../../services/reports-api";

const HeatmapMapEnhanced = dynamic(
  () => import("../../components/heatmap-map-enhanced"),
  { ssr: false }
);

const CATEGORY_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Pothole", value: "pothole" },
  { label: "Garbage", value: "garbage" },
  { label: "Streetlight", value: "streetlight" },
  { label: "Water-logging", value: "water-logging" },
  { label: "Other", value: "other" },
] as const;

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
] as const;

export default function AdminPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [category, setCategory] =
    useState<(typeof CATEGORY_OPTIONS)[number]["value"]>("all");
  const [status, setStatus] =
    useState<(typeof STATUS_OPTIONS)[number]["value"]>("all");
  const [days, setDays] = useState<number>(30);
  const [search, setSearch] = useState("");

  const [hasToken, setHasToken] = useState<boolean | null>(null);

  const refresh = async () => {
    const all = await fetchReports({ sinceDays: 60, limit: 1000 });
    setReports(all);
  };

  useEffect(() => {
    refresh();
    setHasToken(!!getToken());
  }, []);

  const filtered = useMemo(() => {
    const since = new Date();
    since.setDate(since.getDate() - Number(days || 30));
    return reports.filter((r) => {
      const okCat = category === "all" || r.category === category;
      const okStatus = status === "all" || r.status === status;
      const okDate = new Date(r.createdAt) >= since;
      const okSearch =
        !search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase());
      return okCat && okStatus && okDate && okSearch;
    });
  }, [reports, category, status, days, search]);

  const totals = useMemo(() => {
    const t = { all: filtered.length, open: 0, in_progress: 0, resolved: 0 };
    for (const r of filtered) t[r.status]++;
    return t;
  }, [filtered]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {"Admin Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {"Heatmap and filters to identify high-density problem zones."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={refresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {"Refresh"}
          </Button>
          {hasToken === null ? null : hasToken ? (
            <Button asChild>
              <Link href="/admin/login">{"Admin Login"}</Link>
            </Button>
          ) : (
            <Button
            asChild
              variant="outline"
              onClick={() => {
                clearToken();
                location.reload();
              }}
            >
              {"Logout"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{"Total Reports"}</CardDescription>
            <CardTitle className="text-3xl">{totals.all}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span className="text-muted-foreground">
              {"Last "}
              <strong>{days}</strong>
              {" days"}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{"Open"}</CardDescription>
            <CardTitle className="text-3xl">{totals.open}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="rounded">
              {"Backlog"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{"Resolved"}</CardDescription>
            <CardTitle className="text-3xl">{totals.resolved}</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="rounded">
              {"Closure rate"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Severity Heatmap</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">
              Green: Low · Amber: Medium · Red: High
            </span>
          </CardTitle>
          <CardDescription>
            {
              "Heatmap shows severity by color and issue status. Larger markers = urgent issues. Click to see details."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-5">
            <div className="grid gap-2">
              <Label htmlFor="category">{"Category"}</Label>
              <Select
                value={category}
                onValueChange={(value) =>
                  setCategory(value as "all" | "pothole" | "garbage" | "other")
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">{"Status"}</Label>
              <Select
                value={status}
                onValueChange={(status) =>
                  setStatus(
                    status as "all" | "open" | "in_progress" | "resolved"
                  )
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="days">{"Time window"}</Label>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="days"
                  type="number"
                  min={1}
                  max={365}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value || 30))}
                />
                <span className="text-sm text-muted-foreground">{"days"}</span>
              </div>
            </div>
            <div className="md:col-span-2 grid gap-2">
              <Label htmlFor="search">{"Search"}</Label>
              <Input
                id="search"
                placeholder="Title or description"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="h-[520px] overflow-hidden rounded-lg border">
            <HeatmapMapEnhanced
              reports={filtered}
              defaultCenter={{ lat: 28.6139, lng: 77.209 }}
              defaultZoom={11}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#f97316" }}
              />
              <span>Pothole Issues</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#22c55e" }}
              />
              <span>Garbage Issues</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#dc2626" }}
              />
              <span>High Severity Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#4ade80" }}
              />
              <span>Low Severity Zone</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {"Map data © OpenStreetMap contributors"}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{"Recent Reports"}</CardTitle>
          <CardDescription>
            {"Filtered list of reports in view"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {filtered.slice(0, 12).map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  {r.imageUrl ? (
                    <img
                      src={r.imageUrl || "/placeholder.svg"}
                      alt={"Issue preview"}
                      className="h-14 w-20 rounded object-cover"
                    />
                  ) : (
                    <div className="h-14 w-20 rounded bg-muted" />
                  )}
                  <div>
                    <div className="font-medium">
                      {r.title || "Untitled report"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(r.createdAt))}
                      {" · "}
                      <Badge variant="outline" className="mr-1">
                        {r.category}
                      </Badge>
                      <Badge variant="secondary" className="mr-1">
                        {r.status.replace("_", " ")}
                      </Badge>
                      {r.autoCategorized && (
                        <Badge variant="outline" className="border-dashed">
                          {"auto"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
                </div>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="py-6 text-sm text-muted-foreground">
                {"No reports match the filters."}
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}

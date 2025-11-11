"use client"

import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Separator } from "../components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { ArrowRight, MapPinned, ShieldCheck, Zap } from "lucide-react"
import Link from "next/link"
import { ReportFormEnhanced } from "../components/report-form-enhanced"
import IssuesList from "../components/issues-list"
import { useEffect, useState } from "react"
import { fetchReports, type Report } from "../services/reports-api"

export default function HomePage() {
  const [reports, setReports] = useState<Report[]>([])

  const refresh = async () => {
    const all = await fetchReports({ sinceDays: 30, limit: 200 })
    setReports(all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)))
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <main className="min-h-screen">
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-200">
                <Zap className="mr-1.5 h-4 w-4" />
                {"Report civic issues in under a minute"}
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{"Smart City Issue Reporter"}</h1>
              <p className="text-muted-foreground">
                {
                  "A centralized, intelligent platform to report potholes, garbage, broken streetlights, and more. Auto-classification and heatmaps help authorities prioritize faster."
                }
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/admin">
                  <Button variant="secondary" className="gap-2">
                    <MapPinned className="h-4 w-4" />
                    {"View Heatmap (Admin)"}
                  </Button>
                </Link>
                <a
                  href="#report"
                  className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline"
                >
                  {"Report an issue"}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Feature title="Centralized" description="One unified place to submit and track issues." />
                <Feature title="AI-assisted" description="Auto-categorizes issues from image and text." />
                <Feature title="Actionable" description="Heatmap highlights problem hot-spots." />
              </div>
            </div>
            <div className="relative">
              <img
                src="/city-infrastructure-issues-map.png"
                alt="Illustration of a city map with highlighted infrastructure issues"
                className="h-full w-full rounded-xl border bg-muted object-cover shadow-sm"
              />
            </div>
          </div>
        </div>
        <Separator />
      </section>

      <section id="report" className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="border-emerald-100 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Report an Issue</span>
                <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-1 rounded">AI-Powered</span>
              </CardTitle>
              <CardDescription>
                Upload a photo, add details, and pick a location. Our AI automatically categorizes the issue type.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReportFormEnhanced
                onSubmitted={async () => {
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{"Recent Reports"}</CardTitle>
              <CardDescription>{"Fetched from the server API."}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList>
                  <TabsTrigger value="all">{"All"}</TabsTrigger>
                  <TabsTrigger value="open">{"Open"}</TabsTrigger>
                  <TabsTrigger value="resolved">{"Resolved"}</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  <IssuesList reports={reports.slice(0, 50)} onChanged={refresh} />
                </TabsContent>
                <TabsContent value="open" className="mt-4">
                  <IssuesList
                    reports={reports.filter((r) => r.status !== "resolved").slice(0, 50)}
                    onChanged={refresh}
                  />
                </TabsContent>
                <TabsContent value="resolved" className="mt-4">
                  <IssuesList
                    reports={reports.filter((r) => r.status === "resolved").slice(0, 50)}
                    onChanged={refresh}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

function Feature(props: { title: string; description: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-base font-semibold">{props.title}</div>
      <div className="text-sm text-muted-foreground">{props.description}</div>
    </div>
  )
}

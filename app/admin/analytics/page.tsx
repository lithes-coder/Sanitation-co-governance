"use client"

import { useStore } from "@/lib/store"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  getComplaintsByType,
  getMonthlyTrend,
  getRecurrenceByWard,
  getSilentZones,
  getMonthlyUnresolved,
  getVerificationStats,
} from "@/lib/analytics"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  EyeOff,
  ShieldCheck,
  CalendarX,
} from "lucide-react"

export default function AdminAnalytics() {
  const { complaints } = useStore()

  const byType = getComplaintsByType(complaints)
  const monthlyTrend = getMonthlyTrend(complaints)
  const recurrence = getRecurrenceByWard(complaints)
  const silentZones = getSilentZones(complaints)
  const monthlyUnresolved = getMonthlyUnresolved(complaints)
  const verificationStats = getVerificationStats(complaints)

  return (
    <DashboardShell requiredRole="admin">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground">
            Detailed analytics and trend analysis for sanitation governance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Complaints by Type - Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Complaints by Type
              </CardTitle>
              <CardDescription>Distribution of complaints across categories</CardDescription>
            </CardHeader>
            <CardContent>
              {byType.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No data available yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={byType} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="type"
                      width={120}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--foreground)",
                      }}
                    />
                    <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Monthly Trend - Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Monthly Complaint Trend
              </CardTitle>
              <CardDescription>Complaint volume over time</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyTrend.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No data available yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--foreground)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      dot={{ fill: "var(--chart-2)", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Verification Statistics & Monthly Unresolved */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Community Verification Statistics
              </CardTitle>
              <CardDescription>
                Quality verification by citizens on resolved complaints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 p-4 rounded-lg bg-secondary/50">
                  <span className="text-2xl font-bold text-foreground">{verificationStats.totalVerified}</span>
                  <span className="text-xs text-muted-foreground">Total Verified</span>
                </div>
                <div className="flex flex-col gap-1 p-4 rounded-lg bg-secondary/50">
                  <span className="text-2xl font-bold text-foreground">{verificationStats.avgScore}/5</span>
                  <span className="text-xs text-muted-foreground">Avg Score</span>
                </div>
                <div className="flex flex-col gap-1 p-4 rounded-lg bg-destructive/10">
                  <span className="text-2xl font-bold text-destructive">{verificationStats.lowQuality}</span>
                  <span className="text-xs text-muted-foreground">Low Quality Flagged</span>
                </div>
                <div className="flex flex-col gap-1 p-4 rounded-lg bg-warning/10">
                  <span className="text-2xl font-bold text-warning-foreground">{verificationStats.reopened}</span>
                  <span className="text-xs text-muted-foreground">Reopened Complaints</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarX className="w-5 h-5 text-destructive" />
                Monthly Unresolved Analysis
              </CardTitle>
              <CardDescription>
                Complaints unresolved for over 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyUnresolved.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No overdue complaints. All within SLA.
                </p>
              ) : (
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Ward</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Type</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Reported</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyUnresolved.map((c) => (
                        <tr key={c.complaint_id} className="border-b border-border last:border-0">
                          <td className="py-2 px-2 whitespace-nowrap">{c.ward}</td>
                          <td className="py-2 px-2 whitespace-nowrap">{c.complaint_type}</td>
                          <td className="py-2 px-2 text-muted-foreground">{c.date_reported.split(" ")[0]}</td>
                          <td className="py-2 px-2">
                            <Badge className={
                              c.status === "Escalated"
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-warning text-warning-foreground"
                            }>
                              {c.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recurrence Detection Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Recurrence Detection by Ward
            </CardTitle>
            <CardDescription>
              Wards with repeating complaint types indicate systemic issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Ward</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">
                      Recurring Types
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">
                      Top Recurring Issue
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Count</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recurrence.map((r) => (
                    <tr key={r.ward} className="border-b border-border last:border-0">
                      <td className="py-3 px-3 font-medium">{r.ward}</td>
                      <td className="py-3 px-3">{r.total}</td>
                      <td className="py-3 px-3">{r.recurringTypes}</td>
                      <td className="py-3 px-3">{r.topRecurring}</td>
                      <td className="py-3 px-3">{r.topCount}</td>
                      <td className="py-3 px-3">
                        {r.recurringTypes > 0 ? (
                          <Badge className="bg-destructive text-destructive-foreground">
                            Recurring
                          </Badge>
                        ) : (
                          <Badge className="bg-success text-success-foreground">Clean</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Silent Zone Detection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-destructive" />
              Silent Zone Detection
            </CardTitle>
            <CardDescription>
              Wards with significant drops in complaints may indicate underreporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Ward</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">
                      Recent (30d)
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">
                      Previous (30d)
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">
                      Drop Ratio
                    </th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {silentZones.map((z) => (
                    <tr key={z.ward} className="border-b border-border last:border-0">
                      <td className="py-3 px-3 font-medium">{z.ward}</td>
                      <td className="py-3 px-3">{z.recentComplaints}</td>
                      <td className="py-3 px-3">{z.previousComplaints}</td>
                      <td className="py-3 px-3">{z.dropRatio}%</td>
                      <td className="py-3 px-3">
                        {z.isSilent ? (
                          <Badge className="bg-destructive text-destructive-foreground">
                            Silent Zone
                          </Badge>
                        ) : (
                          <Badge className="bg-success text-success-foreground">Active</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

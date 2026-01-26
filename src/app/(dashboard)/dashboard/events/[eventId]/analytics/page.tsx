"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Eye, ShoppingCart, Ticket, DollarSign, Users, TrendingUp, ExternalLink } from "lucide-react"

interface AnalyticsData {
  summary: {
    totalViews: number
    totalOrders: number
    totalTicketsSold: number
    totalCapacity: number
    totalRevenue: number
    checkedInCount: number
    conversionRate: number
    checkInRate: number
  }
  viewsByDay: Array<{ date: string; count: number }>
  ordersByDay: Array<{ date: string; count: number; revenue: number }>
  checkInsByDay: Array<{ date: string; count: number }>
  referrers: Array<{ referrer: string; count: number }>
  tierBreakdown: Array<{
    id: string
    name: string
    price: number
    sold: number
    available: number
    percentSold: number
  }>
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function MiniChart({ data, color = "bg-pink-500" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1)
  
  return (
    <div className="flex items-end gap-0.5 h-12">
      {data.map((value, i) => (
        <div
          key={i}
          className={`w-1.5 ${color} rounded-t opacity-80`}
          style={{ height: `${(value / max) * 100}%`, minHeight: value > 0 ? "2px" : "0" }}
        />
      ))}
    </div>
  )
}

export default function EventAnalyticsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30")

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      try {
        const res = await fetch(`/api/events/${eventId}/analytics?days=${timeRange}`)
        if (res.ok) {
          const analytics = await res.json()
          setData(analytics)
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [eventId, timeRange])

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>
  }

  if (!data) {
    return <div className="text-center py-8">Failed to load analytics</div>
  }

  const { summary, viewsByDay, ordersByDay, referrers, tierBreakdown } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/events/${eventId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Event Analytics</h1>
            <p className="text-muted-foreground">Track your event&apos;s performance</p>
          </div>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalViews.toLocaleString()}</div>
            <MiniChart data={viewsByDay.slice(-14).map((d) => d.count)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {summary.conversionRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalTicketsSold} / {summary.totalCapacity}
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className="bg-pink-500 h-2 rounded-full"
                style={{
                  width: `${summary.totalCapacity > 0 ? (summary.totalTicketsSold / summary.totalCapacity) * 100 : 0}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <MiniChart data={ordersByDay.slice(-14).map((d) => d.revenue)} color="bg-green-500" />
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.checkedInCount} / {summary.totalTicketsSold}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.checkInRate}% check-in rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Views → Purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalOrders > 0
                ? formatCurrency(summary.totalRevenue / summary.totalOrders)
                : "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Per order
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Breakdown & Referrers */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Tiers</CardTitle>
            <CardDescription>Sales breakdown by tier</CardDescription>
          </CardHeader>
          <CardContent>
            {tierBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No ticket tiers</p>
            ) : (
              <div className="space-y-4">
                {tierBreakdown.map((tier) => (
                  <div key={tier.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{tier.name}</span>
                      <span className="text-muted-foreground">
                        {tier.sold} / {tier.sold + tier.available} ({Math.round(tier.percentSold)}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-pink-500 h-2 rounded-full transition-all"
                        style={{ width: `${tier.percentSold}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Where your traffic comes from</CardDescription>
          </CardHeader>
          <CardContent>
            {referrers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No referrer data yet</p>
            ) : (
              <div className="space-y-3">
                {referrers.slice(0, 5).map((ref, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">
                        {ref.referrer === "Direct" ? "Direct / None" : new URL(ref.referrer).hostname}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{ref.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Activity</CardTitle>
          <CardDescription>Views and orders over time</CardDescription>
        </CardHeader>
        <CardContent>
          {viewsByDay.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No data for this period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-right py-2">Views</th>
                    <th className="text-right py-2">Orders</th>
                    <th className="text-right py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {viewsByDay.slice(-14).reverse().map((day, i) => {
                    const orderDay = ordersByDay.find((o) => o.date === day.date)
                    return (
                      <tr key={day.date} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                        <td className="py-2">
                          {new Date(day.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="text-right py-2">{day.count}</td>
                        <td className="text-right py-2">{orderDay?.count || 0}</td>
                        <td className="text-right py-2">
                          {orderDay ? formatCurrency(orderDay.revenue) : "$0.00"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

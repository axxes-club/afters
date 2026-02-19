"use client"

import { useEffect, useState, use } from "react"
import {
  Eye,
  ShoppingCart,
  Ticket,
  DollarSign,
  Users,
  TrendingUp,
  ExternalLink,
  BarChart3,
} from "lucide-react"

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

function MiniChart({ data, color = "bg-primary" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1)

  return (
    <div className="flex items-end gap-0.5 h-10 mt-3">
      {data.map((value, i) => (
        <div
          key={i}
          className={`flex-1 ${color} opacity-80`}
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
    const controller = new AbortController()
    async function fetchAnalytics() {
      setLoading(true)
      try {
        const res = await fetch(`/api/events/${eventId}/analytics?days=${timeRange}`, { signal: controller.signal })
        if (res.ok) {
          const analytics = await res.json()
          setData(analytics)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to fetch analytics:", error)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchAnalytics()
    return () => controller.abort()
  }, [eventId, timeRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-10 h-10 mx-auto text-white/10 mb-3" />
        <p className="text-white/40 font-mono text-sm">Failed to load analytics</p>
      </div>
    )
  }

  const { summary, viewsByDay, ordersByDay, referrers, tierBreakdown } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight">ANALYTICS</h1>
          <p className="text-white/40 text-xs font-mono mt-0.5">Performance metrics</p>
        </div>
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1">
          {[
            { value: "7", label: "7D" },
            { value: "30", label: "30D" },
            { value: "90", label: "90D" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-3 py-1.5 text-xs font-mono tracking-wider transition-all ${
                timeRange === option.value
                  ? "bg-primary text-black"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="PAGE VIEWS"
          value={summary.totalViews.toLocaleString()}
          icon={<Eye className="w-4 h-4" />}
          chart={<MiniChart data={viewsByDay.slice(-14).map((d) => d.count)} />}
        />
        <StatCard
          label="ORDERS"
          value={summary.totalOrders.toString()}
          icon={<ShoppingCart className="w-4 h-4" />}
          subtext={`${summary.conversionRate}% conversion`}
        />
        <StatCard
          label="TICKETS SOLD"
          value={`${summary.totalTicketsSold}/${summary.totalCapacity}`}
          icon={<Ticket className="w-4 h-4" />}
          progress={summary.totalCapacity > 0 ? (summary.totalTicketsSold / summary.totalCapacity) * 100 : 0}
          highlight
        />
        <StatCard
          label="REVENUE"
          value={formatCurrency(summary.totalRevenue)}
          icon={<DollarSign className="w-4 h-4" />}
          chart={<MiniChart data={ordersByDay.slice(-14).map((d) => d.revenue)} color="bg-green-500" />}
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="CHECK-INS"
          value={`${summary.checkedInCount}/${summary.totalTicketsSold}`}
          icon={<Users className="w-4 h-4" />}
          subtext={`${summary.checkInRate}% attendance`}
        />
        <StatCard
          label="CONVERSION"
          value={`${summary.conversionRate}%`}
          icon={<TrendingUp className="w-4 h-4" />}
          subtext="Views → Sales"
        />
        <StatCard
          label="AVG ORDER"
          value={summary.totalOrders > 0 ? formatCurrency(summary.totalRevenue / summary.totalOrders) : "$0.00"}
          icon={<DollarSign className="w-4 h-4" />}
          subtext="Per transaction"
        />
      </div>

      {/* Tier Breakdown & Referrers */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Ticket Tiers */}
        <div className="border border-white/10 bg-white/[0.02]">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono text-white/40 tracking-widest">TICKET TIERS</span>
            <Ticket className="w-4 h-4 text-white/20" />
          </div>
          <div className="p-4">
            {tierBreakdown.length === 0 ? (
              <p className="text-white/30 text-center py-6 text-xs font-mono">No ticket tiers</p>
            ) : (
              <div className="space-y-4">
                {tierBreakdown.map((tier) => (
                  <div key={tier.id} className="space-y-2">
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-white/80">{tier.name}</span>
                      <span className="text-white/40">
                        <span className="text-primary">{tier.sold}</span>
                        <span className="text-white/20 mx-1">/</span>
                        {tier.sold + tier.available}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${tier.percentSold}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Referrers */}
        <div className="border border-white/10 bg-white/[0.02]">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono text-white/40 tracking-widest">TOP REFERRERS</span>
            <ExternalLink className="w-4 h-4 text-white/20" />
          </div>
          <div className="p-4">
            {referrers.length === 0 ? (
              <p className="text-white/30 text-center py-6 text-xs font-mono">No referrer data</p>
            ) : (
              <div className="space-y-3">
                {referrers.slice(0, 5).map((ref, i) => {
                  const maxCount = referrers[0]?.count || 1
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm font-mono">
                        <span className="text-white/60 truncate pr-4">
                          {ref.referrer === "Direct" ? "Direct / None" : (() => {
                            try {
                              return new URL(ref.referrer).hostname
                            } catch {
                              return ref.referrer
                            }
                          })()}
                        </span>
                        <span className="text-primary flex-shrink-0">{ref.count}</span>
                      </div>
                      <div className="h-1 bg-white/5">
                        <div
                          className="h-full bg-white/20 transition-all"
                          style={{ width: `${(ref.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-mono text-white/40 tracking-widest">DAILY ACTIVITY</span>
          <BarChart3 className="w-4 h-4 text-white/20" />
        </div>
        <div className="overflow-x-auto">
          {viewsByDay.length === 0 ? (
            <p className="text-white/30 text-center py-8 text-xs font-mono">No data for this period</p>
          ) : (
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-4 text-[10px] text-white/30 tracking-widest font-normal">DATE</th>
                  <th className="text-right py-3 px-4 text-[10px] text-white/30 tracking-widest font-normal">VIEWS</th>
                  <th className="text-right py-3 px-4 text-[10px] text-white/30 tracking-widest font-normal">ORDERS</th>
                  <th className="text-right py-3 px-4 text-[10px] text-white/30 tracking-widest font-normal">REVENUE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {viewsByDay.slice(-14).reverse().map((day) => {
                  const orderDay = ordersByDay.find((o) => o.date === day.date)
                  return (
                    <tr key={day.date} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-white/60">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="text-right py-3 px-4 text-white/80">{day.count}</td>
                      <td className="text-right py-3 px-4 text-white/80">{orderDay?.count || 0}</td>
                      <td className="text-right py-3 px-4 text-primary">
                        {orderDay ? formatCurrency(orderDay.revenue) : "$0.00"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  subtext,
  progress,
  chart,
  highlight = false,
}: {
  label: string
  value: string
  icon: React.ReactNode
  subtext?: string
  progress?: number
  chart?: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div
      className={`border p-4 ${
        highlight ? "border-primary/50 bg-primary/5" : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`${highlight ? "text-primary" : "text-white/30"}`}>{icon}</span>
        <span className="text-[10px] font-mono text-white/30 tracking-widest">{label}</span>
      </div>
      <p className={`text-xl font-mono font-bold ${highlight ? "text-primary" : ""}`}>{value}</p>
      {subtext && <p className="text-[10px] font-mono text-white/40 mt-1">{subtext}</p>}
      {progress !== undefined && (
        <div className="mt-3 h-1.5 bg-white/5">
          <div
            className={`h-full ${highlight ? "bg-primary" : "bg-white/20"}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
      {chart}
    </div>
  )
}

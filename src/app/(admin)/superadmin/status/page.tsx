import { prisma } from "@/lib/prisma"
import { SystemHealth, FeatureType } from "@prisma/client"
import { StatusForm } from "./StatusForm"
import { Activity, Zap, Server, Shield, CreditCard, Users, Calendar, Ticket, Code, LayoutDashboard } from "lucide-react"

export default async function StatusManagement() {
  const statuses = await prisma.systemStatus.findMany({
    orderBy: { feature: "asc" }
  })

  const healthConfig: Record<SystemHealth, { color: string; borderColor: string; bgColor: string; dotColor: string; label: string }> = {
    OPERATIONAL: {
      color: "text-green-400",
      borderColor: "border-green-500/30",
      bgColor: "bg-green-500/5",
      dotColor: "bg-green-500",
      label: "ONLINE",
    },
    MAINTENANCE: {
      color: "text-yellow-400",
      borderColor: "border-yellow-500/30",
      bgColor: "bg-yellow-500/5",
      dotColor: "bg-yellow-500",
      label: "MAINTENANCE",
    },
    DEPRECATED: {
      color: "text-white/40",
      borderColor: "border-white/20",
      bgColor: "bg-white/5",
      dotColor: "bg-white/40",
      label: "DEPRECATED",
    },
    CONSTRUCTION: {
      color: "text-blue-400",
      borderColor: "border-blue-500/30",
      bgColor: "bg-blue-500/5",
      dotColor: "bg-blue-500",
      label: "BUILDING",
    },
    DEPLOYING: {
      color: "text-purple-400",
      borderColor: "border-purple-500/30",
      bgColor: "bg-purple-500/5",
      dotColor: "bg-purple-500",
      label: "DEPLOYING",
    },
    DOWN: {
      color: "text-red-400",
      borderColor: "border-red-500/30",
      bgColor: "bg-red-500/5",
      dotColor: "bg-red-500",
      label: "OFFLINE",
    },
  }

  const featureTypeConfig: Record<FeatureType, { icon: typeof Activity; color: string }> = {
    EVENTS: { icon: Calendar, color: "text-[#ff1493]" },
    DASHBOARD: { icon: LayoutDashboard, color: "text-purple-400" },
    LOGIN: { icon: Shield, color: "text-green-400" },
    REGISTRATION: { icon: Users, color: "text-cyan-400" },
    TICKETING: { icon: Ticket, color: "text-orange-400" },
    PROFILE: { icon: Users, color: "text-pink-400" },
    PAYMENTS: { icon: CreditCard, color: "text-emerald-400" },
    API: { icon: Code, color: "text-blue-400" },
  }

  // Group by status for summary
  const statusCounts = statuses.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const operationalCount = statusCounts["OPERATIONAL"] || 0
  const totalCount = statuses.length
  const allOperational = operationalCount === totalCount && totalCount > 0

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-6 h-6 text-[#ff1493]" />
              <h1 className="text-2xl font-mono font-bold tracking-tight text-white">SYSTEM STATUS</h1>
            </div>
            <p className="text-white/40 font-mono text-sm">Monitor and control feature statuses across the platform.</p>
          </div>
          <StatusForm />
        </div>
      </div>

      {/* Overall Health */}
      <div className={`border ${allOperational ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/30 bg-yellow-500/5"} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${allOperational ? "bg-green-500" : "bg-yellow-500"} animate-pulse`} />
            <span className={`font-mono font-bold ${allOperational ? "text-green-400" : "text-yellow-400"}`}>
              {allOperational ? "ALL SYSTEMS OPERATIONAL" : "SOME SYSTEMS DEGRADED"}
            </span>
          </div>
          <span className={`text-[10px] font-mono ${allOperational ? "text-green-400/60" : "text-yellow-400/60"}`}>
            {operationalCount}/{totalCount} services online
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["OPERATIONAL", "MAINTENANCE", "DEPLOYING", "DOWN"] as SystemHealth[]).map((status) => {
          const config = healthConfig[status]
          const count = statusCounts[status] || 0
          return (
            <div key={status} className={`border ${config.borderColor} ${config.bgColor} p-3`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                <span className="text-[10px] font-mono text-white/40 tracking-widest">{config.label}</span>
              </div>
              <div className={`text-2xl font-mono font-bold ${config.color}`}>{count}</div>
            </div>
          )
        })}
      </div>

      {/* Feature List */}
      <div className="border border-white/10 bg-white/[0.02]">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#ff1493]" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">MONITORED SERVICES</span>
          </div>
          <span className="text-[10px] font-mono text-white/20">{statuses.length} TOTAL</span>
        </div>

        {statuses.length === 0 ? (
          <div className="p-8 text-center">
            <Zap className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 font-mono text-sm">No services tracked yet</p>
            <p className="text-white/20 font-mono text-xs mt-1">Add a feature to start monitoring</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {statuses.map((status) => {
              const health = healthConfig[status.status]
              const featureType = featureTypeConfig[status.featureType]
              const Icon = featureType.icon

              return (
                <div
                  key={status.id}
                  className="px-4 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    {/* Status Indicator */}
                    <div className={`w-10 h-10 border ${health.borderColor} ${health.bgColor} flex items-center justify-center`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${health.dotColor} ${status.status === "OPERATIONAL" ? "" : "animate-pulse"}`} />
                    </div>

                    {/* Feature Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">{status.feature}</span>
                        <div className={`flex items-center gap-1 px-1.5 py-0.5 ${health.bgColor} border ${health.borderColor}`}>
                          <span className={`text-[10px] font-mono ${health.color}`}>{health.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Icon className={`w-3 h-3 ${featureType.color}`} />
                        <span className="text-[10px] font-mono text-white/30">{status.featureType}</span>
                        {status.message && (
                          <>
                            <span className="text-white/10">•</span>
                            <span className="text-[10px] font-mono text-white/40 truncate max-w-[200px]">{status.message}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Time */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-white/20 hidden sm:block">
                      Updated {status.updatedAt.toLocaleDateString()}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <StatusForm initialData={status} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="border border-white/10 bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-mono text-white/40 tracking-widest">STATUS LEGEND</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.entries(healthConfig) as [SystemHealth, typeof healthConfig[SystemHealth]][]).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
              <span className={`text-[10px] font-mono ${config.color}`}>{config.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

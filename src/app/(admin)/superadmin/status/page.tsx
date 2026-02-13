import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SystemHealth, FeatureType } from "@prisma/client"
import { StatusForm } from "./StatusForm"
import { Activity } from "lucide-react"

export default async function StatusManagement() {
  const statuses = await prisma.systemStatus.findMany({
    orderBy: { feature: "asc" }
  })

  const healthColors: Record<SystemHealth, string> = {
    OPERATIONAL: "bg-green-500",
    MAINTENANCE: "bg-yellow-500",
    DEPRECATED: "bg-gray-500",
    CONSTRUCTION: "bg-blue-500",
    DEPLOYING: "bg-purple-500",
    DOWN: "bg-red-500",
  }

  const featureTypeColors: Record<FeatureType, string> = {
    EVENTS: "bg-blue-500",
    DASHBOARD: "bg-purple-500",
    LOGIN: "bg-green-500",
    REGISTRATION: "bg-yellow-500",
    TICKETING: "bg-orange-500",
    PROFILE: "bg-pink-500",
    PAYMENTS: "bg-indigo-500",
    API: "bg-teal-500",
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-6 h-6 text-[#ff1493]" />
              <h1 className="text-2xl font-mono font-bold tracking-tight text-white">SYSTEM STATUS</h1>
            </div>
            <p className="text-white/40 font-mono text-sm">Manage feature statuses and communicate with users.</p>
          </div>
          <StatusForm />
        </div>
      </div>

      <div className="grid gap-4">
        {statuses.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No feature statuses tracked yet. Add one to start communicating!
            </CardContent>
          </Card>
        ) : (
          statuses.map((status) => (
            <Card key={status.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{status.feature}</h3>
                    <Badge className={healthColors[status.status]}>
                      {status.status}
                    </Badge>
                    <Badge className={featureTypeColors[status.featureType]}>
                      {status.featureType}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{status.message || "No custom message set."}</p>
                  <p className="text-xs text-muted-foreground italic">Last updated: {status.updatedAt.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <StatusForm initialData={status} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

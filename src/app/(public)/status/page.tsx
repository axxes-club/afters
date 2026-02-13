import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { SystemHealth, FeatureType } from "@prisma/client"
import { Zap, HardHat, Sparkles, Trash2, AlertCircle, CheckCircle2, type LucideIcon } from "lucide-react"
import { getAllStatuses, getOverallStatus } from "@/lib/status-utils"

export const dynamic = "force-dynamic"
export const revalidate = 0

const STATUS_CONFIG: Record<SystemHealth, {
  label: string
  color: string
  icon: LucideIcon
  defaultMessage: string
}> = {
  OPERATIONAL: {
    label: "All Good",
    color: "text-green-500 bg-green-500/10 border-green-500/20",
    icon: CheckCircle2,
    defaultMessage: "Everything&apos;s popping. Like a fresh bottle of bubbly.",
  },
  MAINTENANCE: {
    label: "Maintenance",
    color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    icon: Zap,
    defaultMessage: "We&apos;re polishing the disco ball. BRB.",
  },
  CONSTRUCTION: {
    label: "Under Construction",
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    icon: HardHat,
    defaultMessage: "We&apos;re building a bigger dance floor. Watch your step.",
  },
  DEPRECATED: {
    label: "Retired",
    color: "text-gray-500 bg-gray-500/10 border-gray-500/20",
    icon: Trash2,
    defaultMessage: "This feature is retired. It&apos;s living its best life in Ibiza now.",
  },
  DEPLOYING: {
    label: "Deploying",
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    icon: Sparkles,
    defaultMessage: "Fresh vibes incoming. Stay tuned.",
  },
  DOWN: {
    label: "Down",
    color: "text-red-500 bg-red-500/10 border-red-500/20",
    icon: AlertCircle,
    defaultMessage: "Someone tripped over the power cable. We&apos;re on it.",
  },
}

export default async function PublicStatusPage() {
  const statuses = await getAllStatuses()
  const overallStatus = await getOverallStatus()

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="container mx-auto px-4 pb-24 pt-32 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black tracking-tighter mb-4 italic uppercase">
            System <span className="text-[#ff1493]">Status</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            {overallStatus}
          </p>
        </div>

        <div className="grid gap-6">
          {statuses.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-12 text-center">
                <p className="text-zinc-400">Nothing to report. We&apos;re vibing.</p>
              </CardContent>
            </Card>
          ) : (
            statuses.map((status) => {
              const config = STATUS_CONFIG[status.status]
              const Icon = config.icon

              return (
                <Card key={status.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className={`mt-1 p-2 rounded-full ${config.color.split(' ')[0]} bg-current/10`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg tracking-tight uppercase italic">{status.feature}</h3>
                        <div className="flex gap-1">
                          <Badge variant="outline" className={`${config.color} border font-bold text-[10px] uppercase tracking-widest`}>
                            {config.label}
                          </Badge>
                          <Badge variant="outline" className="border font-bold text-[10px] uppercase tracking-widest bg-blue-500/10 border-blue-500/20 text-blue-500">
                            {status.featureType}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-zinc-400 font-medium">
                        {status.message || config.defaultMessage}
                      </p>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-widest pt-2">
                        Updated {status.updatedAt.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        <div className="mt-16 text-center text-[10px] uppercase tracking-[0.2em] text-zinc-700">
          Afters • Est. 2026 • Brooklyn, NY
        </div>
      </main>
      <Footer />
    </div>
  )
}

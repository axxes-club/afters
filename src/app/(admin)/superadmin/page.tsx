import { prisma } from "@/lib/prisma";
import { Users, Calendar, Building2, Ticket, Activity, Zap, TrendingUp, Clock } from "lucide-react";

export default async function SuperadminOverview() {
  const [userCount, eventCount, orgCount, ticketCount, recentUsers, recentEvents] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
    prisma.organizerProfile.count(),
    prisma.ticket.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, email: true, firstName: true, createdAt: true },
    }),
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, createdAt: true, isPublished: true },
    }),
  ]);

  const stats = [
    {
      title: "USERS",
      value: userCount,
      icon: Users,
      color: "text-cyan-400",
      borderColor: "border-cyan-400/30",
      bgColor: "bg-cyan-400/5",
    },
    {
      title: "EVENTS",
      value: eventCount,
      icon: Calendar,
      color: "text-[#ff1493]",
      borderColor: "border-[#ff1493]/30",
      bgColor: "bg-[#ff1493]/5",
    },
    {
      title: "ORGANIZERS",
      value: orgCount,
      icon: Building2,
      color: "text-purple-400",
      borderColor: "border-purple-400/30",
      bgColor: "bg-purple-400/5",
    },
    {
      title: "TICKETS",
      value: ticketCount,
      icon: Ticket,
      color: "text-orange-400",
      borderColor: "border-orange-400/30",
      bgColor: "bg-orange-400/5",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-6 h-6 text-[#ff1493]" />
          <h1 className="text-2xl font-mono font-bold tracking-tight text-white">
            COMMAND CENTER
          </h1>
        </div>
        <p className="text-white/40 font-mono text-sm">
          Welcome back, Boss. Here&apos;s the state of the Afters empire.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.title} className={`border ${stat.borderColor} ${stat.bgColor} p-4 transition-all hover:bg-white/5`}>
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <span className="text-[10px] font-mono text-white/40 tracking-widest">{stat.title}</span>
            </div>
            <div className={`text-3xl font-mono font-bold ${stat.color}`}>
              {stat.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <a href="/superadmin/users" className="group border border-white/10 bg-white/[0.02] p-4 hover:border-[#ff1493]/50 hover:bg-[#ff1493]/5 transition-all">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-white/40 group-hover:text-[#ff1493] transition-colors" />
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="font-mono font-bold text-white">USER MANAGEMENT</p>
          <p className="text-[10px] text-white/40 font-mono mt-1">View &amp; manage all users</p>
        </a>
        <a href="/superadmin/events" className="group border border-white/10 bg-white/[0.02] p-4 hover:border-[#ff1493]/50 hover:bg-[#ff1493]/5 transition-all">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-white/40 group-hover:text-[#ff1493] transition-colors" />
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <p className="font-mono font-bold text-white">EVENT CONTROL</p>
          <p className="text-[10px] text-white/40 font-mono mt-1">Monitor all events</p>
        </a>
        <a href="/superadmin/status" className="group border border-white/10 bg-white/[0.02] p-4 hover:border-[#ff1493]/50 hover:bg-[#ff1493]/5 transition-all">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-white/40 group-hover:text-[#ff1493] transition-colors" />
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono text-green-400">OK</span>
            </div>
          </div>
          <p className="font-mono font-bold text-white">SYSTEM STATUS</p>
          <p className="text-[10px] text-white/40 font-mono mt-1">All systems nominal</p>
        </a>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Users */}
        <div className="border border-white/10 bg-white/[0.02]">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono text-white/40 tracking-widest">RECENT USERS</span>
            </div>
            <a href="/superadmin/users" className="text-[10px] font-mono text-[#ff1493] hover:underline">VIEW ALL</a>
          </div>
          <div className="divide-y divide-white/5">
            {recentUsers.length === 0 ? (
              <p className="p-4 text-sm text-white/30 font-mono">No users yet...</p>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <span className="text-xs font-mono text-cyan-400">
                        {user.firstName?.[0] || user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-mono text-white">{user.firstName || user.email.split("@")[0]}</p>
                      <p className="text-[10px] text-white/30 font-mono">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/20">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-mono">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Events */}
        <div className="border border-white/10 bg-white/[0.02]">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#ff1493]" />
              <span className="text-[10px] font-mono text-white/40 tracking-widest">RECENT EVENTS</span>
            </div>
            <a href="/superadmin/events" className="text-[10px] font-mono text-[#ff1493] hover:underline">VIEW ALL</a>
          </div>
          <div className="divide-y divide-white/5">
            {recentEvents.length === 0 ? (
              <p className="p-4 text-sm text-white/30 font-mono">No events yet...</p>
            ) : (
              recentEvents.map((event) => (
                <div key={event.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 flex items-center justify-center ${event.isPublished ? "bg-[#ff1493]/10 border border-[#ff1493]/20" : "bg-white/5 border border-white/10"}`}>
                      <Ticket className={`w-4 h-4 ${event.isPublished ? "text-[#ff1493]" : "text-white/30"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-mono text-white truncate max-w-[180px]">{event.title}</p>
                      <p className="text-[10px] font-mono mt-0.5">
                        <span className={event.isPublished ? "text-[#ff1493]" : "text-white/30"}>
                          {event.isPublished ? "LIVE" : "DRAFT"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/20">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-mono">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="border border-green-500/20 bg-green-500/5 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="font-mono font-bold text-green-400">SYSTEM ONLINE</span>
          </div>
          <span className="text-[10px] font-mono text-green-400/60">All services operational</span>
        </div>
      </div>
    </div>
  );
}

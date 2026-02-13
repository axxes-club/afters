import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lock, ShieldCheck, Users, UserRound, Music, Building2 } from "lucide-react"

export default function RolesAndPermissionsPage() {
  // Define role permissions
  const rolePermissions = [
    {
      role: "SUPERADMIN",
      icon: ShieldCheck,
      color: "border-purple-500/30 bg-purple-500/5",
      iconColor: "text-purple-400",
      permissions: [
        "Full system access",
        "User management",
        "Event management",
        "Financial oversight",
        "System configuration",
        "All other permissions"
      ]
    },
    {
      role: "ORGANIZER",
      icon: Building2,
      color: "border-blue-500/30 bg-blue-500/5",
      iconColor: "text-blue-400",
      permissions: [
        "Create and manage events",
        "View event analytics",
        "Manage ticket tiers",
        "Access to payout information",
        "Update organizer profile"
      ]
    },
    {
      role: "ARTIST",
      icon: Music,
      color: "border-[#ff1493]/30 bg-[#ff1493]/5",
      iconColor: "text-[#ff1493]",
      permissions: [
        "Manage artist profile",
        "View performance analytics",
        "Connect with fans",
        "Update artist information"
      ]
    },
    {
      role: "PERSONAL",
      icon: UserRound,
      color: "border-green-500/30 bg-green-500/5",
      iconColor: "text-green-400",
      permissions: [
        "Manage personal profile",
        "Purchase tickets",
        "Save events",
        "View purchased tickets",
        "Follow organizers"
      ]
    }
  ]

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-6 h-6 text-[#ff1493]" />
          <h1 className="text-2xl font-mono font-bold tracking-tight text-white">ROLES & PERMISSIONS</h1>
        </div>
        <p className="text-white/40 font-mono text-sm">Understand what each role can do in the system.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rolePermissions.map((roleInfo) => {
          const IconComponent = roleInfo.icon
          return (
            <div key={roleInfo.role} className={`border ${roleInfo.color} p-4 sm:p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <IconComponent className={`h-6 w-6 ${roleInfo.iconColor}`} />
                <div>
                  <h3 className="font-mono font-bold text-white tracking-wide">{roleInfo.role}</h3>
                  <span className="text-[10px] font-mono text-white/40">{roleInfo.permissions.length} permissions</span>
                </div>
              </div>
              <ul className="space-y-2">
                {roleInfo.permissions.map((permission, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Lock className="h-3 w-3 mt-1 text-white/30 flex-shrink-0" />
                    <span className="text-sm text-white/60 font-mono">{permission}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <div className="border border-white/10 bg-white/[0.02] p-4 sm:p-6">
        <h3 className="font-mono font-bold text-white mb-3">ROLE ASSIGNMENT GUIDE</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-white/60 font-mono">
          <li>Navigate to the <span className="text-[#ff1493]">Users</span> section</li>
          <li>Find the user you want to modify</li>
          <li>Click on their role in the table to change it</li>
          <li>Select the appropriate role from the dropdown</li>
          <li>Confirm the change</li>
        </ol>
        <div className="mt-4 p-3 border border-yellow-500/20 bg-yellow-500/5">
          <p className="text-[10px] font-mono text-yellow-400/80 tracking-widest mb-1">NOTE</p>
          <p className="text-xs text-white/50 font-mono">
            Superadmins can assign any role to any user. Other roles can only manage their own permissions
            and those assigned to them by superadmins.
          </p>
        </div>
      </div>
    </div>
  )
}
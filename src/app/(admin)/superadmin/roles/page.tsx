import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lock, ShieldCheck, Users, UserRound, Music, Building2 } from "lucide-react"

export default function RolesAndPermissionsPage() {
  // Define role permissions
  const rolePermissions = [
    {
      role: "SUPERADMIN",
      icon: ShieldCheck,
      color: "bg-purple-500",
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
      color: "bg-blue-500",
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
      color: "bg-pink-500",
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
      color: "bg-green-500",
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
        <p className="text-muted-foreground">
          Understand what each role can do in the system.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {rolePermissions.map((roleInfo) => {
          const IconComponent = roleInfo.icon
          return (
            <Card key={roleInfo.role}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${roleInfo.color}`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {roleInfo.role}
                      <Badge variant="outline">{roleInfo.permissions.length} permissions</Badge>
                    </CardTitle>
                    <CardDescription>
                      Capabilities and access levels
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {roleInfo.permissions.map((permission, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Lock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{permission}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Assignment Guide</CardTitle>
          <CardDescription>
            How to assign and manage user roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li>Navigate to the <strong>Users</strong> section</li>
            <li>Find the user you want to modify</li>
            <li>Click on their role in the table to change it</li>
            <li>Select the appropriate role from the dropdown</li>
            <li>Confirm the change</li>
          </ol>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Note:</h4>
            <p className="text-sm text-muted-foreground">
              Superadmins can assign any role to any user. Other roles can only manage their own permissions 
              and those assigned to them by superadmins.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
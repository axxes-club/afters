"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateUserRole } from "./actions"
import { toast } from "sonner"
import { useState } from "react"

// Define the enum as constants to avoid importing from Prisma client in browser
const USER_ROLE_VALUES = ["USER", "SUPERADMIN", "ORGANIZER", "ARTIST", "PERSONAL"] as const;
type UserRole = typeof USER_ROLE_VALUES[number];

interface UserRoleSelectProps {
  userId: string
  initialRole: UserRole
  disabled?: boolean
}

// Define role labels for better display
const ROLE_LABELS: Record<UserRole, string> = {
  "USER": "Personal",
  "SUPERADMIN": "Superadmin",
  "ORGANIZER": "Organizer",
  "ARTIST": "Artist",
  "PERSONAL": "Personal"
};

export function UserRoleSelect({ userId, initialRole, disabled }: UserRoleSelectProps) {
  const [role, setRole] = useState<UserRole>(initialRole)
  const [isLoading, setIsLoading] = useState(false)
  
  // Superadmins cannot have their role changed
  const isSuperAdmin = initialRole === "SUPERADMIN"
  const isDisabled = disabled || isLoading || isSuperAdmin

  async function onRoleChange(newRole: UserRole) {
    if (newRole === role || isSuperAdmin) return

    setIsLoading(true)
    try {
      await updateUserRole(userId, newRole)
      setRole(newRole)
      toast.success("User role updated")
    } catch (error) {
      toast.error("Failed to update role")
      // Revert select value
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div title={isSuperAdmin ? "Superadmin role cannot be changed" : undefined}>
      <Select
        defaultValue={role}
        onValueChange={(value) => onRoleChange(value as UserRole)}
        disabled={isDisabled}
      >
        <SelectTrigger className={`w-[140px] h-8 text-xs ${isSuperAdmin ? "opacity-60 cursor-not-allowed" : ""}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {USER_ROLE_VALUES.map((r) => (
            <SelectItem key={r} value={r} className="text-xs">
              {ROLE_LABELS[r] || r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

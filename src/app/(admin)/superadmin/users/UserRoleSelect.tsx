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
}

// Define role labels for better display
const ROLE_LABELS: Record<UserRole, string> = {
  "USER": "Personal",
  "SUPERADMIN": "Superadmin",
  "ORGANIZER": "Organizer",
  "ARTIST": "Artist",
  "PERSONAL": "Personal"
};

export function UserRoleSelect({ userId, initialRole }: UserRoleSelectProps) {
  const [role, setRole] = useState<UserRole>(initialRole)
  const [isLoading, setIsLoading] = useState(false)

  async function onRoleChange(newRole: UserRole) {
    if (newRole === role) return

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
    <Select
      defaultValue={role}
      onValueChange={(value) => onRoleChange(value as UserRole)}
      disabled={isLoading}
    >
      <SelectTrigger className="w-[140px] h-8 text-xs">
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
  )
}

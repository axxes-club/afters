"use client"

import { UserRole } from "@prisma/client"
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

interface UserRoleSelectProps {
  userId: string
  initialRole: UserRole
}

// Define role labels for better display
const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.USER]: "Personal",
  [UserRole.SUPERADMIN]: "Superadmin",
  [UserRole.ORGANIZER]: "Organizer",
  [UserRole.ARTIST]: "Artist",
  [UserRole.PERSONAL]: "Personal"
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
        {Object.values(UserRole).map((r) => (
          <SelectItem key={r} value={r} className="text-xs">
            {ROLE_LABELS[r] || r}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

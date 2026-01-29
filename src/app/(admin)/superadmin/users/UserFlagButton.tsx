"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Flag, Loader2, FlagOff } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface UserFlagButtonProps {
  userId: string
  isFlagged: boolean
  flagReason?: string | null
  children: React.ReactNode
}

export function UserFlagButton({ userId, isFlagged, flagReason, children }: UserFlagButtonProps) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const [reason, setReason] = useState(flagReason || "")
  const [loading, setLoading] = useState(false)

  async function handleFlag() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "user",
          entityId: userId,
          flag: true,
          reason: reason.trim() || null,
        })
      })

      if (res.ok) {
        toast.success("User flagged")
        setShowDialog(false)
        router.refresh()
      } else {
        toast.error("Failed to flag user")
      }
    } catch (error) {
      toast.error("Failed to flag user")
    } finally {
      setLoading(false)
    }
  }

  async function handleUnflag() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "user",
          entityId: userId,
          flag: false,
        })
      })

      if (res.ok) {
        toast.success("Flag removed")
        router.refresh()
      } else {
        toast.error("Failed to remove flag")
      }
    } catch (error) {
      toast.error("Failed to remove flag")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {isFlagged ? (
        <DropdownMenuItem onClick={handleUnflag} disabled={loading}>
          <FlagOff className="h-4 w-4 mr-2" />
          Remove Flag
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem onClick={() => setShowDialog(true)}>
          <Flag className="h-4 w-4 mr-2 text-red-500" />
          <span className="text-red-500">Flag User</span>
        </DropdownMenuItem>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-500" />
              Flag User
            </DialogTitle>
            <DialogDescription>
              Flag this user for internal review. This is not visible to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you flagging this user?"
              />
              <p className="text-xs text-muted-foreground">
                This note is only visible to superadmins.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFlag} disabled={loading} variant="destructive">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Flag className="h-4 w-4 mr-2" />}
              Flag User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

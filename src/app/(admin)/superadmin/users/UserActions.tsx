"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  MoreHorizontal, 
  Pencil, 
  Key, 
  Ban, 
  Trash2, 
  Eye,
  Loader2,
  Copy,
  Check,
  Ghost
} from "lucide-react"
import { toast } from "sonner"
import { 
  deleteUser, 
  banUser, 
  unbanUser, 
  sendPasswordResetEmail, 
  updateUserMetadata,
  getUserDetails
} from "./actions"

interface UserActionsProps {
  userId: string
  email: string
  firstName: string
  lastName: string
  username: string
}

export function UserActions({ userId, email, firstName, lastName, username }: UserActionsProps) {
  const [loading, setLoading] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showGhostDialog, setShowGhostDialog] = useState(false)
  const [userDetails, setUserDetails] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    firstName,
    lastName,
    username
  })
  const [copied, setCopied] = useState(false)

  const handleViewDetails = async () => {
    setShowDetailsDialog(true)
    setDetailsLoading(true)
    setUserDetails(null)
    try {
      const details = await getUserDetails(userId)
      setUserDetails(details)
    } catch (error) {
      toast.error("Failed to load user details")
      setShowDetailsDialog(false)
    }
    setDetailsLoading(false)
  }

  const handleEdit = async () => {
    setLoading(true)
    const result = await updateUserMetadata(userId, editForm)
    if (result.success) {
      toast.success("User updated successfully")
      setShowEditDialog(false)
    } else {
      toast.error(result.error || "Failed to update user")
    }
    setLoading(false)
  }

  const handlePasswordReset = async () => {
    setLoading(true)
    const result = await sendPasswordResetEmail(userId)
    if (result.success) {
      toast.success(`Password reset info for: ${result.email}`, {
        description: "Direct the user to the forgot password page",
        duration: 10000
      })
    } else {
      toast.error(result.error || "Failed to initiate password reset")
    }
    setLoading(false)
  }

  const handleBan = async () => {
    setLoading(true)
    const result = await banUser(userId)
    if (result.success) {
      toast.success("User has been banned")
    } else {
      toast.error(result.error || "Failed to ban user")
    }
    setLoading(false)
  }

  const handleUnban = async () => {
    setLoading(true)
    const result = await unbanUser(userId)
    if (result.success) {
      toast.success("User has been unbanned")
    } else {
      toast.error(result.error || "Failed to unban user")
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteUser(userId)
      toast.success("User deleted successfully")
      setShowDeleteDialog(false)
    } catch (error) {
      toast.error("Failed to delete user")
    }
    setLoading(false)
  }

  const handleGhost = () => {
    setShowGhostDialog(true)
  }

  const copyUserId = () => {
    navigator.clipboard.writeText(userId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Actions
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit User
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePasswordReset}>
            <Key className="h-4 w-4 mr-2" />
            Password Reset
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleGhost} className="text-purple-600">
            <Ghost className="h-4 w-4 mr-2" />
            Ghost
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleBan} className="text-yellow-600">
            <Ban className="h-4 w-4 mr-2" />
            Ban User
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleUnban} className="text-green-600">
            <Check className="h-4 w-4 mr-2" />
            Unban User
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={editForm.firstName}
                onChange={(e) => setEditForm(p => ({ ...p, firstName: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={editForm.lastName}
                onChange={(e) => setEditForm(p => ({ ...p, lastName: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={editForm.username}
                onChange={(e) => setEditForm(p => ({ ...p, username: e.target.value }))}
                placeholder="username (no @)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information for {email}
            </DialogDescription>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : userDetails ? (
            <div className="grid gap-4 py-4 text-sm">
              {/* User ID */}
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <span className="text-muted-foreground">User ID:</span>
                <code className="flex-1 font-mono text-xs">{userId}</code>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={copyUserId}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>

              {/* Clerk Info */}
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">Authentication (Clerk)</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`ml-2 ${userDetails.clerk?.banned ? 'text-red-500' : 'text-green-500'}`}>
                      {userDetails.clerk?.banned ? 'Banned' : 'Active'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Sign In:</span>
                    <span className="ml-2">
                      {userDetails.clerk?.lastSignInAt 
                        ? new Date(userDetails.clerk.lastSignInAt).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2">
                      {userDetails.clerk?.createdAt 
                        ? new Date(userDetails.clerk.createdAt).toLocaleString()
                        : 'Unknown'}
                    </span>
                  </div>
                </div>
                {userDetails.clerk?.emailAddresses?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground text-xs">Email Addresses:</span>
                    <ul className="text-xs mt-1">
                      {userDetails.clerk.emailAddresses.map((e: any, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          {e.email}
                          {e.verified && <span className="text-green-500">(verified)</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {userDetails.clerk?.externalAccounts?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground text-xs">Connected Accounts:</span>
                    <ul className="text-xs mt-1">
                      {userDetails.clerk.externalAccounts.map((e: any, i: number) => (
                        <li key={i}>{e.provider}: {e.email}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Database Info */}
              <div className="border rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">Database Record</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Role:</span> <span className="ml-2">{userDetails.db?.role}</span></div>
                  <div><span className="text-muted-foreground">Username:</span> <span className="ml-2">{userDetails.db?.username || 'Not set'}</span></div>
                  <div><span className="text-muted-foreground">Orders:</span> <span className="ml-2">{userDetails.db?._count?.orders}</span></div>
                  <div><span className="text-muted-foreground">Tickets:</span> <span className="ml-2">{userDetails.db?._count?.tickets}</span></div>
                  <div><span className="text-muted-foreground">Follows:</span> <span className="ml-2">{userDetails.db?._count?.follows}</span></div>
                  <div><span className="text-muted-foreground">Saved Events:</span> <span className="ml-2">{userDetails.db?._count?.savedEvents}</span></div>
                </div>
              </div>

              {/* Profiles */}
              {(userDetails.db?.organizerProfile || userDetails.db?.artistProfile || userDetails.db?.personalProfile) && (
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold">Profiles</h4>
                  {userDetails.db?.organizerProfile && (
                    <div className="text-xs">
                      <span className="text-blue-500 font-medium">Organizer:</span>
                      <span className="ml-2">/o/{userDetails.db.organizerProfile.slug}</span>
                    </div>
                  )}
                  {userDetails.db?.artistProfile && (
                    <div className="text-xs">
                      <span className="text-[#ff1493] font-medium">Artist:</span>
                      <span className="ml-2">/a/{userDetails.db.artistProfile.slug}</span>
                      {userDetails.db.artistProfile.isVerified && <span className="ml-1 text-blue-500">(verified)</span>}
                    </div>
                  )}
                  {userDetails.db?.personalProfile && (
                    <div className="text-xs">
                      <span className="text-muted-foreground font-medium">Personal:</span>
                      <span className="ml-2">/p/{userDetails.db.personalProfile.slug}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Failed to load user details
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ghost Dialog */}
      <Dialog open={showGhostDialog} onOpenChange={setShowGhostDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ghost className="h-5 w-5 text-purple-500" />
              Ghost as User
            </DialogTitle>
            <DialogDescription>
              Sign in as this user to see the app from their perspective
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">User: {email}</p>
              <p className="text-xs text-muted-foreground">ID: {userId}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              To ghost as this user, use the Clerk Dashboard impersonation feature:
            </p>
            <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
              <li>Go to Clerk Dashboard → Users</li>
              <li>Find this user by email or ID</li>
              <li>Click "Impersonate" in user actions</li>
            </ol>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGhostDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => window.open(`https://dashboard.clerk.com/apps/app_default/users/${userId}`, '_blank')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Ghost className="h-4 w-4 mr-2" />
              Open in Clerk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{email}</strong>? This action cannot be undone.
              This will remove the user from both Clerk and the database, including all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

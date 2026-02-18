"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Bug,
  Lightbulb,
  MessageCircle,
  AlertCircle,
  Image as ImageIcon,
  Activity,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface FeedbackUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  imageUrl: string | null
}

interface FeedbackEntry {
  id: string
  userId: string | null
  type: "bug" | "feature" | "general"
  message: string
  screenshotUrl: string | null
  activityLog: Array<{ action: string; path: string; timestamp: string; metadata?: unknown }> | null
  currentPath: string | null
  userAgent: string | null
  status: "new" | "reviewed" | "resolved" | "wontfix"
  adminNotes: string | null
  createdAt: string
  updatedAt: string
  user: FeedbackUser | null
}

interface FeedbackCounts {
  new: number
  reviewed: number
  resolved: number
  wontfix: number
  total: number
}

const typeConfig = {
  bug: { icon: Bug, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "Bug" },
  feature: { icon: Lightbulb, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", label: "Feature" },
  general: { icon: MessageCircle, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", label: "General" },
}

const statusConfig = {
  new: { icon: Clock, color: "text-yellow-400", label: "New" },
  reviewed: { icon: AlertCircle, color: "text-blue-400", label: "Reviewed" },
  resolved: { icon: CheckCircle, color: "text-green-400", label: "Resolved" },
  wontfix: { icon: XCircle, color: "text-gray-400", label: "Won't Fix" },
}

export default function FeedbackManagementPage() {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([])
  const [counts, setCounts] = useState<FeedbackCounts>({ new: 0, reviewed: 0, resolved: 0, wontfix: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("new")
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackEntry | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [newStatus, setNewStatus] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [activityExpanded, setActivityExpanded] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    fetchFeedback()
  }, [])

  async function fetchFeedback() {
    try {
      const res = await fetch("/api/feedback")
      if (res.ok) {
        const data = await res.json()
        setFeedback(data.feedback)
        setCounts(data.counts)
      }
    } catch (error) {
      console.error("Error fetching feedback:", error)
      toast.error("Failed to load feedback")
    } finally {
      setLoading(false)
    }
  }

  function openDetail(entry: FeedbackEntry) {
    setSelectedFeedback(entry)
    setAdminNotes(entry.adminNotes || "")
    setNewStatus(entry.status)
    setActivityExpanded(false)
    setDetailDialogOpen(true)
  }

  async function handleSave() {
    if (!selectedFeedback) return
    setSaving(true)

    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedFeedback.id,
          status: newStatus,
          adminNotes,
        }),
      })

      if (res.ok) {
        toast.success("Feedback updated")
        setDetailDialogOpen(false)
        fetchFeedback()
      } else {
        const error = await res.json()
        toast.error(error.message || "Failed to update feedback")
      }
    } catch {
      toast.error("Failed to update feedback")
    } finally {
      setSaving(false)
    }
  }

  const filteredFeedback = feedback.filter(f =>
    activeTab === "all" || f.status === activeTab
  )

  const screenshots = selectedFeedback?.screenshotUrl?.split(",").filter(Boolean) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="w-6 h-6 text-[#ff1493]" />
          <h1 className="text-2xl font-mono font-bold tracking-tight text-white">FEEDBACK</h1>
        </div>
        <p className="text-white/40 font-mono text-sm">Review and manage user feedback submissions.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
        <div className="border border-yellow-500/30 bg-yellow-500/5 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-4 w-4 text-yellow-400" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">NEW</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-yellow-400">{counts.new}</div>
        </div>
        <div className="border border-blue-500/30 bg-blue-500/5 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">REVIEWED</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-blue-400">{counts.reviewed}</div>
        </div>
        <div className="border border-green-500/30 bg-green-500/5 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">RESOLVED</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-green-400">{counts.resolved}</div>
        </div>
        <div className="border border-gray-500/30 bg-gray-500/5 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="h-4 w-4 text-gray-400" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">WONTFIX</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-gray-400">{counts.wontfix}</div>
        </div>
        <div className="border border-[#ff1493]/30 bg-[#ff1493]/5 p-3 sm:p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <MessageSquare className="h-4 w-4 text-[#ff1493]" />
            <span className="text-[10px] font-mono text-white/40 tracking-widest">TOTAL</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-[#ff1493]">{counts.total}</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto grid grid-cols-5 sm:inline-flex">
          <TabsTrigger value="new" className="text-xs sm:text-sm">
            New
            {counts.new > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                {counts.new}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="text-xs sm:text-sm">Reviewed</TabsTrigger>
          <TabsTrigger value="resolved" className="text-xs sm:text-sm">Resolved</TabsTrigger>
          <TabsTrigger value="wontfix" className="text-xs sm:text-sm">Won&apos;t Fix</TabsTrigger>
          <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredFeedback.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No {activeTab === "all" ? "" : activeTab} feedback</p>
                <p className="text-muted-foreground text-sm">
                  {activeTab === "new"
                    ? "All feedback has been reviewed."
                    : "No feedback matches this filter."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredFeedback.map((entry) => {
                const typeInfo = typeConfig[entry.type]
                const statusInfo = statusConfig[entry.status]
                const TypeIcon = typeInfo.icon
                const StatusIcon = statusInfo.icon

                return (
                  <Card key={entry.id} className="overflow-hidden hover:border-white/20 transition-colors cursor-pointer" onClick={() => openDetail(entry)}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Type Badge & Message */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge className={`${typeInfo.bg} ${typeInfo.border} ${typeInfo.color} border`}>
                              <TypeIcon className="h-3 w-3 mr-1" />
                              {typeInfo.label}
                            </Badge>
                            <Badge variant="outline" className={statusInfo.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                            {screenshots.length > 0 && (
                              <Badge variant="outline" className="text-white/60">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                {screenshots.length}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-white/80 line-clamp-2 mb-2">{entry.message}</p>
                          <div className="flex items-center gap-3 text-xs text-white/40">
                            <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                            {entry.user && (
                              <span className="truncate">{entry.user.email}</span>
                            )}
                            {entry.currentPath && (
                              <span className="truncate">on {entry.currentPath}</span>
                            )}
                          </div>
                        </div>

                        {/* View Button */}
                        <div className="flex items-center shrink-0">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#ff1493]" />
              Feedback Details
            </DialogTitle>
            <DialogDescription>
              Review and update this feedback entry
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4 py-4">
              {/* Type & Status */}
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const typeInfo = typeConfig[selectedFeedback.type]
                  const TypeIcon = typeInfo.icon
                  return (
                    <Badge className={`${typeInfo.bg} ${typeInfo.border} ${typeInfo.color} border`}>
                      <TypeIcon className="h-3 w-3 mr-1" />
                      {typeInfo.label}
                    </Badge>
                  )
                })()}
                <span className="text-xs text-white/40">
                  {new Date(selectedFeedback.createdAt).toLocaleString()}
                </span>
              </div>

              {/* User Info */}
              {selectedFeedback.user && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  {selectedFeedback.user.imageUrl && (
                    <Image
                      src={selectedFeedback.user.imageUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {selectedFeedback.user.firstName} {selectedFeedback.user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{selectedFeedback.user.email}</p>
                  </div>
                  <Link href={`/superadmin/users?search=${selectedFeedback.userId}`} className="shrink-0">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View User
                    </Button>
                  </Link>
                </div>
              )}

              {/* Message */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <div className="p-3 bg-muted/50 rounded-lg whitespace-pre-wrap text-sm">
                  {selectedFeedback.message}
                </div>
              </div>

              {/* Path & User Agent */}
              {(selectedFeedback.currentPath || selectedFeedback.userAgent) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedFeedback.currentPath && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-white/60">Page</label>
                      <p className="text-sm font-mono bg-muted/50 p-2 rounded truncate">{selectedFeedback.currentPath}</p>
                    </div>
                  )}
                  {selectedFeedback.userAgent && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-white/60">User Agent</label>
                      <p className="text-xs font-mono bg-muted/50 p-2 rounded line-clamp-2">{selectedFeedback.userAgent}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Screenshots */}
              {screenshots.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Screenshots ({screenshots.length})
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {screenshots.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(url)}
                        className="aspect-video relative bg-muted/50 rounded-lg overflow-hidden hover:ring-2 hover:ring-[#ff1493] transition-all"
                      >
                        <Image
                          src={url}
                          alt={`Screenshot ${i + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Log */}
              {selectedFeedback.activityLog && selectedFeedback.activityLog.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => setActivityExpanded(!activityExpanded)}
                    className="flex items-center gap-2 text-sm font-medium hover:text-[#ff1493] transition-colors w-full"
                  >
                    <Activity className="h-4 w-4" />
                    Activity Log ({selectedFeedback.activityLog.length} actions)
                    {activityExpanded ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                  </button>
                  {activityExpanded && (
                    <div className="max-h-48 overflow-y-auto bg-muted/50 rounded-lg p-3 space-y-2">
                      {selectedFeedback.activityLog.map((log, i) => (
                        <div key={i} className="text-xs font-mono border-b border-white/5 pb-2 last:border-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[#ff1493]">{log.action}</span>
                            <span className="text-white/40">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <span className="text-white/60">{log.path}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Status Update */}
              <div className="space-y-2 pt-2 border-t">
                <label className="text-sm font-medium">Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="wontfix">Won&apos;t Fix</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this feedback..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto bg-[#ff1493] hover:bg-[#ff1493]/80">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95">
          {selectedImage && (
            <div className="relative aspect-video w-full">
              <Image
                src={selectedImage}
                alt="Screenshot"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

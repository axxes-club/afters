"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { 
  BadgeCheck, 
  Clock, 
  XCircle, 
  CheckCircle, 
  Loader2,
  User,
  Link as LinkIcon,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from "lucide-react"

interface ArtistProfile {
  id: string
  artistName: string
  slug: string
  avatarUrl: string | null
  user: {
    email: string
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
  }
}

interface VerificationRequest {
  id: string
  artistProfileId: string | null
  userId: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  realName: string | null
  socialProof: string | null
  pressLinks: string | null
  additionalInfo: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  createdAt: string
  artistProfile: ArtistProfile | null
}

export default function VerificationManagementPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("PENDING")
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    try {
      const res = await fetch("/api/admin/verification")
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests)
        setCounts(data.counts)
      }
    } catch (error) {
      console.error("Error fetching requests:", error)
      toast.error("Failed to load verification requests")
    } finally {
      setLoading(false)
    }
  }

  async function handleReview(action: "approve" | "reject") {
    if (!selectedRequest) return
    setProcessing(true)

    try {
      const res = await fetch("/api/admin/verification", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          action,
          rejectionReason: action === "reject" ? rejectionReason : undefined
        })
      })

      if (res.ok) {
        toast.success(action === "approve" ? "Artist verified successfully!" : "Request rejected")
        setReviewDialogOpen(false)
        setSelectedRequest(null)
        setRejectionReason("")
        fetchRequests()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to process request")
      }
    } catch (error) {
      toast.error("Failed to process request")
    } finally {
      setProcessing(false)
    }
  }

  const filteredRequests = requests.filter(r => 
    activeTab === "ALL" || r.status === activeTab
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
          <BadgeCheck className="h-7 w-7 text-[#ff1493]" />
          Verification Requests
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Review and manage artist verification requests.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-yellow-500/10 rounded-full w-fit">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{counts.pending}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-green-500/10 rounded-full w-fit">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{counts.approved}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-red-500/10 rounded-full w-fit">
                <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{counts.rejected}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 bg-blue-500/10 rounded-full w-fit">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{counts.total}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex">
          <TabsTrigger value="PENDING" className="text-xs sm:text-sm">
            Pending
            {counts.pending > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                {counts.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="APPROVED" className="text-xs sm:text-sm">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED" className="text-xs sm:text-sm">Rejected</TabsTrigger>
          <TabsTrigger value="ALL" className="text-xs sm:text-sm">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No {activeTab.toLowerCase()} requests</p>
                <p className="text-muted-foreground text-sm">
                  {activeTab === "PENDING" 
                    ? "All verification requests have been reviewed."
                    : "No requests match this filter."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Artist Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-12 w-12 shrink-0">
                          <AvatarImage 
                            src={request.artistProfile?.avatarUrl || request.artistProfile?.user?.imageUrl || undefined} 
                          />
                          <AvatarFallback>
                            {request.artistProfile?.artistName?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold truncate">
                              {request.artistProfile?.artistName || "Unknown Artist"}
                            </h3>
                            <Badge variant={
                              request.status === "PENDING" ? "secondary" :
                              request.status === "APPROVED" ? "default" : "destructive"
                            } className="shrink-0">
                              {request.status === "PENDING" && <Clock className="h-3 w-3 mr-1" />}
                              {request.status === "APPROVED" && <CheckCircle className="h-3 w-3 mr-1" />}
                              {request.status === "REJECTED" && <XCircle className="h-3 w-3 mr-1" />}
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {request.artistProfile?.user?.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Submitted {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant={request.status === "PENDING" ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request)
                            setReviewDialogOpen(true)
                          }}
                        >
                          {request.status === "PENDING" ? "Review" : "View"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-[#ff1493]" />
              Verification Request
            </DialogTitle>
            <DialogDescription>
              Review the verification details for {selectedRequest?.artistProfile?.artistName}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              {/* Artist Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-14 w-14">
                  <AvatarImage 
                    src={selectedRequest.artistProfile?.avatarUrl || selectedRequest.artistProfile?.user?.imageUrl || undefined} 
                  />
                  <AvatarFallback className="text-lg">
                    {selectedRequest.artistProfile?.artistName?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedRequest.artistProfile?.artistName}</h3>
                  <p className="text-sm text-muted-foreground">
                    @{selectedRequest.artistProfile?.slug}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedRequest.artistProfile?.user?.email}
                  </p>
                </div>
              </div>

              {/* Verification Info */}
              <div className="space-y-3">
                {selectedRequest.realName && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Legal Name
                    </label>
                    <p className="text-sm p-2 bg-muted/50 rounded">{selectedRequest.realName}</p>
                  </div>
                )}

                {selectedRequest.socialProof && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Social Proof
                    </label>
                    <p className="text-sm p-2 bg-muted/50 rounded whitespace-pre-wrap break-all">
                      {selectedRequest.socialProof}
                    </p>
                  </div>
                )}

                {selectedRequest.pressLinks && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Press Links
                    </label>
                    <p className="text-sm p-2 bg-muted/50 rounded whitespace-pre-wrap break-all">
                      {selectedRequest.pressLinks}
                    </p>
                  </div>
                )}

                {selectedRequest.additionalInfo && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Additional Info</label>
                    <p className="text-sm p-2 bg-muted/50 rounded whitespace-pre-wrap">
                      {selectedRequest.additionalInfo}
                    </p>
                  </div>
                )}
              </div>

              {/* Rejection Reason Input (for pending) */}
              {selectedRequest.status === "PENDING" && (
                <div className="space-y-2 pt-2 border-t">
                  <label className="text-sm font-medium">Rejection Reason (if rejecting)</label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason if rejecting..."
                    rows={3}
                  />
                </div>
              )}

              {/* Show rejection reason for rejected requests */}
              {selectedRequest.status === "REJECTED" && selectedRequest.rejectionReason && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm font-medium text-red-500 mb-1">Rejection Reason:</p>
                  <p className="text-sm">{selectedRequest.rejectionReason}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedRequest?.status === "PENDING" ? (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleReview("reject")}
                  disabled={processing}
                  className="w-full sm:w-auto"
                >
                  {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Reject
                </Button>
                <Button
                  onClick={() => handleReview("approve")}
                  disabled={processing}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                >
                  {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Approve & Verify
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)} className="w-full sm:w-auto">
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

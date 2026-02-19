"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  BadgeCheck, 
  Clock, 
  XCircle, 
  CheckCircle, 
  Loader2,
  ShieldCheck,
  Link as LinkIcon,
  FileText,
  User
} from "lucide-react"

interface VerificationStatus {
  isVerified: boolean
  request: {
    id: string
    status: "PENDING" | "APPROVED" | "REJECTED"
    rejectionReason?: string
    createdAt: string
    reviewedAt?: string
  } | null
}

export function VerificationRequestForm() {
  const tCommon = useTranslations('common')
  
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  // Form state
  const [realName, setRealName] = useState("")
  const [socialProof, setSocialProof] = useState("")
  const [pressLinks, setPressLinks] = useState("")
  const [additionalInfo, setAdditionalInfo] = useState("")

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    try {
      const res = await fetch("/api/artist/verification")
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("Error fetching verification status:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch("/api/artist/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          realName,
          socialProof,
          pressLinks,
          additionalInfo
        })
      })

      if (res.ok) {
        toast.success("Verification request submitted successfully!")
        setShowForm(false)
        fetchStatus()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to submit request")
      }
    } catch {
      toast.error("Failed to submit request")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // Already verified
  if (status?.isVerified) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-full">
              <BadgeCheck className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Verified Artist
                <CheckCircle className="h-5 w-5 text-green-500" />
              </h3>
              <p className="text-muted-foreground text-sm">
                Your artist profile is verified and displays a verification badge.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Pending request
  if (status?.request?.status === "PENDING") {
    return (
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-full">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Verification Pending
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">
                  Under Review
                </Badge>
              </h3>
              <p className="text-muted-foreground text-sm">
                Your verification request is being reviewed. This usually takes 1-3 business days.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Submitted on {new Date(status.request.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Rejected request
  if (status?.request?.status === "REJECTED") {
    return (
      <Card className="border-red-500/30 bg-red-500/5">
        <CardContent className="py-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-full">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Verification Declined
              </h3>
              <p className="text-muted-foreground text-sm">
                Your previous verification request was not approved.
              </p>
              {status.request.rejectionReason && (
                <p className="text-sm text-red-400 mt-2">
                  Reason: {status.request.rejectionReason}
                </p>
              )}
            </div>
          </div>
          <Button onClick={() => setShowForm(true)} variant="outline">
            Submit New Request
          </Button>
        </CardContent>
      </Card>
    )
  }

  // No request yet - show form or CTA
  if (!showForm) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Get Verified</CardTitle>
              <CardDescription>
                Request a verification badge for your artist profile
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <BadgeCheck className="h-4 w-4 mt-0.5 text-primary" />
              <span>Display a verified badge on your profile</span>
            </div>
            <div className="flex items-start gap-2">
              <BadgeCheck className="h-4 w-4 mt-0.5 text-primary" />
              <span>Build trust with fans and event organizers</span>
            </div>
            <div className="flex items-start gap-2">
              <BadgeCheck className="h-4 w-4 mt-0.5 text-primary" />
              <span>Priority placement in search results</span>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Request Verification
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Show verification request form
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Request Verification
        </CardTitle>
        <CardDescription>
          Provide information to help us verify your identity as an artist.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="realName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Legal Name
            </Label>
            <Input
              id="realName"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              placeholder="Your legal/government name"
              required
            />
            <p className="text-xs text-muted-foreground">
              This helps us verify your identity. It will not be displayed publicly.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="socialProof" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Verified Social Accounts
            </Label>
            <Textarea
              id="socialProof"
              value={socialProof}
              onChange={(e) => setSocialProof(e.target.value)}
              placeholder="Links to your verified social media profiles (Instagram, Spotify, SoundCloud, etc.)"
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              Include links to your official artist accounts with significant following.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pressLinks" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Press & Media Coverage (Optional)
            </Label>
            <Textarea
              id="pressLinks"
              value={pressLinks}
              onChange={(e) => setPressLinks(e.target.value)}
              placeholder="Links to press articles, interviews, or media coverage about you"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Additional Information</Label>
            <Textarea
              id="additionalInfo"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Any other information that might help verify your identity as an artist"
              rows={3}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              {tCommon('cancel')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

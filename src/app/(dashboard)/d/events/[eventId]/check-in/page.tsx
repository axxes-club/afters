"use client"

import { useState, use } from "react"
import { Scanner } from "@yudiel/react-qr-scanner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle, XCircle, Search } from "lucide-react"
import Link from "next/link"

interface CheckInResult {
  message: string
  valid: boolean
  ticket?: {
    ticketNumber: string
    tierName: string
    holderName?: string
    checkedInAt?: string
  }
}

export default function CheckInPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const [scanning, setScanning] = useState(true)
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [manualId, setManualId] = useState("")

  async function checkIn(ticketId: string) {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, eventId }),
      })

      const data: CheckInResult = await res.json()
      setResult(data)

      if (data.valid) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error("Check-in failed")
      setResult({ message: "Check-in failed", valid: false })
    } finally {
      setLoading(false)
    }
  }

  function handleScan(detectedCodes: { rawValue: string }[]) {
    if (detectedCodes.length > 0 && !loading) {
      const ticketId = detectedCodes[0].rawValue
      setScanning(false)
      checkIn(ticketId)
    }
  }

  function handleManualCheck() {
    if (manualId.trim()) {
      checkIn(manualId.trim())
      setManualId("")
    }
  }

  function resetScanner() {
    setResult(null)
    setScanning(true)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/d/events/${eventId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Check-in Scanner</h1>
      </div>

      {/* Scanner */}
      <Card>
        <CardHeader>
          <CardTitle>Scan Ticket</CardTitle>
          <CardDescription>Point the camera at a ticket QR code</CardDescription>
        </CardHeader>
        <CardContent>
          {scanning ? (
            <div className="aspect-square rounded-lg overflow-hidden bg-black">
              <Scanner
                onScan={handleScan}
                onError={(error) => console.error(error)}
                constraints={{ facingMode: "environment" }}
                styles={{
                  container: { width: "100%", height: "100%" },
                  video: { width: "100%", height: "100%", objectFit: "cover" },
                }}
              />
            </div>
          ) : result ? (
            <div className="text-center py-8">
              {result.valid ? (
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              )}

              <p className="text-xl font-bold mb-2">{result.message}</p>

              {result.ticket && (
                <div className="text-left bg-muted p-4 rounded-lg mt-4 space-y-2">
                  <p>
                    <span className="text-muted-foreground">Ticket:</span>{" "}
                    {result.ticket.ticketNumber}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Type:</span>{" "}
                    {result.ticket.tierName}
                  </p>
                  {result.ticket.holderName && (
                    <p>
                      <span className="text-muted-foreground">Name:</span>{" "}
                      {result.ticket.holderName}
                    </p>
                  )}
                </div>
              )}

              <Button onClick={resetScanner} className="mt-6">
                Scan Next Ticket
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Manual Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Entry</CardTitle>
          <CardDescription>Enter a ticket ID manually</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter ticket ID"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualCheck()}
            />
            <Button onClick={handleManualCheck} disabled={loading || !manualId.trim()}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

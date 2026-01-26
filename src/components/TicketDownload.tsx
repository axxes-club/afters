"use client"

import { useRef, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface TicketDownloadProps {
  ticketId: string
  ticketNumber: string
  eventTitle: string
  eventDate: Date
  venueName: string
  city: string
  tierName: string
  status: string
}

export function TicketDownload({
  ticketId,
  ticketNumber,
  eventTitle,
  eventDate,
  venueName,
  city,
  tierName,
  status,
}: TicketDownloadProps) {
  const ticketRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  async function downloadTicket() {
    if (!ticketRef.current) return
    setDownloading(true)

    try {
      // Dynamically import html2canvas (only on client)
      const html2canvas = (await import("html2canvas")).default

      // Make the hidden ticket visible for capture
      const ticketEl = ticketRef.current
      ticketEl.style.display = "block"

      const canvas = await html2canvas(ticketEl, {
        scale: 2,
        backgroundColor: "#0a0a0a",
        logging: false,
      })

      // Hide it again
      ticketEl.style.display = "none"

      // Download as PNG
      const link = document.createElement("a")
      link.download = `${ticketNumber}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()

      toast.success("Ticket downloaded!")
    } catch (error) {
      console.error("Download failed:", error)
      toast.error("Failed to download ticket")
    } finally {
      setDownloading(false)
    }
  }

  const formattedDate = new Date(eventDate).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

  return (
    <>
      {/* Download Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={downloadTicket}
        disabled={downloading || status !== "VALID"}
        className="w-full mt-4"
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Download Ticket
      </Button>

      {/* Hidden ticket for screenshot - renders offscreen */}
      <div
        ref={ticketRef}
        style={{ display: "none", position: "absolute", left: "-9999px" }}
        className="w-[400px] bg-zinc-950 text-white p-6 rounded-2xl"
      >
        {/* Hot pink accent bar */}
        <div className="h-2 bg-pink-500 rounded-full mb-6" />

        {/* Event info */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold leading-tight mb-2">{eventTitle}</h2>
          <p className="text-zinc-400">{formattedDate}</p>
          <p className="text-zinc-400">
            {venueName}, {city}
          </p>
        </div>

        {/* Ticket type */}
        <div className="inline-block bg-pink-500/20 text-pink-400 px-3 py-1 rounded-full text-sm font-medium mb-6">
          {tierName}
        </div>

        {/* QR Code */}
        <div className="flex justify-center p-4 bg-white rounded-xl mb-4">
          <QRCodeSVG
            value={ticketId}
            size={200}
            level="H"
            includeMargin
          />
        </div>

        {/* Ticket number */}
        <div className="text-center">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
            Ticket Number
          </p>
          <p className="font-mono text-lg">{ticketNumber}</p>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-500">afters.xxx</p>
        </div>
      </div>
    </>
  )
}

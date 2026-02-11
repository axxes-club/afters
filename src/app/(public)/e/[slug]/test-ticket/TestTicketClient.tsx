"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Share, AlertTriangle, ArrowLeft, Calendar, MapPin, Clock, QrCode, Check, Download } from "lucide-react"
import { toast } from "sonner"

interface TestTicketClientProps {
  event: {
    id: string
    title: string
    slug: string
    venueName: string
    venueAddress: string
    city: string
    state: string | null
    startsAt: string
    flyerUrl: string | null
    accentColor: string | null
    organizer: {
      displayName: string
      slug: string
      logoUrl: string | null
    }
  }
  ticketId: string
  tierName: string
  eventDate: string
  eventTime: string
}

export function TestTicketClient({ event, ticketId, tierName, eventDate, eventTime }: TestTicketClientProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const ticketRef = useRef<HTMLDivElement>(null)

  const accentColor = event.accentColor || '#ff1493'
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/e/${event.slug}/test-ticket`
    : ''

  const handleShare = async () => {
    setIsSharing(true)

    const shareData = {
      title: `Test Ticket - ${event.title}`,
      text: `Training ticket for ${event.title} - Use this to practice check-in scanning`,
      url: shareUrl,
    }

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData)
        toast.success("Shared successfully")
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        toast.success("Link copied to clipboard")
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        // Fallback to clipboard on error
        try {
          await navigator.clipboard.writeText(shareUrl)
          setCopied(true)
          toast.success("Link copied to clipboard")
          setTimeout(() => setCopied(false), 2000)
        } catch {
          toast.error("Failed to share")
        }
      }
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/5">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/e/${event.slug}`}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs uppercase tracking-wider"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Event</span>
          </Link>
          <Link href="/" className="text-lg font-bold tracking-tight">
            AFTERS<span style={{ color: accentColor }}>.</span>
          </Link>
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-white/50 hover:text-white transition-colors disabled:opacity-50"
          >
            {copied ? <Check className="h-4 w-4" /> : <Share className="h-4 w-4" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
          </button>
        </div>
      </header>

      <main className="pt-20 pb-32 px-4">
        <div className="max-w-sm mx-auto">
          {/* Warning Banner */}
          <div
            className="mb-6 p-4 border-l-2 flex items-start gap-3"
            style={{
              backgroundColor: '#ff8c0015',
              borderLeftColor: '#ff8c00'
            }}
          >
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#ff8c00' }} />
            <div>
              <p className="text-sm font-bold" style={{ color: '#ff8c00' }}>TEST TICKET</p>
              <p className="text-xs text-white/50 mt-0.5">
                For staff training only. Not valid for event entry.
              </p>
            </div>
          </div>

          {/* Ticket Card */}
          <div
            ref={ticketRef}
            className="relative overflow-hidden border border-white/10"
            style={{
              background: 'linear-gradient(180deg, #0a0a0a 0%, #000000 100%)',
            }}
          >
            {/* Top Accent Bar */}
            <div
              className="h-2"
              style={{ backgroundColor: '#ff8c00' }}
            />

            {/* Ticket Header */}
            <div className="p-6 pb-4 border-b border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold tracking-tight">
                  AFTERS<span style={{ color: accentColor }}>.</span>
                </span>
                <span
                  className="text-[10px] px-2 py-1 uppercase tracking-wider font-bold"
                  style={{ backgroundColor: '#ff8c00', color: '#000' }}
                >
                  Test Ticket
                </span>
              </div>

              {/* Event Flyer Thumbnail */}
              {event.flyerUrl && (
                <div className="relative w-full aspect-[3/4] mb-4 border border-white/10 overflow-hidden">
                  <Image
                    src={event.flyerUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}

              {/* Event Title */}
              <h1 className="text-2xl font-bold uppercase tracking-tight leading-tight mb-2">
                {event.title}
              </h1>

              {/* Tier */}
              <p className="text-sm" style={{ color: accentColor }}>
                {tierName}
              </p>
            </div>

            {/* Event Details */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Date</p>
                  <p className="text-sm">{eventDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Doors</p>
                  <p className="text-sm">{eventTime}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Venue</p>
                  <p className="text-sm">{event.venueName}</p>
                  <p className="text-xs text-white/40">
                    {event.city}{event.state ? `, ${event.state}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Perforated Divider */}
            <div className="relative py-4">
              <div className="absolute left-0 top-1/2 w-4 h-8 -translate-y-1/2 -translate-x-1/2 bg-black rounded-r-full" />
              <div className="absolute right-0 top-1/2 w-4 h-8 -translate-y-1/2 translate-x-1/2 bg-black rounded-l-full" />
              <div className="border-t border-dashed border-white/10 mx-6" />
            </div>

            {/* QR Code Section */}
            <div className="p-6 pt-2 flex flex-col items-center">
              <div
                className="w-48 h-48 flex items-center justify-center border-2 mb-4"
                style={{
                  borderColor: '#ff8c00',
                  background: 'repeating-linear-gradient(45deg, #ff8c0008, #ff8c0008 10px, transparent 10px, transparent 20px)'
                }}
              >
                <div className="flex flex-col items-center gap-2 text-center p-4">
                  <QrCode className="h-16 w-16" style={{ color: '#ff8c00' }} />
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">
                    Scan to test check-in
                  </p>
                </div>
              </div>

              {/* Ticket ID */}
              <div className="text-center">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Ticket ID</p>
                <p
                  className="text-lg font-bold tracking-widest"
                  style={{ color: '#ff8c00' }}
                >
                  {ticketId}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-6 py-4 border-t border-white/5 flex items-center justify-between"
              style={{ backgroundColor: '#ff8c0008' }}
            >
              <div className="flex items-center gap-2">
                {event.organizer.logoUrl ? (
                  <Image
                    src={event.organizer.logoUrl}
                    alt={event.organizer.displayName}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                ) : (
                  <div
                    className="w-5 h-5 flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: `${accentColor}30`, color: accentColor }}
                  >
                    {event.organizer.displayName.charAt(0)}
                  </div>
                )}
                <span className="text-xs text-white/50">{event.organizer.displayName}</span>
              </div>
              <span className="text-[10px] text-white/20 uppercase tracking-wider">
                Training Only
              </span>
            </div>
          </div>

          {/* Share Button - Fixed at bottom */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-black border-t border-white/5 safe-area-bottom">
            <div className="max-w-sm mx-auto">
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="w-full h-12 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                style={{ backgroundColor: '#ff8c00', color: '#000' }}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Link Copied
                  </>
                ) : (
                  <>
                    <Share className="h-4 w-4" />
                    Share Test Ticket
                  </>
                )}
              </button>
              <p className="text-[10px] text-white/20 text-center mt-2 uppercase tracking-wider">
                AirDrop • Messages • Copy Link
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

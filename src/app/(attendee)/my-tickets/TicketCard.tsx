"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QRCodeSVG } from "qrcode.react"
import { TicketDownload } from "@/components/TicketDownload"

interface TicketCardProps {
  ticket: {
    id: string
    ticketNumber: string
    status: string
    checkedInAt: Date | null
    ticketTier: {
      name: string
    }
  }
  event: {
    title: string
    startsAt: Date
    venueName: string
    city: string
  }
}

export function TicketCard({ ticket, event }: TicketCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="font-medium">{ticket.ticketTier.name}</p>
            <p className="text-sm text-muted-foreground">
              {ticket.ticketNumber}
            </p>
          </div>
          <Badge
            variant={
              ticket.status === "CHECKED_IN"
                ? "secondary"
                : ticket.status === "VALID"
                ? "default"
                : "destructive"
            }
          >
            {ticket.status === "CHECKED_IN"
              ? "Used"
              : ticket.status === "VALID"
              ? "Valid"
              : ticket.status}
          </Badge>
        </div>

        <div className="flex justify-center p-4 bg-white rounded-lg">
          <QRCodeSVG
            value={ticket.id}
            size={150}
            level="H"
            includeMargin
          />
        </div>

        {ticket.status === "CHECKED_IN" && ticket.checkedInAt && (
          <p className="text-xs text-center text-muted-foreground mt-4">
            Checked in at{" "}
            {new Date(ticket.checkedInAt).toLocaleTimeString()}
          </p>
        )}

        <TicketDownload
          ticketId={ticket.id}
          ticketNumber={ticket.ticketNumber}
          eventTitle={event.title}
          eventDate={event.startsAt}
          venueName={event.venueName}
          city={event.city}
          tierName={ticket.ticketTier.name}
          status={ticket.status}
        />
      </CardContent>
    </Card>
  )
}

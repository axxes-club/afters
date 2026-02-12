"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, CalendarDays, MapPin, Users, MoreHorizontal, Pencil, Eye, Ticket } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCents } from "@/lib/stripe"

interface TicketTier {
  id: string
  price: number
  quantity: number | null
}

interface Event {
  id: string
  title: string
  slug: string
  startsAt: Date
  venueName: string
  flyerUrl: string | null
  status: string
  isPublished: boolean
  ticketTiers: TicketTier[]
  _count: {
    tickets: number
  }
}

interface EventsListContentProps {
  events: Event[]
  organizerSlug: string
}

export function EventsListContent({ events, organizerSlug }: EventsListContentProps) {
  const t = useTranslations('events')
  const tCommon = useTranslations('common')

  const getStatusBadge = (event: Event) => {
    const now = new Date()
    if (event.status === "DRAFT") {
      return <Badge variant="secondary">{tCommon('draft')}</Badge>
    }
    if (event.status === "CANCELLED") {
      return <Badge variant="destructive">{tCommon('cancelled')}</Badge>
    }
    if (new Date(event.startsAt) < now) {
      return <Badge variant="outline">{tCommon('past')}</Badge>
    }
    if (event.isPublished) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{tCommon('live')}</Badge>
    }
    return <Badge variant="secondary">{tCommon('unpublished')}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('manageEvents')}
          </p>
        </div>
        <Button asChild>
          <Link href="/d/events/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('createEvent')}
          </Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noEventsYet')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('createFirstEvent')}
            </p>
            <Button asChild>
              <Link href="/d/events/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('createEvent')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => {
            const totalCapacity = event.ticketTiers.reduce((sum, t) => sum + (t.quantity || 0), 0)
            const ticketsSold = event._count.tickets

            return (
              <Card key={event.id} className="overflow-hidden">
                <div className="flex">
                  {/* Event Image */}
                  <div className="relative w-32 h-32 shrink-0">
                    {event.flyerUrl ? (
                      <Image
                        src={event.flyerUrl}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <CalendarDays className="h-8 w-8 text-primary/40" />
                      </div>
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                            {getStatusBadge(event)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-4 w-4" />
                              {new Date(event.startsAt).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.venueName}
                            </span>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/events/${event.id}`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                {tCommon('edit')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/e/${organizerSlug}-${event.slug}`} target="_blank">
                                <Eye className="mr-2 h-4 w-4" />
                                {t('viewPublicPage')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/events/${event.id}/check-in`}>
                                <Ticket className="mr-2 h-4 w-4" />
                                {t('checkIn')}
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {ticketsSold} / {totalCapacity || "∞"} {tCommon('sold')}
                        </span>
                      </div>
                      {event.ticketTiers.length > 0 && (
                        <div>
                          {tCommon('from')}{" "}
                          <span className="font-medium">
                            {formatCents(Math.min(...event.ticketTiers.map((t) => t.price)))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

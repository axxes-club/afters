"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Plus, Ticket, DollarSign } from "lucide-react"

interface Event {
  id: string
  title: string
  startsAt: Date
  venueName: string
  status: string
}

interface DashboardContentProps {
  displayName: string
  totalEvents: number
  totalTicketsSold: number
  totalRevenue: number
  stripeChargesEnabled: boolean
  events: Event[]
}

export function DashboardContent({
  displayName,
  totalEvents,
  totalTicketsSold,
  totalRevenue,
  stripeChargesEnabled,
  events
}: DashboardContentProps) {
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const tEvents = useTranslations('events')

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t('welcomeBack', { name: displayName })}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t('whatsHappening')}
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/events/new">
            <Plus className="mr-2 h-4 w-4" />
            {tEvents('createEvent')}
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('totalEvents')}</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{totalEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('ticketsSold')}</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{totalTicketsSold}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              ${(totalRevenue / 100).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Connect Status */}
      {!stripeChargesEnabled && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200">
              {t('completePayoutSetup')}
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              {t('payoutSetupHint')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/settings/payouts">{t('setUpPayouts')}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recentEvents')}</CardTitle>
          <CardDescription>{t('latestEvents')}</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t('noEventsMessage')}
            </p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.startsAt).toLocaleDateString()} {tCommon('at')} {event.venueName}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      event.status === "PUBLISHED"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {event.status === "PUBLISHED" ? tCommon('live') : tCommon('draft')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

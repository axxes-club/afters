import { notFound } from "next/navigation"
import { headers } from "next/headers"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getWalletPassPath, isAppleWalletConfigured } from "@/lib/apple-wallet"
import { CheckCircle, XCircle, Clock, CalendarDays, MapPin, Ticket, ArrowLeft, Mail, Wallet } from "lucide-react"

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100)
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>
  searchParams: Promise<{ payment_intent?: string; redirect_status?: string }>
}) {
  const [{ orderId }, { redirect_status }, headerList] = await Promise.all([params, searchParams, headers()])

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      event: {
        select: {
          title: true,
          slug: true,
          startsAt: true,
          venueName: true,
          venueAddress: true,
          city: true,
          state: true,
          accentColor: true,
        },
      },
      items: {
        include: {
          ticketTier: {
            select: {
              name: true,
            },
          },
        },
      },
      tickets: {
        select: {
          id: true,
          ticketNumber: true,
          status: true,
        },
      },
    },
  })

  if (!order) {
    notFound()
  }

  const accentColor = order.event.accentColor || '#ff1493'
  const isPaid = order.status === "PAID"
  const isFailed = redirect_status === "failed"
  const isFreeOrder = order.total === 0
  const buyerName = order.guestName || "there"
  // .pkpass files are useless on Android, so only offer them elsewhere
  const showAppleWallet =
    isPaid && isAppleWalletConfigured() && !/android/i.test(headerList.get("user-agent") ?? "")

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/5">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href={`/e/${order.event.slug}`}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs uppercase tracking-wider"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Event</span>
          </Link>
          <Link href="/" className="font-headline text-2xl" style={{ color: accentColor }}>
            .
          </Link>
          <div className="w-16" />
        </div>
      </header>

      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-xl">
          {/* Status Banner */}
          <div
            className="border mb-6 p-6"
            style={{
              borderColor: isPaid ? '#22c55e' : isFailed ? '#ef4444' : '#eab308',
              borderLeftWidth: '3px'
            }}
          >
            <div className="flex items-start gap-4">
              {isPaid ? (
                <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
              ) : isFailed ? (
                <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
              ) : (
                <Clock className="h-8 w-8 text-yellow-500 flex-shrink-0" />
              )}
              <div>
                <h1 className="text-xl font-bold uppercase tracking-wider mb-1">
                  {isPaid
                    ? "ORDER CONFIRMED"
                    : isFailed
                    ? "PAYMENT FAILED"
                    : "PROCESSING"}
                </h1>
                <p className="text-sm text-white/50">
                  {isPaid
                    ? `Thanks ${buyerName}! Your tickets have been sent to ${order.email}`
                    : isFailed
                    ? "Your payment could not be processed. Please try again."
                    : "Please wait while we confirm your payment..."}
                </p>
              </div>
            </div>
          </div>

          {/* Email Notice */}
          {isPaid && (
            <div className="border border-white/5 mb-6 p-4 flex items-center gap-3">
              <Mail className="h-5 w-5" style={{ color: accentColor }} />
              <div className="text-sm">
                <p className="text-white/50">Tickets sent to</p>
                <p className="font-medium">{order.email}</p>
              </div>
            </div>
          )}

          {/* Order Details */}
          <div className="border border-white/5 mb-6">
            <div
              className="px-4 py-3 border-b border-white/5"
              style={{ backgroundColor: `${accentColor}10` }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider">Order Details</h2>
                <span className="text-xs text-white/30">#{order.orderNumber}</span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Event Info */}
              <div>
                <h3 className="font-bold text-lg uppercase tracking-tight mb-2">{order.event.title}</h3>
                <div className="flex flex-wrap gap-4 text-xs text-white/50">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3 w-3" style={{ color: accentColor }} />
                    {new Date(order.event.startsAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" style={{ color: accentColor }} />
                    {order.event.venueName}, {order.event.city}
                  </span>
                </div>
              </div>

              {/* Tickets Breakdown */}
              <div className="border-t border-white/5 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/30 mb-3">Tickets</h4>
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between py-1.5 text-sm">
                    <span>
                      {item.ticketTier.name} <span className="text-white/30">x{item.quantity}</span>
                    </span>
                    <span className="tabular-nums">{formatCents(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
                {!isFreeOrder && (
                  <div className="flex justify-between py-1.5 text-xs text-white/40">
                    <span>Service fee</span>
                    <span className="tabular-nums">{formatCents(order.platformFee)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 font-bold border-t border-white/5 mt-2">
                  <span className="uppercase tracking-wider">Total</span>
                  <span className="tabular-nums text-lg" style={{ color: accentColor }}>
                    {isFreeOrder ? "FREE" : formatCents(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tickets List */}
          {isPaid && order.tickets.length > 0 && (
            <div className="border border-white/5 mb-6">
              <div
                className="px-4 py-3 border-b border-white/5 flex items-center gap-2"
                style={{ backgroundColor: `${accentColor}10` }}
              >
                <Ticket className="h-4 w-4" style={{ color: accentColor }} />
                <h2 className="text-xs font-bold uppercase tracking-wider">Your Tickets</h2>
              </div>

              <div className="p-4 space-y-2">
                {order.tickets.map((ticket) => (
                  <div key={ticket.id} className="p-3 border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm tabular-nums">{ticket.ticketNumber}</span>
                      <span
                        className="text-[10px] uppercase tracking-wider px-2 py-0.5"
                        style={{
                          backgroundColor: ticket.status === "VALID" ? `${accentColor}20` : 'rgba(255,255,255,0.05)',
                          color: ticket.status === "VALID" ? accentColor : 'rgba(255,255,255,0.3)'
                        }}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    {showAppleWallet && ticket.status === "VALID" && (
                      <a
                        href={getWalletPassPath(ticket.id)}
                        className="mt-3 h-10 flex items-center justify-center gap-2 rounded-md bg-white text-black text-xs font-bold tracking-wide hover:bg-white/90 transition-colors"
                      >
                        <Wallet className="h-4 w-4" />
                        Add to Apple Wallet
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href={`/e/${order.event.slug}`}
              className="flex-1 h-11 flex items-center justify-center border border-white/10 text-xs font-bold uppercase tracking-wider hover:border-white/30 transition-colors"
            >
              Back to Event
            </Link>
            {isFailed && (
              <Link
                href={`/e/${order.event.slug}/checkout`}
                className="flex-1 h-11 flex items-center justify-center text-xs font-bold uppercase tracking-wider transition-colors"
                style={{ backgroundColor: accentColor, color: '#000' }}
              >
                Try Again
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

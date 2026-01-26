import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, CalendarDays, MapPin, Ticket } from "lucide-react"

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
  const { userId } = await auth()
  const { orderId } = await params
  const { redirect_status } = await searchParams

  if (!userId) {
    redirect("/sign-in")
  }

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

  // Verify the order belongs to this user
  if (order.userId !== userId) {
    notFound()
  }

  const isPaid = order.status === "PAID"
  const isFailed = redirect_status === "failed"

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 pt-24 max-w-2xl">
        {/* Status Banner */}
        <Card className={`mb-6 ${isPaid ? "border-green-500" : isFailed ? "border-red-500" : "border-yellow-500"}`}>
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              {isPaid ? (
                <CheckCircle className="h-12 w-12 text-green-500" />
              ) : isFailed ? (
                <XCircle className="h-12 w-12 text-red-500" />
              ) : (
                <Clock className="h-12 w-12 text-yellow-500" />
              )}
              <div>
                <h1 className="text-2xl font-bold">
                  {isPaid
                    ? "Payment Successful!"
                    : isFailed
                    ? "Payment Failed"
                    : "Payment Processing"}
                </h1>
                <p className="text-muted-foreground">
                  {isPaid
                    ? "Your tickets are ready"
                    : isFailed
                    ? "Please try again"
                    : "This may take a moment..."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Order #{order.orderNumber}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{order.event.title}</h3>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {new Date(order.event.startsAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {order.event.venueName}, {order.event.city}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Tickets</h4>
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between py-1">
                  <span>
                    {item.ticketTier.name} x {item.quantity}
                  </span>
                  <span>{formatCents(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 text-sm text-muted-foreground">
                <span>Service fee</span>
                <span>{formatCents(order.platformFee)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold border-t mt-2">
                <span>Total</span>
                <span>{formatCents(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets */}
        {isPaid && order.tickets.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Your Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {order.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <span className="font-mono text-sm">{ticket.ticketNumber}</span>
                    <Badge variant={ticket.status === "VALID" ? "default" : "secondary"}>
                      {ticket.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button asChild className="w-full mt-4">
                <Link href="/my-tickets">View All My Tickets</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/e/${order.event.slug}`}>Back to Event</Link>
          </Button>
          {isFailed && (
            <Button asChild className="flex-1">
              <Link href={`/e/${order.event.slug}/checkout`}>Try Again</Link>
            </Button>
          )}
        </div>
      </main>
    </div>
  )
}

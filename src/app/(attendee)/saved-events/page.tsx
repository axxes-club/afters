import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { CalendarDays, MapPin, Music2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { formatCents } from "@/lib/stripe"
import { SaveEventButton } from "@/components/SaveEventButton"

export default async function SavedEventsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const savedEvents = await prisma.savedEvent.findMany({
    where: { userId },
    include: {
      event: {
        include: {
          organizer: {
            select: {
              displayName: true,
              slug: true,
            },
          },
          ticketTiers: {
            where: { isVisible: true },
            orderBy: { price: "asc" },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-bold mb-6 text-white">Watch List</h1>

        {savedEvents.length === 0 ? (
          <div className="text-center py-20 border border-white/10 rounded-lg bg-[#111]">
            <Music2 className="w-12 h-12 text-[#ff1493] mx-auto mb-4 opacity-50" />
            <p className="text-white/60 text-lg">Your watch list is empty.</p>
            <p className="text-white/40 text-sm mt-2">Save events you're interested in to see them here.</p>
            <Link
              href="/events"
              className="inline-block mt-6 px-6 py-3 bg-[#ff1493] text-black font-bold hover:bg-[#ff69b4] transition-colors"
            >
              DISCOVER EVENTS
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {savedEvents.map(({ event }) => {
              const lowestPrice = event.ticketTiers[0]?.price || 0

              return (
                <div key={event.id} className="relative group">
                  <Link
                    href={`/e/${event.organizer.slug}-${event.slug}`}
                    className="block rounded-lg border border-[#222] bg-[#111] overflow-hidden hover:border-[#ff1493]/50 transition-colors"
                  >
                    {event.flyerUrl ? (
                      <div className="relative w-full aspect-[4/3]">
                        <Image
                          src={event.flyerUrl}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-[4/3] bg-gradient-to-br from-[#ff1493]/20 to-[#ff1493]/5 flex items-center justify-center">
                        <CalendarDays className="h-12 w-12 text-[#ff1493]/40" />
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-sm text-gray-400 mb-1">
                        {event.organizer.displayName}
                      </p>
                      <h3 className="font-semibold text-lg text-white group-hover:text-[#ff1493] transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          {new Date(event.startsAt).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.city}
                        </span>
                      </div>
                      <p className="mt-3 font-medium text-[#ff1493]">
                        {lowestPrice === 0 ? "Free" : `From ${formatCents(lowestPrice)}`}
                      </p>
                    </div>
                  </Link>
                  <div className="absolute top-2 right-2">
                    <SaveEventButton 
                      eventId={event.id} 
                      initialIsSaved={true}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

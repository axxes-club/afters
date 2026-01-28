import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { formatCents } from "@/lib/stripe"
import { CalendarDays, MapPin, ArrowRight, Sparkles } from "lucide-react"
import { auth } from "@clerk/nextjs/server"
import { SaveEventButton } from "@/components/SaveEventButton"

// Ensure this page is not cached
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function HomePage() {
  const { userId } = await auth()
  
  // Get upcoming events
  console.log('[HomePage] Fetching events, DATABASE_URL exists:', !!process.env.DATABASE_URL)
  
  let events: Array<{
    id: string
    slug: string
    title: string
    startsAt: Date
    venueName: string
    city: string
    flyerUrl: string | null
    organizer: { id: string; displayName: string; slug: string }
    ticketTiers: Array<{ price: number }>
  }> = []
  
  try {
    events = await prisma.event.findMany({
      where: {
        isPublished: true,
        status: "PUBLISHED",
        startsAt: {
          gte: new Date(),
        },
      },
      include: {
        organizer: {
          select: {
            id: true,
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
      orderBy: { startsAt: "asc" },
      take: 6,
    })
    console.log('[HomePage] Found events:', events.length, events.map(e => e.title))
  } catch (error) {
    console.error('[HomePage] Error fetching events:', error)
  }

  const savedEventIds = userId 
    ? (await prisma.savedEvent.findMany({
        where: { userId },
        select: { eventId: true }
      })).map(s => s.eventId)
    : []

  type EventType = typeof events[number]

  const marqueeText = "AFTERS • AFTER PARTIES • NIGHTLIFE • UNDERGROUND • EXCLUSIVE EVENTS • "

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold font-display tracking-tight">
            AFTERS<span className="text-[#ff1493]">.</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/events" className="text-sm hover:text-[#ff1493] transition-colors">
              EVENTS
            </Link>
            <Link
              href="/dashboard"
              className="text-sm px-4 py-2 bg-[#ff1493] text-black font-medium hover:bg-[#ff69b4] transition-colors"
            >
              HOST
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center pt-20">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#ff1493]/10 via-black to-black pointer-events-none" />

        {/* Animated circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff1493]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#ff1493]/10 rounded-full blur-3xl animate-pulse delay-1000" />

        {/* Marquee */}
        <div className="relative overflow-hidden py-4 border-y border-white/10">
          <div className="animate-marquee whitespace-nowrap flex">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="text-6xl md:text-8xl font-display font-bold text-white/5 mx-4">
                {marqueeText}
              </span>
            ))}
          </div>
        </div>

        {/* Main Hero Content */}
        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="max-w-4xl">
            <p className="text-[#ff1493] font-display text-sm tracking-widest mb-4">
              THE NIGHT STARTS HERE
            </p>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold leading-none mb-6">
              <span className="font-display">WHERE</span>
              <br />
              <span className="text-gradient font-display">LEGENDS</span>
              <br />
              <span className="font-display">GO AFTER</span>
            </h1>
            <p className="text-xl text-white/60 max-w-lg mb-10">
              Exclusive after-parties. Underground events.
              The city&apos;s best kept secrets, now in your pocket.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/events"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-[#ff1493] text-black font-bold text-lg hover:bg-[#ff69b4] transition-all hover-glow"
              >
                EXPLORE EVENTS
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 border border-white/20 text-white font-bold text-lg hover:border-[#ff1493] hover:text-[#ff1493] transition-all"
              >
                HOST YOUR EVENT
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
          <span className="text-xs tracking-widest">SCROLL</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </section>

      {/* Featured Events */}
      <section className="relative py-24 bg-black">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-[#ff1493] font-display text-sm tracking-widest mb-2">WHAT&apos;S HOT</p>
              <h2 className="text-4xl md:text-5xl font-bold font-display">UPCOMING</h2>
            </div>
            <Link
              href="/events"
              className="group flex items-center gap-2 text-white/60 hover:text-[#ff1493] transition-colors"
            >
              <span className="text-sm tracking-widest">VIEW ALL</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-20 border border-white/10">
              <Sparkles className="w-12 h-12 text-[#ff1493] mx-auto mb-4" />
              <p className="text-white/60 text-lg">No events yet. Be the first to drop one.</p>
              <Link
                href="/dashboard"
                className="inline-block mt-6 px-6 py-3 bg-[#ff1493] text-black font-bold hover:bg-[#ff69b4] transition-colors"
              >
                CREATE EVENT
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event: EventType) => {
                const lowestPrice = event.ticketTiers[0]?.price || 0

                return (
                  <Link
                    key={event.id}
                    href={`/e/${event.organizer.slug}-${event.slug}`}
                    className="group relative block overflow-hidden border border-white/10 hover:border-[#ff1493]/50 transition-all duration-300 hover-glow"
                  >
                    {/* Event Image */}
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {event.flyerUrl ? (
                        <Image
                          src={event.flyerUrl}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#ff1493]/20 to-black flex items-center justify-center">
                          <span className="text-6xl font-display text-white/10">A</span>
                        </div>
                      )}
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                      {/* Action buttons */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        {/* Price tag */}
                        <div className="px-3 py-1 bg-[#ff1493] text-black text-sm font-bold">
                          FROM {formatCents(lowestPrice)}
                        </div>
                        <SaveEventButton 
                          eventId={event.id} 
                          initialIsSaved={savedEventIds.includes(event.id)}
                          className="self-end"
                        />
                      </div>
                    </div>

                    {/* Event Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-[#ff1493] text-xs tracking-widest mb-1">
                        {event.organizer.displayName.toUpperCase()}
                      </p>
                      <h3 className="text-xl font-bold font-display mb-3 group-hover:text-[#ff1493] transition-colors">
                        {event.title.toUpperCase()}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-4 h-4" />
                          {new Date(event.startsAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          }).toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.city?.toUpperCase() || "TBA"}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff1493]/20 via-black to-[#ff1493]/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className="container mx-auto px-6 relative z-10 text-center">
          <p className="text-[#ff1493] font-display text-sm tracking-widest mb-4">FOR ORGANIZERS</p>
          <h2 className="text-5xl md:text-7xl font-bold font-display mb-6">
            DROP YOUR<br />
            <span className="text-gradient">NEXT EVENT</span>
          </h2>
          <p className="text-white/60 text-xl max-w-2xl mx-auto mb-10">
            Create your event in minutes. Instant payouts.
            Zero hassle. Let the city come to you.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black font-bold text-lg hover:bg-[#ff1493] transition-all glow-pink"
          >
            GET STARTED FREE
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Stats/Social Proof */}
      <section className="py-20 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10K+", label: "TICKETS SOLD" },
              { value: "500+", label: "EVENTS" },
              { value: "50+", label: "CITIES" },
              { value: "24HR", label: "PAYOUTS" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-4xl md:text-5xl font-bold font-display text-[#ff1493] mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-white/40 tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-display">AFTERS</span>
              <span className="text-[#ff1493]">.</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-white/40">
              <Link href="/events" className="hover:text-[#ff1493] transition-colors">Events</Link>
              <Link href="/dashboard" className="hover:text-[#ff1493] transition-colors">Host</Link>
              <span>&copy; {new Date().getFullYear()}</span>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-white/30">
            from{" "}
            <a 
              href="https://crativo.xyz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#ff1493] hover:text-[#ff69b4] transition-colors"
            >
              jose
            </a>
            {" "}with love
          </div>
        </div>
      </footer>
    </div>
  )
}

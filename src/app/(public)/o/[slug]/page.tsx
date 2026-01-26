import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { CalendarDays, MapPin, Instagram, Youtube, Globe, Music2, Twitter } from "lucide-react"
import { formatCents } from "@/lib/stripe"

// SoundCloud icon component
function SoundCloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.899 1.02c-.051 0-.094.046-.101.1l-.181 1.234.181 1.206c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.21-1.206-.21-1.234c-.009-.06-.052-.1-.099-.1zm1.798-.633c-.051 0-.094.046-.101.1l-.318 1.867.318 1.828c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.35-1.828-.35-1.867c-.009-.06-.052-.1-.099-.1zm.899-.317c-.051 0-.094.046-.101.1l-.265 2.184.265 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.295-2.105-.295-2.184c-.009-.06-.052-.1-.099-.1zm.899-.184c-.051 0-.094.046-.101.1l-.232 2.368.232 2.289c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.289-.255-2.368c-.009-.06-.052-.1-.099-.1zm.899.05c-.051 0-.094.046-.101.1l-.181 2.318.181 2.239c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.21-2.239-.21-2.318c-.009-.06-.052-.1-.099-.1zm1.799-1.435c-.06 0-.111.05-.121.109l-.158 3.694.158 3.539c.01.06.061.109.121.109s.111-.05.121-.109l.175-3.539-.175-3.694c-.01-.06-.061-.109-.121-.109zm.899-.632c-.06 0-.111.05-.121.109l-.105 4.326.105 3.489c.01.06.061.109.121.109s.111-.05.121-.109l.121-3.489-.121-4.326c-.01-.06-.061-.109-.121-.109zm.899-.316c-.06 0-.111.05-.121.109l-.073 4.642.073 3.439c.01.06.061.109.121.109s.111-.05.121-.109l.084-3.439-.084-4.642c-.01-.06-.061-.109-.121-.109zm.899.05c-.06 0-.111.05-.121.109l-.036 4.592.036 3.389c.01.06.061.109.121.109s.111-.05.121-.109l.048-3.389-.048-4.592c-.01-.06-.061-.109-.121-.109zm1.899-1.066c-.075 0-.139.064-.148.139l-.024 5.658.024 3.289c.009.075.073.139.148.139.074 0 .138-.064.147-.139l.036-3.289-.036-5.658c-.009-.075-.073-.139-.147-.139zm.899-.05c-.075 0-.139.064-.148.139v5.708l.012 3.239c.009.075.073.139.148.139.074 0 .138-.064.147-.139l.012-3.239-.024-5.708c-.009-.075-.073-.139-.147-.139zm.899.633c-.075 0-.139.064-.148.139l-.012 5.025.012 3.189c.009.075.073.139.148.139.074 0 .138-.064.147-.139l.012-3.189-.012-5.025c-.009-.075-.073-.139-.147-.139zm3.396-2.032c-.396 0-.779.065-1.136.183-.232-2.628-2.44-4.692-5.13-4.692-.682 0-1.34.138-1.936.389-.222.093-.282.188-.285.372v9.479c.004.193.161.352.354.371l8.133.004c1.775 0 3.215-1.435 3.215-3.203s-1.44-3.203-3.215-3.203z"/>
    </svg>
  )
}

// Spotify icon component  
function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const profile = await prisma.organizerProfile.findUnique({
    where: { slug },
    select: { displayName: true, bio: true },
  })

  if (!profile) {
    return { title: "Artist Not Found | Afters" }
  }

  return {
    title: `${profile.displayName} | Afters`,
    description: profile.bio || `Check out ${profile.displayName}'s upcoming events on Afters`,
  }
}

export default async function ArtistProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const profile = await prisma.organizerProfile.findUnique({
    where: { slug },
    include: {
      events: {
        where: {
          isPublished: true,
          status: "PUBLISHED",
          startsAt: { gte: new Date() },
        },
        include: {
          ticketTiers: {
            where: { isVisible: true },
            orderBy: { price: "asc" },
            take: 1,
          },
        },
        orderBy: { startsAt: "asc" },
        take: 12,
      },
    },
  })

  if (!profile) {
    notFound()
  }

  const pastEventsCount = await prisma.event.count({
    where: {
      organizerId: profile.id,
      isPublished: true,
      startsAt: { lt: new Date() },
    },
  })

  const genres = profile.genres ? JSON.parse(profile.genres) : []

  return (
    <div className="min-h-screen bg-black">
      <Header />

      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-[#ff1493]/20 to-black">
        {profile.coverUrl && (
          <Image
            src={profile.coverUrl}
            alt=""
            fill
            className="object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>

      <main className="container mx-auto px-4 -mt-32 relative z-10 pb-16">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end mb-8">
          {/* Avatar */}
          <div className="relative w-40 h-40 rounded-full border-4 border-black bg-[#111] overflow-hidden shrink-0">
            {profile.logoUrl ? (
              <Image
                src={profile.logoUrl}
                alt={profile.displayName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff1493]/20 to-[#ff1493]/5">
                <span className="text-5xl font-bold text-[#ff1493]">
                  {profile.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {profile.artistType && (
                <span className="text-xs px-2 py-1 bg-[#ff1493]/20 text-[#ff1493] rounded uppercase tracking-wider">
                  {profile.artistType}
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              {profile.displayName}
            </h1>
            {genres.length > 0 && (
              <p className="text-gray-400 mb-4">
                {genres.join(" • ")}
              </p>
            )}
            {profile.bio && (
              <p className="text-gray-300 max-w-2xl">{profile.bio}</p>
            )}
          </div>

          {/* Social Links */}
          <div className="flex gap-3">
            {profile.instagramUrl && (
              <a
                href={profile.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[#111] border border-[#222] flex items-center justify-center hover:border-[#ff1493] hover:text-[#ff1493] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {profile.twitterUrl && (
              <a
                href={profile.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[#111] border border-[#222] flex items-center justify-center hover:border-[#ff1493] hover:text-[#ff1493] transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            )}
            {profile.soundcloudUrl && (
              <a
                href={profile.soundcloudUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[#111] border border-[#222] flex items-center justify-center hover:border-[#ff1493] hover:text-[#ff1493] transition-colors"
              >
                <SoundCloudIcon className="w-5 h-5" />
              </a>
            )}
            {profile.youtubeUrl && (
              <a
                href={profile.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[#111] border border-[#222] flex items-center justify-center hover:border-[#ff1493] hover:text-[#ff1493] transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            )}
            {profile.spotifyUrl && (
              <a
                href={profile.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[#111] border border-[#222] flex items-center justify-center hover:border-[#ff1493] hover:text-[#ff1493] transition-colors"
              >
                <SpotifyIcon className="w-5 h-5" />
              </a>
            )}
            {profile.websiteUrl && (
              <a
                href={profile.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[#111] border border-[#222] flex items-center justify-center hover:border-[#ff1493] hover:text-[#ff1493] transition-colors"
              >
                <Globe className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mb-12 text-sm">
          <div>
            <span className="text-2xl font-bold text-white">{profile.events.length}</span>
            <span className="text-gray-500 ml-2">upcoming events</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-white">{pastEventsCount}</span>
            <span className="text-gray-500 ml-2">past events</span>
          </div>
        </div>

        {/* Upcoming Events */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-[#ff1493]" />
            Upcoming Events
          </h2>

          {profile.events.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Music2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming events scheduled</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {profile.events.map((event) => {
                const lowestPrice = event.ticketTiers[0]?.price || 0

                return (
                  <Link
                    key={event.id}
                    href={`/e/${profile.slug}-${event.slug}`}
                    className="group block rounded-lg border border-[#222] bg-[#111] overflow-hidden hover:border-[#ff1493]/50 transition-colors"
                  >
                    {event.flyerUrl ? (
                      <div className="relative w-full aspect-square">
                        <Image
                          src={event.flyerUrl}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-square bg-gradient-to-br from-[#ff1493]/20 to-[#ff1493]/5 flex items-center justify-center">
                        <CalendarDays className="h-16 w-16 text-[#ff1493]/40" />
                      </div>
                    )}
                    <div className="p-4">
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
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-sm text-gray-400">
                        <MapPin className="h-4 w-4" />
                        {event.venueName}, {event.city}
                      </div>
                      <p className="mt-3 font-medium text-[#ff1493]">
                        {lowestPrice === 0 ? "Free" : `From ${formatCents(lowestPrice)}`}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

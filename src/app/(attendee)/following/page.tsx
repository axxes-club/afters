import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { UserPlus, Music2, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { FollowButton } from "@/components/FollowButton"

export default async function FollowingPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: {
        include: {
          _count: {
            select: { events: { where: { startsAt: { gte: new Date() }, isPublished: true, status: "PUBLISHED" } } }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-bold mb-6 text-white">Following</h1>

        {following.length === 0 ? (
          <div className="text-center py-20 border border-white/10 rounded-lg bg-[#111]">
            <Users className="w-12 h-12 text-[#ff1493] mx-auto mb-4 opacity-50" />
            <p className="text-white/60 text-lg">You're not following any artists or promoters yet.</p>
            <p className="text-white/40 text-sm mt-2">Follow your favorite creators to get updates on their shows.</p>
            <Link
              href="/events"
              className="inline-block mt-6 px-6 py-3 bg-[#ff1493] text-black font-bold hover:bg-[#ff69b4] transition-colors"
            >
              FIND ARTISTS
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {following.map(({ following: profile }) => (
              <div key={profile.id} className="rounded-lg border border-[#222] bg-[#111] p-6 flex flex-col items-center text-center">
                <Link href={`/o/${profile.slug}`} className="group relative w-24 h-24 mb-4">
                  {profile.logoUrl ? (
                    <Image
                      src={profile.logoUrl}
                      alt={profile.displayName}
                      fill
                      className="rounded-full object-cover border-2 border-[#222] group-hover:border-[#ff1493] transition-colors"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#ff1493]/20 to-[#ff1493]/5 flex items-center justify-center border-2 border-[#222] group-hover:border-[#ff1493] transition-colors">
                      <span className="text-3xl font-bold text-[#ff1493]">
                        {profile.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </Link>
                
                <Link href={`/o/${profile.slug}`} className="group">
                  <h2 className="text-xl font-bold text-white group-hover:text-[#ff1493] transition-colors">
                    {profile.displayName}
                  </h2>
                </Link>
                
                {profile.artistType && (
                  <p className="text-xs text-[#ff1493] uppercase tracking-wider mt-1 mb-2">
                    {profile.artistType}
                  </p>
                )}
                
                <p className="text-sm text-gray-400 mb-6">
                  {profile._count.events} upcoming events
                </p>

                <FollowButton 
                  organizerId={profile.id} 
                  initialIsFollowing={true}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

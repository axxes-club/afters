import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    const clerkUser = await currentUser()

    if (!userId || !clerkUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { displayName, slug, bio } = await req.json()

    if (!displayName || !slug) {
      return NextResponse.json(
        { message: "Display name and slug are required" },
        { status: 400 }
      )
    }

    // Check if slug is taken
    const existingSlug = await prisma.organizerProfile.findUnique({
      where: { slug },
    })

    if (existingSlug) {
      return NextResponse.json(
        { message: "This profile URL is already taken" },
        { status: 400 }
      )
    }

    // Ensure user exists in our database (create if not - handles webhook delay)
    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) {
      return NextResponse.json({ message: "No email found" }, { status: 400 })
    }

    let user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      // Create user if webhook hasn't synced yet
      user = await prisma.user.create({
        data: {
          id: userId,
          email,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
        },
      })
    }

    // Try to create Stripe Connect Express account (optional - skip if not configured)
    let stripeAccountId: string | null = null
    try {
      const stripe = getStripe()
      const stripeAccount = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        settings: {
          payouts: {
            schedule: {
              interval: "daily",
            },
          },
        },
      })
      stripeAccountId = stripeAccount.id
    } catch (stripeError) {
      console.warn("Stripe not configured, skipping account creation:", stripeError)
      // Continue without Stripe - user can set up later
    }

    // Create organizer profile
    const profile = await prisma.organizerProfile.create({
      data: {
        userId,
        displayName,
        slug,
        bio: bio || null,
        stripeAccountId,
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error creating organizer profile:", error)
    return NextResponse.json(
      { message: "Failed to create profile" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error fetching organizer profile:", error)
    return NextResponse.json(
      { message: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const existingProfile = await prisma.organizerProfile.findUnique({
      where: { userId },
    })

    if (!existingProfile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 })
    }

    const body = await req.json()
    const { displayName, slug, bio, logoUrl, coverUrl, artistType, genres, instagramUrl, twitterUrl, soundcloudUrl, youtubeUrl, spotifyUrl, websiteUrl } = body

    // If displayName provided, must be non-empty
    if (displayName !== undefined && !displayName.trim()) {
      return NextResponse.json(
        { message: "Display name cannot be empty" },
        { status: 400 }
      )
    }

    // If slug provided, check if valid and not taken
    if (slug !== undefined) {
      if (!slug.trim() || !/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json(
          { message: "Invalid profile URL. Use lowercase letters, numbers, and hyphens only." },
          { status: 400 }
        )
      }

      if (slug !== existingProfile.slug) {
        const slugTaken = await prisma.organizerProfile.findUnique({
          where: { slug },
        })
        if (slugTaken) {
          return NextResponse.json(
            { message: "This profile URL is already taken" },
            { status: 400 }
          )
        }
      }
    }

    const profile = await prisma.organizerProfile.update({
      where: { userId },
      data: {
        ...(displayName !== undefined && { displayName: displayName.trim() }),
        ...(slug !== undefined && { slug: slug.trim() }),
        ...(bio !== undefined && { bio: bio || null }),
        ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
        ...(coverUrl !== undefined && { coverUrl: coverUrl || null }),
        ...(artistType !== undefined && { artistType: artistType || null }),
        ...(genres !== undefined && { genres: genres || null }),
        ...(instagramUrl !== undefined && { instagramUrl: instagramUrl || null }),
        ...(twitterUrl !== undefined && { twitterUrl: twitterUrl || null }),
        ...(soundcloudUrl !== undefined && { soundcloudUrl: soundcloudUrl || null }),
        ...(youtubeUrl !== undefined && { youtubeUrl: youtubeUrl || null }),
        ...(spotifyUrl !== undefined && { spotifyUrl: spotifyUrl || null }),
        ...(websiteUrl !== undefined && { websiteUrl: websiteUrl || null }),
      },
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error updating organizer profile:", error)
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Delete organizer profile (cascades to events due to schema)
    await prisma.organizerProfile.delete({
      where: { userId },
    })

    // Note: The actual Clerk user account should be deleted separately
    // This just removes the organizer profile from our database

    return NextResponse.json({ message: "Profile deleted successfully" })
  } catch (error) {
    console.error("Error deleting organizer profile:", error)
    return NextResponse.json(
      { message: "Failed to delete profile" },
      { status: 500 }
    )
  }
}

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

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const ALLOWED_STATES = ["NC", "SC"]

export async function POST(req: NextRequest) {
  try {
    const { name, email, city, state, instagram, reason } = await req.json()

    if (!name || !email || !city || !state) {
      return NextResponse.json(
        { error: "Name, email, city, and state are required" },
        { status: 400 }
      )
    }

    if (!ALLOWED_STATES.includes(state)) {
      return NextResponse.json(
        { error: "The beta program is currently only available in North Carolina and South Carolina" },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      )
    }

    const existing = await prisma.betaEntry.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existing) {
      return NextResponse.json(
        { error: "This email is already registered for the beta program" },
        { status: 409 }
      )
    }

    const entry = await prisma.betaEntry.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        city: city.trim(),
        state,
        instagram: instagram?.trim() || null,
        reason: reason?.trim() || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Welcome to the Early Access Club!",
      id: entry.id,
    })
  } catch (error) {
    console.error("Beta entry error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}

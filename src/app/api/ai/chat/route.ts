import { streamText } from "ai"
import { auth } from "@clerk/nextjs/server"
import { AI_MODEL, AFTIE_SYSTEM_PROMPT, aftieTools } from "@/lib/ai"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    // Check if API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY not configured")
      return new Response("AI service not configured", { status: 503 })
    }

    const { userId } = await auth()
    if (!userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Get user's organizer profile
    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return new Response("Organizer profile required", { status: 400 })
    }

    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 })
    }

    // Create tools with actual execution logic
    const tools = {
      createEvent: {
        ...aftieTools.createEvent,
        execute: async (params: {
          title: string
          description?: string
          venueName: string
          venueAddress: string
          city: string
          state?: string
          startsAt: string
          endsAt?: string
          ageRestriction?: number
          lineup?: Array<{ name: string; role?: string }>
        }) => {
          try {
            // Generate slug
            const baseSlug = params.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")

            let slug = baseSlug
            let counter = 1
            while (true) {
              const existing = await prisma.event.findFirst({
                where: { organizerId: profile.id, slug },
              })
              if (!existing) break
              slug = `${baseSlug}-${counter}`
              counter++
            }

            const event = await prisma.event.create({
              data: {
                organizerId: profile.id,
                title: params.title,
                slug,
                description: params.description || null,
                venueName: params.venueName,
                venueAddress: params.venueAddress,
                city: params.city,
                state: params.state || null,
                startsAt: new Date(params.startsAt),
                endsAt: params.endsAt ? new Date(params.endsAt) : null,
                ageRestriction: params.ageRestriction || null,
                lineup: params.lineup || null,
                timezone: "America/New_York",
                status: "DRAFT",
                isPublished: false,
              },
            })

            return {
              success: true,
              event: {
                id: event.id,
                title: event.title,
                slug: event.slug,
                startsAt: event.startsAt,
                status: "DRAFT",
              },
              message: `Created "${event.title}" as a draft. You can view and publish it at /d/events/${event.id}`,
            }
          } catch (error) {
            console.error("Create event error:", error)
            return { success: false, error: "Failed to create event" }
          }
        },
      },

      listEvents: {
        ...aftieTools.listEvents,
        execute: async (params: { status?: "all" | "upcoming" | "past" | "draft" }) => {
          try {
            const now = new Date()
            const where: Record<string, unknown> = { organizerId: profile.id }

            if (params.status === "upcoming") {
              where.startsAt = { gte: now }
              where.isPublished = true
            } else if (params.status === "past") {
              where.startsAt = { lt: now }
            } else if (params.status === "draft") {
              where.isPublished = false
            }

            const events = await prisma.event.findMany({
              where,
              orderBy: { startsAt: "desc" },
              take: 10,
              select: {
                id: true,
                title: true,
                slug: true,
                startsAt: true,
                isPublished: true,
                city: true,
              },
            })

            return {
              success: true,
              events: events.map((e) => ({
                id: e.id,
                title: e.title,
                date: e.startsAt.toLocaleDateString(),
                city: e.city,
                status: e.isPublished ? "Published" : "Draft",
              })),
              count: events.length,
            }
          } catch (error) {
            console.error("List events error:", error)
            return { success: false, error: "Failed to list events" }
          }
        },
      },

      updateEvent: {
        ...aftieTools.updateEvent,
        execute: async (params: {
          eventId: string
          title?: string
          description?: string
          venueName?: string
          venueAddress?: string
          startsAt?: string
        }) => {
          try {
            // Verify ownership
            const existing = await prisma.event.findFirst({
              where: { id: params.eventId, organizerId: profile.id },
            })

            if (!existing) {
              return { success: false, error: "Event not found" }
            }

            const updateData: Record<string, unknown> = {}
            if (params.title) updateData.title = params.title
            if (params.description) updateData.description = params.description
            if (params.venueName) updateData.venueName = params.venueName
            if (params.venueAddress) updateData.venueAddress = params.venueAddress
            if (params.startsAt) updateData.startsAt = new Date(params.startsAt)

            const event = await prisma.event.update({
              where: { id: params.eventId },
              data: updateData,
            })

            return {
              success: true,
              event: { id: event.id, title: event.title },
              message: `Updated "${event.title}"`,
            }
          } catch (error) {
            console.error("Update event error:", error)
            return { success: false, error: "Failed to update event" }
          }
        },
      },

      publishEvent: {
        ...aftieTools.publishEvent,
        execute: async (params: { eventId: string }) => {
          try {
            // Verify ownership
            const existing = await prisma.event.findFirst({
              where: { id: params.eventId, organizerId: profile.id },
            })

            if (!existing) {
              return { success: false, error: "Event not found" }
            }

            const event = await prisma.event.update({
              where: { id: params.eventId },
              data: { isPublished: true, status: "PUBLISHED" },
            })

            return {
              success: true,
              event: { id: event.id, title: event.title, slug: event.slug },
              message: `Published "${event.title}"! View it at /e/${event.slug}`,
            }
          } catch (error) {
            console.error("Publish event error:", error)
            return { success: false, error: "Failed to publish event" }
          }
        },
      },
    }

    const result = streamText({
      model: AI_MODEL,
      system: AFTIE_SYSTEM_PROMPT,
      messages,
      tools,
      maxSteps: 5, // Allow multiple tool calls
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return new Response(`Failed to process chat: ${errorMessage}`, { status: 500 })
  }
}

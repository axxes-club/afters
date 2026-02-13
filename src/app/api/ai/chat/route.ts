import { streamText, tool, zodSchema } from "ai"
import { auth } from "@clerk/nextjs/server"
import { AI_MODEL, AFTIE_SYSTEM_PROMPT } from "@/lib/ai"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

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

    // Create tools with actual execution logic using AI SDK v6 format
    const tools = {
      createEvent: tool({
        description: "Create a new event for the user. Use this when the user wants to create an event.",
        inputSchema: zodSchema(z.object({
          title: z.string().describe("Event title/name"),
          description: z.string().optional().describe("Event description"),
          venueName: z.string().describe("Venue name"),
          venueAddress: z.string().describe("Full venue address"),
          city: z.string().describe("City name"),
          state: z.string().optional().describe("State abbreviation (e.g., NY, CA)"),
          startsAt: z.string().describe("Start date/time in ISO format (e.g., 2024-03-15T22:00:00)"),
          endsAt: z.string().optional().describe("End date/time in ISO format"),
          ageRestriction: z.number().optional().describe("Minimum age (e.g., 21)"),
        })),
        execute: async (params) => {
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
                startsAt: event.startsAt.toISOString(),
                status: "DRAFT",
              },
              message: `Created "${event.title}" as a draft. You can view and publish it at /d/events/${event.id}`,
            }
          } catch (error) {
            console.error("Create event error:", error)
            return { success: false, error: "Failed to create event" }
          }
        },
      }),

      listEvents: tool({
        description: "List the user's events. Use this when user asks about their events.",
        inputSchema: zodSchema(z.object({
          status: z.enum(["all", "upcoming", "past", "draft"]).optional().describe("Filter by status"),
        })),
        execute: async (params) => {
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
      }),

      updateEvent: tool({
        description: "Update an existing event",
        inputSchema: zodSchema(z.object({
          eventId: z.string().describe("The event ID to update"),
          title: z.string().optional(),
          description: z.string().optional(),
          venueName: z.string().optional(),
          venueAddress: z.string().optional(),
          startsAt: z.string().optional(),
        })),
        execute: async (params) => {
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
      }),

      publishEvent: tool({
        description: "Publish a draft event to make it live",
        inputSchema: zodSchema(z.object({
          eventId: z.string().describe("The event ID to publish"),
        })),
        execute: async (params) => {
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
      }),
    }

    const result = streamText({
      model: AI_MODEL,
      system: AFTIE_SYSTEM_PROMPT,
      messages,
      tools,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Chat error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return new Response(`Failed to process chat: ${errorMessage}`, { status: 500 })
  }
}

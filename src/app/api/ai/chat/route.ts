import { generateText, tool, stepCountIs } from "ai"
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

    const { messages, context } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 })
    }

    // Build context-aware system prompt addition
    let contextInfo = ""
    if (context?.page === "event-details" && context?.eventId) {
      contextInfo = `\n\nCURRENT CONTEXT:
- Page: Event details dashboard
- Event ID: "${context.eventId}"
- Event Title: "${context.eventTitle || "Unknown"}"
${context.editingField ? `- Currently Editing: ${context.editingField} field` : ""}
${context.eventDetails ? `- Event Details:
  - Venue: ${context.eventDetails.venueName || "Not set"}
  - City: ${context.eventDetails.city || "Not set"}
  - Date: ${context.eventDetails.startsAt || "Not set"}
  - Lineup: ${context.eventDetails.lineup?.map((a: { name: string }) => a.name).join(", ") || "Not set"}
  - Genre/Vibe: ${context.eventDetails.genre || context.eventDetails.vibe || "Not specified"}` : ""}

Use this context for any questions about "this event", ticket sales, or content writing requests.`
    } else if (context?.page === "events") {
      contextInfo = "\n\nCURRENT CONTEXT: User is on the events list page."
    } else if (context?.page === "event-new") {
      contextInfo = "\n\nCURRENT CONTEXT: User is creating a new event."
    }

    // Create tools with proper typing
    const tools = {
      createEvent: tool({
        description: "Create a new event for the user. Use this when the user wants to create an event. After creating, tell the user what was created and provide the dashboard link.",
        inputSchema: z.object({
          title: z.string().describe("Event title/name"),
          description: z.string().optional().describe("Event description"),
          venueName: z.string().describe("Venue name"),
          venueAddress: z.string().describe("Full venue address"),
          city: z.string().describe("City name"),
          state: z.string().optional().describe("State abbreviation (e.g., NY, CA)"),
          startsAt: z.string().describe("Start date/time in ISO format (e.g., 2024-03-15T22:00:00)"),
          endsAt: z.string().optional().describe("End date/time in ISO format"),
          ageRestriction: z.number().optional().describe("Minimum age (e.g., 21)"),
        }),
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
              eventId: event.id,
              eventTitle: event.title,
              slug: event.slug,
              startsAt: event.startsAt.toISOString(),
              status: "DRAFT",
              dashboardUrl: `/d/events/${event.id}`,
              publicUrl: `/e/${event.slug}`,
            }
          } catch (error) {
            console.error("Create event error:", error)
            return { success: false, error: "Failed to create event" }
          }
        },
      }),

      listEvents: tool({
        description: "List the user's events. Use this when user asks about their events.",
        inputSchema: z.object({
          status: z.enum(["all", "upcoming", "past", "draft"]).optional().describe("Filter by status"),
        }),
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
                dashboardUrl: `/d/events/${e.id}`,
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
        description: "Update an existing event. Can update basic info, timing, location, design, content, and lineup. After updating, confirm what was changed.",
        inputSchema: z.object({
          eventId: z.string().describe("The event ID to update"),
          // Basic info
          title: z.string().optional().describe("Event title"),
          description: z.string().optional().describe("Short event description"),
          // Timing
          startsAt: z.string().optional().describe("Start date/time in ISO format"),
          endsAt: z.string().optional().describe("End date/time in ISO format"),
          timezone: z.string().optional().describe("Timezone (e.g., America/New_York)"),
          // Location
          venueName: z.string().optional().describe("Venue name"),
          venueAddress: z.string().optional().describe("Full venue address"),
          city: z.string().optional().describe("City name"),
          state: z.string().optional().describe("State abbreviation"),
          // Event details
          ageRestriction: z.number().optional().describe("Minimum age (e.g., 21)"),
          flyerUrl: z.string().optional().describe("URL to event flyer image"),
          about: z.string().optional().describe("Detailed about section for the event"),
          refundPolicy: z.string().optional().describe("Refund/cancellation policy text"),
          // Lineup - array of artists
          lineup: z.array(z.object({
            name: z.string().describe("Artist name"),
            role: z.string().optional().describe("Role like 'Headliner', 'Support', 'DJ'"),
            imageUrl: z.string().optional().describe("Artist image URL"),
            socialUrl: z.string().optional().describe("Artist social media URL"),
          })).optional().describe("Event lineup array"),
          // FAQs
          faqs: z.array(z.object({
            question: z.string().describe("FAQ question"),
            answer: z.string().describe("FAQ answer"),
          })).optional().describe("Frequently asked questions array"),
          // Gallery
          gallery: z.array(z.string()).optional().describe("Array of gallery image URLs"),
          // Design
          pageTheme: z.enum(["brutalist", "neon", "minimal", "tilt", "lush", "nice", "editorial", "card", "vapor"]).optional().describe("Event page visual theme"),
          accentColor: z.string().optional().describe("Accent color in hex format (e.g., #ff1493)"),
          typography: z.enum(["mono", "headline", "elegant", "modern"]).optional().describe("Typography style"),
        }),
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

            // Basic info
            if (params.title) updateData.title = params.title
            if (params.description) updateData.description = params.description

            // Timing
            if (params.startsAt) updateData.startsAt = new Date(params.startsAt)
            if (params.endsAt) updateData.endsAt = new Date(params.endsAt)
            if (params.timezone) updateData.timezone = params.timezone

            // Location
            if (params.venueName) updateData.venueName = params.venueName
            if (params.venueAddress) updateData.venueAddress = params.venueAddress
            if (params.city) updateData.city = params.city
            if (params.state) updateData.state = params.state

            // Event details
            if (params.ageRestriction !== undefined) updateData.ageRestriction = params.ageRestriction
            if (params.flyerUrl) updateData.flyerUrl = params.flyerUrl
            if (params.about) updateData.about = params.about
            if (params.refundPolicy) updateData.refundPolicy = params.refundPolicy

            // JSON fields
            if (params.lineup) updateData.lineup = params.lineup
            if (params.faqs) updateData.faqs = params.faqs
            if (params.gallery) updateData.gallery = params.gallery

            // Design
            if (params.pageTheme) updateData.pageTheme = params.pageTheme
            if (params.accentColor) updateData.accentColor = params.accentColor
            if (params.typography) updateData.typography = params.typography

            const event = await prisma.event.update({
              where: { id: params.eventId },
              data: updateData,
            })

            return {
              success: true,
              eventId: event.id,
              eventTitle: event.title,
              updatedFields: Object.keys(updateData),
              dashboardUrl: `/d/events/${event.id}`,
            }
          } catch (error) {
            console.error("Update event error:", error)
            return { success: false, error: "Failed to update event" }
          }
        },
      }),

      publishEvent: tool({
        description: "Publish a draft event to make it live. After publishing, provide both dashboard and public URLs.",
        inputSchema: z.object({
          eventId: z.string().describe("The event ID"),
        }),
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
              eventId: event.id,
              eventTitle: event.title,
              slug: event.slug,
              dashboardUrl: `/d/events/${event.id}`,
              publicUrl: `/e/${event.slug}`,
            }
          } catch (error) {
            console.error("Publish event error:", error)
            return { success: false, error: "Failed to publish event" }
          }
        },
      }),

      getEventStats: tool({
        description: "Get ticket sales and check-in statistics for an event. Use this when user asks about tickets sold, revenue, check-ins, or attendees.",
        inputSchema: z.object({
          eventId: z.string().describe("The event ID"),
        }),
        execute: async (params) => {
          try {
            // Verify ownership and get event with stats
            const event = await prisma.event.findFirst({
              where: { id: params.eventId, organizerId: profile.id },
              include: {
                ticketTiers: {
                  select: {
                    name: true,
                    price: true,
                    quantity: true,
                    quantitySold: true,
                  },
                },
                tickets: {
                  select: {
                    checkedInAt: true,
                  },
                },
                _count: {
                  select: {
                    orders: true,
                  },
                },
              },
            })

            if (!event) {
              return { success: false, error: "Event not found" }
            }

            const totalSold = event.ticketTiers.reduce((sum, t) => sum + t.quantitySold, 0)
            const totalCapacity = event.ticketTiers.reduce((sum, t) => sum + t.quantity, 0)
            const totalRevenue = event.ticketTiers.reduce((sum, t) => sum + (t.quantitySold * t.price), 0)
            const checkedIn = event.tickets.filter(t => t.checkedInAt !== null).length

            // For RSVP events
            if (event.isRsvpOnly) {
              return {
                success: true,
                eventTitle: event.title,
                isRsvpEvent: true,
                rsvpCount: event.rsvpCount,
                rsvpCapacity: event.rsvpCapacity,
                checkedIn,
              }
            }

            return {
              success: true,
              eventTitle: event.title,
              totalTicketsSold: totalSold,
              totalCapacity,
              checkedIn,
              totalRevenue: totalRevenue / 100, // Convert cents to dollars
              orderCount: event._count.orders,
              tierBreakdown: event.ticketTiers.map(t => ({
                name: t.name,
                sold: t.quantitySold,
                capacity: t.quantity,
                price: t.price / 100,
              })),
            }
          } catch (error) {
            console.error("Get event stats error:", error)
            return { success: false, error: "Failed to get event stats" }
          }
        },
      }),

      generateFlyer: tool({
        description: "Generate an AI flyer image for an event. Currently not available - feature coming soon.",
        inputSchema: z.object({
          eventId: z.string().describe("The event ID to generate a flyer for"),
        }),
        execute: async () => {
          return {
            success: false,
            error: "AI flyer generation is coming soon! For now, you can upload your own flyer image in the event editor.",
          }
        },
      }),
    }

    // Use generateText instead of streamText for proper tool execution
    // Groq's streaming doesn't properly handle tool calls
    const result = await generateText({
      model: AI_MODEL,
      system: AFTIE_SYSTEM_PROMPT + contextInfo,
      messages,
      tools,
      stopWhen: stepCountIs(5), // Allow multiple steps so AI can respond AFTER tool execution
    })

    // Return the text response
    return new Response(result.text, {
      headers: { "Content-Type": "text/plain" },
    })
  } catch (error) {
    console.error("Chat error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return new Response(`Failed to process chat: ${errorMessage}`, { status: 500 })
  }
}

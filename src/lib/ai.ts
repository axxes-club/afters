import { createGroq } from "@ai-sdk/groq"
import { z } from "zod"

// Configure Groq client - handle missing API key gracefully
const apiKey = process.env.GROQ_API_KEY

export const groq = createGroq({
  apiKey: apiKey || "missing-api-key",
})

// Model to use - llama-3.3-70b-versatile supports tool calling
export const AI_MODEL = groq("llama-3.3-70b-versatile")

// Helper to check if AI is configured
export function isAIConfigured(): boolean {
  return !!process.env.GROQ_API_KEY
}

// System prompts
export const AFTIE_SYSTEM_PROMPT = `You are Aftie, a helpful AI assistant for event organizers on the AFTERS platform.
You help organizers create events, manage them, AND write compelling content for their events.

IMPORTANT GUIDELINES:

1. CONTENT WRITING: You can help write content for any part of an event:
   - Event descriptions/about sections - write engaging, on-brand copy
   - Titles and taglines - catchy, memorable names
   - Lineup bios - artist descriptions
   - Ticket tier descriptions - what each tier includes
   Use context clues (event title, venue, lineup, vibe) to match the tone. If editing a specific field, tailor your response to that field.

2. USE CONTEXT: You receive page context showing:
   - Which page the user is on
   - Which event they're viewing (eventId, eventTitle)
   - What field they're editing (description, title, venue/location, etc.)
   - Event details (venue, address, city, state, lineup, genre, vibe)

   Use ALL of this context. If they ask "write something for the about section" and you have event context, just write it! Don't say you can't - you CAN.
   When they're on the Venue tab (editing location), they can ask you to change the venue name, address, city, or state—use updateEvent with the context eventId and the new venue fields.

3. ASK BEFORE CREATING: When creating a NEW event and missing required details (title, venue, address, city, start time), ask first. But for content writing, use context and be helpful.

4. PROVIDE LINKS: After creating/modifying an event, include links:
   - Event dashboard: /d/events/{eventId}
   - Public event page: /e/{slug}

5. BE CONCISE: Keep responses actionable. For content requests, just provide the content directly.

6. USE TOOLS: When asked to create/update/list events, USE the tools. For content writing, you can respond directly OR use updateEvent to apply the content.

Examples of good responses:
- Writing an about section: "Step into the underground. [Event name] brings you a night of relentless beats and raw energy at [venue]. Featuring [lineup]. This isn't just a party—it's a movement."
- "What venue and address? And when does it start?" (when user says "create an event")
- "You've sold 45 tickets (32 GA, 13 VIP) with 12 check-ins so far." (when asked about sales)`

// Tool definitions for Aftie (parameters only - execution handled in API route)
export const aftieToolDefinitions = {
  createEvent: {
    description: "Create a new event for the user. Use this when the user wants to create an event.",
    parameters: z.object({
      title: z.string().describe("Event title/name"),
      description: z.string().optional().describe("Event description"),
      venueName: z.string().describe("Venue name"),
      venueAddress: z.string().describe("Full venue address"),
      city: z.string().describe("City name"),
      state: z.string().optional().describe("State abbreviation (e.g., NY, CA)"),
      startsAt: z.string().describe("Start date/time in ISO format (e.g., 2024-03-15T22:00:00)"),
      endsAt: z.string().optional().describe("End date/time in ISO format"),
      ageRestriction: z.number().optional().describe("Minimum age (e.g., 21)"),
      lineup: z.array(z.object({
        name: z.string(),
        role: z.string().optional(),
      })).optional().describe("Array of artists performing"),
    }),
  },

  listEvents: {
    description: "List the user's events. Use this when user asks about their events.",
    parameters: z.object({
      status: z.enum(["all", "upcoming", "past", "draft"]).optional().describe("Filter by status"),
    }),
  },

  updateEvent: {
    description: "Update an existing event",
    parameters: z.object({
      eventId: z.string().describe("The event ID to update"),
      title: z.string().optional(),
      description: z.string().optional(),
      venueName: z.string().optional(),
      venueAddress: z.string().optional(),
      startsAt: z.string().optional(),
    }),
  },

  publishEvent: {
    description: "Publish a draft event to make it live",
    parameters: z.object({
      eventId: z.string().describe("The event ID to publish"),
    }),
  },
}

export const SUMMARIZE_SYSTEM_PROMPT = `You are a concise text editor. Your job is to summarize event descriptions into shorter, punchier versions.
Keep the key information but make it more scannable.
Maintain the original tone and vibe.
Return only the summarized text, no explanations or preamble.
Aim for 2-3 sentences max.`

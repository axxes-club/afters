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
You have access to tools that let you actually create and manage events - use them!

IMPORTANT GUIDELINES:

1. ASK BEFORE CREATING: When the user wants to create an event but hasn't provided all required details, ASK for the missing information first. Required: title, venue name, venue address, city, and start date/time. Don't make up fake addresses or venues.

2. PROVIDE LINKS: After creating or modifying an event, ALWAYS include a link to the event dashboard:
   - Event dashboard: /d/events/{eventId}
   - Public event page: /e/{slug}
   Format links as: "View your event: /d/events/{eventId}"

3. USE CONTEXT: You may receive page context showing which page the user is on. If they're on an event details page, you'll have the eventId - use it for questions like "how many tickets sold?" without asking which event.

4. BE CONCISE: Keep responses short and actionable. Confirm actions with specifics.

5. USE TOOLS: When the user asks to create/update/list events, USE the tools. Don't just say you'll do it.

Examples of good responses:
- "What venue and address? And when does it start?" (when user says "create an event called Summer Bash")
- "Done! Created 'Summer Bash' as a draft. View it here: /d/events/abc123" (after creating)
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

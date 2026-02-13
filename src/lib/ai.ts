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

When the user asks to create an event, USE the createEvent tool. Don't just say you'll create it - actually do it.
When the user asks about their events, USE the listEvents tool.

Be concise and friendly. When you successfully create or modify something, confirm what you did.
Keep responses short and actionable.`

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

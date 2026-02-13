import { streamText } from "ai"
import { AI_MODEL, AFTYS_SYSTEM_PROMPT } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    // Check if API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY not configured")
      return new Response("AI service not configured", { status: 503 })
    }

    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 })
    }

    const result = streamText({
      model: AI_MODEL,
      system: AFTYS_SYSTEM_PROMPT,
      messages,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Chat error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return new Response(`Failed to process chat: ${errorMessage}`, { status: 500 })
  }
}

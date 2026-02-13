import { streamText } from "ai"
import { AI_MODEL, AFTYS_SYSTEM_PROMPT } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const result = streamText({
      model: AI_MODEL,
      system: AFTYS_SYSTEM_PROMPT,
      messages,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Chat error:", error)
    return new Response("Failed to process chat", { status: 500 })
  }
}

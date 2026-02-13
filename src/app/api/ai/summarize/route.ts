import { generateText } from "ai"
import { AI_MODEL, SUMMARIZE_SYSTEM_PROMPT } from "@/lib/ai"

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text || text.trim().length < 50) {
      return Response.json({
        summary: text,
        message: "Text too short to summarize"
      })
    }

    const result = await generateText({
      model: AI_MODEL,
      system: SUMMARIZE_SYSTEM_PROMPT,
      prompt: text,
    })

    return Response.json({ summary: result.text })
  } catch (error) {
    console.error("Summarize error:", error)
    return Response.json(
      { error: "Failed to summarize text" },
      { status: 500 }
    )
  }
}

import { generateText } from "ai"
import { AI_MODEL, SUMMARIZE_SYSTEM_PROMPT } from "@/lib/ai"
import { getUserId } from "@/lib/auth/session"

const MAX_INPUT_LENGTH = 10000 // 10k character limit to prevent abuse

export async function POST(req: Request) {
  try {
    // Require authentication to prevent anonymous API credit burn
    const userId = await getUserId()
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text } = await req.json()

    if (!text || text.trim().length < 50) {
      return Response.json({
        summary: text,
        message: "Text too short to summarize"
      })
    }

    // Enforce max input length to prevent excessive API usage
    if (text.length > MAX_INPUT_LENGTH) {
      return Response.json(
        { error: `Text exceeds maximum length of ${MAX_INPUT_LENGTH} characters` },
        { status: 400 }
      )
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

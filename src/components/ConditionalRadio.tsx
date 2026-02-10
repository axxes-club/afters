import { prisma } from "@/lib/prisma"
import { AftersRadio } from "./AftersRadio"

async function getRadioEnabled() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
      select: { radioWidgetEnabled: true },
    })
    // Default to true if no settings exist yet
    return settings?.radioWidgetEnabled ?? true
  } catch (error) {
    console.error("Failed to fetch radio settings:", error)
    return true // Default to showing radio on error
  }
}

export async function ConditionalRadio() {
  const radioEnabled = await getRadioEnabled()

  if (!radioEnabled) {
    return null
  }

  return <AftersRadio />
}

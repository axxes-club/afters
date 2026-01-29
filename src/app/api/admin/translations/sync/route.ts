import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// Import message files
import en from '../../../../../../messages/en.json'
import esES from '../../../../../../messages/es-ES.json'
import esLA from '../../../../../../messages/es-LA.json'
import ptBR from '../../../../../../messages/pt-BR.json'

type MessageObject = Record<string, unknown>

const messageFiles: Record<string, MessageObject> = {
  'en': en,
  'es-ES': esES,
  'es-LA': esLA,
  'pt-BR': ptBR,
}

// Flatten nested object into dot notation keys
function flattenMessages(obj: MessageObject, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenMessages(value as MessageObject, newKey))
    } else {
      result[newKey] = String(value)
    }
  }
  
  return result
}

// Extract namespace and key from flattened key
function parseKey(flatKey: string): { namespace: string; key: string } {
  const parts = flatKey.split('.')
  const namespace = parts[0]
  const key = parts.slice(1).join('.')
  return { namespace, key }
}

// Sync translations from JSON files to database
export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let count = 0

    for (const [locale, messages] of Object.entries(messageFiles)) {
      const flattened = flattenMessages(messages)
      
      for (const [flatKey, value] of Object.entries(flattened)) {
        const { namespace, key } = parseKey(flatKey)
        
        await prisma.translation.upsert({
          where: {
            locale_namespace_key: { locale, namespace, key }
          },
          update: {
            // Only update if not previously modified by admin
            // This preserves manual edits
          },
          create: {
            locale,
            namespace,
            key,
            value,
          }
        })
        count++
      }
    }

    return NextResponse.json({ success: true, count })
  } catch (error) {
    console.error("Error syncing translations:", error)
    return NextResponse.json({ error: "Failed to sync translations" }, { status: 500 })
  }
}

import { prisma } from './prisma'
import type { Locale } from '@/i18n/config'

// Pre-import static message files as fallback
import en from '../../messages/en.json'
import esES from '../../messages/es-ES.json'
import esLA from '../../messages/es-LA.json'
import ptBR from '../../messages/pt-BR.json'

const staticMessages: Record<Locale, typeof en> = {
  'en': en,
  'es-ES': esES,
  'es-LA': esLA,
  'pt-BR': ptBR,
}

type MessageObject = Record<string, unknown>

// Convert flat DB records to nested object
function unflattenMessages(translations: Array<{ namespace: string; key: string; value: string }>): MessageObject {
  const result: MessageObject = {}
  
  for (const { namespace, key, value } of translations) {
    if (!result[namespace]) {
      result[namespace] = {}
    }
    
    // Handle nested keys (e.g., "button.submit" -> { button: { submit: value } })
    const keys = key.split('.')
    let current = result[namespace] as MessageObject
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {}
      }
      current = current[keys[i]] as MessageObject
    }
    
    current[keys[keys.length - 1]] = value
  }
  
  return result
}

// Deep merge two objects (db overrides static)
function deepMerge(target: MessageObject, source: MessageObject): MessageObject {
  const result = { ...target }
  
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        (result[key] as MessageObject) || {},
        source[key] as MessageObject
      )
    } else {
      result[key] = source[key]
    }
  }
  
  return result
}

// Get messages for a locale, merging DB overrides with static files
export async function getMessagesForLocale(locale: Locale): Promise<MessageObject> {
  const staticMsgs = staticMessages[locale] || staticMessages['en']
  
  try {
    // Fetch DB translations for this locale
    const dbTranslations = await prisma.translation.findMany({
      where: { locale },
      select: { namespace: true, key: true, value: true }
    })
    
    if (dbTranslations.length === 0) {
      return staticMsgs
    }
    
    // Convert flat DB records to nested structure
    const dbMessages = unflattenMessages(dbTranslations)
    
    // Merge: DB overrides static
    return deepMerge(staticMsgs, dbMessages)
  } catch (error) {
    // If DB fails, fall back to static messages
    console.error('Failed to fetch DB translations, using static:', error)
    return staticMsgs
  }
}

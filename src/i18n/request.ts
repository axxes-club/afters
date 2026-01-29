import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, locales, type Locale } from './config'

// Pre-import all message files to avoid dynamic import issues
import en from '../../messages/en.json'
import esES from '../../messages/es-ES.json'
import esLA from '../../messages/es-LA.json'
import ptBR from '../../messages/pt-BR.json'

const messages: Record<Locale, typeof en> = {
  'en': en,
  'es-ES': esES,
  'es-LA': esLA,
  'pt-BR': ptBR,
}

export default getRequestConfig(async () => {
  // Get locale from cookie or default
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value as Locale | undefined
  const locale = localeCookie && locales.includes(localeCookie) ? localeCookie : defaultLocale

  return {
    locale,
    messages: messages[locale]
  }
})

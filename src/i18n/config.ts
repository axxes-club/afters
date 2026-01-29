export const locales = ['en', 'es-ES', 'es-LA', 'pt-BR'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  'en': 'English',
  'es-ES': 'Español (España)',
  'es-LA': 'Español (Latinoamérica)',
  'pt-BR': 'Português (Brasil)',
}

export const localeFlags: Record<Locale, string> = {
  'en': '🇺🇸',
  'es-ES': '🇪🇸',
  'es-LA': '🇲🇽',
  'pt-BR': '🇧🇷',
}

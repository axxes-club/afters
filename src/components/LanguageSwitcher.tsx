"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe, Check } from 'lucide-react'
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config'

export function LanguageSwitcher() {
  const router = useRouter()
  const [currentLocale, setCurrentLocale] = useState<Locale>('en')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Get current locale from cookie
    fetch('/api/locale')
      .then(res => res.json())
      .then(data => setCurrentLocale(data.locale as Locale))
      .catch(() => {})
  }, [])

  const changeLocale = async (locale: Locale) => {
    if (locale === currentLocale) return
    
    setIsLoading(true)
    try {
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      })
      setCurrentLocale(locale)
      router.refresh()
    } catch (error) {
      console.error('Failed to change locale:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isLoading} className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{localeFlags[currentLocale]} {localeNames[currentLocale]}</span>
          <span className="sm:hidden">{localeFlags[currentLocale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => changeLocale(locale)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>{localeFlags[locale]}</span>
              <span>{localeNames[locale]}</span>
            </span>
            {currentLocale === locale && <Check className="h-4 w-4 text-[#ff1493]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

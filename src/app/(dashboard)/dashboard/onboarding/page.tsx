"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const t = useTranslations('onboarding')
  const tSettings = useTranslations('settings')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const displayName = formData.get("displayName") as string
    const slug = formData.get("slug") as string
    const bio = formData.get("bio") as string

    try {
      const res = await fetch("/api/organizer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, slug, bio }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || tErrors('generic'))
      }

      toast.success(t('profileCreated'))
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tErrors('generic'))
    } finally {
      setLoading(false)
    }
  }

  const suggestedSlug = user?.firstName?.toLowerCase().replace(/[^a-z0-9]/g, "") || ""

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>
            {t('subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">{t('displayNameLabel')}</Label>
              <Input
                id="displayName"
                name="displayName"
                placeholder={t('displayNamePlaceholder')}
                defaultValue={user?.fullName || ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">{t('profileUrlLabel')}</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">afters.xxx/o/</span>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="yourname"
                  defaultValue={suggestedSlug}
                  pattern="^[a-z0-9-]+$"
                  title={tSettings('profileUrlHint')}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{tSettings('bioOptional')}</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder={tSettings('bioOptionalPlaceholder')}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? tCommon('creating') : t('createProfile')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

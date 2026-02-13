'use client'

import { useState } from 'react'
import EditDesignButton from './EditDesignButton'

interface DesignSettings {
  accentColor: string
  typography: string
  pageTheme: string
  showLocationOnPage: boolean
  showMapOnPage: boolean
  isAddressHidden: boolean
}

interface EventPageClientProps {
  eventId: string
  initialDesign: DesignSettings
  isOwner: boolean
  children: (design: DesignSettings) => React.ReactNode
}

export default function EventPageClient({ eventId, initialDesign, isOwner, children }: EventPageClientProps) {
  const [liveDesign, setLiveDesign] = useState(initialDesign)

  return (
    <>
      {isOwner && (
        <EditDesignButton
          eventId={eventId}
          initialDesign={initialDesign}
          onDesignChange={setLiveDesign}
        />
      )}
      {children(liveDesign)}
    </>
  )
}

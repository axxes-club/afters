'use client'

import { useState } from 'react'
import EditDesignButton from './EditDesignButton'

interface EventPageClientProps {
  event: any
  isOwner: boolean
  children: (design: any) => React.ReactNode
}

export default function EventPageClient({ event, isOwner, children }: EventPageClientProps) {
  const [liveDesign, setLiveDesign] = useState({
    accentColor: event.accentColor || '#ff1493',
    typography: event.typography || 'headline',
    pageTheme: event.pageTheme || 'neon',
    showLocationOnPage: event.showLocationOnPage || false,
    showMapOnPage: event.showMapOnPage || false,
    isAddressHidden: event.isAddressHidden || false,
  })

  return (
    <>
      {isOwner && (
        <EditDesignButton
          eventId={event.id}
          initialDesign={{
            accentColor: event.accentColor || '#ff1493',
            typography: event.typography || 'headline',
            pageTheme: event.pageTheme || 'neon',
            showLocationOnPage: event.showLocationOnPage || false,
            showMapOnPage: event.showMapOnPage || false,
            isAddressHidden: event.isAddressHidden || false,
          }}
          onDesignChange={setLiveDesign}
        />
      )}
      {children(liveDesign)}
    </>
  )
}

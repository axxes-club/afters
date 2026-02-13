'use client'

import EditDesignButton from './EditDesignButton'

interface DesignSettings {
  accentColor: string
  typography: string
  pageTheme: string
  showLocationOnPage: boolean
  showMapOnPage: boolean
  isAddressHidden: boolean
}

interface EditDesignOverlayProps {
  eventId: string
  initialDesign: DesignSettings
}

// This is a simple client component that just shows the edit button
// No live preview - changes require re-publish and page reload
export default function EditDesignOverlay({ eventId, initialDesign }: EditDesignOverlayProps) {
  return (
    <EditDesignButton
      eventId={eventId}
      initialDesign={initialDesign}
      onDesignChange={() => {}} // No live preview - changes saved on publish
    />
  )
}

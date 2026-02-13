'use client'

import EditDesignButton from './EditDesignButton'
import { PreviewBadge } from './PreviewBadge'
import { LivePreviewStyles } from './LivePreviewStyles'
import { LivePreviewProvider, type DesignSettings } from './LivePreviewProvider'

interface EditDesignOverlayProps {
  eventId: string
  initialDesign: DesignSettings
  children?: React.ReactNode
}

// Wrapper component that provides live preview context
export default function EditDesignOverlay({ eventId, initialDesign, children }: EditDesignOverlayProps) {
  return (
    <LivePreviewProvider initialDesign={initialDesign}>
      <LivePreviewStyles />
      <PreviewBadge />
      <EditDesignButton eventId={eventId} />
      {children}
    </LivePreviewProvider>
  )
}

// Re-export for convenience
export { useLivePreview } from './LivePreviewProvider'
export type { DesignSettings }

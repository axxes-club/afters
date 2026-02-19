"use client";

import { EventDesignTab } from "@/components/dashboard/EventDesignTab";
import { useEventEditor } from "../layout";

export default function DesignPage() {
  const { event, eventId } = useEventEditor();

  if (!event) return null;

  return (
    <EventDesignTab
      eventId={eventId}
      initialTemplate={event.pageTheme}
      initialTypography={event.typography}
      initialAccentColor={event.accentColor || "#ff1493"}
      initialBackgroundColor={event.backgroundColor || "#000000"}
      flyerUrl={event.flyerUrl}
    />
  );
}

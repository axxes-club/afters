"use client";

import { EventDetailsTab } from "@/components/dashboard/EventDetailsTab";
import { useEventEditor } from "../layout";

export default function DetailsPage() {
  const { event, eventId } = useEventEditor();

  if (!event) return null;

  return (
    <EventDetailsTab
      eventId={eventId}
      initialAbout={event.about || ""}
      initialFaqs={event.faqs || []}
      initialLineup={event.lineup || []}
      initialGallery={event.gallery || []}
    />
  );
}

import { redirect } from "next/navigation";

// Redirect old event routes to new event-editor routes
export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { eventId } = await params;
  const { tab } = await searchParams;

  // Map old tab param to new route
  const tabMap: Record<string, string> = {
    overview: "overview",
    tickets: "tickets",
    door: "door",
    design: "design",
    details: "details",
    venue: "venue",
    settings: "settings",
  };

  const targetTab = tab && tabMap[tab] ? tabMap[tab] : "overview";
  redirect(`/b/event-editor/${eventId}/${targetTab}`);
}

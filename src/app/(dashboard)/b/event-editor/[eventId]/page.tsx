import { redirect } from "next/navigation";

export default async function EventEditorPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  redirect(`/b/event-editor/${eventId}/overview`);
}

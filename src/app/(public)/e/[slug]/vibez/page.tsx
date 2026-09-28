import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { VibezPageClient } from "./VibezPageClient";

async function getEventBySlug(slug: string) {
  let event = await prisma.event.findFirst({
    where: { slug, isPublished: true },
    select: {
      id: true,
      title: true,
      slug: true,
      vibezEnabled: true,
      startsAt: true,
      accentColor: true,
    },
  });

  if (!event) {
    const organizers = await prisma.organizerProfile.findMany({
      select: { slug: true },
    });
    for (const org of organizers) {
      if (slug.startsWith(org.slug + "-")) {
        const eventSlug = slug.slice(org.slug.length + 1);
        event = await prisma.event.findFirst({
          where: {
            isPublished: true,
            slug: eventSlug,
            organizer: { slug: org.slug },
          },
          select: {
            id: true,
            title: true,
            slug: true,
            vibezEnabled: true,
            startsAt: true,
            accentColor: true,
          },
        });
        if (event) break;
      }
    }
  }

  return event;
}

export default async function VibezPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  if (!event.vibezEnabled) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <p className="text-sm font-mono text-white/50 text-center mb-4">
          VIBEZ is not enabled for this event.
        </p>
        <Link
          href={`/e/${event.slug}`}
          className="inline-flex items-center gap-2 text-sm font-mono text-white/70 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to event
        </Link>
      </div>
    );
  }

  const eventStarted = new Date(event.startsAt) <= new Date();
  if (!eventStarted) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <p className="text-sm font-mono text-white/50 text-center mb-4">
          The feed will be available when the event starts.
        </p>
        <Link
          href={`/e/${event.slug}`}
          className="inline-flex items-center gap-2 text-sm font-mono text-white/70 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to event
        </Link>
      </div>
    );
  }

  return (
    <VibezPageClient
      eventId={event.id}
      eventTitle={event.title}
      eventSlug={event.slug}
      accentColor={event.accentColor}
    />
  );
}

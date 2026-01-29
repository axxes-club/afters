import { prisma } from "@/lib/prisma";
import { EventStatus, TicketingType, UserRole } from "@prisma/client";

async function seedSampleEvents() {
  try {
    // First, ensure we have a user with organizer role to create events
    const sampleUser = await prisma.user.upsert({
      where: { email: "organizer@example.com" },
      update: {},
      create: {
        id: "sample_user_id_1",
        email: "organizer@example.com",
        firstName: "Sample",
        lastName: "Organizer",
        role: UserRole.ORGANIZER,
        imageUrl: "https://utfs.io/f/sample-organizer-image.jpg"
      },
    });

    // Create an organizer profile for the user
    const organizerProfile = await prisma.organizerProfile.upsert({
      where: { userId: sampleUser.id },
      update: {},
      create: {
        userId: sampleUser.id,
        displayName: "Sample Events Co.",
        slug: "sample-events-co",
        bio: "We organize amazing events!",
        logoUrl: "https://utfs.io/f/sample-logo.jpg",
      },
    });

    // Sample flyer URLs (using placeholder images)
    const flyerUrls = [
      "https://placehold.co/600x800/ff1493/white?text=Event+1",
      "https://placehold.co/600x800/00ced1/white?text=Event+2", 
      "https://placehold.co/600x800/ff6347/white?text=Event+3",
      "https://placehold.co/600x800/9370db/white?text=Event+4",
      "https://placehold.co/600x800/32cd32/white?text=Event+5",
      "https://placehold.co/600x800/ffa500/white?text=Event+6"
    ];

    // Create sample events
    const eventsData = [
      {
        title: "Summer Music Festival",
        description: "Join us for an amazing summer music festival featuring top artists from around the world.",
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 8 hours after start
        venueName: "Central Park Amphitheater",
        venueAddress: "123 Concert Drive",
        city: "Charlotte",
        state: "NC",
        flyerUrl: flyerUrls[0],
        ageRestriction: 18,
        ticketingType: TicketingType.AFTERS,
      },
      {
        title: "Tech Conference 2026",
        description: "The premier technology conference bringing together innovators and thought leaders.",
        startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        endsAt: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000), // 2 days later
        venueName: "Charlotte Convention Center",
        venueAddress: "456 Tech Blvd",
        city: "Charlotte",
        state: "NC",
        flyerUrl: flyerUrls[1],
        ageRestriction: null,
        ticketingType: TicketingType.AFTERS,
      },
      {
        title: "Art Gallery Opening",
        description: "Exclusive opening night for our new contemporary art exhibition.",
        startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours after start
        venueName: "Downtown Art Gallery",
        venueAddress: "789 Art Street",
        city: "Charlotte",
        state: "NC",
        flyerUrl: flyerUrls[2],
        ageRestriction: 21,
        ticketingType: TicketingType.EVENTBRITE,
        externalTicketingUrl: "https://eventbrite.com/sample-art-event"
      },
      {
        title: "Food & Wine Tasting",
        description: "Experience exquisite flavors from renowned chefs and winemakers.",
        startsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        endsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6 hours after start
        venueName: "Grand Hotel Ballroom",
        venueAddress: "321 Gourmet Avenue",
        city: "Raleigh",
        state: "NC",
        flyerUrl: flyerUrls[3],
        ageRestriction: 21,
        ticketingType: TicketingType.AFTERS,
      },
      {
        title: "Startup Pitch Night",
        description: "Watch emerging startups pitch their innovative ideas to investors.",
        startsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours after start
        venueName: "Innovation Hub",
        venueAddress: "654 Startup Lane",
        city: "Raleigh",
        state: "NC",
        flyerUrl: flyerUrls[4],
        ageRestriction: null,
        ticketingType: TicketingType.AFTERS,
      },
      {
        title: "Jazz Evening at the Rooftop",
        description: "Smooth jazz under the stars at our exclusive rooftop venue.",
        startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        endsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours after start
        venueName: "Skyline Rooftop Bar",
        venueAddress: "987 Downtown Plaza",
        city: "New York",
        state: "NY",
        flyerUrl: flyerUrls[5],
        ageRestriction: 21,
        ticketingType: TicketingType.AFTERS,
      }
    ];

    for (const eventData of eventsData) {
      const baseSlug = eventData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      await prisma.event.upsert({
        where: { 
          organizerId_slug: {
            organizerId: organizerProfile.id,
            slug: baseSlug,
          }
        },
        update: {},
        create: {
          ...eventData,
          organizerId: organizerProfile.id,
          slug: baseSlug,
          status: EventStatus.PUBLISHED,
          isPublished: true,
          timezone: "America/New_York",
        },
      });
    }

    // Create ticket tiers for the events
    const events = await prisma.event.findMany({
      where: { organizerId: organizerProfile.id }
    });

    for (const event of events) {
      // Create sample ticket tiers
      await prisma.ticketTier.createMany({
        data: [
          {
            eventId: event.id,
            name: "General Admission",
            description: "Standard entry with access to all event areas",
            price: event.city === "New York" ? 7500 : 5000, // Higher price for NYC
            quantity: 200,
            salesStartAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started yesterday
            salesEndAt: event.startsAt,
            minPerOrder: 1,
            maxPerOrder: 4,
            sortOrder: 1,
            isVisible: true,
          },
          {
            eventId: event.id,
            name: "VIP Experience",
            description: "Premium access with exclusive areas and amenities",
            price: event.city === "New York" ? 15000 : 10000, // Higher price for NYC
            quantity: 50,
            salesStartAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started yesterday
            salesEndAt: event.startsAt,
            minPerOrder: 1,
            maxPerOrder: 2,
            sortOrder: 2,
            isVisible: true,
          }
        ]
      });
    }

    console.log("✅ Sample events seeded successfully!");
    console.log(`Created ${eventsData.length} events with organizer profile`);
  } catch (error) {
    console.error("❌ Error seeding sample events:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function if this file is executed directly
if (require.main === module) {
  seedSampleEvents();
}

export { seedSampleEvents };
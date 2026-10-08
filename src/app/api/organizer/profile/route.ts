import { getEffectiveUserId } from "@/lib/auth-utils";
import { organizerWhere } from "@/lib/organizer-context";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const userId = await getEffectiveUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, slug, bio } = body;

    // Validate required fields
    if (!displayName || !slug) {
      return NextResponse.json(
        { error: "Display name and profile URL are required" },
        { status: 400 },
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        {
          error:
            "Profile URL can only contain lowercase letters, numbers, and hyphens",
        },
        { status: 400 },
      );
    }

    // Check if user already has an organizer profile
    const existingProfile = await prisma.organizerProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "You already have an organizer profile" },
        { status: 400 },
      );
    }

    // Check if slug is already taken
    const slugTaken = await prisma.organizerProfile.findUnique({
      where: { slug },
    });

    if (slugTaken) {
      return NextResponse.json(
        { error: "This URL is already taken" },
        { status: 400 },
      );
    }

    // Ensure user exists in our database, create if not (for local dev without webhooks)
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // Create the afters row from the sign-in profile
      const authUser = await currentUser();
      if (!authUser) {
        return NextResponse.json(
          {
            error:
              "Unable to fetch user data. Please try signing out and back in.",
          },
          { status: 404 },
        );
      }

      const primaryEmail = authUser.email;

      if (!primaryEmail) {
        return NextResponse.json(
          { error: "No email address found for user." },
          { status: 400 },
        );
      }

      user = await prisma.user.create({
        data: {
          id: userId,
          email: primaryEmail,
          firstName: authUser.firstName,
          lastName: authUser.lastName,
          imageUrl: authUser.imageUrl,
        },
      });
    }

    // Create the organizer profile
    const profile = await prisma.organizerProfile.create({
      data: {
        userId,
        displayName,
        slug,
        bio: bio || null,
      },
    });

    // Update user role to ORGANIZER
    await prisma.user.update({
      where: { id: userId },
      data: { role: "ORGANIZER" },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error("Error creating organizer profile:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 },
    );
  }
}

async function updateProfile(request: Request) {
  try {
    const userId = await getEffectiveUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      displayName,
      slug,
      bio,
      logoUrl,
      coverUrl,
      genres,
      artistType,
      websiteUrl,
      instagramUrl,
      twitterUrl,
      youtubeUrl,
      spotifyUrl,
      soundcloudUrl,
    } = body;

    // Check if user has organizer profile
    const existingProfile = await prisma.organizerProfile.findUnique({
      where: await organizerWhere("owner"),
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: "Organizer profile not found" },
        { status: 404 },
      );
    }

    // Check if slug is taken by another organizer
    if (slug !== existingProfile.slug) {
      const slugTaken = await prisma.organizerProfile.findUnique({
        where: { slug },
      });
      if (slugTaken) {
        return NextResponse.json(
          { error: "This URL is already taken" },
          { status: 400 },
        );
      }
    }

    const updatedProfile = await prisma.organizerProfile.update({
      where: await organizerWhere("owner"),
      data: {
        displayName,
        slug,
        bio,
        logoUrl,
        coverUrl,
        genres,
        artistType,
        websiteUrl,
        instagramUrl,
        twitterUrl,
        youtubeUrl,
        spotifyUrl,
        soundcloudUrl,
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Error updating organizer profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  return updateProfile(request);
}

export async function PATCH(request: Request) {
  return updateProfile(request);
}

export async function GET() {
  try {
    const userId = await getEffectiveUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.organizerProfile.findUnique({
      where: await organizerWhere("owner"),
      include: {
        events: {
          orderBy: { startsAt: "desc" },
          take: 10,
          include: {
            _count: { select: { tickets: true, orders: true } },
          },
        },
        _count: {
          select: { events: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching organizer profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const userId = await getEffectiveUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has organizer profile
    const profile = await prisma.organizerProfile.findUnique({
      where: await organizerWhere("owner"),
      include: {
        events: {
          select: { id: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Organizer profile not found" },
        { status: 404 },
      );
    }

    // Check if they have any events (prevent deletion if they do)
    if (profile.events.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete profile with existing events. Please delete or transfer your events first.",
        },
        { status: 400 },
      );
    }

    // Delete the organizer profile (this will cascade delete related data)
    await prisma.organizerProfile.delete({
      where: { id: profile.id },
    });

    // Reset user role to USER
    await prisma.user.update({
      where: { id: userId },
      data: { role: "USER" },
    });

    return NextResponse.json(
      { message: "Profile deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting organizer profile:", error);
    return NextResponse.json(
      { error: "Failed to delete profile" },
      { status: 500 },
    );
  }
}

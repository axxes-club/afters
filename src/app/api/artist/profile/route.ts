import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Get current user's artist profile
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.artistProfile.findUnique({
      where: { userId },
      include: {
        radioTracks: {
          include: {
            _count: { select: { plays: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

// Create or update artist profile
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      artistName,
      slug,
      bio,
      avatarUrl,
      coverUrl,
      genres,
      tagline,
      location,
      // Social links
      spotifyUrl,
      soundcloudUrl,
      instagramUrl,
      twitterUrl,
      websiteUrl,
      youtubeUrl,
      tiktokUrl,
      bandcampUrl,
      beatportUrl,
      appleMusicUrl,
      // Customization
      accentColor,
      headerStyle,
      showPlayCount,
      showUpcoming,
      // Professional
      bookingEmail,
      pressKitUrl,
      riderUrl,
      label,
      management,
      agency,
    } = body;

    if (!artistName || !slug) {
      return NextResponse.json(
        {
          error: "Artist name and slug are required",
        },
        { status: 400 },
      );
    }

    // Check slug uniqueness
    const existing = await prisma.artistProfile.findUnique({ where: { slug } });
    if (existing && existing.userId !== userId) {
      return NextResponse.json(
        {
          error: "This slug is already taken",
        },
        { status: 400 },
      );
    }

    const profileData = {
      artistName,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      bio: bio || null,
      avatarUrl: avatarUrl || null,
      coverUrl: coverUrl || null,
      genres: genres || null,
      tagline: tagline || null,
      location: location || null,
      // Social links
      spotifyUrl: spotifyUrl || null,
      soundcloudUrl: soundcloudUrl || null,
      instagramUrl: instagramUrl || null,
      twitterUrl: twitterUrl || null,
      websiteUrl: websiteUrl || null,
      youtubeUrl: youtubeUrl || null,
      tiktokUrl: tiktokUrl || null,
      bandcampUrl: bandcampUrl || null,
      beatportUrl: beatportUrl || null,
      appleMusicUrl: appleMusicUrl || null,
      // Customization
      accentColor: accentColor || null,
      headerStyle: headerStyle || null,
      showPlayCount: showPlayCount ?? true,
      showUpcoming: showUpcoming ?? true,
      // Professional
      bookingEmail: bookingEmail || null,
      pressKitUrl: pressKitUrl || null,
      riderUrl: riderUrl || null,
      label: label || null,
      management: management || null,
      agency: agency || null,
    };

    const profile = await prisma.artistProfile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData,
      },
    });

    // Update user role to ARTIST if not already
    await prisma.user.update({
      where: { id: userId },
      data: { role: "ARTIST" },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Error creating artist profile:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 },
    );
  }
}

// Delete artist profile
export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has artist profile
    const profile = await prisma.artistProfile.findUnique({
      where: { userId },
      include: {
        radioTracks: {
          select: { id: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Artist profile not found" },
        { status: 404 },
      );
    }

    // Check if they have any radio tracks (prevent deletion if they do)
    if (profile.radioTracks.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete profile with existing radio tracks. Please delete your tracks first.",
        },
        { status: 400 },
      );
    }

    // Delete the artist profile (this will cascade delete related data)
    await prisma.artistProfile.delete({
      where: { userId },
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
    console.error("Error deleting artist profile:", error);
    return NextResponse.json(
      { error: "Failed to delete profile" },
      { status: 500 },
    );
  }
}

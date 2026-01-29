import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Get current user's personal profile
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.personalProfile.findUnique({
      where: { userId },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

// Create or update personal profile
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      displayName,
      slug,
      bio,
      avatarUrl,
      coverUrl,
      websiteUrl,
      twitterUrl,
      instagramUrl,
      isPublic,
    } = body;

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

    // Check if slug is already taken by another user
    const slugTaken = await prisma.personalProfile.findUnique({
      where: { slug },
    });

    if (slugTaken && slugTaken.userId !== userId) {
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
      // Fetch user data from Clerk and create in our database
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return NextResponse.json(
          {
            error:
              "Unable to fetch user data. Please try signing out and back in.",
          },
          { status: 404 },
        );
      }

      const primaryEmail = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId,
      )?.emailAddress;

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
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
        },
      });
    }

    const profileData = {
      displayName,
      slug: slug.toLowerCase(),
      bio: bio || null,
      avatarUrl: avatarUrl || null,
      coverUrl: coverUrl || null,
      websiteUrl: websiteUrl || null,
      twitterUrl: twitterUrl || null,
      instagramUrl: instagramUrl || null,
      isPublic: isPublic ?? true,
    };

    const profile = await prisma.personalProfile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData,
      },
    });

    // Update user role to PERSONAL if not already set
    if (user.role === "USER") {
      await prisma.user.update({
        where: { id: userId },
        data: { role: "PERSONAL" },
      });
    }

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error("Error creating personal profile:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 },
    );
  }
}

// Delete personal profile
export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has personal profile
    const profile = await prisma.personalProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Personal profile not found" },
        { status: 404 },
      );
    }

    // Delete the personal profile (this will cascade delete related data)
    await prisma.personalProfile.delete({
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
    console.error("Error deleting personal profile:", error);
    return NextResponse.json(
      { error: "Failed to delete profile" },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * E2E Test User Seeding API
 *
 * This endpoint allows E2E tests to directly create users and organizer profiles
 * without going through the sign-in flow. It's protected by a bypass token
 * and only works in non-production environments.
 *
 * Usage:
 * POST /api/e2e/seed-user
 * Headers: X-E2E-Bypass-Token: <token>
 * Body: { userId, email, displayName, slug, bio?, firstName?, lastName?, createOrganizerProfile? }
 */

interface SeedUserRequest {
  userId: string;
  email: string;
  displayName: string;
  slug: string;
  bio?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  createOrganizerProfile?: boolean;
}

export async function POST(request: Request) {
  // Only allow in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  // Validate bypass token
  const bypassToken = request.headers.get('X-E2E-Bypass-Token');
  const expectedToken = process.env.E2E_AUTH_BYPASS_TOKEN;

  if (!expectedToken) {
    return NextResponse.json(
      { error: 'E2E_AUTH_BYPASS_TOKEN not configured' },
      { status: 500 }
    );
  }

  if (bypassToken !== expectedToken) {
    return NextResponse.json({ error: 'Invalid bypass token' }, { status: 401 });
  }

  try {
    const body: SeedUserRequest = await request.json();
    const {
      userId,
      email,
      displayName,
      slug,
      bio,
      firstName,
      lastName,
      imageUrl,
      createOrganizerProfile = true,
    } = body;

    // Validate required fields
    if (!userId || !email || !displayName || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, email, displayName, slug' },
        { status: 400 }
      );
    }

    // Use a transaction to create user and profile atomically
    const result = await prisma.$transaction(async (tx) => {
      // Check if user already exists
      let user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (user) {
        // User exists, update if needed
        user = await tx.user.update({
          where: { id: userId },
          data: {
            email,
            firstName: firstName ?? user.firstName,
            lastName: lastName ?? user.lastName,
            imageUrl: imageUrl ?? user.imageUrl,
            role: createOrganizerProfile ? 'ORGANIZER' : user.role,
          },
        });
      } else {
        // Check if email is taken by another user
        const existingByEmail = await tx.user.findUnique({
          where: { email },
        });

        if (existingByEmail) {
          // Update the existing user's ID to match the test user ID
          user = await tx.user.update({
            where: { email },
            data: {
              id: userId,
              firstName: firstName ?? existingByEmail.firstName,
              lastName: lastName ?? existingByEmail.lastName,
              imageUrl: imageUrl ?? existingByEmail.imageUrl,
              role: createOrganizerProfile ? 'ORGANIZER' : existingByEmail.role,
            },
          });
        } else {
          // Create new user
          user = await tx.user.create({
            data: {
              id: userId,
              email,
              firstName: firstName ?? 'Test',
              lastName: lastName ?? 'User',
              imageUrl,
              role: createOrganizerProfile ? 'ORGANIZER' : 'USER',
            },
          });
        }
      }

      let profile = null;

      if (createOrganizerProfile) {
        // Check if organizer profile exists
        profile = await tx.organizerProfile.findUnique({
          where: { userId },
        });

        if (profile) {
          // Update existing profile
          profile = await tx.organizerProfile.update({
            where: { userId },
            data: {
              displayName,
              slug,
              bio: bio ?? profile.bio,
            },
          });
        } else {
          // Check if slug is taken
          const slugTaken = await tx.organizerProfile.findUnique({
            where: { slug },
          });

          if (slugTaken && slugTaken.userId !== userId) {
            throw new Error(`Slug "${slug}" is already taken by another user`);
          }

          // Create new profile
          profile = await tx.organizerProfile.create({
            data: {
              userId,
              displayName,
              slug,
              bio,
            },
          });
        }
      }

      return { user, profile };
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
        },
        profile: result.profile
          ? {
              id: result.profile.id,
              displayName: result.profile.displayName,
              slug: result.profile.slug,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('E2E seed user error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to seed user',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clean up a test user
 */
export async function DELETE(request: Request) {
  // Only allow in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  // Validate bypass token
  const bypassToken = request.headers.get('X-E2E-Bypass-Token');
  const expectedToken = process.env.E2E_AUTH_BYPASS_TOKEN;

  if (!expectedToken || bypassToken !== expectedToken) {
    return NextResponse.json({ error: 'Invalid bypass token' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Must provide userId or email query parameter' },
        { status: 400 }
      );
    }

    // Find and delete user
    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: email! },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user (cascades to profile, events, etc.)
    await prisma.user.delete({
      where: { id: user.id },
    });

    return NextResponse.json({ success: true, deletedUserId: user.id });
  } catch (error) {
    console.error('E2E delete user error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete user',
      },
      { status: 500 }
    );
  }
}

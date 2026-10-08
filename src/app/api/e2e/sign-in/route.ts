import { randomBytes, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { hashPassword } from 'better-auth/crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * E2E sign-in. Creates (or reuses) a verified sign-in account for a test user
 * and returns a real session cookie, so Playwright never drives the sign-in
 * form. Same guard as /api/e2e/seed-user: never in production, and only with
 * the bypass token.
 *
 * POST /api/e2e/sign-in
 * Headers: X-E2E-Bypass-Token: <token>
 * Body: { userId, email, firstName?, lastName? }
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'This endpoint is disabled in production' }, { status: 403 });
  }
  const expected = process.env.E2E_AUTH_BYPASS_TOKEN;
  const given = request.headers.get('X-E2E-Bypass-Token') ?? '';
  if (!expected) {
    return NextResponse.json({ error: 'E2E_AUTH_BYPASS_TOKEN not configured' }, { status: 500 });
  }
  if (given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return NextResponse.json({ error: 'Invalid bypass token' }, { status: 401 });
  }

  const { userId, email, firstName, lastName } = (await request.json()) as {
    userId: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  if (!userId || !email) {
    return NextResponse.json({ error: 'userId and email are required' }, { status: 400 });
  }

  // A fresh password every time: nothing outside this request ever knows it.
  const password = randomBytes(24).toString('base64url');
  const name = [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0];
  await prisma.authUser.upsert({
    where: { id: userId },
    update: { email, name, emailVerified: true, banned: false },
    create: { id: userId, email, name, emailVerified: true },
  });
  await prisma.authAccount.upsert({
    where: { providerId_accountId: { providerId: 'credential', accountId: userId } },
    update: { password: await hashPassword(password) },
    create: { id: `e2e_${userId}`, providerId: 'credential', accountId: userId, userId, password: await hashPassword(password) },
  });

  // Better Auth's own response, so the session cookie is exactly the real one.
  return auth.api.signInEmail({ body: { email, password }, asResponse: true });
}

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { resolveVibezAlias } from "@/lib/vbz-alias";

// Routes that require authentication
// Note: "/d(.*)" would also match /demo and /developers, so match /d exactly.
// /orders is not listed: guest buyers reach it with a signed token (see src/lib/order-access.ts).
const isProtectedRoute = createRouteMatcher([
  "/d",
  "/d/(.*)",
  "/superadmin(.*)",
]);

function rewriteVibezHost(request: NextRequest): NextResponse | null {
  const target = resolveVibezAlias(
    request.headers.get("host") ?? "",
    request.nextUrl.pathname
  );
  if (!target) return null;
  return NextResponse.rewrite(new URL(target, request.url));
}

// In development, skip all auth to make local testing easy
// Set ENABLE_AUTH_IN_DEV=true in .env.local if you need auth locally
const skipAuthInDev = process.env.NODE_ENV === "development" && process.env.ENABLE_AUTH_IN_DEV !== "true";

export default clerkMiddleware(async (auth, req) => {
  // The alias is resolved first and unconditionally, including in development,
  // so `vbz.localhost:3000/foo` behaves the same as it will in production.
  const aliased = rewriteVibezHost(req);
  if (aliased) return aliased;

  // Skip auth entirely in development for easy local/mobile testing
  if (skipAuthInDev) {
    return NextResponse.next();
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and sandbox
    "/((?!_next|sandbox|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

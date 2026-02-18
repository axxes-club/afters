import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/d(.*)",
  "/onboarding(.*)",
  "/orders(.*)",
  "/superadmin(.*)",
]);

// In development, skip all auth to make local testing easy
// Set ENABLE_AUTH_IN_DEV=true in .env.local if you need auth locally
const skipAuthInDev = process.env.NODE_ENV === "development" && process.env.ENABLE_AUTH_IN_DEV !== "true";

export default clerkMiddleware(async (auth, req) => {
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
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

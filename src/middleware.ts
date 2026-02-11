import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
  "/orders(.*)",
  "/superadmin(.*)",
]);

// Check if we're in local development mode
function isLocalDev(req: NextRequest): boolean {
  const host = req.headers.get("host") || "";

  // Allow localhost and local network IPs
  return (
    host.startsWith("localhost:") ||
    host.startsWith("127.0.0.1:") ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    host.startsWith("172.16.") ||
    host.startsWith("172.17.") ||
    host.startsWith("172.18.") ||
    host.startsWith("172.19.") ||
    host.startsWith("172.20.") ||
    host.startsWith("172.21.") ||
    host.startsWith("172.22.") ||
    host.startsWith("172.23.") ||
    host.startsWith("172.24.") ||
    host.startsWith("172.25.") ||
    host.startsWith("172.26.") ||
    host.startsWith("172.27.") ||
    host.startsWith("172.28.") ||
    host.startsWith("172.29.") ||
    host.startsWith("172.30.") ||
    host.startsWith("172.31.")
  );
}

export default clerkMiddleware(async (auth, req) => {
  // Skip auth protection for local development on mobile/LAN
  // This allows testing without Clerk domain restrictions
  if (process.env.NODE_ENV === "development" && isLocalDev(req)) {
    // Still allow Clerk to work for localhost, just don't enforce protection
    // for LAN IPs where Clerk may not be configured
    const host = req.headers.get("host") || "";
    if (!host.startsWith("localhost:") && !host.startsWith("127.0.0.1:")) {
      return NextResponse.next();
    }
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

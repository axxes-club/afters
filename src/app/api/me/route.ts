import { getUserId } from "@/lib/auth/session";
import { NextResponse } from "next/server";

/**
 * GET /api/me
 * Just the signed-in account id, for the rare client that needs to tell "mine"
 * from "theirs" without a page load. Deliberately says nothing else.
 */
export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ userId: null }, { status: 401 });
  }
  return NextResponse.json({ userId });
}

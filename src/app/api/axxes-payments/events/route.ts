import { NextResponse } from "next/server";
import { paymentsMode, verifyPaymentsEvent } from "@/lib/axxes-payments";
import { applySignatureSnapshot } from "@/lib/signature-billing";

// Signed subscription and checkout events from payments.axxes.app. A non-2xx answer makes Payments retry.
export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > 65536) return NextResponse.json({ error: "Too large" }, { status: 413 });
  const event = verifyPaymentsEvent(body, request.headers.get("axxes-payments-signature"));
  if (!event) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  // Sandbox events never touch live access, and the reverse.
  if (event.product !== "afters" || event.mode !== paymentsMode()) return NextResponse.json({ ignored: true });
  if (event.subscription) await applySignatureSnapshot(event.subscription);
  return NextResponse.json({ received: true });
}

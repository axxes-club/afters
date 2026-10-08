import { NextRequest, NextResponse } from "next/server";
import { getCheckout, getSubscription } from "@/lib/axxes-payments";
import { applySignatureSnapshot } from "@/lib/signature-billing";
import { publicOrigin } from "@/lib/public-origin";

// Buyers land here from payments.axxes.app. The checkout ID in the URL is only a pointer:
// state is read back from Payments with this product's key before anything changes.
export async function GET(req: NextRequest) {
  const billing = new URL("/b/settings/billing", publicOrigin(req));
  const id = req.nextUrl.searchParams.get("axxes_checkout") ?? "";
  try {
    const checkout = await getCheckout(id);
    if (checkout.product === "afters" && checkout.subscription && (checkout.state === "paid" || checkout.state === "no_payment_due")) {
      await applySignatureSnapshot(await getSubscription(checkout.subscription));
      billing.searchParams.set("subscription", "success");
    } else {
      billing.searchParams.set("subscription", checkout.state === "processing" ? "processing" : "incomplete");
    }
  } catch {
    billing.searchParams.set("subscription", "incomplete");
  }
  return NextResponse.redirect(billing, 303);
}

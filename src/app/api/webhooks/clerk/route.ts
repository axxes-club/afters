import { Webhook } from "svix"
import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not configured — webhook ignored")
    return new Response("Webhook secret not configured", { status: 500 })
  }

  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Webhook verification failed:", err)
    return new Response("Webhook verification failed", { status: 400 })
  }

  const eventType = evt.type

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data

    const primaryEmail = email_addresses.find(
      (e) => e.id === evt.data.primary_email_address_id
    )?.email_address

    if (!primaryEmail) {
      return new Response("No primary email", { status: 400 })
    }

    // Check if a user with this email already exists (e.g., migrated from dev)
    const existingByEmail = await prisma.user.findUnique({
      where: { email: primaryEmail },
    })

    if (existingByEmail && existingByEmail.id !== id) {
      // User exists with a different Clerk ID (dev→prod migration).
      // Update their ID to the new production Clerk ID.
      await prisma.user.update({
        where: { email: primaryEmail },
        data: {
          id,
          firstName: first_name ?? existingByEmail.firstName,
          lastName: last_name ?? existingByEmail.lastName,
          imageUrl: image_url ?? existingByEmail.imageUrl,
        },
      })
    } else {
      // Normal upsert — match by Clerk ID (new users default to ORGANIZER)
      await prisma.user.upsert({
        where: { id },
        update: {
          email: primaryEmail,
          firstName: first_name,
          lastName: last_name,
          imageUrl: image_url,
        },
        create: {
          id,
          email: primaryEmail,
          firstName: first_name,
          lastName: last_name,
          imageUrl: image_url,
          role: "ORGANIZER",
        },
      })
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data
    if (id) {
      await prisma.user.delete({
        where: { id },
      }).catch(() => {
        // User might not exist in our DB
      })
    }
  }

  return new Response("OK", { status: 200 })
}

import { createHmac, timingSafeEqual } from "crypto"
import { PKPass } from "passkit-generator"
import { PASS_IMAGES } from "@/lib/apple-wallet-images"
import { SITE_DOMAIN, SITE_URL } from "@/lib/constants"
import { formatInTimezone } from "@/lib/utils"

// Apple Wallet (.pkpass) generation for tickets.
//
// Required env vars (see .env.example):
//   APPLE_PASS_TYPE_ID, APPLE_TEAM_ID
//   APPLE_WALLET_SIGNER_CERT, APPLE_WALLET_SIGNER_KEY, APPLE_WALLET_WWDR  (PEM text or base64-encoded PEM)
//   APPLE_WALLET_KEY_PASSPHRASE  (optional; falls back to APPLE_CERT_PASSWORD)

export const PKPASS_CONTENT_TYPE = "application/vnd.apple.pkpass"

interface WalletConfig {
  passTypeIdentifier: string
  teamIdentifier: string
  signerCert: Buffer
  signerKey: Buffer
  wwdr: Buffer
  signerKeyPassphrase?: string
}

// Accepts raw PEM (with real or escaped "\n" newlines) or base64-encoded PEM
function decodePem(value: string | undefined): Buffer | null {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed.includes("-----BEGIN")) {
    return Buffer.from(trimmed.replace(/\\n/g, "\n"))
  }
  const decoded = Buffer.from(trimmed, "base64")
  return decoded.toString("utf8").includes("-----BEGIN") ? decoded : null
}

export function getAppleWalletConfig(): WalletConfig | null {
  const passTypeIdentifier = process.env.APPLE_PASS_TYPE_ID
  const teamIdentifier = process.env.APPLE_TEAM_ID
  const signerCert = decodePem(process.env.APPLE_WALLET_SIGNER_CERT)
  const signerKey = decodePem(process.env.APPLE_WALLET_SIGNER_KEY)
  const wwdr = decodePem(process.env.APPLE_WALLET_WWDR)

  if (!passTypeIdentifier || !teamIdentifier || !signerCert || !signerKey || !wwdr) {
    return null
  }

  return {
    passTypeIdentifier,
    teamIdentifier,
    signerCert,
    signerKey,
    wwdr,
    signerKeyPassphrase:
      process.env.APPLE_WALLET_KEY_PASSPHRASE || process.env.APPLE_CERT_PASSWORD || undefined,
  }
}

export function isAppleWalletConfigured(): boolean {
  return getAppleWalletConfig() !== null
}

// ─── Signed download links ───
// Most buyers check out as guests (no Clerk session), so wallet links in emails and on
// the order page carry an HMAC of the ticket ID instead of relying on sign-in.

function getLinkSecret(): string {
  const secret = process.env.WALLET_LINK_SECRET || process.env.SCANNER_JWT_SECRET
  if (!secret) {
    throw new Error("WALLET_LINK_SECRET or SCANNER_JWT_SECRET environment variable is required")
  }
  return secret
}

export function createWalletToken(ticketId: string): string {
  return createHmac("sha256", getLinkSecret())
    .update(`apple-wallet:${ticketId}`)
    .digest("base64url")
}

export function verifyWalletToken(ticketId: string, token: string | null | undefined): boolean {
  if (!token) return false
  const expected = Buffer.from(createWalletToken(ticketId))
  const actual = Buffer.from(token)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function getWalletPassPath(ticketId: string): string {
  return `/api/tickets/${ticketId}/wallet?token=${createWalletToken(ticketId)}`
}

export function getWalletPassUrl(ticketId: string): string {
  return `${SITE_URL}${getWalletPassPath(ticketId)}`
}

// ─── Pass building ───

export interface WalletPassTicket {
  id: string
  ticketNumber: string
  isTestTicket: boolean
  ticketTier: { name: string }
  order: { orderNumber: string; guestName: string | null }
  event: {
    title: string
    slug: string
    startsAt: Date
    endsAt: Date | null
    timezone: string
    venueName: string
    venueAddress: string
    city: string
    state: string | null
    accentColor: string | null
    ageRestriction: number | null
    mapLat: number | null
    mapLng: number | null
    organizer: { displayName: string }
  }
}

function hexToRgb(hex: string | null | undefined, fallback: string): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex?.trim() ?? "")
  if (!match) return fallback
  const n = parseInt(match[1], 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

export function buildTicketPass(ticket: WalletPassTicket, config: WalletConfig): Buffer {
  const { event } = ticket
  const images = Object.fromEntries(
    Object.entries(PASS_IMAGES).map(([name, b64]) => [name, Buffer.from(b64, "base64")])
  )

  const pass = new PKPass(
    images,
    {
      signerCert: config.signerCert,
      signerKey: config.signerKey,
      wwdr: config.wwdr,
      signerKeyPassphrase: config.signerKeyPassphrase,
    },
    {
      serialNumber: ticket.id,
      passTypeIdentifier: config.passTypeIdentifier,
      teamIdentifier: config.teamIdentifier,
      organizationName: event.organizer.displayName || "Afters",
      description: `Ticket for ${event.title}`,
      logoText: ticket.isTestTicket ? "afters · TEST" : "afters",
      backgroundColor: "rgb(0, 0, 0)",
      foregroundColor: "rgb(255, 255, 255)",
      labelColor: hexToRgb(event.accentColor, "rgb(255, 20, 147)"),
      sharingProhibited: true,
    }
  )

  pass.type = "eventTicket"

  pass.primaryFields.push({ key: "event", label: "EVENT", value: event.title })

  pass.secondaryFields.push(
    {
      key: "date",
      label: "DATE",
      value: formatInTimezone(event.startsAt, event.timezone, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    },
    {
      key: "time",
      label: "DOORS",
      value: formatInTimezone(event.startsAt, event.timezone, {
        hour: "numeric",
        minute: "2-digit",
      }),
      textAlignment: "PKTextAlignmentRight",
    }
  )

  pass.auxiliaryFields.push(
    { key: "tier", label: "TICKET", value: ticket.ticketTier.name },
    { key: "venue", label: "VENUE", value: event.venueName, textAlignment: "PKTextAlignmentRight" }
  )

  const location = [event.venueAddress, event.city, event.state].filter(Boolean).join(", ")
  pass.backFields.push(
    { key: "ticketNumber", label: "Ticket Number", value: ticket.ticketNumber },
    { key: "orderNumber", label: "Order", value: ticket.order.orderNumber },
    ...(ticket.order.guestName
      ? [{ key: "holder", label: "Name", value: ticket.order.guestName }]
      : []),
    { key: "address", label: "Location", value: `${event.venueName}\n${location}` },
    ...(event.ageRestriction
      ? [{ key: "age", label: "Age Restriction", value: `${event.ageRestriction}+` }]
      : []),
    {
      key: "eventPage",
      label: "Event Page",
      value: `${SITE_URL}/e/${event.slug}`,
      attributedValue: `<a href="${SITE_URL}/e/${event.slug}">${SITE_DOMAIN}/e/${event.slug}</a>`,
    },
    {
      key: "terms",
      label: "Terms",
      value: "This ticket is non-transferable. Present the QR code at the door for entry.",
    }
  )

  // The scanner reads the raw ticket ID, same as the PDF / on-screen QR codes
  pass.setBarcodes({
    format: "PKBarcodeFormatQR",
    message: ticket.id,
    messageEncoding: "iso-8859-1",
    altText: ticket.ticketNumber,
  })

  pass.setRelevantDate(event.startsAt)

  // Grey the pass out once the night is over
  const endsAt = event.endsAt ?? new Date(event.startsAt.getTime() + 12 * 60 * 60 * 1000)
  pass.setExpirationDate(new Date(endsAt.getTime() + 6 * 60 * 60 * 1000))

  if (event.mapLat != null && event.mapLng != null) {
    pass.setLocations({
      latitude: event.mapLat,
      longitude: event.mapLng,
      relevantText: `${event.title} — show this ticket at the door`,
    })
  }

  return pass.getAsBuffer()
}

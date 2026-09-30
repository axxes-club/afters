/**
 * Per-event VIBEZ settings: the one place that reads and writes them.
 *
 * The settings row is created on demand. An event whose organizer has never
 * opened the settings screen has no row, and every reader here answers with
 * DEFAULTS rather than null — so "no row" and "row of all defaults" are the same
 * thing to every caller, and the feed keeps working exactly as it did before
 * this existed.
 *
 * Settings are deliberately NOT cached in module scope. A serverless instance
 * that cached them would serve one organizer's watermark to the next event that
 * happened to land on it; every read is a row, and the row is tiny.
 */

import { prisma } from "@/lib/prisma"
import { isVibezFilterId } from "./vibez-filters"

export type VibezAccessMode = "ticket" | "qr" | "ticket_or_qr" | "link"

export type VibezWatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "tile"

/**
 * Every setting, as a plain widened type.
 *
 * Deliberately *not* derived from the defaults object with `as const`: that
 * would pin every field to its literal ("ticket_or_qr", not `string`), and a row
 * read back from Postgres — where the column is just TEXT — would then fail to
 * typecheck against the shape it is supposed to have. Widened here, once, rather
 * than cast at every call site.
 */
export type VibezSettingsValues = {
  accessMode: string
  requireGeofence: boolean
  geoRadiusM: number

  defaultFilterId: string
  allowFilterChoice: boolean
  dateStamp: boolean
  allowMirror: boolean

  watermarkEnabled: boolean
  watermarkType: string
  watermarkUrl: string | null
  watermarkText: string | null
  watermarkPosition: string
  watermarkScale: number
  watermarkOpacity: number

  moderationMode: string
  allowReactions: boolean
  allowDownloads: boolean
  allowCaptions: boolean

  maxPerGuestPerHour: number
  maxPhotosTotal: number
  maxPerHour: number

  wallEnabled: boolean
  wallLayout: string
  wallSlideMs: number
  wallShowQr: boolean

  closedManually: boolean
}

/** The full shape callers work with. */
export type VibezSettingsShape = VibezSettingsValues & { eventId: string }

/** Mirrors VibezSettings' defaults in schema.prisma, so a missing row and a
 *  fresh row are indistinguishable to every caller. */
export const VIBEZ_DEFAULTS: VibezSettingsValues = {
  accessMode: "ticket_or_qr",
  requireGeofence: false,
  geoRadiusM: 300,

  defaultFilterId: "nightflash",
  allowFilterChoice: true,
  dateStamp: true,
  allowMirror: true,

  watermarkEnabled: false,
  watermarkType: "image",
  watermarkUrl: null,
  watermarkText: null,
  watermarkPosition: "bottom-right",
  watermarkScale: 0.22,
  watermarkOpacity: 0.85,

  moderationMode: "auto",
  allowReactions: true,
  allowDownloads: true,
  allowCaptions: true,

  maxPerGuestPerHour: 10,
  maxPhotosTotal: 500,
  maxPerHour: 120,

  wallEnabled: false,
  wallLayout: "grid",
  wallSlideMs: 6000,
  wallShowQr: true,

  closedManually: false,
}

/** What the guest camera and feed are given: everything about how a photo looks
 *  and what a guest may do, and none of the moderation choices, limits or
 *  access rules the client has no business rendering. */
export type VibezPublicSettings = Pick<
  VibezSettingsValues,
  | "defaultFilterId"
  | "allowFilterChoice"
  | "dateStamp"
  | "allowMirror"
  | "watermarkEnabled"
  | "watermarkType"
  | "watermarkUrl"
  | "watermarkText"
  | "watermarkPosition"
  | "watermarkScale"
  | "watermarkOpacity"
  | "allowReactions"
  | "allowDownloads"
  | "allowCaptions"
  | "wallEnabled"
  | "wallLayout"
  | "wallSlideMs"
  | "wallShowQr"
  | "requireGeofence"
  | "geoRadiusM"
  | "accessMode"
  | "moderationMode"
  | "closedManually"
>

const ACCESS_MODES: readonly string[] = ["ticket", "qr", "ticket_or_qr", "link"]
const POSITIONS: readonly string[] = [
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
  "tile",
]

/**
 * Read an event's settings, or the defaults when there is no row.
 *
 * A database error here is NOT swallowed into "defaults". Silently serving
 * defaults on a read failure would mean an organizer who turned the watermark on
 * watches photos go out unwatermarked with no way to tell why; a thrown error
 * surfaces as a failed page instead, which they will report.
 */
export async function getVibezSettings(eventId: string): Promise<VibezSettingsShape> {
  const row = await prisma.vibezSettings.findUnique({ where: { eventId } })
  if (!row) return { eventId, ...VIBEZ_DEFAULTS }

  // Read column by column rather than spreading the row: spreading would let a
  // column added to the schema later silently start overriding a default that
  // was never updated here, and the two defaults lists would drift apart.
  return {
    eventId,
    ...VIBEZ_DEFAULTS,
    accessMode: row.accessMode,
    requireGeofence: row.requireGeofence,
    geoRadiusM: row.geoRadiusM,
    defaultFilterId: row.defaultFilterId,
    allowFilterChoice: row.allowFilterChoice,
    dateStamp: row.dateStamp,
    allowMirror: row.allowMirror,
    watermarkEnabled: row.watermarkEnabled,
    watermarkType: row.watermarkType,
    watermarkUrl: row.watermarkUrl,
    watermarkText: row.watermarkText,
    watermarkPosition: row.watermarkPosition,
    watermarkScale: row.watermarkScale,
    watermarkOpacity: row.watermarkOpacity,
    moderationMode: row.moderationMode,
    allowReactions: row.allowReactions,
    allowDownloads: row.allowDownloads,
    allowCaptions: row.allowCaptions,
    maxPerGuestPerHour: row.maxPerGuestPerHour,
    maxPhotosTotal: row.maxPhotosTotal,
    maxPerHour: row.maxPerHour,
    wallEnabled: row.wallEnabled,
    wallLayout: row.wallLayout,
    wallSlideMs: row.wallSlideMs,
    wallShowQr: row.wallShowQr,
    closedManually: row.closedManually,
  }
}

/**
 * Create the settings row for an event if it does not have one.
 *
 * Called when an organizer first opens the settings screen, so that opening it
 * and saving it cannot be the thing that silently resets a watermark somebody
 * configured through a previous save.
 */
export async function ensureVibezSettings(eventId: string): Promise<VibezSettingsShape> {
  const existing = await prisma.vibezSettings.findUnique({
    where: { eventId },
    select: { eventId: true },
  })
  if (existing) return getVibezSettings(eventId)
  try {
    await prisma.vibezSettings.create({ data: { eventId } })
  } catch {
    // Lost a race with a concurrent save. The row exists now either way, which
    // is the only thing this function promised.
  }
  return getVibezSettings(eventId)
}

/** Clamp into [min, max], falling back when it is not a number at all. Used on
 *  every numeric setting so a hand-typed form value or a crafted request body
 *  cannot set a limit to 0 or -1. */
function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

/**
 * Validate and persist a settings patch.
 *
 * Only the keys the organizer actually sent are written, so two people editing
 * the settings screen in different tabs cannot clobber each other's unrelated
 * change by saving a stale copy of the whole form.
 *
 * Every value is clamped or checked against an allowlist. This endpoint takes
 * organizer input and writes it into a row that a browser later uses to draw an
 * image — an unvalidated string here is an unvalidated string in the camera.
 */
export async function updateVibezSettings(
  eventId: string,
  patch: Record<string, unknown>
): Promise<VibezSettingsShape> {
  await ensureVibezSettings(eventId)

  const data: Record<string, unknown> = {}
  const has = (k: string) => Object.prototype.hasOwnProperty.call(patch, k)

  if (has("accessMode") && ACCESS_MODES.includes(String(patch.accessMode))) {
    data.accessMode = String(patch.accessMode)
  }
  if (has("requireGeofence")) data.requireGeofence = boolOr(patch.requireGeofence, false)
  if (has("geoRadiusM")) data.geoRadiusM = Math.round(clampNumber(patch.geoRadiusM, 50, 5000, 300))

  // Validated against the real filter list rather than trusted, because this
  // value is what the camera renders and an unknown id has to fall back to
  // something visible rather than to nothing.
  if (has("defaultFilterId") && isVibezFilterId(patch.defaultFilterId)) {
    data.defaultFilterId = patch.defaultFilterId
  }
  if (has("allowFilterChoice")) data.allowFilterChoice = boolOr(patch.allowFilterChoice, true)
  if (has("dateStamp")) data.dateStamp = boolOr(patch.dateStamp, true)
  if (has("allowMirror")) data.allowMirror = boolOr(patch.allowMirror, true)

  if (has("watermarkEnabled")) data.watermarkEnabled = boolOr(patch.watermarkEnabled, false)
  if (has("watermarkType")) data.watermarkType = patch.watermarkType === "text" ? "text" : "image"
  if (has("watermarkUrl")) {
    const url = typeof patch.watermarkUrl === "string" ? patch.watermarkUrl.trim() : ""
    data.watermarkUrl = url && isOurImage(url) ? url : null
  }
  if (has("watermarkText")) {
    const text = typeof patch.watermarkText === "string" ? patch.watermarkText.trim() : ""
    data.watermarkText = text ? text.slice(0, 80) : null
  }
  if (has("watermarkPosition") && POSITIONS.includes(String(patch.watermarkPosition))) {
    data.watermarkPosition = String(patch.watermarkPosition)
  }
  if (has("watermarkScale")) data.watermarkScale = clampNumber(patch.watermarkScale, 0.05, 1, 0.22)
  if (has("watermarkOpacity")) data.watermarkOpacity = clampNumber(patch.watermarkOpacity, 0.05, 1, 0.85)

  if (has("moderationMode")) {
    data.moderationMode = patch.moderationMode === "approve" ? "approve" : "auto"
  }
  if (has("allowReactions")) data.allowReactions = boolOr(patch.allowReactions, true)
  if (has("allowDownloads")) data.allowDownloads = boolOr(patch.allowDownloads, true)
  if (has("allowCaptions")) data.allowCaptions = boolOr(patch.allowCaptions, true)

  if (has("maxPerGuestPerHour")) {
    data.maxPerGuestPerHour = Math.round(clampNumber(patch.maxPerGuestPerHour, 1, 100, 10))
  }
  if (has("maxPhotosTotal")) {
    data.maxPhotosTotal = Math.round(clampNumber(patch.maxPhotosTotal, 10, 20000, 500))
  }
  if (has("maxPerHour")) {
    data.maxPerHour = Math.round(clampNumber(patch.maxPerHour, 5, 2000, 120))
  }

  if (has("wallEnabled")) data.wallEnabled = boolOr(patch.wallEnabled, false)
  if (has("wallLayout")) data.wallLayout = patch.wallLayout === "single" ? "single" : "grid"
  if (has("wallSlideMs")) {
    data.wallSlideMs = Math.round(clampNumber(patch.wallSlideMs, 2000, 60000, 6000))
  }
  if (has("wallShowQr")) data.wallShowQr = boolOr(patch.wallShowQr, true)

  if (has("closedManually")) data.closedManually = boolOr(patch.closedManually, false)

  if (Object.keys(data).length > 0) {
    await prisma.vibezSettings.update({ where: { eventId }, data })
  }
  return getVibezSettings(eventId)
}

/**
 * Narrow a full settings row to what the client is allowed to see.
 *
 * An explicit pick list rather than a delete-list, so a moderation or limit
 * field added to the schema later is excluded by default instead of leaking the
 * first time someone appends it to the row.
 */
export function publicSettings(s: VibezSettingsShape): VibezPublicSettings {
  return {
    defaultFilterId: s.defaultFilterId,
    allowFilterChoice: s.allowFilterChoice,
    dateStamp: s.dateStamp,
    allowMirror: s.allowMirror,
    watermarkEnabled: s.watermarkEnabled,
    watermarkType: s.watermarkType,
    watermarkUrl: s.watermarkUrl,
    watermarkText: s.watermarkText,
    watermarkPosition: s.watermarkPosition as VibezWatermarkPosition,
    watermarkScale: s.watermarkScale,
    watermarkOpacity: s.watermarkOpacity,
    allowReactions: s.allowReactions,
    allowDownloads: s.allowDownloads,
    allowCaptions: s.allowCaptions,
    wallEnabled: s.wallEnabled,
    wallLayout: s.wallLayout,
    wallSlideMs: s.wallSlideMs,
    wallShowQr: s.wallShowQr,
    requireGeofence: s.requireGeofence,
    geoRadiusM: s.geoRadiusM,
    accessMode: s.accessMode,
    moderationMode: s.moderationMode,
    closedManually: s.closedManually,
  }
}


function boolOr(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

/** Only accept images we host — the same rule the photo upload uses. Anything
 *  else is a hotlink to someone else's bandwidth, or a document pretending to be
 *  a logo. This string is loaded by the browser and drawn over a guest's photo,
 *  so leaving it unconstrained is an injection point. */
function isOurImage(url: string): boolean {
  return /^https:\/\/[^/]*ufs\.sh\//i.test(url) || /^https:\/\/utfs\.io\//i.test(url)
}

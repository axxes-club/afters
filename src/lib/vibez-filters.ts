/**
 * The look catalogue: every filter a guest can shoot with.
 *
 * This module is deliberately DOM-only-at-call-time and dependency-free, because
 * two very different places import it — the camera in the browser and the
 * settings validator on the server. Nothing here touches `document` until a
 * function is actually called, so importing it from a route handler is safe.
 *
 * `nightflash` is the signature look and is ported unchanged from
 * vibez.axxes.club and from the original src/lib/vibez-flash.ts. It is not
 * tidied up or rebalanced even though it sits among seven other filters now:
 * every photo already on the feed was made with it, and a "cleanup" would mean
 * the same event looks different depending on when it was shot.
 */

export type VibezFilterId =
  | "none"
  | "nightflash"
  | "noir"
  | "chrome"
  | "amber"
  | "infrared"
  | "thermal"
  | "polaroid"

export type VibezFilter = {
  id: VibezFilterId
  label: string
  /** One line the organizer reads in the settings screen. */
  hint: string
  /** Rough swatch for the picker, [background, ink]. */
  swatch: [string, string]
}

export const VIBEZ_FILTERS: readonly VibezFilter[] = [
  {
    id: "nightflash",
    label: "Night flash",
    hint: "The house look. Disposable camera fired in a dark room.",
    swatch: ["#1a1410", "#ff9d2e"],
  },
  {
    id: "none",
    label: "Raw",
    hint: "No grade. Just what the phone saw.",
    swatch: ["#3f3f46", "#e4e4e7"],
  },
  {
    id: "noir",
    label: "Noir",
    hint: "Hard black and white. Contrast pushed, grain kept.",
    swatch: ["#000000", "#ffffff"],
  },
  {
    id: "chrome",
    label: "Chrome",
    hint: "Cool and metallic. Blues lift, warmth drains out.",
    swatch: ["#0b1220", "#7dd3fc"],
  },
  {
    id: "amber",
    label: "Amber",
    hint: "Sodium-vapour orange. Reads as a basement at 3am.",
    swatch: ["#2a1403", "#fbbf24"],
  },
  {
    id: "infrared",
    label: "Infrared",
    hint: "Blown highlights and washed skin. Very 2007 camera.",
    swatch: ["#2b0b3d", "#f0abfc"],
  },
  {
    id: "thermal",
    label: "Thermal",
    hint: "Posterised into flat blocks of heat.",
    swatch: ["#111827", "#f97316"],
  },
  {
    id: "polaroid",
    label: "Polaroid",
    hint: "Faded, lifted blacks, warm cast. Bigger date stamp.",
    swatch: ["#e7e2d3", "#8b5e34"],
  },
]

/** Used by the settings validator to reject an id that would render nothing. */
export function isVibezFilterId(value: unknown): value is VibezFilterId {
  return typeof value === "string" && VIBEZ_FILTERS.some((f) => f.id === value)
}

/* ────────────────────────────────────────────────────────────────────────────
 * Rendering. Everything below touches the DOM and only runs in a browser.
 * ──────────────────────────────────────────────────────────────────────────── */

const MAX_EDGE = 1600

function stampText(date = new Date()) {
  const yy = String(date.getFullYear()).slice(2)
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `'${yy} ${mm} ${dd}`
}

/** Draw a source (video frame or image) into a canvas, capped at MAX_EDGE,
 *  optionally mirrored. */
export function drawSource(
  source: CanvasImageSource,
  width: number,
  height: number,
  mirror = false
) {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height))
  const w = Math.round(width * scale)
  const h = Math.round(height * scale)
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")!
  if (mirror) {
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(source, 0, 0, w, h)
  return canvas
}

/** Shared prologue for the graded filters: a screen-blended blurred copy so
 *  highlights bleed, which is what makes a dark room photo look shot on film
 *  rather than shot on a phone with the brightness turned up. */
function bloom(ctx: CanvasRenderingContext2D, w: number, h: number, strength = 0.35) {
  const layer = document.createElement("canvas")
  layer.width = w
  layer.height = h
  const b = layer.getContext("2d")!
  b.filter = `blur(${Math.round(Math.max(w, h) / 90)}px) brightness(1.2)`
  b.drawImage(ctx.canvas, 0, 0)
  ctx.globalAlpha = strength
  ctx.globalCompositeOperation = "screen"
  ctx.drawImage(layer, 0, 0)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = "source-over"
}

/**
 * Run every pixel through `fn`, in place.
 *
 * The flash hotspot and the vignette are computed here rather than in each
 * filter because all of them want them and they are the same maths: a point
 * light source falls off with distance from the centre of the frame.
 */
function grade(
  canvas: HTMLCanvasElement,
  fn: (r: number, g: number, b: number, out: [number, number, number], spot: number) => void,
  grain = 22
) {
  const ctx = canvas.getContext("2d")!
  const { width: w, height: h } = canvas
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  const cx = w / 2
  const cy = h * 0.45
  const maxR = Math.hypot(w, h) / 2
  const out: [number, number, number] = [0, 0, 0]

  for (let i = 0; i < d.length; i += 4) {
    const p = i / 4
    const x = p % w
    const y = (p - x) / w
    const r = Math.hypot(x - cx, y - cy) / maxR // 0 centre → ~1 corners
    fn(d[i], d[i + 1], d[i + 2], out, r)
    const flash = 1.45 - r * 0.85
    const vignette = 1 - Math.max(0, r - 0.55) * 1.1
    const noise = (Math.random() - 0.5) * grain
    for (let c = 0; c < 3; c++) d[i + c] = out[c] * flash * vignette + noise
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

/** The orange LED date stamp, bottom right. The signature of the look. */
function drawDateStamp(canvas: HTMLCanvasElement, bold = false) {
  const ctx = canvas.getContext("2d")!
  const { width: w, height: h } = canvas
  const size = Math.round(Math.max(w, h) / (bold ? 26 : 32))
  ctx.font = `bold ${size}px ui-monospace, "SF Mono", Menlo, monospace`
  ctx.textAlign = "right"
  ctx.textBaseline = "bottom"
  ctx.shadowColor = "rgba(255,120,20,0.9)"

  ctx.shadowBlur = size / 2
  ctx.fillStyle = "#ff9d2e"
  ctx.fillText(stampText(), w - size, h - size * 0.8)
  ctx.shadowBlur = 0
}

/**
 * The reference night-flash grade, ported verbatim from
 * src/lib/vibez-flash.ts and vibez.axxes.club.
 *
 * It does NOT use the shared `grade` helper, and that is the point. The helper
 * applies the flash falloff *after* the per-filter transform; the original
 * applies it *between* the exposure curve and the contrast curve. On a bright
 * highlight the two differ visibly, and every photo already on the feed was made
 * with the original ordering. Sharing the helper here would quietly re-grade the
 * house look for anyone who shoots after this deploy.
 *
 * If you change the maths in here, change it in all three places in one commit.
 */
function nightFlashGrade(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!
  const { width: w, height: h } = canvas

  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  const cx = w / 2
  const cy = h * 0.45
  const maxR = Math.hypot(w, h) / 2
  for (let i = 0; i < d.length; i += 4) {
    const p = i / 4
    const x = p % w
    const y = (p - x) / w
    const r = Math.hypot(x - cx, y - cy) / maxR
    const flash = 1.45 - r * 0.85 // the flash falls off towards the edges
    const vignette = 1 - Math.max(0, r - 0.55) * 1.1
    const grain = (Math.random() - 0.5) * 22
    for (let c = 0; c < 3; c++) {
      let v = d[i + c] / 255
      v = Math.pow(v, 0.82) * flash // exposure + flash hotspot
      v = (v - 0.5) * 1.18 + 0.5 // contrast
      d[i + c] = v * 255 * vignette + grain
    }
    d[i] += 10 // warm
    d[i + 2] -= 8
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

/**
 * Apply a filter in place and return the canvas.
 *
 * `dateStamp` is a parameter rather than part of the filter because an organizer
 * can turn the stamp off while leaving the grade on, and the two decisions are
 * genuinely independent — the stamp is a piece of the camera, not a piece of the
 * colour.
 */
export function applyFilter(
  canvas: HTMLCanvasElement,
  filterId: string,
  dateStamp = true
): HTMLCanvasElement {
  const { width: w, height: h } = canvas
  const ctx = canvas.getContext("2d")!

  switch (filterId) {
    case "none":
      break

    case "nightflash":
      // The reference look, unchanged. See the note above nightFlashGrade.
      bloom(ctx, w, h, 0.35)
      nightFlashGrade(canvas)
      if (dateStamp) drawDateStamp(canvas)
      break

    case "noir":
      bloom(ctx, w, h, 0.2)
      grade(
        canvas,
        (r, g, b, out) => {
          // Rec. 601 luma, then a hard S-curve so it reads as film rather than as
          // a greyscale filter.
          const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255
          const v = Math.min(1, Math.max(0, (luma - 0.5) * 1.35 + 0.5))
          const c = (v * v * (3 - 2 * v)) * 255
          out[0] = out[1] = out[2] = c
        },
        14
      )
      if (dateStamp) drawDateStamp(canvas)
      break

    case "chrome":
      bloom(ctx, w, h, 0.45)
      grade(
        canvas,
        (r, g, b, out) => {
          out[0] = (r / 255) * 0.88 * 255
          out[1] = (g / 255) * 0.96 * 255
          out[2] = (b / 255) * 1.14 * 255
        },
        10
      )
      if (dateStamp) drawDateStamp(canvas)
      break

    case "amber":
      bloom(ctx, w, h, 0.4)
      grade(
        canvas,
        (r, g, b, out) => {
          out[0] = Math.min(255, (r / 255) * 1.16 * 255)
          out[1] = (g / 255) * 0.9 * 255
          out[2] = (b / 255) * 0.62 * 255
        },
        16
      )
      if (dateStamp) drawDateStamp(canvas)
      break

    case "infrared":
      bloom(ctx, w, h, 0.5)
      grade(
        canvas,
        (r, g, b, out) => {
          // Lift the reds hard and crush the greens — the reason an IR flash
          // turns skin pale and foliage white.
          out[0] = Math.min(255, (r / 255) * 1.3 * 255)
          out[1] = (g / 255) * 0.55 * 255
          out[2] = Math.min(255, (b / 255) * 1.05 * 255)
        },
        26
      )
      if (dateStamp) drawDateStamp(canvas)
      break

    case "thermal":
      // Posterised. A coarse quantise rather than a real thermal ramp, because a
      // true ramp needs a palette lookup per pixel and this is a filter somebody
      // picks while drunk at 2am, not a science instrument.
      bloom(ctx, w, h, 0.3)
      grade(
        canvas,
        (r, g, b, out) => {
          const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255
          const step = Math.round(luma * 5) / 5
          out[0] = step * 255
          out[1] = step * step * 235
          out[2] = step * step * step * 200
        },
        0
      )
      break

    case "polaroid":
      // Lifted blacks and a warm cast is what an aged print looks like; the
      // giveaway is that the shadows are never black.
      ctx.fillStyle = "rgba(255, 246, 224, 0.14)"
      ctx.fillRect(0, 0, w, h)
      grade(
        canvas,
        (r, g, b, out) => {
          out[0] = Math.min(255, r * 0.94 + 26)
          out[1] = Math.min(255, g * 0.93 + 20)
          out[2] = Math.min(255, b * 0.9 + 12)
        },
        18
      )
      if (dateStamp) drawDateStamp(canvas, true)
      break

    default:
      // An id this build does not know about falls back to the raw frame rather
      // than throwing. The settings validator rejects unknown ids, so reaching
      // here means a stale client, and a photo with no grade beats a camera that
      // refuses to open.
      break
  }

  return canvas
}

export function toJpeg(canvas: HTMLCanvasElement, quality = 0.86): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't encode photo"))),
      "image/jpeg",
      quality
    )
  )
}

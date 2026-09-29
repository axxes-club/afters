/**
 * Watermarking: laying an organizer's logo or event name over a guest's photo,
 * in the browser, before the bytes are ever uploaded.
 *
 * Why client-side rather than server-side. The photo is already in a canvas in
 * the guest's hand at the moment they press the shutter — it exists as pixels
 * and nowhere else. Compositing here means no second upload, no image
 * processing service, no per-photo server cost, and the guest's phone does the
 * work it already has the pixels for. The alternative (upload, then stamp) would
 * mean every photo crosses the network twice and the feed shows un-watermarked
 * tiles for however long the round trip takes.
 *
 * The consequence, stated plainly: the watermark is baked into the bytes the
 * guest uploads, so a guest who wanted to strip it would have to edit the file
 * first. That is the same guarantee a sticker on a printout gives you, and it is
 * the right one — the goal is that a photo posted here is visibly a photo from
 * here, not that the file is cryptographically sealed.
 */

import type { VibezWatermarkPosition } from "./vibez-settings"

export type WatermarkConfig = {
  enabled: boolean
  type: "image" | "text"
  url: string | null
  text: string | null
  position: VibezWatermarkPosition
  /** Fraction of the photo's width. */
  scale: number
  opacity: number
}

/** Where each anchor puts the mark, as fractions of the canvas. */
const ANCHORS: Record<Exclude<VibezWatermarkPosition, "tile">, { x: number; y: number }> = {
  "top-left": { x: 0, y: 0 },
  "top-center": { x: 0.5, y: 0 },
  "top-right": { x: 1, y: 0 },
  "center-left": { x: 0, y: 0.5 },
  center: { x: 0.5, y: 0.5 },
  "center-right": { x: 1, y: 0.5 },
  "bottom-left": { x: 0, y: 1 },
  "bottom-center": { x: 0.5, y: 1 },
  "bottom-right": { x: 1, y: 1 },
}

/** Padding as a fraction of the watermark's own size. Keeps the mark off the
 *  very edge, where a crop or a rounded thumbnail would clip it. */
const MARGIN = 0.18

/**
 * Load an image for drawing onto a canvas.
 *
 * `crossOrigin = "anonymous"` is set before `src`, and it is load-bearing: a
 * canvas that has drawn a cross-origin image without it is *tainted*, and
 * `toBlob` then throws a SecurityError. The watermark is hosted on our own
 * UploadThing domain which does send CORS headers, so this resolves — but the
 * order of these two lines is not cosmetic and must not be swapped.
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Watermark image wouldn't load"))
    img.src = url
  })
}

/**
 * An SVG has no intrinsic size until something tells it one, and an `<img>` of
 * an SVG with no width/height loads at 0×0. So for the vector case the source is
 * measured from the SVG itself before it is handed to the browser.
 */
async function svgIntrinsicSize(url: string): Promise<{ w: number; h: number } | null> {
  try {
    const res = await fetch(url, { mode: "cors" })
    if (!res.ok) return null
    const text = await res.text()
    // width/height attributes, or a viewBox to fall back on. Not a full XML
    // parse: this only needs two numbers, and a regex that fails to find them
    // degrades to "use the natural size", which is correct enough.
    const w = Number(/width=["']?(\d+(?:\.\d+)?)/i.exec(text)?.[1] ?? 0)
    const h = Number(/height=["']?(\d+(?:\.\d+)?)/i.exec(text)?.[1] ?? 0)
    if (w > 0 && h > 0) return { w, h }
    const vb = /viewBox=["']\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/i.exec(text)
    if (vb) return { w: Number(vb[1]), h: Number(vb[2]) }
    return null
  } catch {
    return null
  }
}

/** Draw the text watermark. Kept apart from the image path because the two
 *  have nothing in common but the position maths. */
function drawText(ctx: CanvasRenderingContext2D, w: number, h: number, cfg: WatermarkConfig) {
  const text = (cfg.text ?? "").trim()
  if (!text) return

  const size = Math.max(14, Math.round(w * cfg.scale * 0.42))
  ctx.save()
  ctx.globalAlpha = cfg.opacity
  ctx.font = `700 ${size}px ui-monospace, "SF Mono", Menlo, monospace`
  ctx.textBaseline = "middle"
  ctx.textAlign = "left"
  // A shadow rather than a stroke: the mark has to stay legible over a white
  // dress and over a black jacket, and a dark halo does that without boxing
  // the letters.
  ctx.shadowColor = "rgba(0,0,0,0.55)"
  ctx.shadowBlur = size * 0.35

  const anchor = cfg.position === "tile" ? { x: 0, y: 0 } : ANCHORS[cfg.position]
  const metrics = ctx.measureText(text)
  const tw = metrics.width
  const pad = tw * MARGIN

  const x = anchor.x === 0 ? pad : anchor.x === 1 ? w - tw - pad : (w - tw) / 2
  const y =
    anchor.y === 0 ? pad + size * 0.6 : anchor.y === 1 ? h - pad - size * 0.6 : h * 0.5

  ctx.fillStyle = "#ffffff"
  ctx.fillText(text, x, y)
  ctx.restore()
}


/**
 * Lay the watermark onto a canvas, in place.
 *
 * Never throws. A watermark that fails to load must not cost the guest their
 * photo — the feed is the product, the watermark is branding on top of it, and
 * a broken logo URL is an organizer's mistake, not a reason to lose someone's
 * picture of the night. On failure the untouched canvas is returned.
 */
export async function applyWatermark(
  canvas: HTMLCanvasElement,
  cfg: WatermarkConfig
): Promise<HTMLCanvasElement> {
  if (!cfg.enabled) return canvas

  // An enabled watermark with nothing to draw is a half-finished setting, not a
  // reason to draw an empty box on every photo in the room.
  if (cfg.type === "text" && !(cfg.text ?? "").trim()) return canvas
  if (cfg.type === "image" && !cfg.url) return canvas

  const ctx = canvas.getContext("2d")
  if (!ctx) return canvas
  const { width: w, height: h } = canvas

  if (cfg.type === "text") {
    try {
      drawText(ctx, w, h, cfg)
    } catch {
      /* a photo without a watermark beats a photo that was not taken */
    }
    return canvas
  }

  try {
    const url = cfg.url!
    const isSvg = /\.svg(\?|$)/i.test(url)
    let img: HTMLImageElement
    let naturalW: number
    let naturalH: number

    if (isSvg) {
      const size = await svgIntrinsicSize(url)
      if (!size) return canvas
      naturalW = size.w
      naturalH = size.h
      // Rasterised at the size it will be drawn, so an SVG watermark is sharp at
      // any resolution without shipping a 4K PNG.
      const targetW = Math.max(1, Math.round(w * cfg.scale))
      const svgText = await fetch(url, { mode: "cors" }).then((r) => (r.ok ? r.text() : null))
      if (!svgText) return canvas
      const sized = svgText.replace(
        /(<svg\b[^>]*?)\swidth=["'][^"']*["']/i,
        `$1 width="${targetW}"`
      )
      img = await loadImage(
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sized)}`
      )
    } else {
      img = await loadImage(url)
      naturalW = img.naturalWidth || w
      naturalH = img.naturalHeight || h
    }

    const drawW = w * cfg.scale
    const drawH = naturalH > 0 ? (drawW / naturalW) * naturalH : drawW
    const pad = drawW * MARGIN

    ctx.save()
    ctx.globalAlpha = cfg.opacity

    if (cfg.position === "tile") {
      // A repeating pattern, for an event that wants the mark on every part of
      // the photo rather than in one corner. Rotated so the repeats read as a
      // deliberate pattern instead of a grid of copies.
      const stepX = drawW * 1.6
      const stepY = drawH * 1.6
      ctx.translate(w / 2, h / 2)
      ctx.rotate((-18 * Math.PI) / 180)
      ctx.translate(-w / 2, -h / 2)
      for (let y = -stepY; y < h + stepY; y += stepY) {
        for (let x = -stepX; x < w + stepX; x += stepX) {
          ctx.drawImage(img, x, y, drawW, drawH)
        }
      }
    } else {
      const anchor = ANCHORS[cfg.position]
      const x = anchor.x === 0 ? pad : anchor.x === 1 ? w - drawW - pad : (w - drawW) / 2
      const y = anchor.y === 0 ? pad : anchor.y === 1 ? h - drawH - pad : (h - drawH) / 2
      ctx.drawImage(img, x, y, drawW, drawH)
    }

    ctx.restore()
  } catch {
    // See the note at the top: the photo is the product.
  }
  return canvas
}

/** The full capture pipeline: grade → watermark → encode.
 *
 * Order matters and is not arbitrary. The watermark goes on *after* the grade so
 * the brand mark is not itself blown out, grained and vignetted by a look that
 * is meant to apply to the photograph.
 */
export async function renderShot(
  canvas: HTMLCanvasElement,
  opts: {
    filterId: string
    dateStamp: boolean
    watermark: WatermarkConfig
    quality?: number
  }
): Promise<Blob> {
  const { applyFilter, toJpeg } = await import("./vibez-filters")
  applyFilter(canvas, opts.filterId, opts.dateStamp)
  await applyWatermark(canvas, opts.watermark)
  return toJpeg(canvas, opts.quality ?? 0.86)
}

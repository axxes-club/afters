import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * The short link is a path, not a subdomain: afters.am is at a registrar nobody
 * currently has access to, so `vbz.afters.am` cannot be pointed anywhere.
 *
 * These assert what the *source* actually does, by reading it — because the bug
 * being pinned here was invisible to unit tests: the landing page pushed a path
 * that only resolved on a host that does not exist.
 */

const ROOT = join(__dirname, "..", "..")
/** File contents with comments removed, so a check about behaviour cannot be
 *  satisfied (or failed) by prose describing it. */
const readCode = (p: string) =>
  readFileSync(join(ROOT, p), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")

const read = (p: string) => readFileSync(join(ROOT, p), "utf8")

describe("the short VIBEZ link", () => {
  it("the landing page no longer pushes the subdomain-only path", () => {
    const form = readCode("src/app/vbz/VibezCodeForm.tsx")
    // Regression: it pushed /${cleaned}/vibez, which 404s on afters.am.
    expect(form).not.toMatch(/router\.push\(`\/\$\{cleaned\}\/vibez`\)/)
    expect(form).toContain("/vbz/${encodeURIComponent(cleaned)}")
  })

  it("the short route redirects to the canonical feed", () => {
    const route = readCode("src/app/vbz/[slug]/page.tsx")
    expect(route).toContain("redirect(")
    expect(route).toContain("/vibez`")
    // Not a permanent redirect: a slug can change or be unpublished.
    expect(route).not.toContain("permanentRedirect")
  })

  it("the link the organizer copies is the short one", () => {
    // Only the *copied* URL is asserted. The "Open feed" preview link
    // deliberately points at the canonical /e/<slug>/vibez, which is where an
    // organizer should end up.
    const editor = readCode(
      "src/app/(dashboard)/b/event-editor/[eventId]/vibez/page.tsx"
    )
    expect(editor).toMatch(/guestVibezUrl\s*=\s*[^;]*\/vbz\/\$\{event\.slug\}/)
  })

  it("takes the last path segment, so a pasted full URL still works", () => {
    // Someone pastes "afters.am/e/friday" into the box; they mean "friday".
    const form = readCode("src/app/vbz/VibezCodeForm.tsx")
    expect(form).toContain(".split(\"/\")")
    expect(form).toContain(".pop()")
  })
})

import { describe, it, expect } from "vitest"

/**
 * vbz.afters.am is an alias for the VIBEZ feed, resolved in middleware before
 * routing. These are the rewrite rules, pinned.
 *
 * The rules matter more than they look. This is a rewrite, not a redirect: a
 * redirect would bounce someone off their camera mid-flow and replace the short
 * URL they scanned with a long one, which defeats the point of printing it on a
 * sticker. And it has to be an exact host match, or a request to any other
 * subdomain of afters.am would start being rewritten.
 */

import { resolveVibezAlias } from "@/lib/vbz-alias"

describe("vbz.afters.am alias", () => {
  it("maps a bare event slug to that event's feed", () => {
    expect(resolveVibezAlias("vbz.afters.am", "/friday-at-the-warehouse")).toBe(
      "/e/friday-at-the-warehouse/vibez"
    )
  })

  it("sends the bare host to the explainer rather than a 404", () => {
    expect(resolveVibezAlias("vbz.afters.am", "/")).toBe("/vbz")
  })

  it("tolerates a port, as in local development", () => {
    expect(resolveVibezAlias("vbz.afters.am:3000", "/friday")).toBe("/e/friday/vibez")
  })

  it("is case-insensitive about the host", () => {
    expect(resolveVibezAlias("VBZ.Afters.AM", "/friday")).toBe("/e/friday/vibez")
  })

  it("accepts the www form", () => {
    expect(resolveVibezAlias("www.vbz.afters.am", "/friday")).toBe("/e/friday/vibez")
  })

  it("leaves the canonical afters.am host completely alone", () => {
    expect(resolveVibezAlias("afters.am", "/friday")).toBeNull()
    expect(resolveVibezAlias("afters.am", "/e/friday/vibez")).toBeNull()
  })

  it("does not rewrite some other subdomain of afters.am", () => {
    // The exact-match host list is the guard. A suffix match here would hijack
    // every subdomain the company ever adds.
    expect(resolveVibezAlias("shop.afters.am", "/friday")).toBeNull()
    expect(resolveVibezAlias("notvbz.afters.am", "/friday")).toBeNull()
  })

  it("does not loop when the long URL is used on the alias host", () => {
    // Already a full path: pass it through, or /e/x/vibez would become
    // /e/e/x/vibez/vibez on every hop.
    expect(resolveVibezAlias("vbz.afters.am", "/e/friday/vibez")).toBeNull()
    expect(resolveVibezAlias("vbz.afters.am", "/vbz")).toBeNull()
  })

  it("never rewrites the API, so upload and join calls keep their real path", () => {
    expect(resolveVibezAlias("vbz.afters.am", "/api/events/e1/vibez/join")).toBeNull()
  })

  it("handles a trailing slash", () => {
    expect(resolveVibezAlias("vbz.afters.am", "/friday/")).toBe("/e/friday/vibez")
  })

  it("does not let a crafted path escape the rewrite target", () => {
    // A slug is interpolated into a path. `..` must not climb out of /e/.
    const out = resolveVibezAlias("vbz.afters.am", "/../../d/secrets")
    expect(out).not.toBeNull()
    expect(out!.startsWith("/e/")).toBe(true)
    expect(out).toBe("/e/../../d/secrets/vibez")
  })
})
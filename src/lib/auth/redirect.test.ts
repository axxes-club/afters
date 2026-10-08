import { describe, expect, it } from "vitest"
import { safeReturnPath } from "./redirect"

describe("safeReturnPath", () => {
  it("keeps a path on this site", () => {
    expect(safeReturnPath("/invite/abc")).toBe("/invite/abc")
    expect(safeReturnPath("/oauth/authorize?client_id=x")).toBe("/oauth/authorize?client_id=x")
  })
  it("refuses other sites and odd forms", () => {
    expect(safeReturnPath("https://evil.example")).toBe("/b")
    expect(safeReturnPath("//evil.example")).toBe("/b")
    expect(safeReturnPath("/\\evil.example")).toBe("/b")
    expect(safeReturnPath("javascript:alert(1)")).toBe("/b")
  })
  it("falls back when empty or pointing at sign-in", () => {
    expect(safeReturnPath(null)).toBe("/b")
    expect(safeReturnPath("/sign-in")).toBe("/b")
    expect(safeReturnPath("/sign-up?x=1")).toBe("/b")
  })
})

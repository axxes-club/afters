import { describe, it, expect } from "vitest"
import { escapeHtml, safeHref, safeColor } from "@/lib/security"

describe("Security utilities", () => {
  describe("escapeHtml", () => {
    it("should escape HTML special characters", () => {
      expect(escapeHtml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;"
      )
    })

    it("should escape ampersands", () => {
      expect(escapeHtml("foo & bar")).toBe("foo &amp; bar")
    })

    it("should escape quotes", () => {
      expect(escapeHtml('"double" and \'single\'')).toBe(
        "&quot;double&quot; and &#039;single&#039;"
      )
    })

    it("should return empty string for null", () => {
      expect(escapeHtml(null)).toBe("")
    })

    it("should return empty string for undefined", () => {
      expect(escapeHtml(undefined)).toBe("")
    })

    it("should return empty string for empty string", () => {
      expect(escapeHtml("")).toBe("")
    })

    it("should leave safe strings unchanged", () => {
      expect(escapeHtml("Hello World")).toBe("Hello World")
    })
  })

  describe("safeHref", () => {
    it("should allow https URLs", () => {
      expect(safeHref("https://example.com")).toBe("https://example.com")
    })

    it("should allow http URLs", () => {
      expect(safeHref("http://example.com")).toBe("http://example.com")
    })

    it("should reject javascript: URLs", () => {
      expect(safeHref("javascript:alert('xss')")).toBeUndefined()
    })

    it("should reject data: URLs", () => {
      expect(safeHref("data:text/html,<script>alert(1)</script>")).toBeUndefined()
    })

    it("should reject file: URLs", () => {
      expect(safeHref("file:///etc/passwd")).toBeUndefined()
    })

    it("should return undefined for null", () => {
      expect(safeHref(null)).toBeUndefined()
    })

    it("should return undefined for undefined", () => {
      expect(safeHref(undefined)).toBeUndefined()
    })

    it("should return undefined for invalid URLs", () => {
      expect(safeHref("not a url")).toBeUndefined()
    })

    it("should return undefined for empty string", () => {
      expect(safeHref("")).toBeUndefined()
    })
  })

  describe("safeColor", () => {
    it("should allow valid hex colors", () => {
      expect(safeColor("#FF5500")).toBe("#FF5500")
      expect(safeColor("#ffffff")).toBe("#ffffff")
      expect(safeColor("#000000")).toBe("#000000")
    })

    it("should reject short hex colors", () => {
      expect(safeColor("#FFF")).toBeUndefined()
    })

    it("should reject invalid characters", () => {
      expect(safeColor("#GGGGGG")).toBeUndefined()
    })

    it("should reject missing hash", () => {
      expect(safeColor("FF5500")).toBeUndefined()
    })

    it("should return undefined for null", () => {
      expect(safeColor(null)).toBeUndefined()
    })

    it("should return undefined for undefined", () => {
      expect(safeColor(undefined)).toBeUndefined()
    })

    it("should reject CSS color names", () => {
      expect(safeColor("red")).toBeUndefined()
    })

    it("should reject rgb values", () => {
      expect(safeColor("rgb(255, 0, 0)")).toBeUndefined()
    })
  })
})

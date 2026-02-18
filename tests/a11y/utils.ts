import { configureAxe, toHaveNoViolations } from "jest-axe"
import { expect } from "vitest"

// Extend vitest matchers with jest-axe matchers
expect.extend(toHaveNoViolations)

// Configure axe for common a11y checks
export const axe = configureAxe({
  rules: {
    // Disable rules that are too strict for testing
    "color-contrast": { enabled: false }, // Can be flaky in JSDOM
    region: { enabled: false }, // Not always applicable
  },
})

// Helper to run a11y checks on a container
export async function checkA11y(container: HTMLElement) {
  const results = await axe(container)
  expect(results).toHaveNoViolations()
}

// Common a11y test patterns
export const a11yPatterns = {
  // Check form inputs have labels
  formInputsHaveLabels: (container: HTMLElement) => {
    const inputs = container.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"])'
    )
    inputs.forEach((input) => {
      const id = input.getAttribute("id")
      const ariaLabel = input.getAttribute("aria-label")
      const ariaLabelledBy = input.getAttribute("aria-labelledby")
      const hasLabel = id && container.querySelector(`label[for="${id}"]`)
      const hasImplicitLabel = input.closest("label")

      expect(
        hasLabel || hasImplicitLabel || ariaLabel || ariaLabelledBy,
        `Input ${id || input.getAttribute("name")} should have an associated label or aria-label`
      ).toBeTruthy()
    })
  },

  // Check buttons have accessible text
  buttonsHaveText: (container: HTMLElement) => {
    const buttons = container.querySelectorAll("button")
    buttons.forEach((button) => {
      const hasText = button.textContent?.trim()
      const hasAriaLabel = button.getAttribute("aria-label")
      const hasAriaLabelledBy = button.getAttribute("aria-labelledby")
      const hasTitle = button.getAttribute("title")

      expect(
        hasText || hasAriaLabel || hasAriaLabelledBy || hasTitle,
        `Button should have accessible text`
      ).toBeTruthy()
    })
  },

  // Check images have alt text
  imagesHaveAlt: (container: HTMLElement) => {
    const images = container.querySelectorAll("img")
    images.forEach((img) => {
      const alt = img.getAttribute("alt")
      const role = img.getAttribute("role")
      const isDecorative = alt === "" || role === "presentation"

      expect(
        alt !== null || isDecorative,
        `Image with src ${img.getAttribute("src")} should have alt text or be marked as decorative`
      ).toBeTruthy()
    })
  },

  // Check links have accessible text
  linksHaveText: (container: HTMLElement) => {
    const links = container.querySelectorAll("a")
    links.forEach((link) => {
      const hasText = link.textContent?.trim()
      const hasAriaLabel = link.getAttribute("aria-label")
      const hasAriaLabelledBy = link.getAttribute("aria-labelledby")
      const hasTitle = link.getAttribute("title")

      expect(
        hasText || hasAriaLabel || hasAriaLabelledBy || hasTitle,
        `Link with href ${link.getAttribute("href")} should have accessible text`
      ).toBeTruthy()
    })
  },
}

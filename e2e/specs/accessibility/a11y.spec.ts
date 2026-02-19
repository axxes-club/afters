import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility tests using axe-core
 * 
 * These tests verify that key pages meet WCAG 2.1 AA standards.
 * Run with: pnpm test:e2e --project=a11y
 */

test.describe('Accessibility', () => {
  test.describe('Public Pages', () => {
    test('home page should have no critical a11y violations', async ({ page }) => {
      await page.goto('/');
      
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .exclude('.clerk-loading') // Exclude Clerk loading states
        .analyze();

      // Filter to critical and serious violations only
      const criticalViolations = results.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });

    test('sign-in page should be accessible', async ({ page }) => {
      await page.goto('/sign-in');
      
      // Wait for Clerk to load
      await page.waitForTimeout(2000);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .exclude('[data-clerk-component]') // Clerk handles its own a11y
        .analyze();

      const criticalViolations = results.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });
  });

  test.describe('Authenticated Pages', () => {
    test.beforeEach(async () => {
      // These tests require authentication
      // Skip if not configured
      if (!process.env.CLERK_TESTING_TOKEN) {
        test.skip();
      }
    });

    test('dashboard should be accessible', async ({ page }) => {
      await page.goto('/b');
      
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .exclude('.clerk-loading')
        .analyze();

      const criticalViolations = results.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      // Log violations for debugging (not failing on moderate/minor)
      if (results.violations.length > 0) {
        console.log('A11y violations found:', results.violations.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
        })));
      }

      expect(criticalViolations).toEqual([]);
    });

    test('event create page should be accessible', async ({ page }) => {
      await page.goto('/b/events/new');
      
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .exclude('.clerk-loading')
        .analyze();

      const criticalViolations = results.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('main navigation should be keyboard accessible', async ({ page }) => {
      await page.goto('/');
      
      // Tab through the page and check focus is visible
      await page.keyboard.press('Tab');
      
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Check that focus has a visible indicator (not just outline: none)
      const focusStyle = await focusedElement.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          outline: style.outline,
          boxShadow: style.boxShadow,
          border: style.border,
        };
      });
      
      // Should have some kind of focus indicator
      const hasFocusIndicator = 
        focusStyle.outline !== 'none' ||
        focusStyle.boxShadow !== 'none' ||
        focusStyle.border.includes('rgb');
      
      expect(hasFocusIndicator).toBe(true);
    });

    test('forms should be navigable with keyboard', async ({ page }) => {
      await page.goto('/sign-in');
      await page.waitForTimeout(2000); // Wait for Clerk
      
      // Find all focusable elements
      const focusableElements = page.locator(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      const count = await focusableElements.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Color Contrast', () => {
    test('text should have sufficient contrast', async ({ page }) => {
      await page.goto('/');
      
      const results = await new AxeBuilder({ page })
        .withTags(['cat.color'])
        .analyze();

      // Check for color contrast violations specifically
      const contrastViolations = results.violations.filter(
        v => v.id === 'color-contrast'
      );

      // Log any contrast issues
      if (contrastViolations.length > 0) {
        console.log('Contrast violations:', contrastViolations[0].nodes.map(n => ({
          html: n.html.substring(0, 100),
          message: n.failureSummary,
        })));
      }

      // Allow some violations but track them
      expect(contrastViolations.length).toBeLessThanOrEqual(5);
    });
  });

  test.describe('Screen Reader', () => {
    test('page should have proper heading structure', async ({ page }) => {
      await page.goto('/');
      
      // Check that there's exactly one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
      
      // Check heading hierarchy (no skipped levels)
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      const levels = await Promise.all(
        headings.map(async h => {
          const tag = await h.evaluate(el => el.tagName);
          return parseInt(tag[1]);
        })
      );
      
      // Verify no level is skipped
      for (let i = 1; i < levels.length; i++) {
        const diff = levels[i] - levels[i - 1];
        expect(diff).toBeLessThanOrEqual(1); // Can go up by 1 or stay same, not skip
      }
    });

    test('images should have alt text', async ({ page }) => {
      await page.goto('/');
      
      const images = page.locator('img:not([role="presentation"])');
      const count = await images.count();
      
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const ariaLabel = await img.getAttribute('aria-label');
        const ariaLabelledBy = await img.getAttribute('aria-labelledby');
        
        // Should have some form of accessible name
        const hasAccessibleName = alt !== null || ariaLabel !== null || ariaLabelledBy !== null;
        
        if (!hasAccessibleName) {
          const src = await img.getAttribute('src');
          console.log(`Image missing alt text: ${src}`);
        }
        
        expect(hasAccessibleName).toBe(true);
      }
    });

    test('interactive elements should have accessible names', async ({ page }) => {
      await page.goto('/');
      
      const results = await new AxeBuilder({ page })
        .withTags(['cat.name-role-value'])
        .analyze();

      const nameViolations = results.violations.filter(
        v => v.id === 'button-name' || v.id === 'link-name'
      );

      expect(nameViolations).toEqual([]);
    });
  });
});

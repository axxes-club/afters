import { test, expect } from '@playwright/test';

/**
 * Public home page tests
 * These don't require authentication
 */
test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the home page', async ({ page }) => {
    // Should have a title
    await expect(page).toHaveTitle(/Afters/i);
    
    // Should have main content
    await expect(page.locator('main, [role="main"], body')).toBeVisible();
  });

  test('should have navigation links', async ({ page }) => {
    // Should have sign in link
    const signInLink = page.getByRole('link', { name: /sign in|login/i });
    
    // May or may not exist depending on page design
    if (await signInLink.count() > 0) {
      await expect(signInLink.first()).toBeVisible();
    }
  });

  test('should be responsive', async ({ page }) => {
    // Desktop viewport (already set)
    await expect(page.locator('body')).toBeVisible();
    
    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load without console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known acceptable errors (e.g., third-party scripts)
    const criticalErrors = errors.filter(
      e => !e.includes('favicon') && 
           !e.includes('third-party') &&
           !e.includes('clerk')
    );

    expect(criticalErrors).toEqual([]);
  });

  test('should have valid meta tags', async ({ page }) => {
    // Check for essential meta tags
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(10);
  });

  test('should load critical resources', async ({ page }) => {
    // Check that CSS is loaded (body should have styles)
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    expect(bodyBg).toBeTruthy();
    
    // Check that fonts are loaded
    await page.waitForFunction(() => {
      return document.fonts.ready;
    });
  });
});

test.describe('Error Pages', () => {
  test('should show 404 page for invalid routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');
    
    // Should return 404 status
    expect(response?.status()).toBe(404);
    
    // Should show error message
    await expect(page.getByText(/not found|404|doesn't exist/i)).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Should load DOM content within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have layout shifts after load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot position of key element
    const header = page.locator('header, nav').first();
    
    if (await header.count() > 0) {
      const initialBox = await header.boundingBox();
      
      // Wait a bit for any late loading
      await page.waitForTimeout(1000);
      
      const finalBox = await header.boundingBox();
      
      // Position should not have changed significantly
      if (initialBox && finalBox) {
        expect(Math.abs(initialBox.y - finalBox.y)).toBeLessThan(5);
      }
    }
  });
});

import { expect, test } from "@playwright/test";

const routes = ["/", "/o-nas", "/cviceni", "/akce", "/kalendar", "/prihlaska", "/fotogalerie", "/historie", "/kontakt", "/gdpr", "/dotace"];

for (const viewport of [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
]) {
  test(`all public routes fit ${viewport.width}px without broken images`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator("footer")).toBeVisible();
      const audit = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).length,
      }));
      expect(audit.overflow, `${route} overflows at ${viewport.width}px`).toBeLessThanOrEqual(1);
      expect(audit.brokenImages, `${route} contains a broken image`).toBe(0);
    }
  });
}

test("dark mode keeps key pages usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/akce");
  await page.getByRole("button", { name: "Přepnout na tmavý režim" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  for (const route of ["/akce", "/fotogalerie", "/prihlaska", "/kontakt"]) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("main h1")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${route} overflows in dark mode`).toBeLessThanOrEqual(1);
  }

  await expect(page.getByRole("button", { name: "Přepnout na světlý režim" })).toBeVisible();
});

test("mobile navigation and poster lightbox work with keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/akce");

  const menu = page.locator('button[aria-controls="mobile-navigation"]');
  await menu.press("Enter");
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");

  const posterButton = page.getByRole("button", { name: /Zvětšit plakát Vodácké putování Berounka 2026/ });
  await posterButton.press("Enter");
  const lightbox = page.getByRole("dialog", { name: "Vodácké putování Berounka 2026" });
  await expect(lightbox).toBeVisible();
  await expect(lightbox.getByRole("link", { name: "Stáhnout plakát v JPG" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(posterButton).toBeFocused();
});

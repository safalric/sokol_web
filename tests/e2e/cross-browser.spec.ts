import { expect, test } from "@playwright/test";
import axe from "axe-core";

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
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
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
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${route} overflows in dark mode`).toBeLessThanOrEqual(1);
  }

  await expect(page.getByRole("button", { name: "Přepnout na světlý režim" })).toBeVisible();
});

test("mobile navigation and poster lightbox support keyboard dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/akce");

  const menu = page.locator('button[aria-controls="mobile-navigation"]');
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();

  const posterButton = page.getByRole("button", { name: "Zvětšit plakát Florbal", exact: true });
  await posterButton.click();
  const lightbox = page.getByRole("dialog", { name: "Florbal", exact: true });
  await expect(lightbox).toBeVisible();
  await expect(lightbox.getByRole("link", { name: "Stáhnout plakát v JPG" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(lightbox).not.toBeVisible();
  await expect(posterButton).toBeFocused();
});

test("current exercise filters, original poster download and weekly schedule work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/cviceni");
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((font) => font.status === "loaded").map((font) => font.family.replace(/["']/g, ""));
  });
  expect(fonts).toContain("Sokol Tyrs");
  expect(fonts).toContain("Work Sans");
  await page.getByLabel("Den cvičení").selectOption("1");
  await expect(page.getByRole("heading", { name: "Florbal", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Volejbal", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Zvětšit plakát Florbal", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Florbal", exact: true });
  await expect(dialog.locator("img")).toHaveJSProperty("complete", true);
  expect(await dialog.locator("img").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(1000);
  const download = await dialog.getByRole("link", { name: "Stáhnout plakát v JPG" }).getAttribute("href");
  const response = await page.request.get(download!);
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/jpeg");
  await expect(dialog.getByRole("link", { name: "Přihláška do Sokola" })).toHaveAttribute("href", "https://www.ecz-sokol.cz/clen/prihlaska");
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Týdenní rozvrh" }).click();
  await expect(page.getByRole("region", { name: "Týdenní rozvrh cvičení" }).getByRole("listitem")).toHaveCount(17);
  await page.getByRole("button", { name: "Kalendář akcí", exact: true }).click();
  await expect(page.getByRole("button", { name: "Následující měsíc" })).toBeEnabled();
  await page.getByRole("button", { name: "Následující měsíc" }).click();
  await expect(page.locator(".calendar-layout")).toHaveAttribute("aria-busy", "false");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test("new schedule and posters meet automated WCAG AA checks in both themes", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const theme of ["light", "dark"]) {
    for (const route of ["/cviceni", "/kalendar", "/akce"]) {
      await page.goto(route);
      await page.evaluate((value) => {
        localStorage.setItem("sokol-theme", value);
        document.documentElement.dataset.theme = value;
      }, theme);
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(async () => {
        await new Promise(requestAnimationFrame);
        await Promise.all(document.getAnimations()
          .filter((animation) => animation instanceof CSSTransition)
          .map((animation) => animation.finished.catch(() => undefined)));
      });
      await page.evaluate(axe.source);
      const violations = await page.evaluate(async () => {
        const result = await (window as unknown as { axe: typeof axe }).axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] }, iframes: false,
        });
        return result.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map((node) => ({ target: node.target, summary: node.failureSummary })) }));
      });
      expect(violations, `${route} (${theme})`).toEqual([]);
      if (route !== "/akce") await page.screenshot({ path: testInfo.outputPath(`${route.slice(1)}-${theme}.png`), fullPage: false });
    }
  }
});

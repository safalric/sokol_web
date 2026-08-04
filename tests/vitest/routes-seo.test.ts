import { beforeEach, describe, expect, test } from "vitest";
import { applyRouteMetadata } from "../../src/seo";
import { normalizePath, NOT_FOUND_PATH, ROUTES, ROUTE_METADATA } from "../../src/routes";

describe("routing and dynamic SEO metadata", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    window.history.replaceState({}, "", "/");
  });

  test("all public routes have unique titles and non-empty descriptions", () => {
    expect(new Set(ROUTES.map((route) => route.path)).size).toBe(ROUTES.length);
    expect(new Set(ROUTES.map((route) => route.title)).size).toBe(ROUTES.length);
    for (const route of ROUTES) {
      expect(route.title.length).toBeGreaterThan(10);
      expect(route.description.length).toBeGreaterThan(40);
    }
  });

  test.each(ROUTES)("generates metadata for $path", (route) => {
    window.history.replaceState({}, "", route.path);
    const result = applyRouteMetadata(route.path);

    expect(document.title).toBe(route.title);
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute("content", route.description);
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute("content", route.title);
    expect(document.querySelector('meta[property="og:url"]')).toHaveAttribute("content", result.canonicalUrl);
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute("href", result.canonicalUrl);
  });

  test("unknown and malformed paths resolve to the 404 route", () => {
    expect(normalizePath("/neexistujici-stranka")).toBe(NOT_FOUND_PATH);
    expect(normalizePath("/akce/neznamy-detail")).toBe(NOT_FOUND_PATH);
    expect(normalizePath("/kontakt/")).toBe("/kontakt");
  });

  test("404 metadata is noindex and keeps the requested canonical path", () => {
    window.history.replaceState({}, "", "/neexistujici-stranka");
    const result = applyRouteMetadata(NOT_FOUND_PATH);

    expect(document.title).toContain("Stránka nenalezena");
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
    expect(result.canonicalUrl).toBe(`${window.location.origin}/neexistujici-stranka`);
  });

  test("metadata lookup covers every normalized public path", () => {
    for (const route of ROUTES) expect(ROUTE_METADATA[normalizePath(route.path) as keyof typeof ROUTE_METADATA]).toEqual(route);
  });
});

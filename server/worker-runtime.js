import { calendarRuntimeStatus, handleCalendar } from "./calendar-api.js";
import { isLocalRequest, jsonResponse, staticResponse, withSecurityHeaders } from "./http-security.js";
import { createRegistrationHandler, registrationRuntimeStatus } from "./registration-api.js";

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function methodNotAllowed(allowed) {
  const response = jsonResponse({ error: "Tato metoda není podporována." }, 405);
  response.headers.set("Allow", allowed.join(", "));
  return response;
}

const NOT_FOUND_METADATA = {
  title: "Stránka nenalezena | TJ Sokol Doudleby nad Orlicí",
  description: "Požadovaná stránka na webu TJ Sokol Doudleby nad Orlicí nebyla nalezena.",
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function replaceMeta(html, attribute, key, content) {
  const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${key}["'][^>]*>`, "i");
  return html.replace(pattern, (tag) => {
    const value = escapeHtml(content);
    return /content=["'][^"']*["']/i.test(tag)
      ? tag.replace(/content=["'][^"']*["']/i, `content="${value}"`)
      : tag.replace(/>$/, ` content="${value}">`);
  });
}

function replaceCanonical(html, canonicalUrl) {
  return html.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/i, (tag) => tag.replace(/href=["'][^"']*["']/i, `href="${escapeHtml(canonicalUrl)}"`));
}

function publicOrigin(env, requestUrl) {
  try {
    const configured = new URL(env.PUBLIC_SITE_URL || "");
    if (configured.protocol === "https:") return configured.origin;
  } catch {
    // The request origin is the safe fallback until the canonical domain is configured.
  }
  return requestUrl.origin;
}

function renderIndexHtml(indexHtml, metadata, canonicalPath, origin, isNotFound = false) {
  const canonicalUrl = new URL(canonicalPath === "/" ? "/" : canonicalPath, origin).toString();
  const imageUrl = new URL("/og.png", origin).toString();
  let html = indexHtml.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(metadata.title)}</title>`);
  html = replaceMeta(html, "name", "description", metadata.description);
  html = replaceMeta(html, "name", "robots", isNotFound ? "noindex, follow" : "index, follow");
  html = replaceMeta(html, "name", "site-origin", origin);
  html = replaceMeta(html, "property", "og:title", metadata.title);
  html = replaceMeta(html, "property", "og:description", metadata.description);
  html = replaceMeta(html, "property", "og:url", canonicalUrl);
  html = replaceMeta(html, "property", "og:image", imageUrl);
  html = replaceMeta(html, "name", "twitter:title", metadata.title);
  html = replaceMeta(html, "name", "twitter:description", metadata.description);
  html = replaceMeta(html, "name", "twitter:image", imageUrl);
  return replaceCanonical(html, canonicalUrl);
}

function sitemapXml(routes, origin) {
  const urls = routes.map((path) => `  <url><loc>${escapeHtml(new URL(path, origin).toString())}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function createWorker({
  indexHtml,
  staticEntries,
  calendarEvents,
  registrationEvents = [],
  appRoutes = ["/"],
  routeMetadata = [],
  fetchImpl = fetch,
  now = () => new Date(),
}) {
  const assets = new Map(staticEntries);
  const knownHtmlRoutes = new Set(appRoutes);
  const metadataByPath = new Map(routeMetadata.map((route) => [route.path, route]));
  const handleRegistration = createRegistrationHandler({ fetchImpl, now, registrationEvents });

  return {
    async fetch(request, env = {}) {
      const url = new URL(request.url);
      const canonicalOrigin = publicOrigin(env, url);

      if (url.protocol !== "https:" && !isLocalRequest(url)) {
        if (request.method === "GET" || request.method === "HEAD") {
          const secureUrl = new URL(url);
          secureUrl.protocol = "https:";
          return Response.redirect(secureUrl, 308);
        }
        return jsonResponse({ error: "Požadavek je povolen pouze přes HTTPS." }, 400);
      }

      if (url.pathname === "/api/health") {
        if (request.method !== "GET") return methodNotAllowed(["GET"]);
        const registration = registrationRuntimeStatus(env);
        const calendar = calendarRuntimeStatus(env);
        const expectedLive = env.HEALTH_EXPECT_LIVE === "true";
        const operational = !expectedLive || (calendar.status === "configured" && registration.status === "configured");
        return jsonResponse({
          ok: operational,
          status: operational ? "ok" : "degraded",
          checkedAt: now().toISOString(),
          release: typeof env.RELEASE_SHA === "string" && env.RELEASE_SHA ? env.RELEASE_SHA.slice(0, 12) : "unknown",
          calendar: calendar.status,
          registrations: registration.status,
          healthData: registration.status === "configured" && env.REGISTRATION_HEALTH_DATA_ENABLED === "true" ? "enabled" : "disabled",
          configurationWarnings: {
            calendar: calendar.configurationWarning,
            registrations: registration.configurationWarning,
          },
        }, operational ? 200 : 503);
      }
      if (url.pathname === "/api/registration-config") {
        if (request.method !== "GET") return methodNotAllowed(["GET"]);
        const registration = registrationRuntimeStatus(env);
        return jsonResponse({
          mode: registration.status === "configured" ? "live" : "demo",
          turnstileSiteKey: registration.turnstileSiteKey,
          healthDataEnabled: registration.status === "configured" && env.REGISTRATION_HEALTH_DATA_ENABLED === "true",
          configurationWarning: registration.configurationWarning,
          missingCapabilities: registration.missingCapabilities,
          warning: registration.warning,
        });
      }
      if (url.pathname === "/api/calendar") {
        if (request.method !== "GET") return methodNotAllowed(["GET"]);
        return handleCalendar(url, env, calendarEvents, fetchImpl, now);
      }
      if (url.pathname === "/api/registrations") {
        if (request.method !== "POST") return methodNotAllowed(["POST"]);
        return handleRegistration(request, url, env);
      }
      if (url.pathname.startsWith("/api/")) return jsonResponse({ error: "Endpoint nebyl nalezen." }, 404);

      if (!["GET", "HEAD"].includes(request.method)) return methodNotAllowed(["GET", "HEAD"]);
      if (url.pathname === "/robots.txt") {
        return staticResponse(`User-agent: *\nAllow: /\n\nSitemap: ${canonicalOrigin}/sitemap.xml\n`, "text/plain; charset=utf-8", 200, request.method);
      }
      if (url.pathname === "/sitemap.xml") {
        return staticResponse(sitemapXml(appRoutes, canonicalOrigin), "application/xml; charset=utf-8", 200, request.method);
      }
      if (url.pathname === "/" || url.pathname === "/index.html") {
        const metadata = metadataByPath.get("/") || { title: "TJ Sokol Doudleby nad Orlicí", description: "TJ Sokol Doudleby nad Orlicí" };
        return staticResponse(renderIndexHtml(indexHtml, metadata, "/", canonicalOrigin), "text/html; charset=utf-8", 200, request.method);
      }
      const asset = assets.get(url.pathname);
      if (asset) return staticResponse(decodeBase64(asset.content), asset.contentType, 200, request.method);
      if ((request.headers.get("Accept") || "").includes("text/html")) {
        const normalizedPath = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
        const knownRoute = knownHtmlRoutes.has(normalizedPath);
        const metadata = knownRoute ? metadataByPath.get(normalizedPath) : NOT_FOUND_METADATA;
        return staticResponse(
          renderIndexHtml(indexHtml, metadata || NOT_FOUND_METADATA, normalizedPath, canonicalOrigin, !knownRoute),
          "text/html; charset=utf-8",
          knownRoute ? 200 : 404,
          request.method,
        );
      }
      if (env.ASSETS) return withSecurityHeaders(await env.ASSETS.fetch(request));
      return staticResponse("Not found", "text/plain; charset=utf-8", 404, request.method);
    },
  };
}

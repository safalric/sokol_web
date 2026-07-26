import { handleCalendar } from "./calendar-api.js";
import { isLocalRequest, jsonResponse, staticResponse, withSecurityHeaders } from "./http-security.js";
import { createRegistrationHandler } from "./registration-api.js";

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

export function createWorker({
  indexHtml,
  staticEntries,
  calendarEvents,
  registrationEvents = [],
  fetchImpl = fetch,
  now = () => new Date(),
}) {
  const assets = new Map(staticEntries);
  const handleRegistration = createRegistrationHandler({ fetchImpl, now, registrationEvents });

  return {
    async fetch(request, env = {}) {
      const url = new URL(request.url);

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
        const registrationConfig = [
          env.RESEND_API_KEY,
          env.REGISTRATION_FROM_EMAIL,
          env.REGISTRATION_ORGANIZER_EMAIL,
          env.GOOGLE_SHEETS_WEBHOOK_URL,
          env.GOOGLE_SHEETS_WEBHOOK_SECRET,
        ];
        const registrationConfigCount = registrationConfig.filter(Boolean).length;
        return jsonResponse({
          ok: true,
          calendar: env.GOOGLE_CALENDAR_ID && env.GOOGLE_CALENDAR_API_KEY ? "google" : "demo",
          registrations:
            registrationConfigCount === 0
              ? "demo"
              : registrationConfigCount === registrationConfig.length
                ? "configured"
                : "misconfigured",
          healthData: env.REGISTRATION_HEALTH_DATA_ENABLED === "true" ? "enabled" : "disabled",
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
      if (url.pathname === "/" || url.pathname === "/index.html") {
        return staticResponse(indexHtml, "text/html; charset=utf-8", 200, request.method);
      }
      const asset = assets.get(url.pathname);
      if (asset) return staticResponse(decodeBase64(asset.content), asset.contentType, 200, request.method);
      if ((request.headers.get("Accept") || "").includes("text/html")) {
        return staticResponse(indexHtml, "text/html; charset=utf-8", 200, request.method);
      }
      if (env.ASSETS) return withSecurityHeaders(await env.ASSETS.fetch(request));
      return staticResponse("Not found", "text/plain; charset=utf-8", 404, request.method);
    },
  };
}

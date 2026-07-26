export const SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "upgrade-insecure-requests",
  ].join("; "),
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Permitted-Cross-Domain-Policies": "none",
};

export function secureHeaders(headers = {}) {
  return new Headers({ ...SECURITY_HEADERS, ...headers });
}

export function jsonResponse(body, status = 200, cacheControl = "no-store") {
  return new Response(JSON.stringify(body), {
    status,
    headers: secureHeaders({
      "Cache-Control": cacheControl,
      "Content-Type": "application/json; charset=utf-8",
    }),
  });
}

export function staticResponse(body, contentType, status = 200, method = "GET") {
  return new Response(method === "HEAD" ? null : body, {
    status,
    headers: secureHeaders({
      "Cache-Control": contentType.includes("text/html") ? "no-store" : "public, max-age=86400",
      "Content-Type": contentType,
    }),
  });
}

export function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  Object.entries(SECURITY_HEADERS).forEach(([name, value]) => headers.set(name, value));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export function isLocalRequest(url) {
  return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
}

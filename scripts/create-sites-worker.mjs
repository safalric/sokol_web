import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const serverDir = join(process.cwd(), "dist", "server");
const assetsDir = join(process.cwd(), "dist", "assets");
const distDir = join(process.cwd(), "dist");
const indexHtml = await readFile(join(process.cwd(), "dist", "index.html"), "utf8");

async function collectFiles(dir) {
  const entries = await Promise.all(
    (await readdir(dir)).map(async (fileName) => {
      const filePath = join(dir, fileName);
      const fileStat = await stat(filePath);
      return fileStat.isDirectory() ? collectFiles(filePath) : [filePath];
    }),
  );

  return entries.flat();
}

function getContentType(fileName) {
  if (fileName.endsWith(".css")) return "text/css; charset=utf-8";
  if (fileName.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (fileName.endsWith(".svg")) return "image/svg+xml; charset=utf-8";
  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "image/jpeg";
  if (fileName.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

const assetEntries = await Promise.all(
  (await readdir(assetsDir)).map(async (fileName) => {
    const filePath = join(assetsDir, fileName);
    const content = await readFile(filePath);
    const contentType = getContentType(fileName);

    return [`/assets/${fileName}`, { content: content.toString("base64"), contentType }];
  }),
);
const publicEntries = await Promise.all(
  (await collectFiles(distDir)).map(async (filePath) => {
    const fileName = relative(distDir, filePath);
    if (fileName === "index.html" || fileName.startsWith(`assets${sep}`) || fileName.startsWith(`server${sep}`)) {
      return null;
    }

    const content = await readFile(filePath);
    const contentType = getContentType(fileName);
    const route = `/${fileName.split(sep).join("/")}`;

    return [route, { content: content.toString("base64"), contentType }];
  }),
);
const staticEntries = [...assetEntries, ...publicEntries.filter(Boolean)];

await mkdir(serverDir, { recursive: true });
await writeFile(
  join(serverDir, "index.js"),
`const INDEX_HTML = ${JSON.stringify(indexHtml)};
const ASSETS = new Map(${JSON.stringify(staticEntries)});

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function responseWithHeaders(body, contentType, status = 200) {
  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control": contentType.includes("text/html")
      ? "no-store"
      : "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-Frame-Options": "DENY",
  });

  return new Response(body, { status, headers });
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("X-Frame-Options", "DENY");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return responseWithHeaders(INDEX_HTML, "text/html; charset=utf-8");
    }

    const asset = ASSETS.get(url.pathname);
    if (asset) {
      return responseWithHeaders(decodeBase64(asset.content), asset.contentType);
    }

    if (request.method === "GET" && (request.headers.get("Accept") || "").includes("text/html")) {
      return responseWithHeaders(INDEX_HTML, "text/html; charset=utf-8");
    }

    if (env.ASSETS) {
      return withSecurityHeaders(await env.ASSETS.fetch(request));
    }

    return responseWithHeaders("Not found", "text/plain; charset=utf-8", 404);
  },
};
`,
);

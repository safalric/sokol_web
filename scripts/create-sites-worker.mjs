import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const serverDir = join(process.cwd(), "dist", "server");
const clientDir = join(process.cwd(), "dist", "client");
const indexHtml = await readFile(join(clientDir, "index.html"), "utf8");
const calendarEvents = JSON.parse(await readFile(join(process.cwd(), "src", "data", "calendar-events.json"), "utf8"));
const registrationEvents = JSON.parse(await readFile(join(process.cwd(), "src", "data", "registration-events.json"), "utf8"));
const routeMetadata = JSON.parse(await readFile(join(process.cwd(), "src", "data", "site-routes.json"), "utf8"));
const appRoutes = routeMetadata.map((route) => route.path);

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
  if (fileName.endsWith(".pdf")) return "application/pdf";
  if (fileName.endsWith(".json")) return "application/json; charset=utf-8";
  if (fileName.endsWith(".ico")) return "image/x-icon";
  if (fileName.endsWith(".woff2")) return "font/woff2";
  if (fileName.endsWith(".txt")) return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

// Keep media in the asset store, not in the Worker JavaScript bundle.
const staticEntries = (await collectFiles(clientDir))
  .map((filePath) => relative(clientDir, filePath).split(sep).join("/"))
  .filter((fileName) => fileName !== "index.html" && !fileName.split("/").some((part) => part.startsWith(".")))
  .sort()
  .map((fileName) => [`/${fileName}`, { contentType: getContentType(fileName) }]);

await mkdir(serverDir, { recursive: true });
await writeFile(join(serverDir, "asset-manifest.js"), `export default ${JSON.stringify(staticEntries)};\n`);
await Promise.all(
  (await readdir(join(process.cwd(), "server")))
    .filter((fileName) => fileName.endsWith(".js"))
    .map((fileName) => copyFile(join(process.cwd(), "server", fileName), join(serverDir, fileName === "worker-runtime.js" ? "runtime.js" : fileName))),
);
await writeFile(
  join(serverDir, "index.js"),
`import { createWorker } from "./runtime.js";
import assetManifest from "./asset-manifest.js";

const INDEX_HTML = ${JSON.stringify(indexHtml)};
const CALENDAR_EVENTS = ${JSON.stringify(calendarEvents)};
const REGISTRATION_EVENTS = ${JSON.stringify(registrationEvents)};
const APP_ROUTES = ${JSON.stringify(appRoutes)};
const ROUTE_METADATA = ${JSON.stringify(routeMetadata)};

export default createWorker({
  indexHtml: INDEX_HTML,
  staticEntries: assetManifest,
  calendarEvents: CALENDAR_EVENTS,
  registrationEvents: REGISTRATION_EVENTS,
  appRoutes: APP_ROUTES,
  routeMetadata: ROUTE_METADATA,
});
`,
);

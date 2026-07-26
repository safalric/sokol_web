import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const serverDir = join(process.cwd(), "dist", "server");
const assetsDir = join(process.cwd(), "dist", "assets");
const distDir = join(process.cwd(), "dist");
const indexHtml = await readFile(join(process.cwd(), "dist", "index.html"), "utf8");
const calendarEvents = JSON.parse(await readFile(join(process.cwd(), "src", "data", "calendar-events.json"), "utf8"));
const registrationEvents = JSON.parse(await readFile(join(process.cwd(), "src", "data", "registration-events.json"), "utf8"));

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
await Promise.all(
  (await readdir(join(process.cwd(), "server")))
    .filter((fileName) => fileName.endsWith(".js"))
    .map((fileName) => copyFile(join(process.cwd(), "server", fileName), join(serverDir, fileName === "worker-runtime.js" ? "runtime.js" : fileName))),
);
await writeFile(
  join(serverDir, "index.js"),
`import { createWorker } from "./runtime.js";

const INDEX_HTML = ${JSON.stringify(indexHtml)};
const ASSETS = new Map(${JSON.stringify(staticEntries)});
const CALENDAR_EVENTS = ${JSON.stringify(calendarEvents)};
const REGISTRATION_EVENTS = ${JSON.stringify(registrationEvents)};

export default createWorker({
  indexHtml: INDEX_HTML,
  staticEntries: ASSETS,
  calendarEvents: CALENDAR_EVENTS,
  registrationEvents: REGISTRATION_EVENTS,
});
`,
);

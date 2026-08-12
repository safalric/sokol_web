import { createServer } from "node:http";
import worker from "../dist/server/index.js";

const host = "127.0.0.1";
const port = Number(process.env.PORT || 4174);

const server = createServer(async (request, response) => {
  try {
    const url = `http://${host}:${port}${request.url || "/"}`;
    const body = request.method === "GET" || request.method === "HEAD" ? undefined : request;
    const workerRequest = new Request(url, {
      method: request.method,
      headers: request.headers,
      body,
      duplex: body ? "half" : undefined,
    });
    const workerResponse = await worker.fetch(workerRequest, process.env);
    const headers = new Headers(workerResponse.headers);
    const contentSecurityPolicy = headers.get("Content-Security-Policy");
    if (contentSecurityPolicy) {
      headers.set(
        "Content-Security-Policy",
        contentSecurityPolicy
          .split(";")
          .map((directive) => directive.trim())
          .filter((directive) => directive !== "upgrade-insecure-requests")
          .join("; "),
      );
    }
    response.writeHead(workerResponse.status, Object.fromEntries(headers.entries()));
    response.end(Buffer.from(await workerResponse.arrayBuffer()));
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : "Internal preview error");
  }
});

server.listen(port, host, () => {
  process.stdout.write(`Production worker preview: http://${host}:${port}\n`);
});

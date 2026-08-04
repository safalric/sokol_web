import { NOT_FOUND_PATH, ROUTE_METADATA, type ResolvedPath } from "./routes";

const NOT_FOUND_METADATA = {
  title: "Stránka nenalezena | TJ Sokol Doudleby nad Orlicí",
  description: "Požadovaná stránka na webu TJ Sokol Doudleby nad Orlicí nebyla nalezena.",
};

function setMeta(selector: string, attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}

export function applyRouteMetadata(path: ResolvedPath, pathname = window.location.pathname) {
  const metadata = path === NOT_FOUND_PATH ? NOT_FOUND_METADATA : ROUTE_METADATA[path];
  const canonicalPath = path === NOT_FOUND_PATH ? pathname : path;
  const canonicalUrl = new URL(canonicalPath === "/" ? "/" : canonicalPath, window.location.origin).toString();

  document.title = metadata.title;
  setMeta('meta[name="description"]', "name", "description", metadata.description);
  setMeta('meta[name="robots"]', "name", "robots", path === NOT_FOUND_PATH ? "noindex, follow" : "index, follow");
  setMeta('meta[property="og:title"]', "property", "og:title", metadata.title);
  setMeta('meta[property="og:description"]', "property", "og:description", metadata.description);
  setMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
  setMeta('meta[name="twitter:title"]', "name", "twitter:title", metadata.title);
  setMeta('meta[name="twitter:description"]', "name", "twitter:description", metadata.description);

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.append(canonical);
  }
  canonical.href = canonicalUrl;

  return { ...metadata, canonicalUrl };
}

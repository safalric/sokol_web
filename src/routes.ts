import routeData from "./data/site-routes.json";

export const NOT_FOUND_PATH = "/404" as const;

export type SitePath =
  | "/"
  | "/o-nas"
  | "/cviceni"
  | "/akce"
  | "/kalendar"
  | "/prihlaska"
  | "/fotogalerie"
  | "/historie"
  | "/kontakt"
  | "/gdpr"
  | "/dotace";

export type ResolvedPath = SitePath | typeof NOT_FOUND_PATH;

export type RouteMetadata = {
  path: SitePath;
  title: string;
  pageTitle: string;
  description: string;
};

export const ROUTES = routeData as RouteMetadata[];
export const SITE_PATHS = ROUTES.map((route) => route.path);
export const ROUTE_METADATA = Object.fromEntries(ROUTES.map((route) => [route.path, route])) as Record<SitePath, RouteMetadata>;
export const PAGE_TITLES = Object.fromEntries(ROUTES.map((route) => [route.path, route.pageTitle])) as Record<SitePath, string>;

export function normalizePath(pathname: string): ResolvedPath {
  const withoutTrailingSlash = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return Object.prototype.hasOwnProperty.call(ROUTE_METADATA, withoutTrailingSlash)
    ? withoutTrailingSlash as SitePath
    : NOT_FOUND_PATH;
}

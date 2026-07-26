export const PAGE_TITLES: Record<string, string> = {
  "/": "Úvod",
  "/o-nas": "O nás",
  "/cviceni": "Cvičení",
  "/akce": "Akce",
  "/kalendar": "Kalendář",
  "/prihlaska": "Přihláška",
  "/fotogalerie": "Fotogalerie",
  "/historie": "Historie",
  "/kontakt": "Kontakt",
  "/gdpr": "Ochrana osobních údajů",
};

export type SitePath = keyof typeof PAGE_TITLES;

export function normalizePath(pathname: string) {
  const path = pathname.replace(/\/$/, "") || "/";
  return Object.prototype.hasOwnProperty.call(PAGE_TITLES, path) ? path : "/";
}

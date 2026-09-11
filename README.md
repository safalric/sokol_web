# TJ Sokol Doudleby nad Orlicí

Moderní prezentační web postavený v Reactu, TypeScriptu, Vite a Tailwind CSS. Součástí je same-origin API pro kalendář a přihlášky na akce.

Aktuální stav a plán: [zářijové předání](docs/release-2026-09-10.md), [přechod z FORPSI](docs/migration-forpsi.md), [ověřené cvičení](docs/exercise-sources-2026-2027.md), [oficiální písma](docs/fonts.md). Starší reporty popisují historický stav, nikoli současný ostrý provoz.

Příprava účtů a přístupů: [Google pro jednotu a testování](docs/google-accounts-setup.md). Nové účty zatím nejsou založené a živé integrace nejsou aktivované.

## Vývoj

```bash
pnpm install
pnpm dev
```

Kompletní kontrola typů, automatizovaných testů a produkčního sestavení:

```bash
pnpm qa
```

Lokální náhled včetně worker API:

```bash
pnpm preview:worker
```

## Struktura

- `src/pages/` obsahuje stránky seskupené podle domény.
- `src/components/` obsahuje sdílené komponenty a formuláře.
- `src/config/` obsahuje sdílená pravidla klienta.
- `src/data/` obsahuje veřejný obsah, demo kalendář a povolené akce.
- `src/data/site-routes.json` je jediný registr veřejných cest a jejich SEO metadat.
- `src/data/gallery.json` je jediný manifest alb, popisků a rozměrů fotografií.
- `public/gallery/` obsahuje malé WebP náhledy a větší varianty načítané až v lightboxu.
- `src/data/posters.json` je manifest plakátů a informačních letáků převzatých z původního webu.
- `src/data/exercises.json` je společný zdroj aktuálních cvičení 2026/2027, rozvrhu, kontaktů a 15 nových plakátů.
- `src/data/posters.ts` spojuje aktuální materiály a oddělený archiv.
- `public/posters/previews/` obsahuje optimalizované WebP náhledy, `public/posters/original/` originály ke stažení.
- `src/services/` je jediná klientská vrstva pro same-origin API.
- `server/` odděluje HTTP zabezpečení, kalendář a zpracování přihlášek.
- `db/schema.ts` a `drizzle/` popisují trvalé D1 schéma a nasazované migrace.
- `tests/vitest/` ověřuje routing, 404, metadata, přístupnost a manipulace formuláře.
- `tests/e2e/` ověřuje Chromium, Firefox a WebKit při 375, 390, 768 a 1280 px včetně dark mode a ovládání klávesnicí.
- Ostatní testy v `tests/` ověřují API, assety, bezpečnostní hlavičky a kritická pravidla formuláře.
- `docs/` popisuje integrace, bezpečnost a kroky před ostrým provozem.
- `.github/workflows/ci.yml` spouští stejnou kontrolu při pushi a pull requestu do `main`.

Build odděluje veřejné soubory (`dist/client/`) od Workeru (`dist/server/`). Obrázky nejsou vložené do JavaScriptu serveru; produkční hosting musí poskytovat vazbu `ASSETS` na `dist/client/` a `DB` pro D1. Worker odbavuje HTML/API před statickými soubory, aby zůstala funkční metadata, 404 i bezpečnostní hlavičky. Nikdy nezveřejňovat celý `dist/server/` jako statické soubory. Lokální `preview:worker` poskytuje stejnou vazbu přes seznam povolených veřejných souborů.

## Provozní režimy

Bez tajných proměnných běží kalendář a přihlášky v transparentním demo režimu. Přihláška projde serverovou validací, ale osobní ani zdravotní údaje se neukládají a neodesílají.

Ostrý režim vyžaduje serverové proměnné a každá skutečná akce také `productionApproved: true`. Ukázkové akce mají tuto pojistku vypnutou. Klíče nesmí mít prefix `VITE_` a nesmí být commitnuty. Zdravotní údaje mají samostatnou pojistku `REGISTRATION_HEALTH_DATA_ENABLED=true` a spolu s volnými poznámkami se neposílají e-mailem.

Podrobnosti jsou v [integrations.md](docs/integrations.md), [security.md](docs/security.md), [privacy-go-live.md](docs/privacy-go-live.md), [final-production-readiness-report.md](docs/final-production-readiness-report.md) a [go-live-handoff.md](docs/go-live-handoff.md).

## Fotogalerie a plakáty

Galerie načítá v přehledu pouze náhledy do šířky 640 px. Větší fotografie se stáhne až po otevření lightboxu. Každá fotografie musí mít v `gallery.json` vlastní ID, album, český popis `alt`, rozměry náhledu a rozměry velké varianty. Před zveřejněním nové fotografie musí vedení jednoty potvrdit oprávnění ke zveřejnění, zejména pokud jsou na snímku děti.

Plakáty jsou uloženy jako kompaktní WebP náhledy a původní JPG soubory ke stažení. Zdroj a datum převzetí jsou evidované v `docs/poster-sources.md`. Kontrola `pnpm qa` hlídá manifest, lazy loading, existenci, formát a maximální velikost souborů.

## Provozní ochrana

Ostré přihlášky vyžadují D1 binding `DB` a tajnou hodnotu `RATE_LIMIT_HASH_SECRET`. D1 počítá pokusy globálně napříč instancemi Workeru, přičemž ukládá pouze jednosměrný hash IP a automaticky odstraňuje staré záznamy. Edge WAF a monitoring se nastavují podle `docs/waf-monitoring-runbook.md` až nad produkční doménou.

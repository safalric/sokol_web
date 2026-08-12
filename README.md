# TJ Sokol Doudleby nad Orlicí

Moderní prezentační web postavený v Reactu, TypeScriptu, Vite a Tailwind CSS. Součástí je same-origin API pro kalendář a přihlášky na akce.

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
- `public/posters/previews/` obsahuje optimalizované WebP náhledy, `public/posters/original/` originály ke stažení.
- `src/services/` je jediná klientská vrstva pro same-origin API.
- `server/` odděluje HTTP zabezpečení, kalendář a zpracování přihlášek.
- `db/schema.ts` a `drizzle/` popisují trvalé D1 schéma a nasazované migrace.
- `tests/vitest/` ověřuje routing, 404, metadata, přístupnost a manipulace formuláře.
- `tests/e2e/` ověřuje Chromium, Firefox a WebKit při 375, 390, 768 a 1280 px včetně dark mode a ovládání klávesnicí.
- Ostatní testy v `tests/` ověřují API, assety, bezpečnostní hlavičky a kritická pravidla formuláře.
- `docs/` popisuje integrace, bezpečnost a kroky před ostrým provozem.
- `.github/workflows/ci.yml` spouští stejnou kontrolu při pushi a pull requestu do `main`.

## Provozní režimy

Bez tajných proměnných běží kalendář a přihlášky v transparentním demo režimu. Přihláška projde serverovou validací, ale osobní ani zdravotní údaje se neukládají a neodesílají.

Ostrý režim se aktivuje pouze serverovými proměnnými prostředí. Klíče nesmí mít prefix `VITE_` a nesmí být commitnuty. Zdravotní údaje mají samostatnou pojistku `REGISTRATION_HEALTH_DATA_ENABLED=true` a nikdy se neposílají e-mailem.

Podrobnosti jsou v [integrations.md](docs/integrations.md), [security.md](docs/security.md), [privacy-go-live.md](docs/privacy-go-live.md), [final-production-readiness-report.md](docs/final-production-readiness-report.md) a [go-live-handoff.md](docs/go-live-handoff.md).

## Fotogalerie a plakáty

Galerie načítá v přehledu pouze náhledy do šířky 640 px. Větší fotografie se stáhne až po otevření lightboxu. Každá fotografie musí mít v `gallery.json` vlastní ID, album, český popis `alt`, rozměry náhledu a rozměry velké varianty. Před zveřejněním nové fotografie musí vedení jednoty potvrdit oprávnění ke zveřejnění, zejména pokud jsou na snímku děti.

Plakáty jsou uloženy jako kompaktní WebP náhledy a původní JPG soubory ke stažení. Zdroj a datum převzetí jsou evidované v `docs/poster-sources.md`. Kontrola `pnpm qa` hlídá manifest, lazy loading, existenci, formát a maximální velikost souborů.

## Provozní ochrana

Ostré přihlášky vyžadují D1 binding `DB` a tajnou hodnotu `RATE_LIMIT_HASH_SECRET`. D1 počítá pokusy globálně napříč instancemi Workeru, přičemž ukládá pouze jednosměrný hash IP a automaticky odstraňuje staré záznamy. Edge WAF a monitoring se nastavují podle `docs/waf-monitoring-runbook.md` až nad produkční doménou.

# TJ Sokol Doudleby nad Orlicí

Moderní prezentační web postavený v Reactu, TypeScriptu, Vite a Tailwind CSS. Součástí je same-origin API pro kalendář a přihlášky na akce.

## Vývoj

```bash
pnpm install
pnpm dev
```

Kompletní kontrola typů, 50 automatizovaných testů a produkčního sestavení:

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
- `src/services/` je jediná klientská vrstva pro same-origin API.
- `server/` odděluje HTTP zabezpečení, kalendář a zpracování přihlášek.
- `tests/vitest/` ověřuje routing, 404, metadata a manipulace formuláře.
- Ostatní testy v `tests/` ověřují API, assety, bezpečnostní hlavičky a kritická pravidla formuláře.
- `docs/` popisuje integrace, bezpečnost a kroky před ostrým provozem.
- `.github/workflows/ci.yml` spouští stejnou kontrolu při pushi a pull requestu do `main`.

## Provozní režimy

Bez tajných proměnných běží kalendář a přihlášky v transparentním demo režimu. Přihláška projde serverovou validací, ale osobní ani zdravotní údaje se neukládají a neodesílají.

Ostrý režim se aktivuje pouze serverovými proměnnými prostředí. Klíče nesmí mít prefix `VITE_` a nesmí být commitnuty. Zdravotní údaje mají samostatnou pojistku `REGISTRATION_HEALTH_DATA_ENABLED=true` a nikdy se neposílají e-mailem.

Podrobnosti jsou v [integrations.md](docs/integrations.md), [security.md](docs/security.md), [privacy-go-live.md](docs/privacy-go-live.md) a [final-production-readiness-report.md](docs/final-production-readiness-report.md).

## Fotogalerie a plakáty

Galerie načítá v přehledu pouze náhledy do šířky 640 px. Větší fotografie se stáhne až po otevření lightboxu. Každá fotografie musí mít v `gallery.json` vlastní ID, album, český popis `alt`, rozměry náhledu a rozměry velké varianty. Před zveřejněním nové fotografie musí vedení jednoty potvrdit oprávnění ke zveřejnění, zejména pokud jsou na snímku děti.

Plakáty jsou uloženy v `public/posters/` jako kompaktní PNG náhled a odpovídající PDF ke stažení. Kontrola `pnpm qa` hlídá existenci, formát a maximální velikost obrazových souborů.

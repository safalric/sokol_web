# TJ Sokol Doudleby nad Orlicí

Moderní prezentační web postavený v Reactu, TypeScriptu, Vite a Tailwind CSS. Součástí je same-origin API pro kalendář a přihlášky na akce.

## Vývoj

```bash
pnpm install
pnpm dev
```

Kompletní kontrola typů, API testů a produkčního sestavení:

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
- `src/services/` je jediná klientská vrstva pro same-origin API.
- `server/` odděluje HTTP zabezpečení, kalendář a zpracování přihlášek.
- `tests/` ověřuje API, bezpečnostní hlavičky a kritická pravidla formuláře.
- `docs/` popisuje integrace, bezpečnost a kroky před ostrým provozem.

## Provozní režimy

Bez tajných proměnných běží kalendář a přihlášky v transparentním demo režimu. Přihláška projde serverovou validací, ale osobní ani zdravotní údaje se neukládají a neodesílají.

Ostrý režim se aktivuje pouze serverovými proměnnými prostředí. Klíče nesmí mít prefix `VITE_` a nesmí být commitnuty. Zdravotní údaje mají samostatnou pojistku `REGISTRATION_HEALTH_DATA_ENABLED=true` a nikdy se neposílají e-mailem.

Podrobnosti jsou v [integrations.md](docs/integrations.md), [security.md](docs/security.md) a [privacy-go-live.md](docs/privacy-go-live.md).

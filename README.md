# TJ Sokol Doudleby nad Orlicí

Web v Reactu, TypeScriptu, Vite a Tailwind CSS. Veřejné termíny načítá z Google Kalendáře; přihlášky otevírá v Google Forms a osobní údaje tak nikdy neposílá přes webový server.

## Vývoj a kontrola

```bash
pnpm install
pnpm dev
pnpm qa
```

`pnpm qa` ověří veřejný obsah, TypeScript, unit a integrační testy, produkční build a E2E testy v Chromium, Firefoxu a WebKitu.

Lokální náhled Workeru:

```bash
pnpm preview:worker
```

## Kde se co spravuje

- `src/data/site-content.json`: aktuality, oddíly, veřejné kontakty, akce a ověřené odkazy na Google Forms.
- Google Kalendář: skutečné termíny a změny programu.
- Samostatná neveřejná Google tabulka: odpovědi z přihlášek, kontrola duplicit a kapacity.
- `server/google-forms-sheets.example.gs`: Apps Script pro kontrolu přihlášek, zálohy a retenční kontrolu; neposílá e-maily.
- `src/data/gallery.json` a `src/data/posters.json`: fotografie a plakáty.
- `src/data/site-routes.json`: veřejné cesty a SEO metadata.

Veřejný obsah a osobní údaje se nesmějí ukládat do stejného souboru ani tabulky.

## Produkční konfigurace

Worker potřebuje pouze:

- `PUBLIC_SITE_URL`
- `GOOGLE_CALENDAR_ID`
- `GOOGLE_CALENDAR_API_KEY`
- `HEALTH_EXPECT_LIVE=true` po připojení kalendáře
- volitelně `RELEASE_SHA`

Odkaz na přihlášku se zveřejní až tehdy, když má akce v `site-content.json` platnou oficiální Google Forms URL a `open: true`. Build odmítne jinou doménu nebo otevřenou přihlášku bez URL.

Podrobný provozní postup je v [content-operations.md](docs/content-operations.md), [integrations.md](docs/integrations.md) a [go-live-handoff.md](docs/go-live-handoff.md).

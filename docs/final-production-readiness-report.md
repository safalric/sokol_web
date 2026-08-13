# Připravenost na produkci

Stav k 13. srpnu 2026: aplikace je připravená jako release candidate. Veřejný web nepřijímá osobní údaje; přihlášky jsou navržené výhradně přes Google Forms a neveřejné Sheets.

## Hotovo v kódu

- Jeden validovaný zdroj veřejných aktualit, oddílů, kontaktů a akcí.
- Ověřování Google Forms URL a bezpečně zavřené přihlášky bez URL.
- Google Calendar API s bezpečnou zálohou a odkazy pro Apple, Google a ICS.
- Apps Script pro chyby, duplicity, kapacitu, náhradníky, zálohy a retenční kontrolu bez e-mailů.
- Odstraněný registrační endpoint, e-mailová služba, Turnstile a D1 databáze.
- HTTPS redirect, HSTS, CSP, route-specific SEO, sitemap a monitorovatelný health endpoint.
- CI s validací, testy, buildem, E2E, auditem a náhledovým artefaktem.

## Detailní technický audit 13. srpna 2026

Výsledek kontroly aktuální větve:

- čistá instalace `pnpm install --frozen-lockfile` prošla,
- validace obsahu a TypeScript prošly,
- 34 Vitest UI, routing, SEO a accessibility testů prošlo,
- 25 Node integračních testů obsahu, Workeru, assetů a registračního Apps Scriptu prošlo,
- 18 Playwright scénářů prošlo v Chromium, Firefoxu a WebKitu při šířkách 375, 390, 768 a 1280 px,
- produkční Vite + Worker build prošel,
- `pnpm audit --audit-level high` nehlásí známou zranitelnost,
- `git diff --check` nehlásí poškozený patch ani chyby bílých znaků,
- kontrola repozitáře a produkčního bundle nenašla tajný klíč ani zbylou klientskou registrační logiku,
- externí odkazy na eČlen, ÚOOÚ a OpenStreetMap byly ověřeny jako dostupné.

Audit našel a před publikací opravil:

- časové Apps Script triggery nyní otevírají výhradně uložené ID soukromé registrační tabulky,
- hodinový monitor označí nezpracovanou přihlášku k ruční kontrole,
- pomocné listy se při údržbě nerozpoznají jako odpovědi formuláře,
- duplicity používají tajný HMAC otisk automaticky uložený v Script Properties,
- česká hodnota `Souhlasím` se porovnává po bezpečné Unicode normalizaci,
- odstraněna zbylá nepoužívaná D1 vazba a starý registrační endpoint,
- GDPR text přesně uvádí automatické načítání mapového náhledu OpenStreetMap.

Závislosti mají nastavený Dependabot. Velké aktualizace React/Vite/Tailwind a testovacích nástrojů se nemají slučovat hromadně bez samostatného testovaného pull requestu.

## Externí blokátory

- skutečné Google Forms URL a soukromé odpovědní tabulky,
- veřejný Google Calendar ID a API klíč,
- schválený obsah a odstranění demo položek,
- schválené informace o ochraně osobních údajů a retenční lhůty,
- produkční doména, DNS a přístupy k hostingu.

Bez těchto údajů zůstávají přihlášky bezpečně zavřené a kalendář používá záložní obsah. Přesný postup obsahuje `docs/go-live-handoff.md`.

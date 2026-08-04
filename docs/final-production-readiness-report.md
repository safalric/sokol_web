# Finální report připravenosti projektu

Projekt: TJ Sokol Doudleby nad Orlicí  
Datum auditu: 4. srpna 2026  
Repozitář: `https://github.com/safalric/sokol_web`

## Výsledek

Kód je po šesti fázích připravený k produkčnímu nasazení a bezpečně funguje bez externích klíčů v transparentním demo režimu. Veřejný ostrý start je podmíněný dodáním produkčních účtů, schválením obsahu, právní kontrolou GDPR procesu a změnou neveřejného přístupu hostingu.

## Fáze 1: Architektura a chybějící funkce

- Přidaná samostatná responzivní 404 stránka s návratem na úvod a kalendář.
- Neznámé cesty se již nenormalizují na homepage.
- Worker vrací 200 pro známé HTML cesty a 404 pro neznámé.
- Přidaný jednotný registr 11 rout v `src/data/site-routes.json`.
- Každá podstránka má vlastní title, description, canonical, OpenGraph a Twitter metadata.
- 404 používá `noindex, follow`.
- Přidané `robots.txt` a `sitemap.xml`.
- Doplněná stránka Dotace s transparentním prázdným stavem.
- Nadpisy a běžný text mají robustní lokální font fallbacky.

## Fáze 2: Bezpečnost a API režimy

- Calendar a Registration API mají explicitní stav demo/configured.
- Chybějící nebo částečná konfigurace zůstane bezpečně v demu a vrací varovný příznak.
- API odpovědi uvádějí pouze obecné chybějící schopnosti, nikoli názvy nebo hodnoty tajných klíčů.
- Z klienta jsou odstraněné všechny předpoklady, že částečná konfigurace je ostrá.
- Health endpoint reportuje stav integrací bez úniku konfigurace.
- Zdravotní údaje vyžadují výslovný souhlas, neposílají se e-mailem a ukládání vyžaduje zvláštní serverovou pojistku.
- Ověřený honeypot, časová past, rate limit, origin kontrola, allowlist polí, NFKC sanitizace, XSS escaping a Sheets formula injection ochrana.
- Přidaný `Retry-After` u rate limitu a CORP hlavička.

## Fáze 3: Přístupnost, dark mode a responzivita

- Doplněné role a názvy pro lightboxy, ovladače kalendáře, sociální skupiny, souhrny a formulář.
- Mobilní menu správně používá `aria-expanded` a vrací fokus po Escape.
- Plakátový lightbox zamyká scroll, podporuje Escape a vrací fokus na původní kartu.
- Galerie podporuje tab pattern, šipky, Escape a návrat fokusu.
- Turnstile používá automatické světlé/tmavé téma a přístupný popisek.
- Fokusové rámečky jsou viditelné a kontrastní v obou režimech.
- Opravený kontrast počítadel galerie, mapového odkazu a kontaktních odkazů.
- Ověřeno 48 kombinací cesty a šířky: 375, 390, 768 a 1280 px.
- Nalezeno 0 horizontálních overflow, 0 chybějících H1, 0 chybějících alt a 0 duplicitních ID.
- Cílený WCAG AA kontrastní scan ve světlém i tmavém režimu po opravách: 0 nálezů.
- Konzole prohlížeče: 0 chyb.

## Fáze 4: CI/CD a konfigurace

- Přidaný `.github/workflows/ci.yml` pro push a pull request do `main`.
- CI používá Node 22, pnpm 11.9.0, frozen lockfile a read-only oprávnění.
- CI spouští TypeScript, Vitest, Worker/API testy, produkční build a audit produkčních závislostí.
- Přidaná concurrency ochrana proti zbytečně souběžným běhům.
- `.env.example` popisuje demo chování, jednotlivé integrace, nakládání se secrets a zdravotní data.
- Žádná citlivá proměnná nepoužívá prefix `VITE_`.

## Fáze 5: Testovací sada

- Přidaný Vitest 4, jsdom a Testing Library.
- Přidané testy vykreslení 404 a návratu na homepage.
- Přidané testy routy Dotace.
- Přidané parametrické testy metadata všech 11 cest.
- Přidané testy canonical a robots pro 404.
- Přidané testy bezpečného demo fallbacku a nepřítomnosti secretů v odpovědi.
- Přidané testy mass-assignment, zdravotního souhlasu, honeypotu a časové pasti.
- Přidaný Worker test HTTP 200/404.

## Fáze 6: Finální ověření

- `pnpm qa`: úspěch.
- Vitest: 24/24.
- Node Worker/API/asset testy: 26/26.
- Celkem: 50/50 testů, 0 chyb, 0 přeskočených.
- TypeScript `tsc --noEmit`: úspěch.
- Produkční Vite a Worker build: úspěch.
- Build: HTML 2 173 B, CSS 87 840 B, JS 287 261 B.
- `pnpm audit`: žádná známá zranitelnost.
- `pnpm audit --prod`: žádná známá zranitelnost.
- `git diff --check`: bez whitespace chyb.
- Obsahový scan: 0 pronájmů, 0 Lorem Ipsum, 0 TODO/FIXME/HACK.
- Secret scan: žádné rozpoznané produkční klíče a žádná `VITE_` serverová konfigurace.

## Proměnné pro ostrý start

### Kalendář

- `GOOGLE_CALENDAR_ID`
- `GOOGLE_CALENDAR_API_KEY`

### Přihlášky a e-mail

- `RESEND_API_KEY`
- `REGISTRATION_FROM_EMAIL`
- `REGISTRATION_ORGANIZER_EMAIL`

### Evidence a kapacita

- `GOOGLE_SHEETS_WEBHOOK_URL`
- `GOOGLE_SHEETS_WEBHOOK_SECRET`

### Antispam

- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

### Citlivé údaje

- `REGISTRATION_HEALTH_DATA_ENABLED=false` ve výchozím stavu
- Hodnotu `true` použít pouze po právním schválení, omezení přístupů a ověření výmazu.

## Checklist pro vedení Sokola

- [ ] Potvrdit zveřejnění webu pro veřejnost.
- [ ] Rozhodnout vlastní doménu a DNS.
- [ ] Schválit všechny aktuality, akce, plakáty a rozvrhy.
- [ ] Potvrdit kontakty a přiřazení cvičitelů.
- [ ] Potvrdit práva ke všem fotografiím, zejména fotografiím dětí.
- [ ] Schválit současný fallback font nebo dodat licencovaný oficiální font.
- [ ] Právně schválit GDPR text, právní tituly, příjemce, doby uchování a výmaz.
- [ ] Určit odpovědnou osobu pro žádosti subjektů údajů a incidenty.
- [ ] Založit ověřenou odesílací doménu a Resend účet.
- [ ] Založit chráněnou Google tabulku a nasadit kontrolovaný webhook.
- [ ] Založit Turnstile a samostatný veřejný Google Kalendář.
- [ ] Vložit secrets pouze do zabezpečeného prostředí hostingu.
- [ ] Provést E2E test ostrého toku s fiktivním účastníkem.
- [ ] Ověřit doručení organizátorovi i účastníkovi a zápis kapacity.
- [ ] Otestovat proces opravy, exportu a výmazu přihlášky.
- [ ] Provést akceptaci v Safari, Firefoxu a se čtečkou obrazovky.
- [ ] Nastavit monitoring bez logování osobních a zdravotních údajů.

## Zbývající technická omezení

- Metadata podstránek jsou klientská; projekt nepoužívá SSR.
- Není schema.org JSON-LD.
- Rate limit Workeru je lokální pro konkrétní instanci; trvalou kapacitu a duplicity musí hlídat webhook.
- Není CMS, administrace galerie ani automatický upload obrázků.
- Externí integrace nebyly end-to-end otestované se skutečnými účty, protože přístupy nebyly dodané.
- Repo nemůže samo garantovat pouze TLS 1.3; to se ověřuje v konfiguraci cílového hostingu.
- GDPR dokumentace není právní stanovisko.

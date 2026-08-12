# Finální audit připravenosti projektu

Projekt: TJ Sokol Doudleby nad Orlicí

Datum auditu: 12. srpna 2026

Repozitář: `https://github.com/safalric/sokol_web`

Produkční kandidát: větev `main`

## Verdikt

Kód je ve stavu **release candidate** a je bezpečný pro prezentaci v demo režimu. Veřejný ostrý provoz zatím není dokončený, protože chybí produkční účty a tajné proměnné, schválený obsah, právní schválení práce s osobními údaji, veřejná doména a provozní monitoring.

Bez těchto vstupů se kalendář i přihlášky záměrně přepnou do viditelně označeného demo režimu. Demo přihláška osobní ani zdravotní údaje neukládá a neposílá třetím stranám.

## Co je hotové v kódu

- 11 responzivních podstránek a samostatná 404 stránka s korektním HTTP 404.
- Mobilní navigace, dark mode, galerie s lightboxem, plakáty s PDF a kalendář v grid/list režimu.
- Oddělené formuláře pro jednodenní výlet a tábor. Výlet nepřijímá ani neodesílá zdravotní údaje.
- Same-origin Worker API pro kalendář a přihlášky.
- Bezpečný přechod mezi demo a live režimem podle kompletnosti serverové konfigurace.
- Serverová validace, allowlist polí a akcí, honeypot, časová past, rate limit, idempotence a Turnstile.
- XSS escaping, Unicode normalizace a ochrana Google Sheets proti formula injection.
- Zdravotní údaje pouze u tábora, s výslovným souhlasem, mimo e-mail a za samostatnou provozní pojistkou.
- Oddělené listy `Výlety` a `Tábory`, kontrola schématu, duplicit a kapacity pod zámkem Apps Scriptu.
- Oddělené cílové e-maily pro výlety a tábory a potvrzení účastníkovi s ID přihlášky.
- Dynamické title, description, canonical, OpenGraph a Twitter metadata renderované Workerem před spuštěním JavaScriptu.
- Dynamické `robots.txt` a `sitemap.xml` podle `PUBLIC_SITE_URL`; 404 má `noindex, follow`.
- CSP, HSTS, zákaz rámování, bezpečná referrer policy, omezení oprávnění a další bezpečnostní hlavičky.
- GitHub Actions kontrola typů, testů, buildu a známých zranitelností při pushi a pull requestu.

## Opravy z auditu 12. srpna 2026

- Opravená zranitelná tranzitivní verze `nanoid`; `pnpm audit --audit-level high` nyní hlásí nula známých zranitelností.
- Build nástroje byly přesunuté z produkčních do vývojových závislostí.
- Opravené serverové SEO podstránek, canonical URL, sitemap a robots pro vlastní doménu.
- Produkční URL Google Sheets webhooku musí používat HTTPS a povolený host Google Apps Scriptu.
- Webhook secret musí mít minimálně 24 znaků.
- Přidaná osmivteřinová timeout ochrana volání Google Calendar, Sheets, Resend a Turnstile.
- Zpřísněná kontrola kapacity, termínu akce, uzávěrky a data kontroly výmazu.
- Nahrazený křehký poziční řádek Sheets pojmenovaným záznamem a přesnou kontrolou hlaviček.
- Výletový záznam již neobsahuje ani prázdné zdravotní sloupce.
- Opravené oddělené adresy organizátorů výletů a táborů.
- Opravené neexistující CSS tlačítka detailu akce.
- CI nyní audituje i vývojové závislosti.

## Výsledek automatických kontrol

- `pnpm qa`: úspěch.
- TypeScript `tsc --noEmit`: úspěch.
- Vitest: 27/27 testů.
- Node Worker/API/asset testy: 32/32 testů.
- Celkem: **59/59**, 0 chyb, 0 přeskočených.
- Produkční Vite + Worker build: úspěch.
- Build: HTML 2,31 kB, CSS 90,30 kB (11,66 kB gzip), JS 289,51 kB (87,84 kB gzip).
- `pnpm audit --audit-level high`: žádná známá zranitelnost.
- `git diff --check`: bez whitespace chyb.
- Obsahový scan: bez Lorem Ipsum, pronájmu sokolovny a TODO/FIXME/HACK markerů v aplikačním kódu.

## Výsledek ručního QA

- Všechny veřejné cesty ověřené při 375 px a 1280 px: bez horizontálního přetékání, rozbitých obrázků, chybějícího `main`, H1 nebo patičky.
- Navigace ověřená při 375, 390, 768, 1024 a 1280 px; hamburger se otevře, zavře a nepřetéká.
- Dark mode, plakátový lightbox, PDF odkazy, galerie a kalendář ověřené v prohlížeči.
- Demo táborová přihláška ověřená s fiktivními daty včetně potvrzení a náhledu e-mailů.
- Výletová přihláška neobsahuje zdravotní pole; táborová je obsahuje jen podle provozního režimu.
- Konzole prohlížeče: bez chyb a varování.

## Blokátory veřejného spuštění

### P0 – musí být hotové před ostrým startem

- Schválit skutečné aktuality, rozvrhy, termíny, kapacity, plakáty, dotace a přiřazení cvičitelů. Současná ukázková data nesmí být prezentována jako realita.
- Potvrdit práva ke všem fotografiím, zvlášť k fotografiím dětí.
- Právně schválit GDPR text, právní tituly, souhlas se zdravotními údaji a médii, příjemce, dobu uchování, výmaz a incidentní proces.
- Založit a nastavit Resend, Google Calendar, Google Sheets Apps Script a Cloudflare Turnstile.
- Dodat dvě cílové adresy organizátorů a ověřenou odesílací adresu.
- Nastavit všechny serverové proměnné z níže uvedeného seznamu; aktuální hosting je nemá vyplněné.
- Připojit a ověřit produkční doménu, HTTPS, přesměrování staré domény a `PUBLIC_SITE_URL`.
- Změnit hosting z neveřejného režimu na veřejný až po akceptaci vedením.
- Provést ostrý end-to-end test s výhradně fiktivními údaji: tabulka, kapacita, oba e-maily, duplicita a zrušení.

### P1 – silně doporučené při spuštění

- Nastavit WAF nebo globální rate limit; současný aplikační limit je lokální pro instanci Workeru.
- Nastavit monitoring dostupnosti a anonymizované chybové alerty bez obsahu formulářů.
- Zdokumentovat správce účtů, přístupy, rotaci secrets, zálohu tabulky a návrat na předchozí verzi.
- Ověřit web v aktuálním Safari, Firefoxu, Androidu a iOS a provést základní test čtečkou obrazovky.
- Optimalizovat 1,7MB OpenGraph PNG; běžné načtení stránky neblokuje, ale sociální náhled může být menší.

### P2 – následný rozvoj

- CMS nebo administrační rozhraní pro aktuality, akce, rozvrhy, galerii a plakáty.
- Automatizované mazání nebo anonymizace přihlášek po uplynutí retenční lhůty.
- Trvalejší úložiště idempotence a globálního rate limitu, pokud objem přihlášek naroste.
- Schema.org JSON-LD pro organizaci a jednotlivé události.
- Analytika pouze po rozhodnutí o účelu, právním základu a cookie režimu; nyní žádná marketingová analytika není.

## Produkční proměnné

- `PUBLIC_SITE_URL`
- `GOOGLE_CALENDAR_ID`
- `GOOGLE_CALENDAR_API_KEY`
- `RESEND_API_KEY`
- `REGISTRATION_FROM_EMAIL`
- `REGISTRATION_TRIP_ORGANIZER_EMAIL`
- `REGISTRATION_CAMP_ORGANIZER_EMAIL`
- `GOOGLE_SHEETS_WEBHOOK_URL`
- `GOOGLE_SHEETS_WEBHOOK_SECRET`
- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `REGISTRATION_HEALTH_DATA_ENABLED=false` do právního a provozního schválení citlivých údajů

Apps Script navíc vyžaduje Script Properties `WEBHOOK_SECRET`, `SHEET_ID` a volitelně `TRIP_SHEET_NAME`, `CAMP_SHEET_NAME`.

## Známá omezení

- Web nemá CMS; obsah se upravuje v repozitáři a nasazuje přes CI/CD.
- Bez produkčních účtů nebyly externí služby otestované end-to-end.
- TLS 1.3, DNS, veřejný přístup, WAF a logování jsou vlastnosti cílového hostingu, ne samotného repozitáře.
- GDPR dokumentace je technický návrh, nikoli právní stanovisko.
- Aplikační rate limit a idempotence nejsou globálně trvalé napříč všemi instancemi Workeru.

Podrobný rozpis vlastníků práce, akceptačních kritérií a pořadí spuštění je v `docs/go-live-handoff.md`.

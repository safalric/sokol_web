# Finální audit připravenosti projektu

- Projekt: TJ Sokol Doudleby nad Orlicí
- Datum auditu: 12. srpna 2026
- Repozitář: `https://github.com/safalric/sokol_web`
- Produkční kandidát: větev `main`

## Verdikt

Kód je release candidate vhodný pro prezentaci a bezpečný demo provoz. Pro veřejný ostrý provoz stále chybí externí účty, produkční tajné proměnné, doména, aktivace edge WAF a monitoringu, schválení reálného obsahu a právní akceptace zpracování osobních a zdravotních údajů.

Neúplná konfigurace aktivuje transparentní demo režim. Demo přihláška osobní ani zdravotní údaje neukládá, neposílá e-mailem a nepředává třetím stranám.

## Hotovo v kódu

- 11 responzivních podstránek, samostatná 404 s HTTP 404, dynamické SEO, sitemap a robots.
- Mobilní navigace, dark mode, galerie, kalendář, přístupný lightbox a oddělené formuláře pro výlet a tábor.
- 12 skutečných plakátů a informačních letáků z původního webu: optimalizované WebP náhledy, originály ke stažení a dohledatelný zdroj.
- Same-origin Worker API s bezpečným přepínáním demo/live a zdravotním endpointem `/api/health`.
- Serverová validace, allowlist polí a akcí, honeypot, časová past, Turnstile, idempotence a omezení těla požadavku.
- Globální D1 rate limit pěti pokusů za deset minut, hashované identifikátory klienta a bezpečné odmítnutí při nedostupnosti ochrany.
- XSS escaping, Unicode normalizace a ochrana Google Sheets proti formula injection.
- Zdravotní údaj pouze v táborovém formuláři, s výslovným souhlasem, mimo e-mail a za samostatnou provozní pojistkou.
- Atomická kontrola kapacity a duplicit v Google Sheets, oddělené listy `Výlety` a `Tábory` a oddělené adresy organizátorů.
- CSP, HSTS, zákaz rámování, bezpečná referrer policy a omezení oprávnění prohlížeče.
- GitHub Actions pro typy, unit/integration/E2E testy, build a audit závislostí.
- Uptime workflow a provozní runbook pro WAF, rate limiting, monitoring a reakci na incident.

## Automatické kontroly

- TypeScript `tsc --noEmit`.
- Vitest včetně axe-core auditu všech veřejných cest.
- Node testy Worker API, bezpečnostních hlaviček, assetů, D1 limitu a degradačních režimů.
- Playwright v Chromium, Firefoxu a WebKitu při 375, 390, 768 a 1280 px, včetně dark mode a ovládání klávesnicí.
- Produkční Vite + Worker build.
- `pnpm audit --audit-level high` a `git diff --check`.

Poslední sada obsahuje 38 Vitest testů, 35 Node Worker/API testů a 18 Playwright scénářů, celkem **91 automatických kontrol**. Skutečný Safari a konkrétní čtečku obrazovky musí před zveřejněním potvrdit člověk na cílovém zařízení; WebKit a axe-core jsou silná automatická kontrola, nikoli náhrada této akceptace.

## P0 blokátory ostrého startu

- Schválit reálné aktuality, rozvrhy, termíny, kapacity, dotace, kontakty a přiřazení cvičitelů. Ukázková data nesmí být vydávána za realitu.
- Potvrdit práva ke všem fotografiím a plakátům, zejména snímkům dětí.
- Právně schválit GDPR texty, právní tituly, souhlasy, příjemce, retenční lhůty, výmaz a incidentní proces.
- Založit a nastavit Resend, Google Calendar, Google Sheets Apps Script a Cloudflare Turnstile.
- Dodat adresu organizátora výletů, adresu organizátora táborů a ověřenou odesílací adresu.
- Nastavit všechny serverové proměnné a ověřit D1 migraci; aktuální hosting produkční hodnoty nemá.
- Připojit produkční doménu, HTTPS, přesměrování staré domény a správné `PUBLIC_SITE_URL`.
- Aktivovat edge WAF, rate pravidla a monitoring na produkční doméně.
- Provést ostrý end-to-end test výhradně s fiktivními údaji: tabulka, kapacita, oba e-maily, duplicita a zrušení.
- Změnit neveřejný hosting na veřejný až po výslovné akceptaci vedením.

## P1 před zveřejněním

- Ručně ověřit aktuální Safari na macOS/iOS, Android Chrome a NVDA nebo VoiceOver podle `docs/accessibility-qa.md`.
- Zapnout upozornění pro GitHub uptime workflow nebo nezávislý monitor a otestovat doručení alertu.
- Zdokumentovat vlastníky účtů, rotaci secrets, zálohu tabulky a rollback.
- Nastavit a ověřit pravidelný výmaz nebo anonymizaci přihlášek po retenční lhůtě.

## Produkční proměnné a bindingy

- `DB` – D1 binding definovaný v `.openai/hosting.json`.
- `PUBLIC_SITE_URL`
- `GOOGLE_CALENDAR_ID`
- `GOOGLE_CALENDAR_API_KEY`
- `RESEND_API_KEY`
- `REGISTRATION_FROM_EMAIL`
- `REGISTRATION_TRIP_ORGANIZER_EMAIL`
- `REGISTRATION_CAMP_ORGANIZER_EMAIL`
- `GOOGLE_SHEETS_WEBHOOK_URL`
- `GOOGLE_SHEETS_WEBHOOK_SECRET`
- `RATE_LIMIT_HASH_SECRET`
- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `REGISTRATION_HEALTH_DATA_ENABLED=false` do právního a provozního schválení.
- `HEALTH_EXPECT_LIVE=true` až po kompletním zprovoznění integrací.
- `RELEASE_SHA` pro identifikaci nasazené revize.

Apps Script navíc vyžaduje Script Properties `WEBHOOK_SECRET`, `SHEET_ID` a volitelně `TRIP_SHEET_NAME`, `CAMP_SHEET_NAME`. GitHub monitoring vyžaduje repository secret `MONITOR_URL`.

## Známá omezení

- Web nemá CMS; obsah se upravuje v repozitáři a nasazuje přes CI/CD.
- Externí integrace nebyly bez produkčních účtů otestované end-to-end.
- Edge WAF, DNS, skutečné TLS a veřejný přístup se nastavují na cílovém hostingu, nikoli pouze změnou repozitáře.
- GDPR dokumentace je technický návrh, ne právní stanovisko.
- Popis projektu v administraci Sites obsahuje historickou zmínku o pronájmu. Veřejný web ji neobsahuje; dostupné Sites API nyní dovoluje změnit pouze titul, nikoli popis, proto je nutná ruční oprava v administraci platformy.

Podrobný rozpis odpovědností je v `docs/go-live-handoff.md`; provozní nastavení WAF a monitoringu v `docs/waf-monitoring-runbook.md`.

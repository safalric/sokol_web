# Úplný stav projektu pro předání do Gemini

Stav byl znovu ověřen 4. srpna 2026 proti větvi `main` repozitáře `safalric/sokol_web`. Tento dokument rozlišuje hotový kód, demo provoz a kroky, které vyžadují rozhodnutí nebo účty TJ Sokol Doudleby nad Orlicí.

## 1. Přesné hodnocení

Repozitář je technicky připravený produkční základ: má samostatnou 404, dynamická metadata, zabezpečené Worker API, responzivní a přístupné UI, CI a 50 automatizovaných testů. Veřejný ostrý provoz však ještě není dokončený, protože hosting je neveřejný, externí integrace nemají produkční účty a část obsahu i GDPR procesu čeká na schválení vedením.

Správné označení aktuálního stavu je: **produkčně připravený kód v bezpečném demo režimu, před předáním externích přístupů a finálním obsahovým schválením**.

## 2. Repozitář a hosting

- GitHub: `https://github.com/safalric/sokol_web`
- Větev: `main`
- Lokální hlavní kopie: `C:\Users\tomik\Desktop\TJ-Sokol-Doudleby-Web-komplet-2026-07-23`
- OpenAI Sites projekt: `appgprj_6a5f8c6d09cc8191afb5ea2aed94739a`
- Adresa náhledu: `https://tj-sokol-doudleby.tomas-saf.chatgpt.site`
- Přístup hostingu je `custom`: web není veřejně dostupný bez autorizace.
- Vlastní doména dosud není připojená.
- Aktuální commit se vždy zjistí příkazem `git rev-parse HEAD`; finální hash je uveden také v závěrečném předávacím reportu po pushi.

## 3. Technologie a architektura

- React 19, TypeScript, Vite 6 a Tailwind CSS 3.
- Lucide React pro ikony.
- pnpm 11.9.0 určený v `packageManager` a uzamčené závislosti v `pnpm-lock.yaml`.
- Cloudflare Worker kompatibilní serverový výstup pro OpenAI Sites.
- SPA routing přes History API bez další router knihovny.
- Seznam veřejných rout a SEO dat má jediný zdroj v `src/data/site-routes.json`.
- Same-origin API: `/api/health`, `/api/registration-config`, `/api/calendar`, `/api/registrations`.
- Obsah je spravovaný v TypeScriptu a JSON; CMS ani databáze nejsou součástí projektu.
- Produkční evidence přihlášek je připravená přes chráněný Google Sheets webhook.

## 4. Veřejné cesty

| Cesta | Stav | Obsah |
| --- | --- | --- |
| `/` | Hotové UI, ukázkové aktuality | Hero, CTA, rychlé odkazy, aktuality a plakáty |
| `/o-nas` | Hotová s dodanými kontakty | Jednota, vedení a cvičitelé |
| `/cviceni` | Hotové UI, nepotvrzený rozvrh | Sedm oddílů a kontaktní údaje |
| `/akce` | Hotové UI, demo akce | Karty akcí a přihláška |
| `/kalendar` | Funkční demo API | Mřížka, seznam, měsíce a kategorie |
| `/prihlaska` | Hotová | Odkaz na oficiální eČlen přihlášku ČOS |
| `/fotogalerie` | Hotová | Pět alb, filtry a lightbox |
| `/historie` | Hotová z dodaných podkladů | Časová osa a tematické bloky |
| `/kontakt` | Hotová s dodanými údaji | IČO, adresy, datová schránka, mapa a vedení |
| `/gdpr` | Technicky hotová, právně neschválená | Informační povinnost a práva subjektů |
| `/dotace` | Transparentní prázdný stav | Nezobrazuje smyšlená data bez podkladů |

Neznámá cesta vykreslí samostatnou responzivní stránku „Stránka nenalezena“. Worker vrací pro známé HTML cesty HTTP 200 a pro neznámé HTTP 404. 404 má `noindex, follow` a canonical na původní neznámou adresu.

## 5. SEO a metadata

- Každá z 11 veřejných cest má vlastní title, description, page title a canonical cestu.
- Za běhu se aktualizují title, description, robots, OpenGraph title/description/URL, Twitter title/description a canonical.
- Jsou přítomné `public/robots.txt` a `public/sitemap.xml`.
- Obrázky mají alt texty; OpenGraph používá `og.png`.
- Metadata jsou dynamická na klientu. Základní HTML je stále SPA shell s metadata homepage, nikoli server-side render každé podstránky. Pro vyhledávače bez JavaScriptu je to známé omezení.
- Schema.org JSON-LD zatím není doplněné.

## 6. Uživatelské rozhraní

- Responzivní hlavička, hlavní navigace, nabídka „Více“ a mobilní hamburger menu.
- Mobilní menu má `aria-expanded`, blokování scrollu, Escape a návrat fokusu.
- Kompaktní patička bez duplikované kompletní navigace.
- Oficiální dodaný symbol Sokola je v hlavičce, patičce a faviconě.
- Oficiální licencovaný sokolský font nebyl dodaný. Nadpisy a text mají odolné lokální fallback řetězce bez závislosti na externím font CDN.
- Světlý a tmavý režim respektují systémové nastavení a volbu ukládají pod `sokol-theme`.
- Facebook a Instagram jsou v hlavičce i patičce.
- Instagram: `https://www.instagram.com/sokoldoudlebyno/`
- Facebook: `https://www.facebook.com/TJ-Sokol-Doudleby-nad-Orlic%C3%AD-1547925445429424`
- Členská přihláška: `https://www.ecz-sokol.cz/clen/prihlaska`

## 7. Fotogalerie a plakáty

- Galerie: 13 fotografií v pěti albech.
- Pro každou fotografii existuje WebP náhled a větší WebP varianta, celkem 26 souborů a 2 932 990 B.
- Náhledy se načítají líně, velká varianta až po otevření.
- Manifest obsahuje ID, album, titul, rok, alt text a rozměry.
- Filtry používají tab pattern a podporují šipky, Home a End.
- Lightbox podporuje Escape, předchozí/další, klávesové šipky, kliknutí na pozadí, swipe, zamknutí scrollu a návrat fokusu.
- Plakáty: tři PNG náhledy a tři PDF, celkem 668 123 B.
- Plakátový lightbox obsahuje stažení PDF a přechod k přihlášce.
- Kontrast stahování funguje ve světlém i tmavém režimu.
- Fotografie a obsah plakátů musí před veřejným spuštěním schválit vedení, zvlášť u dětí.

## 8. Kalendář

- `GET /api/calendar` podporuje demo a Google Calendar režim.
- Neúplná konfigurace vrací demo data s `configurationWarning`, kódem varování a obecnými názvy chybějících schopností.
- Kompletní konfigurace používá veřejný Google Calendar a pětiminutovou cache.
- Při výpadku Google API systém bezpečně vrátí demo data s varováním.
- Klíče zůstávají pouze ve Worker prostředí a nemají prefix `VITE_`.
- Produkční Google Calendar ID a API klíč zatím nejsou dodané.

## 9. Přihlášky na akce

- `POST /api/registrations` podporuje demo a ostrý režim.
- Demo validuje celý požadavek, ale osobní ani zdravotní údaje neukládá a neposílá.
- Ostrý režim se aktivuje jen při kompletní konfiguraci e-mailu, úložiště a antispamu. Částečná konfigurace bezpečně zůstane v demu.
- Pole: akce, účastník, datum narození, zákonný zástupce, e-mail, telefon, zdravotní údaj, organizační poznámka, souhlasy a honeypot.
- U nezletilého je vyžadovaný zástupce a potvrzení oprávnění.
- GDPR potvrzení je povinné; mediální souhlas je nepovinný.
- Zdravotní údaj vyžaduje samostatný výslovný souhlas.
- Zdravotní text se nikdy neposílá e-mailem.
- Omezené uložení zdravotního údaje je povolené jen s `REGISTRATION_HEALTH_DATA_ENABLED=true`.
- Tok rezervuje kapacitu v Google Sheets před odesláním dvou e-mailů.
- Organizátor dostane provozní souhrn bez zdravotního textu; účastník potvrzení.
- Produkční Resend, Sheets a Turnstile účty zatím nejsou připojené.

## 10. Bezpečnostní model

- HTTPS redirect 308 mimo localhost; nezabezpečený zápis se odmítne.
- HSTS, CSP, `frame-ancestors 'none'`, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, COOP a CORP.
- Same-origin kontrola přes Origin a Sec-Fetch-Site.
- Povolený pouze JSON, allowlist polí a maximální tělo 12 kB.
- NFKC normalizace, odstranění řídicích znaků a limity délek.
- HTML escaping pro e-mail a ochrana proti formula injection v Sheets.
- Honeypot, minimální čas vyplnění, Turnstile a rate limit 5 požadavků za 10 minut.
- Idempotentní submission ID a Resend idempotency keys.
- Konfigurační endpoint zpřístupní jen veřejný Turnstile site key, nikdy secret.
- Rate limit a lokální receipt cache jsou v paměti jedné Worker instance. Globální kapacitu a duplicity musí v ostrém režimu atomicky hlídat Sheets webhook nebo budoucí trvalé úložiště.
- Repo nemůže samo vynutit výhradně TLS 1.3; verze TLS je odpovědnost hostingové platformy.
- Scan nenašel produkční tajné klíče ani serverové proměnné s prefixem `VITE_`.
- `pnpm audit` i `pnpm audit --prod` nehlásí známé zranitelnosti.

## 11. Přístupnost a responzivita

- Skip link, sémantické nadpisy, alt texty a dekorativní ikony `aria-hidden`.
- Viditelné `focus-visible` rámečky v obou režimech.
- Dialogy mají modální role, popisky, Escape a správu fokusu.
- Kalendářové ovladače a sociální skupiny mají přístupná jména.
- Turnstile skupina má stabilní popisek a automatické téma.
- Prohlížečový audit ověřil 12 stavů (11 cest + 404) na šířkách 375, 390, 768 a 1280 px: 48 kontrol bez horizontálního přetékání, chybějícího H1, alt textu nebo duplicitního ID.
- Světlý i tmavý režim prošly cíleným kontrastním měřením WCAG AA bez zachycené chyby.
- Manuálně prošly mobilní menu, plakátový lightbox a galerie včetně klávesnice a návratu fokusu.
- Konzole prohlížeče při auditu neobsahovala chyby.
- Neproběhl nezávislý audit se skutečnou čtečkou obrazovky ani BrowserStack test v Safari a Firefoxu.

## 12. Automatizované kontroly

`pnpm qa` spouští:

1. `tsc --noEmit`
2. 24 Vitest testů
3. 26 Node Worker/API a asset testů
4. Produkční Vite a Worker build

Celkem: **50 testů, 50 úspěšných, 0 chyb**.

Pokrytí zahrnuje 404 routing a HTTP status, metadata všech rout, SPA navigaci, galerii, plakáty, dark mode, Calendar API, demo/ostrý režim registrací, validaci, nezletilé, zdravotní souhlas, honeypot, cross-origin, neočekávaná pole, časovou past, rate limit, idempotenci, kapacitu, Turnstile, e-maily, Sheets, XSS escaping, formula injection a bezpečnostní hlavičky.

GitHub Actions `.github/workflows/ci.yml` při pushi a pull requestu do `main` spouští instalaci s frozen lockfile, TypeScript, Vitest, Worker testy, build a audit produkčních závislostí.

## 13. Obsahový audit

- Nula výskytů nabídky pronájmu sokolovny.
- Nula výskytů Lorem Ipsum.
- Nula TODO, FIXME a HACK markerů v aplikačním stromu.
- Kontaktní stránka neobsahuje bankovní spojení.
- Reálné kontakty, IČO, datová schránka a adresy odpovídají dodaným podkladům.
- Aktuality, rozvrh oddílů a demo akce jsou stále jasně označené jako ukázkové nebo nepotvrzené.
- Historie vychází z uživatelem dodaného textu a nebyla nezávisle historicky ověřena.

## 14. Proměnné ostrého provozu

- `GOOGLE_CALENDAR_ID`
- `GOOGLE_CALENDAR_API_KEY`
- `RESEND_API_KEY`
- `REGISTRATION_FROM_EMAIL`
- `REGISTRATION_ORGANIZER_EMAIL`
- `GOOGLE_SHEETS_WEBHOOK_URL`
- `GOOGLE_SHEETS_WEBHOOK_SECRET`
- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `REGISTRATION_HEALTH_DATA_ENABLED=true` pouze po právním a provozním schválení

Bezpečný a okomentovaný vzor je v `.env.example`. Skutečné hodnoty nesmějí být commitnuté.

## 15. Co zbývá vedení a správci

1. Schválit veřejný přístup hostingu a vlastní doménu.
2. Potvrdit rozvrh, místa, cvičitele, aktuality, akce a plakáty.
3. Potvrdit oprávnění ke zveřejnění všech fotografií.
4. Schválit nebo dodat licencovaný sokolský font.
5. Nechat právně schválit GDPR text, právní tituly, dodavatele, doby uchování, výmaz a incident response.
6. Založit ověřenou odesílací doménu a Resend.
7. Založit chráněnou Google tabulku a nasadit webhook s omezenými rolemi.
8. Založit Cloudflare Turnstile a veřejný Google Kalendář.
9. Nastavit serverové secrets mimo repozitář.
10. Provést end-to-end zkoušku ostrého toku pouze s fiktivními údaji.
11. Doplnit monitoring anonymizovaných provozních chyb bez formulářových dat.
12. Provést právní, Safari/Firefox a screen-reader akceptaci před veřejným spuštěním.

## 16. Známé hranice

- Není CMS ani administrace galerie.
- Není připojený reálný e-mail, Google Sheets, Turnstile ani Google Calendar.
- Není analytika ani marketingové cookies.
- GDPR text není právní stanovisko.
- Server-side rendering a JSON-LD nejsou součástí současné architektury.
- Veřejnost web dosud nevidí kvůli přístupovému režimu hostingu.

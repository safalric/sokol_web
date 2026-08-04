# Úplný stav projektu pro předání do Gemini

Audit odpovídá repozitáři a nasazené verzi ověřené dne 4. srpna 2026. Dokument rozlišuje technickou implementaci od skutečně aktivních externích služeb a od obsahu, který ještě musí potvrdit TJ Sokol Doudleby nad Orlicí.

## 1. Jednověté hodnocení

Web je technicky vyspělý, responzivní a nasazený prezentační prototyp s hotovým demo API, ale ještě není veřejně přístupný ani připravený k ostrému přijímání přihlášek, protože chybí reálná provozní data, externí účty, právní schválení a produkční integrace.

## 2. Ověřená identifikace verze

- GitHub: `https://github.com/safalric/sokol_web`
- GitHub viditelnost: veřejný repozitář
- Výchozí větev: `main`
- GitHub commit: `8a69569b276b80407daa86289b5ed047bc2118f4`
- Commit message: `feat: complete optimized gallery and poster experience`
- Nasazená adresa: `https://tj-sokol-doudleby.tomas-saf.chatgpt.site`
- Nasazená Sites verze: 23
- Interní commit nasazené Sites verze: `802bfc2845df2388a5251c3918d19ab05265bfee`
- Strom souborů nasazené verze odpovídá GitHub commitu `8a69569`.
- Hosting je aktivní, ale přístup je `custom`: povolen je 1 uživatel, 0 skupin a 0 externích návštěvníků.
- Důsledek: web nyní není veřejně dostupný z libovolného počítače bez autorizovaného přihlášení.

## 3. Použitá technologie a architektura

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 3
- Lucide React ikony
- pnpm a `pnpm-lock.yaml`
- Cloudflare Worker-kompatibilní serverový výstup pro OpenAI Sites
- Klient je SPA s History API a fallbackem všech HTML cest na `index.html`.
- Serverové endpointy jsou stejného původu: `/api/health`, `/api/registration-config`, `/api/calendar` a `/api/registrations`.
- Obsah není napojený na CMS. Je uložený v TypeScriptu a JSON souborech v repozitáři.
- Není použita databáze. Pro budoucí ostré přihlášky je připraven Google Sheets webhook.

## 4. Přesný stav jednotlivých cest

| Cesta | Stav | Obsah |
| --- | --- | --- |
| `/` | Hotová prezentace, demo obsah | Hero, CTA, rychlé odkazy, tři ukázkové aktuality, tři plakáty |
| `/o-nas` | Hotová s dodanými daty | Popis jednoty, 7 členek vedení, 12 kontaktů na cvičitele |
| `/cviceni` | UI hotové, data nepotvrzená | 7 oddílů; časy, místa a přiřazení jsou označené jako demo |
| `/akce` | UI a demo formulář hotové | 3 ukázkové akce, formulář pro Sokolský výlet |
| `/kalendar` | Funkční demo API | Mřížka/seznam, přepínání měsíců, demo data, připravené Google API |
| `/prihlaska` | Hotová externí navigace | Odkaz na oficiální eČlen přihlášku České obce sokolské |
| `/fotogalerie` | Hotová | 5 alb, 13 fotografií, filtry a lightbox |
| `/historie` | Hotová z dodaných podkladů | 7 bodů časové osy a 3 delší tematické bloky |
| `/kontakt` | Hotová s dodanými daty | IČ, e-mail, datová schránka, 2 adresy, mapa, vedení |
| `/gdpr` | Technický návrh, čeká na právní schválení | 9 informačních částí a odkaz na ÚOOÚ |

Neexistuje samostatná stránka 404. Neznámá cesta se normalizuje na úvodní stránku.

## 5. Společné uživatelské rozhraní

- Responzivní hlavička s hlavní navigací a nabídkou „Více“.
- Mobilní hamburger menu s ikonami, blokováním scrollu, přesunem fokusu a zavřením klávesou Escape.
- Kompaktní patička bez duplicitní kompletní navigace; obsahuje identitu, e-mail, sociální sítě, IČO, GDPR a copyright.
- Oficiální dodaný obrazový symbol Sokola je použitý v hlavičce, patičce a faviconě.
- Textový lockup „Sokol Doudleby“ je sestavený v CSS, nejde o dodaný kompletní oficiální logotyp.
- Barevná paleta obsahuje červenou `#D32F2F`, modrou `#1976D2`, bílou, světle šedou a tmavé neutrální barvy.
- Tmavý režim je hotový, respektuje systémové nastavení a volbu ukládá do `localStorage` pod klíčem `sokol-theme`.
- Oficiální sokolský font není implementován. Nadpisy používají systémový fallback `Impact`, `Arial Narrow`, `Haettenschweiler`, `Arial`.
- Běžný text používá `Arial`, `Helvetica` a systémový sans-serif.
- Header obsahuje Facebook a Instagram v nabídce „Více“ a v mobilním menu; footer obsahuje oba odkazy přímo.
- Instagram: `https://www.instagram.com/sokoldoudlebyno/`
- Facebook: `https://www.facebook.com/TJ-Sokol-Doudleby-nad-Orlic%C3%AD-1547925445429424`
- Členská přihláška: `https://www.ecz-sokol.cz/clen/prihlaska`

## 6. Obsah, který je skutečně doplněný

- Název: TJ Sokol Doudleby nad Orlicí
- IČ: 15040020
- E-mail: `sokoldoudleby@seznam.cz`
- Datová schránka: `c7sy84v`
- Korespondenční adresa: Na Benátkách 131, 517 42 Doudleby nad Orlicí
- Sídlo: Švermova 528, 517 42 Doudleby nad Orlicí
- Vedení: Monika Šafaříková, Lenka Divíšková, Daniela Vařeková, Michaela Podolská, Kateřina Lásková, Radka Suchomelová a Marta Šimperská.
- Cvičitelé: Jana Florianová, Radka Suchomelová, Monika Šafaříková, Vlasta Lacinová, Daniela Šafaříková, Jan Merganc, Matyáš Leimer, Barbora Pitter, Veronika Šlajová, Matěj Řehák, Valerie Forštová a Monika Šimperská.
- Kontaktní stránka neobsahuje bankovní spojení.
- Nikde v aplikačním obsahu není nabídka pronájmu sokolovny.
- Nikde není Lorem Ipsum.
- Historie vychází z podkladů dodaných uživatelem; nebyla nezávisle historicky ověřena.
- Mapa používá vložený OpenStreetMap náhled a externí odkaz na hledání adresy v Google Maps.

## 7. Obsah, který je stále ukázkový nebo nepotvrzený

- Všechny 3 aktuality na homepage jsou výslovně označené jako ukázkové.
- Všech 7 oddílů má `demo: true`.
- U oddílů Rodiče a děti, Předškoláci a Všestrannost chybí potvrzený kontakt.
- U Fit dance děti chybí potvrzený den a čas.
- U ostatních oddílů nejsou potvrzené časy, místa ani správnost přiřazení uvedených cvičitelů.
- Sokolský výlet 19. září 2026 je ukázkový termín.
- Sokolský běh republiky v říjnu 2026 je ukázkový obsah.
- Letní tábor v červenci 2027 je ukázkový obsah; chybí přesný termín, místo, cena a pokyny.
- Všechny 3 plakáty samy uvádějí, že jde o ukázkové podklady čekající na potvrzení vedením.

## 8. Fotogalerie

- Stav: technicky hotová a nasazená.
- Alba: Atletika 3, Volejbal 3, Capoeira 3, Všestrannost 3, Floriteam 1.
- Celkem: 13 fotografií, 13 náhledů a 13 velkých variant.
- Formát: WebP.
- Celková velikost galerie: 2 932 990 B.
- Náhledy se načítají líně; velká fotografie až po otevření lightboxu.
- Manifest obsahuje ID, album, titul, rok, český alt popis a rozměry obou variant.
- Filtry používají přístupný tab pattern a podporují šipky, Home a End.
- Lightbox podporuje tlačítka, šipky klávesnice, Escape, kliknutí na pozadí a dotykový swipe.
- Po zavření se fokus vrací na původní fotografii.
- Fotografie jsou převzaté z dříve veřejné galerie původního webu.
- Před ostrým veřejným spuštěním musí vedení znovu potvrdit oprávnění k jejich zveřejnění, zejména u fotografií dětí.
- Není implementované nahrávání, mazání ani správa galerie přes administraci.

## 9. Plakátovací plocha

- Stav komponent a souborů: technicky hotový demo obsah.
- 3 PNG náhledy a 3 odpovídající PDF soubory.
- Celková velikost plakátových souborů: 668 123 B.
- Karty se na mobilu skládají do jednoho sloupce.
- Plakát lze otevřít v lightboxu, zavřít, stáhnout v PDF a přejít na detail akce.
- Kontrast tlačítka ke stažení je opravený i v tmavém režimu.
- Obsah a termíny plakátů nejsou schválené jako reálné.

## 10. Kalendář

- Endpoint: `GET /api/calendar`.
- UI podporuje mřížku a seznam, předchozí/následující měsíc a kategorie Trénink / Akce.
- Povolený rozsah měsíců je 2020 až 2035.
- Je připravené čtení veřejného Google Calendar API a převod časů do `Europe/Prague`.
- Google odpověď se cachuje 5 minut.
- Při chybě Google API se zobrazí demo data s varováním.
- Aktuální živý stav 4. srpna 2026: `calendar: demo`.
- Aktuální odpověď používá srpen 2026 a vrací jednu demo událost „Rodiče a děti“ dne 25. srpna 2026.
- Google Calendar ID ani API klíč nejsou na hostingu nastavené.
- Demo JSON obsahuje 7 událostí od srpna do října 2026.

## 11. Přihláška na akci

- Endpoint: `POST /api/registrations`.
- Konfigurační endpoint: `GET /api/registration-config`.
- Aktuální živý stav: `registrations: demo`, `healthData: disabled`, Turnstile site key je `null`.
- Demo odeslání provede frontendovou i serverovou validaci a vytvoří pouze maskovaný náhled e-mailů.
- V demo režimu se žádné osobní ani zdravotní údaje neukládají ani neposílají.
- Jediná povolená akce je Sokolský výlet do Orlických hor dne 19. září 2026.
- Ukázková kapacita je 30 míst, uzávěrka 18. září 2026 v 18:00 a kontrola výmazu 19. října 2026.
- Pole: název akce, účastník, datum narození, zákonný zástupce, e-mail, telefon, zdravotní omezení, organizační poznámka a skrytý honeypot.
- U nezletilého se dynamicky vyžaduje zákonný zástupce a potvrzení oprávnění dítě přihlásit.
- Potvrzení seznámení s GDPR je povinné.
- Mediální souhlas je samostatný a nepovinný.
- Pokud je vyplněný zdravotní údaj, vyžaduje se samostatný výslovný souhlas.
- Tlačítko se při odesílání deaktivuje a nejméně 1 sekundu ukazuje stav načítání.
- Klient má timeout 15 sekund, načtení konfigurace timeout 8 sekund.
- Produkční režim vyžaduje současně Resend, Google Sheets webhook a Cloudflare Turnstile. Částečná konfigurace formulář zablokuje.
- Produkční tok nejprve atomicky rezervuje místo v Sheets, potom odešle e-mail organizátorovi a účastníkovi.
- Zdravotní text se záměrně neposílá e-mailem.
- Apps Script příklad je v repozitáři, ale není nasazený ani připojený ke skutečné tabulce.

## 12. Připravené zabezpečení

- Vynucení HTTPS mimo localhost; GET/HEAD se přesměruje 308, nezabezpečený POST se odmítne.
- HSTS: 2 roky, `includeSubDomains`, `preload`.
- CSP bez `unsafe-inline`; povoluje pouze vlastní zdroje, OpenStreetMap iframe a Cloudflare Turnstile.
- `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, bezpečný Referrer-Policy, omezený Permissions-Policy a COOP.
- Kontrola `Origin` a odmítnutí `Sec-Fetch-Site: cross-site`.
- Pouze JSON, allowlist polí, maximální tělo 12 kB.
- Normalizace NFKC, odstranění řídicích znaků a délkové limity.
- HTML escaping e-mailů a ochrana buněk proti Google Sheets formula injection.
- Honeypot `website_hp`.
- Časová past minimálně 3 sekundy.
- Rate limit 5 pokusů za 10 minut na klientský klíč.
- Idempotentní submission ID a Resend idempotency keys.
- Turnstile v ostrém režimu ověřuje action a hostname.
- Důležitý limit: rate limit a lokální receipt cache jsou pouze v paměti jedné worker instance. Globální kapacitu a duplicity má v ostrém režimu jistit Google Sheets Apps Script.
- `pnpm audit --prod` dne 4. srpna 2026: žádná známá zranitelnost.
- HTTPS a HSTS jsou ověřené na úrovni aplikace. Výhradní povolení pouze TLS 1.3 nebylo ověřeno a je vlastností hostingové platformy, ne tohoto repozitáře.

## 13. GDPR a soukromí

- Web neobsahuje analytiku, marketingové skripty ani reklamní profilování.
- Jediný lokálně ukládaný údaj aplikace je preference barevného režimu.
- Mapa OpenStreetMap se načítá jako externí iframe a může poskytovateli předat IP a technické údaje.
- V ostrém režimu by byl externím poskytovatelem také Cloudflare Turnstile, Resend a Google.
- GDPR stránka popisuje správce, účely, zdravotní údaje, fotografie, nezletilé, uchování, příjemce, práva, mapu a automatizaci.
- Jde výslovně o návrh informační povinnosti, nikoli právní stanovisko.
- Před ostrým provozem chybí schválení právních titulů, dob uchování, zpracovatelských smluv, předávání mimo EHP, procesu žádostí subjektů údajů a incident response.
- Chybí provozně schválený proces mazání a určený odpovědný správce.
- Cookie banner není implementovaný. Při současné absenci analytických a marketingových cookies nemusí být automaticky nutný, ale použití externí mapy a budoucího Turnstile musí posoudit právník.

## 14. SEO, přístupnost a výkon

- `lang="cs"`, UTF-8, viewport meta, favicon, meta description, canonical, OpenGraph, Twitter card a vlastní `og.png` jsou přítomné.
- Titulek dokumentu se mění podle klientské cesty.
- Meta description, canonical URL a OpenGraph URL jsou statické a ukazují vždy na homepage; nejsou specifické pro podstránky.
- Není sitemap.xml, robots.txt, schema.org strukturované JSON-LD ani server-side rendering.
- SPA vrací stejný HTML základ pro všechny podstránky, což omezuje plnohodnotné SEO podstránek.
- Všechny aplikační obrázky mají alt text; dekorativní ikony jsou převážně `aria-hidden`.
- Je implementovaný skip link, focus management, klávesové ovládání menu a lightboxů a respektování `prefers-reduced-motion`.
- Nebyl proveden nezávislý WCAG/axe audit ani test se skutečnou čtečkou obrazovky.
- Nebyl proveden BrowserStack test v Safari a Firefoxu; manuální vizuální test proběhl v Chromium prostředí.
- Poslední cílený test galerie a plakátů proběhl při 1280 × 720 a 390 × 844 bez horizontálního přetékání.
- Produkční build: HTML 2,17 kB, CSS 85,66 kB (gzip 10,80 kB), JS 279,57 kB (gzip 85,42 kB).
- Veřejné soubory mají celkem 5 494 883 B.

## 15. Automatizované testy

Poslední `pnpm qa` dne 4. srpna 2026 prošlo: 25 testů, 0 chyb, TypeScript bez chyb a produkční build úspěšný.

Testy pokrývají:

- manifest galerie, album reference, unikátní ID, alt popisy, rozměry, WebP formát a velikostní limity,
- existenci a velikost PNG/PDF plakátů a lazy loading markup,
- uložení a inicializaci světlého/tmavého režimu,
- výběr a filtraci demo měsíce kalendáře,
- převod Google Calendar odpovědi a fallback při chybě,
- formulářovou validaci, nezletilé a zdravotní souhlas,
- honeypot, původ požadavku, nepovolená pole, časovou past a rate limit,
- demo režim a idempotenci,
- simulovaný ostrý tok e-mailů a Google Sheets,
- kapacitu, Turnstile, HTML escaping a pojistku zdravotních dat,
- nezveřejnění tajného Turnstile klíče,
- bezpečnostní hlavičky a odmítnutí nepovolených HTTP metod.

Automatizované testy nepokrývají pixelovou podobu všech podstránek, reálné externí účty, doručitelnost skutečného e-mailu, skutečný Google Sheets dokument, skutečný Google Calendar, Safari, Firefox ani právní správnost textů.

## 16. Co přesně chybí k ostrému dokončení

### Kritické blokátory

1. Změnit přístup webu z jednoho povoleného uživatele na schválený veřejný nebo jiný cílový režim.
2. Rozhodnout a nastavit vlastní doménu; nyní se používá `chatgpt.site`.
3. Dodat a potvrdit skutečné rozvrhy, místa, přiřazení cvičitelů, aktuality a akce.
4. Nahradit nebo schválit ukázkové plakáty a termíny.
5. Získat potvrzení práv ke zveřejnění fotografií.
6. Právně schválit GDPR text, procesy, dodavatele a doby uchování.
7. Založit ověřenou odesílací doménu a Resend účet.
8. Založit chráněnou Google tabulku, nasadit Apps Script a nastavit přístupy a výmaz.
9. Založit produkční Cloudflare Turnstile widget.
10. Připojit samostatný veřejný Google Kalendář.
11. Provést end-to-end test ostrého toku výhradně s fiktivními údaji.

### Důležité technické dokončení

1. Dodat licenci a soubor skutečného sokolského fontu, nebo schválit současný systémový font.
2. Doplnit route-specific metadata, sitemap, robots a případně strukturovaná data.
3. Přidat 404 stránku.
4. Rozhodnout, zda má být obsah dlouhodobě spravovaný v kódu, nebo přes CMS/admin rozhraní.
5. Doplnit CI workflow pro automatické spuštění testů při pushi.
6. Přidat monitoring anonymizovaných provozních chyb bez logování formulářových dat.
7. Projít nezávislý accessibility audit a test v Safari/Firefoxu.

### Volitelné rozšíření

- CMS pro aktuality, oddíly, akce a plakáty.
- Administrace a upload galerie.
- Privacy-friendly analytika po právním posouzení.
- Automatické optimalizování nově nahraných fotografií.
- CI/CD nasazení z GitHubu.

## 17. Potřebné produkční proměnné

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

Tajné hodnoty nesmějí být vložené do repozitáře ani proměnných s prefixem `VITE_`.

## 18. Přesný závěr pro dalšího agenta

Nepopisuj projekt jako hotový produkční web. Přesné označení je „nasazený a důkladně otestovaný prezentační prototyp s připravenou bezpečnou serverovou architekturou“. Vizuální web, galerie, plakáty, kontakty, historie, navigace, dark mode a demo API jsou funkční. Veřejný přístup, reálný obsah, oficiální font, Google Calendar, e-mailové doručování, Google Sheets, Turnstile a právně schválené GDPR procesy dokončené nejsou.

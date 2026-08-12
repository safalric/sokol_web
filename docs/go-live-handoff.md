# Předání práce pro ostré spuštění

Tento dokument rozděluje zbývající práci podle odpovědnosti. Žádný bod označený P0 nesmí být nahrazen domněnkou vývojáře.

## 1. Vedení TJ Sokol – vlastník obsahu a spuštění

Úkoly:

- schválit veřejné spuštění, doménu a rozsah funkcí,
- dodat finální aktuality, rozvrhy, akce, kapacity, plakáty a dotace,
- potvrdit přiřazení cvičitelů a zveřejnění všech kontaktů,
- potvrdit práva k logu, fontu a každé fotografii,
- určit organizátora výletů a organizátora táborů,
- určit osobu pro žádosti subjektů údajů a bezpečnostní incidenty.

Akceptace: na webu nezůstane žádný štítek „Demo“, „Ukázkový“ ani nepotvrzený údaj; vedení potvrdí obsah písemně.

## 2. Právník nebo pověřenec – GDPR a média

Úkoly:

- potvrdit správce, účely a právní tituly běžných i zdravotních údajů,
- schválit informační text a samostatné souhlasy pro zdraví a fotografie,
- schválit pravidla pro nezletilé, příjemce dat a předávání mimo EHP,
- stanovit retenční lhůty, proces výmazu, odvolání souhlasu a incidentní postup,
- prověřit smluvní vztahy s hostingem, Resend, Google a Cloudflare.

Akceptace: schválená verze textu GDPR, datum/verze souhlasu, seznam příjemců, retenční tabulka a jmenovaný vlastník výmazu.

## 3. Správce domény a hostingu

Úkoly:

- připojit `sokoldoudleby.cz` nebo definitivně zvolenou doménu,
- nastavit DNS, HTTPS, HSTS a přesměrování HTTP i starých URL,
- nastavit `PUBLIC_SITE_URL` přesně na kanonickou HTTPS adresu,
- vložit secrets pouze do serverového prostředí,
- ověřit automaticky vytvořený D1 binding `DB` a nasazenou migraci,
- nastavit WAF/rate limiting, monitoring dostupnosti a retenční pravidla logů,
- změnit přístup webu na veřejný až po finální akceptaci.

Akceptace: TLS test bez chyb, jedna kanonická URL, všechny varianty domény přesměrují správně, `/api/health` hlásí očekávaný stav a secrets nejsou ve frontendu ani repozitáři.

## 4. Správce e-mailu

Úkoly:

- založit Resend účet a ověřit odesílací doménu pomocí SPF/DKIM,
- dodat `RESEND_API_KEY`, `REGISTRATION_FROM_EMAIL`, `REGISTRATION_TRIP_ORGANIZER_EMAIL` a `REGISTRATION_CAMP_ORGANIZER_EMAIL`,
- nastavit přijímací schránky a odpovědnost za změny a rušení přihlášek.

Akceptace: organizátor i účastník obdrží testovací e-mail, odpověď jde správnému organizátorovi a zprávy nekončí ve spamu.

## 5. Správce Google Workspace

Úkoly:

- založit samostatný veřejný Google Kalendář a dodat omezený API klíč,
- založit chráněnou tabulku se samostatnými listy `Výlety` a `Tábory`,
- nasadit `server/google-sheets-webhook.example.gs`,
- nastavit Script Properties `WEBHOOK_SECRET`, `SHEET_ID`, případně názvy listů,
- omezit přístup k táborovým zdravotním údajům a nastavit kontrolu výmazu.

Akceptace: kalendář ukazuje živá data; test výletu zapisuje jen výletové sloupce; test tábora zapisuje zdravotní údaj pouze se souhlasem; duplicitní ID nepřidá řádek a kapacitu nelze překročit.

## 6. Vývojář

Úkoly:

- nahradit schválený obsah v `src/data/`, galerii a plakátech,
- zapsat skutečné akce, typ formuláře, kapacitu, uzávěrku a datum kontroly výmazu do `src/data/registration-events.json`,
- vložit dodané proměnné do hostingu a nikdy je necommitovat,
- spustit `pnpm install --frozen-lockfile`, `pnpm qa` a `pnpm audit --audit-level high`,
- nasadit označený commit z `main` a zaznamenat ID verze.

Akceptace: čistý pracovní strom, 80 nebo více procházejících testů, úspěšný build, nulové high/critical zranitelnosti a shoda nasazené revize s commitem.

## 7. QA a akceptace

Úkoly:

- automaticky otestovat Chromium, Firefox a WebKit; ručně potvrdit aktuální Safari na macOS/iOS a Android,
- ověřit 375, 390, 768 a 1280 px bez horizontálního přetékání,
- otestovat klávesnici, viditelný fokus, čtečku obrazovky a reduced motion,
- otestovat dark mode, menu, všechny odkazy, mapu, galerii, plakáty, PDF, kalendář a 404,
- poslat pouze fiktivní výletovou a táborovou přihlášku,
- ověřit plnou kapacitu, duplicitu, neplatné hodnoty, honeypot a zrušení přihlášky.

Akceptace: podepsaný protokol bez otevřených P0/P1 vad a s uloženými screenshoty hlavních viewportů.

## Pořadí ostrého spuštění

1. Schválit obsah, fotografie a právní dokumentaci.
2. Založit produkční účty, doménu, e-mail, kalendář, tabulku a Turnstile.
3. Nastavit secrets nejprve ve staging prostředí a ponechat `REGISTRATION_HEALTH_DATA_ENABLED=false`.
4. Nasadit kandidáta, provést E2E testy s fiktivními daty a odstranit testovací řádky.
5. Zapnout zdravotní údaje jen po právní a provozní akceptaci omezeného úložiště.
6. Připojit kanonickou doménu, ověřit SEO/HTTPS a zveřejnit přístup.
7. Prvních 48 hodin sledovat dostupnost, chyby, doručení e-mailů a kapacitu bez logování osobních údajů.

## Návratový plán

- Uchovat ID poslední ověřené verze a před změnou exportovat pouze nezbytnou zálohu tabulky s omezeným přístupem.
- Při selhání integrace vypnout neúplné secrets; aplikace se bezpečně vrátí do viditelného demo režimu bez ukládání.
- Při chybě nového frontendu nasadit poslední ověřenou verzi.
- Při podezření na únik okamžitě rotovat webhook secret, Resend a Google klíče, omezit formulář a spustit incidentní postup.

## Definice hotového ostrého provozu

Web je produkčně hotový až tehdy, když jsou uzavřené všechny P0 body, nasazená revize odpovídá GitHub `main`, produkční E2E test projde a vedení, právník, správce integrací i QA výsledek výslovně přijmou.

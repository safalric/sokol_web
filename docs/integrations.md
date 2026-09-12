# Kalendář a přihlášky

Web používá výhradně same-origin endpointy `/api/calendar` a `/api/registrations`. Tajné klíče zůstávají na serveru; klient obdrží pouze veřejný Turnstile site key. Týdenní rozvrh cvičení se načítá z ověřených místních dat a nepotřebuje externí API.

## Demo režim

Bez proměnných prostředí načítá kalendář data z `src/data/calendar-events.json`. Platná přihláška se zkontroluje na serveru a vrátí náhled dvou e-mailů. Osobní a zdravotní údaje se v tomto režimu neukládají ani neodesílají.

## Google Kalendář

1. Zveřejněte samostatný kalendář určený pro web.
2. Zapněte Google Calendar API a nastavte `GOOGLE_CALENDAR_ID` a `GOOGLE_CALENDAR_API_KEY`.
3. API klíč omezte na Calendar API a na produkční prostředí.

Při výpadku Google API se endpoint bezpečně vrátí k demo datům a návštěvníka na to upozorní.

## E-mail přes Resend

Nastavte `RESEND_API_KEY`, `REGISTRATION_FROM_EMAIL` z ověřené domény, `REGISTRATION_TRIP_ORGANIZER_EMAIL` a `REGISTRATION_CAMP_ORGANIZER_EMAIL`. Obě cílové adresy mohou být stejné, ale musí být nastavené výslovně. Server odešle jeden e-mail příslušnému organizátorovi a jeden účastníkovi. Každý požadavek používá idempotency key odvozený z ID odeslání. Obsah zdravotní poznámky se záměrně neposílá e-mailem.

Produkční režim se aktivuje pouze tehdy, když jsou současně nastaveny e-mail, Google Sheets, Turnstile, D1 binding `DB`, `RATE_LIMIT_HASH_SECRET`, `REGISTRATION_OUTBOX_KEY` a `REGISTRATION_JOBS_TOKEN`. Chybějící nebo částečné nastavení bezpečně ponechá formulář v demo režimu s viditelným varováním; nic se neuloží ani neodešle. Návštěvník proto nikdy nedostane falešné produkční potvrzení bez uložené rezervace. Ostrý start navíc vyžaduje běžící plánovač podle [návodu k doručování](registration-delivery.md).

## Google Sheets

1. Zkopírujte `server/google-sheets-webhook.example.gs` do Apps Script projektu připojeného k tabulce.
2. Ve Script Properties nastavte `WEBHOOK_SECRET`, `TRIP_SHEET_ID`, `CAMP_SHEET_ID` a volitelně `TRIP_SHEET_NAME` / `CAMP_SHEET_NAME`. Výletový identifikátor může pro kompatibilitu použít `SHEET_ID`. Tábor vyžaduje odlišný soubor.
3. Skript publikujte jako Web App spuštěnou pod účtem správce a URL vložte do `GOOGLE_SHEETS_WEBHOOK_URL`.
4. Stejný náhodný secret vložte do `GOOGLE_SHEETS_WEBHOOK_SECRET`.

Apps Script používá dva odlišné soubory: výletový s listem `Výlety` a omezeně sdílený táborový s listem `Tábory`. Ochrana či skrytí záložky Google Sheets neomezuje čtení, a proto nenahrazuje oddělené přístupové oprávnění ([Google](https://support.google.com/docs/answer/1218656?hl=en)). Výletová data nemají zdravotní sloupce. Zámek chrání rezervaci kapacity; stejné ID s odlišnými údaji je odmítnuto jako konflikt.

Akce, uzávěrka, kapacita a kontrola výmazu jsou v `src/data/registration-events.json`. Skutečné přihlášení navíc vyžaduje `productionApproved: true`. Ukázkové akce tuto hodnotu nesmí dostat. Zdravotní údaje lze přijmout jen při `REGISTRATION_HEALTH_DATA_ENABLED=true` a po schválení omezeného úložiště. Ani volné organizační poznámky se neposílají e-mailem, mohou totiž obsahovat citlivé údaje.

## Cloudflare Turnstile

1. Vytvořte Turnstile widget pro produkční doménu a zvolte spravovaný režim.
2. Nastavte `TURNSTILE_SITE_KEY` a serverový `TURNSTILE_SECRET_KEY`.
3. Secret nikdy nevkládejte do klientského kódu; veřejný site key poskytuje formuláři serverový endpoint.

Vedle Turnstile zůstává aktivní skrytý honeypot, kontrola původu požadavku, časová past, limit pěti pokusů za deset minut, omezení velikosti těla a serverová validace všech polí.

## D1 a globální rate limit

Hosting používá logical binding `DB` z `.openai/hosting.json`. Migrace `drizzle/0000_registration_rate_limits.sql` vytvoří tabulku pro desetiminutová okna. IP adresa se neukládá přímo; Worker ji před zápisem jednosměrně zahashuje pomocí tajné hodnoty `RATE_LIMIT_HASH_SECRET` dlouhé alespoň 32 znaků. Záznamy starší než 24 hodin se průběžně mažou. Pokud je ochrana v ostrém režimu nedostupná, odeslání skončí bezpečně chybou 503 a data se dál nezpracují.

## Pořadí zpracování

1. Server ověří původ, rychlost odeslání, honeypot, pole a Turnstile token.
2. Do D1 se připraví šifrovaná fronta obou e-mailů bez zdravotních údajů a volných poznámek. Teprve potom Google Sheets pod zámkem rezervuje místo a odmítne plnou kapacitu.
3. Po potvrzení rezervace se fronta aktivuje a Resend dostane oba e-maily, každý s vlastním stavem. Při částečném výpadku API vrátí uloženou přihlášku se stavem `queued`, nikoli falešně odeslané potvrzení.
4. Stejné ID a údaje nevytvoří další řádek. Zprávy přijaté Resendem se zaznamenají trvale; opakování nejistého pokusu končí po 23 hodinách k ruční kontrole, ještě před 24hodinovým limitem poskytovatele. Nelze slibovat garantované doručení do schránky ([Resend](https://resend.com/docs/dashboard/emails/idempotency-keys)).
5. Pravidelná údržba dohledává nejasný výsledek rezervace pomocí akce `status` v Apps Scriptu a pokračuje pouze při shodném otisku. Vyžaduje aktuální schema tabulky se sloupcem `Otisk přihlášky`.

## Před ostrým provozem

- potvrdit správce údajů, právní tituly, dobu uchování a proces výmazu s právníkem nebo pověřencem,
- uzavřít potřebné zpracovatelské smlouvy s poskytovateli,
- doplnit ověřené texty akcí, termíny a příjemce,
- odeslat testovací přihlášku bez skutečných zdravotních údajů a ověřit oba e-maily i jeden řádek v tabulce,
- ověřit skutečnou kapacitu a uzávěrku každé publikované akce,
- nastavit automatické mazání přihlášek po schválené době uchování.
- zapnout WAF a monitoring podle `docs/waf-monitoring-runbook.md` a ověřit `/api/health` s `HEALTH_EXPECT_LIVE=true`.

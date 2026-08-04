# Kalendář a přihlášky

Web používá výhradně same-origin endpointy `/api/calendar` a `/api/registrations`. Veřejné klíče ani e-mailové API klíče nejsou součástí klientského JavaScriptu.

## Demo režim

Bez proměnných prostředí načítá kalendář data z `src/data/calendar-events.json`. Platná přihláška se zkontroluje na serveru a vrátí náhled dvou e-mailů. Osobní a zdravotní údaje se v tomto režimu neukládají ani neodesílají.

## Google Kalendář

1. Zveřejněte samostatný kalendář určený pro web.
2. Zapněte Google Calendar API a nastavte `GOOGLE_CALENDAR_ID` a `GOOGLE_CALENDAR_API_KEY`.
3. API klíč omezte na Calendar API a na produkční prostředí.

Při výpadku Google API se endpoint bezpečně vrátí k demo datům a návštěvníka na to upozorní.

## E-mail přes Resend

Nastavte `RESEND_API_KEY`, `REGISTRATION_FROM_EMAIL` z ověřené domény a `REGISTRATION_ORGANIZER_EMAIL`. Server odešle jeden e-mail organizátorovi a jeden účastníkovi. Každý požadavek používá idempotency key odvozený z ID odeslání. Obsah zdravotní poznámky se záměrně neposílá e-mailem.

Produkční režim se aktivuje pouze tehdy, když jsou současně nastaveny e-mail, Google Sheets i Turnstile. Chybějící nebo částečné nastavení bezpečně ponechá formulář v demo režimu s viditelným varováním; nic se neuloží ani neodešle. Návštěvník proto nikdy nedostane falešné produkční potvrzení bez uložené rezervace.

## Google Sheets

1. Zkopírujte `server/google-sheets-webhook.example.gs` do Apps Script projektu připojeného k tabulce.
2. Ve Script Properties nastavte `WEBHOOK_SECRET`, `SHEET_ID` a volitelně `SHEET_NAME`.
3. Skript publikujte jako Web App spuštěnou pod účtem správce a URL vložte do `GOOGLE_SHEETS_WEBHOOK_URL`.
4. Stejný náhodný secret vložte do `GOOGLE_SHEETS_WEBHOOK_SECRET`.

Apps Script používá zámek nad tabulkou, kontroluje ID přihlášky a před přidáním řádku atomicky ověří kapacitu konkrétní akce. Tím se zabrání duplicitám i překročení kapacity při souběžném odeslání. Přístup k tabulce musí být omezen jen na oprávněné osoby.

Akce povolené pro přihlášení, uzávěrka, kapacita a datum kontroly výmazu jsou v `src/data/registration-events.json`. Zdravotní údaje lze v ostrém režimu přijmout jen při současně nastavené tabulce a hodnotě `REGISTRATION_HEALTH_DATA_ENABLED=true`.

## Cloudflare Turnstile

1. Vytvořte Turnstile widget pro produkční doménu a zvolte spravovaný režim.
2. Nastavte `TURNSTILE_SITE_KEY` a serverový `TURNSTILE_SECRET_KEY`.
3. Secret nikdy nevkládejte do klientského kódu; veřejný site key poskytuje formuláři serverový endpoint.

Vedle Turnstile zůstává aktivní skrytý honeypot, kontrola původu požadavku, časová past, limit pěti pokusů za deset minut, omezení velikosti těla a serverová validace všech polí.

## Pořadí zpracování

1. Server ověří původ, rychlost odeslání, honeypot, pole a Turnstile token.
2. Google Sheets pod zámkem rezervuje místo a odmítne plnou kapacitu.
3. Resend odešle e-mail organizátorovi a potvrzení účastníkovi.
4. Opakovaný požadavek se stejným ID nevytvoří druhý řádek ani druhé e-maily.

## Před ostrým provozem

- potvrdit správce údajů, právní tituly, dobu uchování a proces výmazu s právníkem nebo pověřencem,
- uzavřít potřebné zpracovatelské smlouvy s poskytovateli,
- doplnit ověřené texty akcí, termíny a příjemce,
- odeslat testovací přihlášku bez skutečných zdravotních údajů a ověřit oba e-maily i jeden řádek v tabulce,
- ověřit skutečnou kapacitu a uzávěrku každé publikované akce,
- nastavit automatické mazání přihlášek po schválené době uchování.

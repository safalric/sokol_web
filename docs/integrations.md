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

## Google Sheets

1. Zkopírujte `server/google-sheets-webhook.example.gs` do Apps Script projektu připojeného k tabulce.
2. Ve Script Properties nastavte `WEBHOOK_SECRET`, `SHEET_ID` a volitelně `SHEET_NAME`.
3. Skript publikujte jako Web App a URL vložte do `GOOGLE_SHEETS_WEBHOOK_URL`.
4. Stejný náhodný secret vložte do `GOOGLE_SHEETS_WEBHOOK_SECRET`.

Tabulka kontroluje ID přihlášky před přidáním řádku. Přístup k tabulce musí být omezen jen na oprávněné osoby.

Akce povolené pro přihlášení a datum kontroly výmazu jsou v `src/data/registration-events.json`. Zdravotní údaje lze v ostrém režimu přijmout jen při současně nastavené tabulce a hodnotě `REGISTRATION_HEALTH_DATA_ENABLED=true`.

## Před ostrým provozem

- potvrdit správce údajů, právní tituly, dobu uchování a proces výmazu s právníkem nebo pověřencem,
- uzavřít potřebné zpracovatelské smlouvy s poskytovateli,
- doplnit ověřené texty akcí, termíny a příjemce,
- odeslat testovací přihlášku bez skutečných zdravotních údajů a ověřit oba e-maily i jeden řádek v tabulce,
- nastavit automatické mazání přihlášek po schválené době uchování.

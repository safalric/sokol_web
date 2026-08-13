# Google integrace

## Google Kalendář

1. Založte samostatný veřejný kalendář TJ Sokol. Nevkládejte do něj jména, e-maily, telefony ani jiné osobní údaje.
2. Dejte každému správci vlastní účet a pouze potřebné oprávnění. Nesdílejte společné heslo.
3. V Google Cloud zapněte Calendar API a vytvořte API klíč omezený pouze na Calendar API.
4. Do hostingu nastavte `GOOGLE_CALENDAR_ID` a `GOOGLE_CALENDAR_API_KEY`.
5. Po ověření nastavte `HEALTH_EXPECT_LIVE=true`.

API vrací webu program a bezpečné odkazy pro Google Kalendář, Apple `webcal` a standardní ICS. Apple odběr je jen pro čtení a může se aktualizovat se zpožděním; správci proto upravují termíny přímo v Google Kalendáři.

## Google Forms + soukromé Sheets

1. Vytvořte samostatný Google Form pro akci nebo jeden formulář s povinným rozbalovacím polem `ID akce`. Volba může mít přívětivý tvar `orlicke-hory-2026 — Sokolský výlet`.
2. Odpovědi propojte s novou neveřejnou tabulkou. Nesdílejte ji odkazem „kdokoli s odkazem“.
3. Vytvořte Apps Script navázaný na tabulku a vložte obsah `server/google-forms-sheets.example.gs`.
4. Spusťte `setupRegistrationAutomation()`. Funkce uloží do Script Properties přesné `REGISTRATION_SPREADSHEET_ID`, aby časové triggery vždy pracovaly se správnou soukromou tabulkou.
5. V listu `Nastaveni` vyplňte stabilní ID akce, kapacitu, stav otevření, uzávěrku a datum kontroly výmazu.
6. V Script Properties nastavte `BACKUP_FOLDER_ID`, `BACKUP_RETENTION_DAYS` a `AUTO_DELETE_EXPIRED=false`.
7. Spusťte `installRegistrationTriggers()` a schvalte oprávnění.
8. Odešlete testovací odpovědi: platnou, duplicitní, chybnou a odpověď po naplnění kapacity.

Požadované názvy otázek jsou uvedené v konstantě `FORM_FIELDS`. Pole souhlasu má mít povinnou volbu `Souhlasím`. Formulářová potvrzovací stránka musí říkat pouze, že přihláška byla přijata ke kontrole; nesmí automaticky slibovat místo.

Skript označuje řádky jako `POTVRZENO`, `NAHRADNIK`, `DUPLICITA`, `CHYBA` nebo `K VYMAZU`. Používá zámek proti souběžnému překročení kapacity, kontrolní hash a ochranu proti vzorcům v tabulce. Hodinový monitor označí přihlášku, kterou odesílací trigger do 15 minut nezpracoval. Záměrně neposílá žádné e-maily rodičům.

## Zveřejnění formuláře

Do `src/data/site-content.json` doplňte například:

```json
{
  "provider": "google_forms",
  "formUrl": "https://docs.google.com/forms/d/e/FORM_ID/viewform",
  "open": true
}
```

Potom spusťte `pnpm qa`. Neoficiální doména, HTTP odkaz nebo chybějící URL zastaví build.

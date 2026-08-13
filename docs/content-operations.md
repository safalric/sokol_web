# Jednoduchá správa obsahu a provozu

## Veřejný obsah

Aktuality, oddíly, veřejné kontakty, akce a odkazy na formuláře jsou v `src/data/site-content.json`. Po změně upravte `contentVersion` a spusťte:

```bash
pnpm content:check
pnpm qa
```

Validátor odmítne neznámá pole, duplicitní ID, chybné datum, uzávěrku po akci, neplatnou kapacitu, telefon, e-mail a neověřený odkaz na formulář. Soubor je veřejný; nikdy do něj nepatří odpovědi, data narození, poznámky nebo tajné hodnoty.

## Termíny

Běžné termíny se mění pouze ve veřejném Google Kalendáři. Web je načte automaticky. `calendarFallback` je bezpečná záloha pro náhled při výpadku poskytovatele.

Na Apple zařízeních používají správci Google Kalendář nebo připojený Google účet. Rodiče mohou použít odkaz „Přidat do Apple Kalendáře“, který je jen pro čtení.

## Přihlášky

Odpovědi z Google Forms jsou pouze v neveřejné tabulce. Apps Script automaticky kontroluje formát, neznámé akce, uzávěrku, duplicity a kapacitu. Hodinová kontrola označí jako chybu i řádek, který odesílací trigger nezpracoval. Správce pracuje hlavně se sloupcem `Stav kontroly`.

- `POTVRZENO`: automatická kontrola prošla a kapacita byla volná.
- `NAHRADNIK`: údaje prošly, kapacita je naplněná.
- `DUPLICITA`: stejný účastník a akce už existují.
- `CHYBA`: údaj nebo nastavení vyžaduje ruční kontrolu.
- `K VYMAZU`: uplynulo datum retenční kontroly.

Automatické e-maily ani upozornění rodičům nejsou nyní aktivní.

## Zálohy a výmaz

Apps Script vytváří jednou týdně kopii do soukromé složky `BACKUP_FOLDER_ID` a staré kopie odstraňuje podle `BACKUP_RETENTION_DAYS` (výchozí 7, maximálně 30 dní). Denní kontrola označuje expirované řádky. `AUTO_DELETE_EXPIRED` ponechte `false`, dokud vedení neschválí automatický výmaz.

## Náhled a nasazení

Každá změna jde přes větev a pull request. GitHub Actions spustí validaci, testy, build, E2E a audit a uloží ověřený `dist/` jako náhledový artefakt. Produkční nasazení smí následovat pouze po úspěšných kontrolách a sloučení do `main`.

Monitoring dvakrát za hodinu ověřuje web, health endpoint a sitemap. Repository secret `FORM_MONITOR_URL` přidá dostupnost ostrého Google Formu; při více formulářích se nastaví hlavní aktivní formulář. Po produkčním připojení kalendáře nastavte `MONITOR_EXPECT_LIVE=true`.

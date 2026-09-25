# Google kalendář jednoty

Hlavní web načítá veřejný kalendář uvedený v `src/data/public-calendar.json`.
Stačí vytvářet a upravovat veřejné akce přímo v tomto Google kalendáři.
Není potřeba API klíč ani tajná iCal adresa. Tajná adresa nesmí být v repozitáři,
nastavení veřejného webu ani klientském kódu. Dříve sdílenou tajnou adresu obnovte
v nastavení Google kalendáře tlačítkem Reset.

## Jak se program zobrazuje

- Google akce se přidávají do stávajícího měsíčního kalendáře na `/kalendar#akce`.
- Pravidelný rozvrh cvičení na webu zůstává samostatný. Nevkládejte jeho kopii
  do Google, jinak budou termíny zobrazené dvakrát. Změna Google akce automaticky
  neruší cvičení z místního rozvrhu.
- Podporována jsou opakování, vynechané a přesunuté výskyty, celodenní a vícedenní
  akce. Časy se zobrazují v pásmu Europe/Prague včetně letního času.
- Přenášejí se název, datum, čas a místo. Popisy, kontakty a účastníci se neimportují.
  Události označené PRIVATE, CONFIDENTIAL nebo CANCELLED se nezobrazují.
- Aktualizace může mít zpoždění: server drží veřejný feed nejvýše 60 sekund,
  odpověď prohlížeče má platnost 5 minut. Další zpoždění může způsobit Google.
  Návštěvník získá nová data při načtení nebo přepnutí měsíce, nejde o živý push.
- Při chybě Google zůstává místní rozvrh a zobrazí se upozornění. Web nepředstírá,
  že chybějící online akce nejsou naplánované. Poslední online akce se trvale neukládají.
- V pravém panelu je veřejný odkaz do Google a adresa pro odběr iCal.
  Změny nebo smazání Google akcí se projeví při dalším úspěšném načtení.

Kalendář musí být veřejně čitelný. Ověření 25. 9. 2026: veřejná iCal adresa
vrátila HTTP 200 a platný, zatím prázdný kalendář. Žádné testovací akce nebyly
zapsány do účtu uživatele.

## Technické nastavení

`pnpm build` vloží veřejné ID do Workeru a přibalí nezměněnou knihovnu
ical.js 2.2.1 s licencí MPL-2.0. Zdroj knihovny:
https://github.com/kewisch/ical.js/tree/v2.2.1

Volitelná proměnná `GOOGLE_CALENDAR_PUBLIC_ID` přepíše ID z buildu.
Explicitní prázdný řetězec veřejné iCal napojení vypne. Původní napojení
`GOOGLE_CALENDAR_ID` + `GOOGLE_CALENDAR_API_KEY` zůstává dostupné, když je
veřejný iCal zdroj vypnutý. Veřejný zdroj má jinak přednost.

Veřejný feed se načítá pouze serverem z pevně určené domény Google. Požadavek
má časový limit 8 sekund včetně čtení těla a velikostní limit 2 MB. Zpracování
má limity na počet událostí a opakování; při jejich překročení se vrací viditelné
upozornění místo neúplného online programu. Soukromé iCal URL tento mechanismus
nepřijímá.

Testy: `pnpm test:api`, `pnpm test`, `pnpm check`, `pnpm build` a Chromium E2E.
Automatické E2E používá vypnutý veřejný zdroj, aby nebylo závislé na změnách
živého kalendáře; nový scénář testuje online událost a veřejné odkazy.

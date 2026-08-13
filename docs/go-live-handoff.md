# Předání k ostrému spuštění

Kód je připravený pro Google Kalendář a externí Google Forms. K ostrému zapnutí zbývají hodnoty a schválení, které nelze vytvořit bez účtu a rozhodnutí jednoty.

## P0 – nutné před spuštěním

1. Potvrdit skutečné texty, termíny, oddíly, kontakty a odstranit označení `demo`.
2. Zvolit produkční doménu a nastavit DNS/Cloudflare.
3. Založit veřejný Google Kalendář bez osobních údajů a dodat jeho ID a omezený API klíč.
4. Založit Google Form a neveřejnou odpovědní tabulku pro každou aktivní přihlášku.
5. Nasadit `server/google-forms-sheets.example.gs`, nastavit soukromou zálohovací složku a otestovat stavy přihlášek.
6. Schválit text ochrany osobních údajů, právní tituly, přístupy a retenční lhůty.
7. Doplnit oficiální Google Forms URL do `site-content.json`, změnit `open` na `true` a spustit `pnpm qa`.
8. Nastavit `PUBLIC_SITE_URL`, `GOOGLE_CALENDAR_ID`, `GOOGLE_CALENDAR_API_KEY`, `HEALTH_EXPECT_LIVE=true`, `MONITOR_URL`, `FORM_MONITOR_URL` a `MONITOR_EXPECT_LIVE=true`.
9. Zapnout ochranu větve `main`; vyžadovat úspěšné workflow `Kontrola kvality`.

## Akceptační test

- Web a všechny interní cesty vracejí HTTPS bez varování.
- Kalendář zobrazuje skutečný program a tlačítka Apple/Google.
- Apple odkaz přidá kalendář jen pro čtení.
- Google Form se otevře pouze u skutečně otevřené akce.
- Platná testovací odpověď dostane `POTVRZENO`.
- Druhá stejná odpověď dostane `DUPLICITA`.
- Po naplnění kapacity dostane další odpověď `NAHRADNIK`.
- Chybná odpověď dostane `CHYBA`.
- Záloha vznikne v neveřejné složce a retenční kontrola zapíše provozní log.
- `pnpm qa` a produkční GitHub Actions projdou.

## Návratový plán

Při problému zavřete přihlášku (`open: false`) a vraťte poslední úspěšný deployment. Soukromou tabulku nemažte. Kalendář lze dočasně odpojit; web zobrazí validovaná záložní data a monitoring ohlásí degradaci.

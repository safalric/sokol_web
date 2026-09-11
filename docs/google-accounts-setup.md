# Google účty a přístupy pro web Sokola

Stav k 11. 9. 2026: připravený návrh, žádný nový Google účet není založený. Nebyl vytvořen Kalendář, Tabulky ani nasazený Apps Script. Přístupové údaje nejsou v repozitáři.

## Co se má založit

| Prostředí | Vlastník | Účel |
| --- | --- | --- |
| Provoz jednoty | Jednotou pověřený správce | Google Kalendář, neveřejné přihlášky, provozní Apps Script |
| Testování | Potvrzený správce testovacího provozu | Oddělený kalendář, testovací tabulky, falešné osoby a testovací doručení |

Nejprve ověřit existující sokolský Google účet: [ČOS – Sokol start](https://prosokoly.sokol.eu/sokol-start). Nevytvářet duplicitní osobní Gmail jen kvůli domněnce, že jednota účet nemá. Návrh názvu pro případný nový testovací Gmail je `sokoldoudleby.web.test`; dostupnost názvu není ověřená ani rezervovaná. Provozní adresa se zvolí až podle existujícího účtu jednoty nebo rozhodnutí vedení. Nic placeného neobjednávat bez souhlasu.

Samostatný účet není potřeba pro každou akci. Akce se rozlišují v evidenci názvem a ID přihlášky. Jednotliví organizátoři mají vlastní přihlášení a přidělené oprávnění; nesdílejí jedno heslo.

## Co potřebuji od vlastníka

1. Kdo vlastní provozní a kdo testovací prostředí; zda již existuje sokolský Google účet.
2. Skutečné údaje držitele vyžadované Googlem. Nevymýšlet datum narození organizace.
3. Dokončení hesla, telefonu, případného CAPTCHA/ověření a přijetí podmínek přímo v prohlížeči vlastníkem. Hesla a recovery kódy neposílat do chatu.
4. Zapnutí 2FA nebo přístupového klíče, obnova účtu a bezpečné uložení záložních kódů. Obnovu nesmí ovládat pouze dodavatel webu.
5. Jména/oprávnění správců a e-maily organizátorů výletů a táborů; tyto adresy mohou být odlišné od vlastníka Google účtu.

## Soubory a oprávnění

- `Sokol Doudleby – veřejný program`: pouze termíny, místo, veřejný kontakt. Žádná jména účastníků, přihlášky či zdravotní informace.
- `Sokol Doudleby – přihlášky výlety`: neveřejný soubor Google Sheets, přístup jen pověřeným organizátorům výletů.
- `Sokol Doudleby – přihlášky tábory`: jiný neveřejný soubor Google Sheets, omezený okruh táborových organizátorů. Skrytá záložka ve výletové tabulce není oddělení oprávnění.
- Testovací kopie všech prostředků oddělené od provozu. Výhradně smyšlená jména a údaje; žádné skutečné zdravotní záznamy.
- Sdílení Tabulek nastavit na omezený přístup konkrétním lidem. Nepoužívat „kdokoliv s odkazem“ ani publikování na web.

## Navazující technické propojení

1. Vytvořit samostatný Google Cloud projekt pro test, povolit Calendar API, omezit API klíč na tuto službu. API klíč sám o sobě nezpřístupňuje soukromý kalendář; současná integrace čte veřejný program.
2. Nasadit `server/google-sheets-webhook.example.gs` do testovacího Apps Scriptu. Script Properties: `WEBHOOK_SECRET`, `TRIP_SHEET_ID` a jiný `CAMP_SHEET_ID`.
3. Nastavit odpovídající URL a tajemství pouze na serveru dle `.env.example`. Využití Resendu vyžaduje jeho účet/klíč a ověřenou odesílací doménu, samotný Gmail účastníkům potvrzení neposílá.
4. Nastavit Turnstile a D1, ověřit odeslání, chyby poskytovatelů, duplicity, souběh posledního místa a oprávnění účtů.
5. Teprve po schválení vedením vytvořit provozní prostředky a produkční akce. Zdravotní údaje ponechat vypnuté do právního a provozního schválení.

Tento dokument je předávací checklist, nikoli potvrzení, že výše uvedené účty a propojení už existují.

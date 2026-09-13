# Pravidelná cvičení v měsíčním kalendáři

Aktualizace 12. 9. 2026 na výslovné zadání uživatele: týdenní cvičení se zobrazují také jako konkrétní termíny, s vynecháním školních prázdnin a svátků. Toto nahrazuje starší rozhodnutí neodvozovat termíny z rozvrhu.

## Zdroje a období

- Dny, časy, místa a cvičitelé zůstávají v jediném zdroji `src/data/exercises.json` podle uložených plakátů. V běžném týdnu jde o 17 lekcí / 15 cvičení.
- `src/data/exercise-calendar-rules.json` omezuje generování na školní rok 1. 9. 2026 až 30. 6. 2027. Jde o zvolený rámec školního roku podle zadání, nikoli údaj o zahájení každého oddílu vyčtený z plakátu. Nejsou generovány termíny před datem zveřejnění konkrétního plakátu. Odlišný první/poslední termín jednoty je potřeba potvrdit a upravit před spuštěním.
- Prázdniny: [MŠMT, školní rok 2026/2027](https://msmt.gov.cz/organizace-skolniho-roku), ověřeno 12. 9. 2026. Podzimní 29.–30. 10., vánoční 23. 12.–3. 1., pololetní 29. 1., jarní pro okres Rychnov nad Kněžnou 8.–14. 2., velikonoční 25. 3. Letní prázdniny jsou mimo platnost rozvrhu.
- Svátky: [zákon č. 245/2000 Sb. v podkladech MPSV](https://ppropo.mpsv.cz/pdf/zakon_245_2000.pdf). Vynechávají se státní i ostatní svátky, včetně Velkého pátku 26. 3. 2027 a Velikonočního pondělí 29. 3. 2027.
- Ředitelská volna místní ZŠ pro tento rok nebyla potvrzena. Nepřebírat je z webů jiných škol, zejména nezaměnit Doudleby nad Orlicí s jihočeskými Doudleby.

## Údržba

Generátor `server/exercise-calendar.js` se spouští při sestavení. Termíny se nemusejí ručně kopírovat každý týden a nepotřebují Google účet. UTC slouží jen k průchodu kalendářními dny, místní časy z plakátů se při přechodu na letní/zimní čas neposouvají. Kalendář nepokračuje automaticky do nepotvrzeného dalšího školního roku.

- `excludedDates`: seznam ISO dat, kdy necvičí žádný oddíl (například potvrzené uzavření školy).
- `cancelledSessions`: jednotlivé zrušené lekce ve tvaru `{ "courseId": "florbal", "date": "2026-09-14", "start": "17:30" }`. Příklad nepatří do skutečných dat bez potvrzení.
- `schoolBreaks` a `publicHolidays`: úplné výjimky v uvedeném školním roce. Při změně sezóny aktualizovat i pohyblivé svátky a jarní prázdniny místního okresu.
- Samostatné výlety a akce patří nadále do `calendar-events.json`. Prázdninová výjimka ruší pouze pravidelné cvičení, ne výslovně zveřejněný výlet.
- Po změně dat spustit `pnpm qa` a znovu nasadit web. Případné Google události doplňují místní program; nevytvářet druhou kopii stejného rozvrhu také v Google Kalendáři.

Přihlášky na akce zůstávají uzavřené. Generátor neaktivuje e-maily, tabulky ani příjem osobních údajů.

## Ověření 13. 9. 2026

Finální `pnpm qa` prošlo: TypeScript, 47 Vitest testů, 85 serverových/datových testů, produkční sestavení a 48 Playwright scénářů (Chromium, Firefox, WebKit), celkem 180 bez selhání. Kalendář se kontroluje na 375, 390, 768 a 1280 px ve světlém i tmavém režimu, včetně automatické přístupnosti. Lokální API vrací v září 71 lekcí a žádnou 28. 9.; za celou sezónu vzniká 665 termínů.

Dřívější běh narazil na limit času souhrnného testu osmi variant v jednom scénáři. Kontroly byly rozděleny podle šířky bez snížení pokrytí. Další běh zaznamenal pád procesu Firefox při navigaci na GDPR; následná kompletní kontrola prošla i tímto scénářem. Ruční ověření konkrétního iPhonu a čtečky obrazovky tím není nahrazeno.

## FORPSI

Uživatel potvrdil zaplacený hosting u FORPSI a požaduje zachovat doménu i službu. Pro současný informační rozsah lze připravit statický export včetně kalendářových dat. Toto není hotový export ani ověření konkrétního tarifu.

Zbývá připravit: veřejné JSON soubory kalendáře a jejich klientské načítání, předgenerovaná metadata podstránek, správná 404, pravidla HTTPS/starých URL a bezpečnostních hlaviček pro zjištěný server. Dále testovat na testovací subdoméně, zálohovat starý WordPress a teprve potom přepnout kořen webu. Nenahrávat zdroje, `.env`, `node_modules` ani `dist/server` do veřejné složky.

Od uživatele: název tarifu, Linux/Windows, přístup k hostingu přes jeho správu nebo FTPS a možnost testovací subdomény. Ověřit platný certifikát. Poštu ani MX neměnit. Není potřeba hned kupovat další hosting.

FORPSI uvádí [Node.js mimo běžně podporované technologie webhostingu](https://www.forpsi.com/webhosting/assisted-migration/?lang=cs-cz). Současný Cloudflare Worker s D1 tam nelze nahrát jako PHP. Před budoucím zapnutím chytrých přihlášek je nutné vybrat samostatný kompatibilní backend nebo odpovídající implementaci pro konkrétní hosting.

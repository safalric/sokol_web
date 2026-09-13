# Publikační verze: kalendář a informační web

**Pozdější změna téhož dne:** uživatel požádal o týdenní opakování cvičení mimo prázdniny a svátky. Měsíční kalendář už tedy není prázdný. Aktuální pravidla a plán využití zaplaceného FORPSI hostingu: [calendar-recurrence.md](calendar-recurrence.md). Níže je původní publikační rozsah a záznam tehdejší kontroly.

Aktuální rozhodnutí zadavatele z 12. 9. 2026 nahrazuje dřívější požadavek aktivovat všechny integrace před spuštěním. Chytré přihlášky, automatické e-maily a Google Sheets se dokončí až v další etapě.

## Rozsah

- Skutečný týdenní rozvrh: 15 cvičení a 17 týdenních položek, společný zdroj `src/data/exercises.json`.
- Poznámka „ověřeno z Facebooku“ odstraněna z veřejného rozvrhu na přání zadavatele. Doklady a zdroje zůstávají v `docs/exercise-sources-2026-2027.md` a datových souborech.
- Měsíční kalendář funguje bez externího účtu; zobrazuje pouze výslovně zveřejněná data. Nyní nejsou dodané potvrzené termíny jednotlivých akcí, a proto je prázdný. Týdenní rozvrh to neovlivňuje.
- Odstraněny smyšlené výlety, běh a tábor, neověřené jednotlivé tréninky a veřejné ukázkové formuláře. Testovací data přesunuta mimo distribuovaný obsah do `tests/fixtures/`.
- API přihlášek při prázdném seznamu akcí vrací `503 / registrations_closed` ještě před čtením těla. Veřejná konfigurace vrací `unavailable`, health uvádí `closed`. Nic se neodesílá.
- Členská přihláška přes oficiální eČlen, plakáty, galerie, kontakty, historie a světlý/tmavý vzhled zůstávají.
- Text ochrany údajů popisuje současný informační web. Původní návrh pro budoucí přihlášky je v `docs/privacy-registration-draft.md`, není zveřejněný jako hotová služba.

## Výsledek ověření

Finální `pnpm qa` po odstranění poznámky z rozvrhu: TypeScript i produkční build úspěšné, 47 testů Vitest, 78 serverových/datových testů a 30 testů Playwright, celkem 155 bez selhání. Testy procházejí všechny veřejné stránky bez demo/prototypových nápisů, měsíční kalendář na 375/390/768/1280 px, světlý a tmavý režim, prázdný stav, chybu načtení, přepínání měsíců a uzavření registrací. Prohlížeče Chromium, Firefox a WebKit; automatické axe kontroly a lokální screenshoty. Nejde o ruční test skutečného iPhonu ani právní posudek.

## Doplnění termínů

V `src/data/calendar-events.json` lze doplnit skutečné položky s poli `id`, `date` (YYYY-MM-DD), `title`, `time`, `category` (`training` nebo `event`), `place`, `sourceUrl` (HTTPS zdroj) a `published: true`. Každý termín musí předem potvrdit organizátor. Neodvozovat výjimky a prázdniny z pravidelného týdenního rozvrhu. Test publikačních dat nyní záměrně očekává prázdný seznam; při prvním doplnění ho nahradit kontrolou konkrétních schválených zdrojů.

Google Calendar je volitelné pozdější rozšíření. Pokud je kompletně nakonfigurovaný, API jej čte; při výpadku zobrazí varování a jen publikované místní termíny, nikdy ukázky. Měsíc se určuje podle Europe/Prague. Prázdné či neplatné parametry jsou odmítnuty.

## Před otevřením původní domény veřejnosti

1. Potvrdit vedením rozvrh, kontakty a oprávnění zveřejnit fotografie a logo. Nové výlety ani tábory nejsou podmínkou spuštění této verze.
2. Vybrat cílový hosting a dodat přístup k DNS/hostingu. Aktuální nasazení používá Worker a ASSETS; prosté nahrání celého dist přes FTP není správné. Viz `docs/migration-forpsi.md`. Doména sokoldoudleby.cz se tímto commitem nepřepíná.
3. Zapnout platné HTTPS, přesměrování starých URL, nastavit PUBLIC_SITE_URL a provést test po přepnutí včetně zálohy a návratového postupu.
4. Doplnit a schválit informační povinnost podle skutečného cílového hostingu: zejména právní tituly zveřejněných kontaktů/fotografií, zpracovatele, retenci provozních logů a případné předávání dat. Technická kontrola není právní certifikace. Přehled požadavků: https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en .
5. Zachovat uzavřené přihlášky. Pro tento rozsah není potřeba zakládat Google účty, nastavovat Resend ani zapínat plánovač.

Soukromý Sites náhled a veřejně přístupná vlastní doména jsou odlišné kroky. Aktualizace náhledu sama o sobě nemění přístupová oprávnění ani DNS.

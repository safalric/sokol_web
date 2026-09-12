# Trvalé doručování potvrzení přihlášek

Implementováno 11.–12. 9. 2026. Produkční služby ani plánovač nejsou aktivované, dokud správce nedoplní účty, klíče a schválení. Testy používají skutečný SQLite engine a simulované HTTP poskytovatele, nikoli reálné osoby či e-maily.

## Ověření 12. 9. 2026

Kompletní `pnpm qa` skončilo úspěšně: kontrola TypeScriptu, produkční build, 44 testů Vitest, 73 serverových/datových testů a 24 testů Playwright (celkem 141). Prohlížeče: Chromium, Firefox a WebKit; šířky 375, 390, 768 a 1280 px. Sada zahrnuje tmavý režim, menu, plakáty a automatické kontroly přístupnosti. WebKit není náhradou ručního testu Safari na skutečném iPhonu ani automatická kontrola náhradou testu čtečkou obrazovky.

Serverové scénáře ověřují skutečné SQL migrace v SQLite, souběh a obnovu fronty, chyby poskytovatelů, souhlasy, manipulovaná data a ochranu citlivých údajů. HTTP poskytovatelé jsou simulovaní. Ostrý end-to-end test Google Sheets, Turnstile a doručení pošty nebyl proveden; chybí schválené účty a konfigurace. Plánovač není aktivovaný.

## Průchod přihlášky

1. API ověří původ, velikost dat, rate limit, souhlasy, schválenou akci a Turnstile.
2. Před zápisem do Google Sheets založí v D1 záznam doručování. Tělo obou e-mailů je zašifrované AES-256-GCM, s náhodným IV a vazbou na ID/otisk přihlášky. Zdravotní údaje ani volné poznámky do tohoto těla nepatří. Otisk, veřejný název akce, stav a časové údaje jsou provozní metadata, nikoli anonymní data.
3. Google Sheets pod zámkem potvrdí rezervaci. Plná kapacita či konflikt zneplatní čekající doručování a vymaže šifrovaný obsah. Při výpadku D1 před přípravou fronty se zápis do Sheets vůbec neprovede.
4. Server se pokusí o oba e-maily. Každý má vlastní stabilní idempotency key, počet pokusů, čas prvního pokusu a ID vrácené Resendem. Úspěch jednoho e-mailu není podmínkou pokusu o druhý.
5. Pokud služba neodpoví, přihláška zůstává uložená a API vrátí stav `queued`. Návštěvník vidí, že nemá posílat novou přihlášku. Přijetí poskytovatelem není tvrzení o doručení do schránky.
6. Plánovač zpracovává až tři přihlášky za běh. Při nejasném výsledku Google Sheets se nejprve dotáže na rezervaci podle ID, typu, akce a otisku. Tento dotaz nevrací údaje účastníka. D1 lease s kontrolou stavu brání souběžnému zpracování.

Po ztrátě odpovědi při zápisu nelze provést atomickou transakci napříč Google Sheets a D1. Proto vzniká fronta předem a nejasná rezervace se dohledává, nikoli opakuje naslepo. Pokud rezervaci nelze potvrdit, e-maily se neodesílají.

## Opakování a nejisté výsledky

- Opakování po 1, 2, 4 a dalších minutách, nejvýše jednou za hodinu. Běhy plánovače a vytížení mohou skutečnou prodlevu prodloužit.
- Už potvrzený e-mail se znovu neposílá ani po restartu Workeru.
- Resend pamatuje idempotency key pouze 24 hodin. Automatické pokusy se proto zastaví nejpozději 23 hodin od prvního pokusu daného e-mailu. Nejasný stav řeší člověk; systém neslibuje matematické „exactly once“ přes nezávislé služby. [Dokumentace Resendu](https://resend.com/docs/dashboard/emails/idempotency-keys).
- Trvalé odmítnutí poskytovatelem, nesoulad rezervace nebo chyba dešifrování vyvolají ruční kontrolu. Opakování nikdy nevytvoří jiný obsah pod původním idempotency key.
- Bounces a doručení do schránky se zatím automaticky nezpracovávají. Stav `sent` znamená pouze potvrzené přijetí API Resendu. Integrace podepsaných doručovacích webhooků je další samostatný krok.

## Nasazení

1. Aplikovat novou migraci `drizzle/0001_registration_deliveries.sql` a zachovat původní migraci beze změn. Schéma je zapsané také v `db/schema.ts`; při úpravách kontroluje test jejich shodu.
2. Nasadit aktuální Apps Script, který podporuje `reserve` i `status`. Nové tabulky mají poslední sloupec `Otisk přihlášky`. Starší záhlaví se úmyslně odmítne; před aktivací použít nové testovací tabulky. Existující ostrá data nesmazat. Případný přechod staré evidence musí projít zvláštní migrací, protože chybějící otisky nelze bezpečně vymyslet.
3. Vygenerovat kryptograficky náhodný 32bajtový klíč v Base64 pro `REGISTRATION_OUTBOX_KEY`, uložit jen do secrets serveru a bezpečné zálohy. Jiný dlouhý náhodný token uložit jako `REGISTRATION_JOBS_TOKEN`. Nikdy je nevkládat do souborů projektu či klientského kódu.
4. Do GitHub Actions secrets nastavit `REGISTRATION_DELIVERY_ORIGIN` (pouze kořenová HTTPS adresa ostrého webu) a stejný `REGISTRATION_JOBS_TOKEN`. Šifrovací klíč do Actions nepatří. V repo variables povolit `REGISTRATION_DELIVERY_ENABLED=true` až po ověření veřejně dosažitelného hostingu a všech přístupů. Soukromý Sites náhled bez dalšího oprávnění externí plánovač neobslouží.
5. Ručně spustit workflow `Dorucovani potvrzeni prihlasek`, ověřit výsledek a zapnout oznámení neúspěšných běhů odpovědnému správci. GitHub cron po pěti minutách není záruka přesného času; může být opožděn a u neaktivních veřejných repozitářů vyžaduje dohled ([GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)). Pro ostré SLA zvážit spravovaný plánovač hostingu.
6. V testovacím prostředí ověřit skutečný příjem obou e-mailů, chybu služby, vyčerpání kapacity a dohledání rezervace po výpadku. Teprve potom schválit produkční akce.

Bez nastaveného plánovače není zajištěné doručení čekající fronty ani pravidelný úklid. Chybějící nové serverové klíče udržují registrace v demo režimu.

## Provoz a řešení incidentu

`POST /api/internal/registration-delivery` vyžaduje Bearer token. Vrací pouze souhrnné počty a čas, žádná jména, adresy, ID přihlášek, klíče nebo těla e-mailů. Při ručním zásahu nebo interní chybě vrátí 503, aby plánovač nahlásil neúspěch. Přesměrování plánovač odmítá.

Pověřený správce otevře D1 přes administraci hostingu a dohledá řádky `state = 'manual'`. Podle ID přihlášky a uložených ID poskytovatele porovná evidenci se Sheets a Resendem. Nejprve ověří skutečný stav rezervace a odeslání. Teprve poté případně účastníka kontaktuje nebo potvrdí přihlášku ručně. Neměnit ID ani hromadně resetovat `*_first_attempt`, protože by se obešla ochrana proti duplicitám.

Po vyřešení incidentu správce zaznamená postup do přístupově omezené provozní evidence a označí konkrétní řádek jako `resolved`, nastaví `resolved_at`, vymaže `payload`. Podmínkou je `state = 'manual'` a neaktivní lease. Stav `resolved` neznamená automaticky doručený e-mail a nikdy se z něj znovu neodesílá. Web zatím nemá administrátorské UI pro tento zásah.

## Retence a klíče

- Po přijetí obou e-mailů poskytovatelem se šifrované tělo ihned odstraní. Totéž platí pro zamítnutou rezervaci.
- Při pravidelné údržbě se nedořešená těla starší sedmi dnů odstraní a případ předá k ruční kontrole. Zbývající provozní metadata se odstraní po datu kontroly výmazu dané akce, nejdříve sedm dnů od založení.
- Stejný běh odstraňuje D1 čítače starší 24 hodin. Běžící lease chrání před úklidem rozpracovaného požadavku.
- Jde o úklid této fronty, nikoli automatický výmaz Google Sheets, schránek, záloh a evidence ostatních zpracovatelů. Celkový retenční plán musí schválit vedení.
- Šifrovací klíč se nesmí bez migračního postupu vyměnit, dokud existují nevyřešená šifrovaná těla. Aktuálně je podporován jeden klíč. Ztráta klíče znamená nutnost ručního vyřízení těchto případů; nesmí vést k nezabezpečenému náhradnímu uložení.

Právní akceptace nové provozní evidence a skutečný test obnovy zůstávají povinnými body před ostrým používáním.

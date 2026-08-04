# Bezpečnostní model

## Hranice systému

Prohlížeč komunikuje pouze se same-origin endpointy `/api/calendar` a `/api/registrations`. Přístupové klíče pro Google a Resend existují jen v runtime prostředí serverového workeru. Repo neobsahuje produkční tajné hodnoty.

Neúplná produkční konfigurace neaktivuje žádnou část doručování. API zůstane v demo režimu, vrátí pouze obecné názvy chybějících schopností a nikdy nezveřejní názvy ani hodnoty tajných proměnných.

## Přihlášky

- HTTPS je povinné; nezabezpečené POST požadavky se odmítají.
- API vyžaduje JSON, platný same-origin `Origin` a odmítá `Sec-Fetch-Site: cross-site`.
- Požadavek má limit 12 kB, omezenou sadu polí a syntaktickou i sémantickou validaci.
- Honeypot se zahodí bez doručení, časová past odmítne nereálně rychlé odeslání a server používá rate limit i idempotentní ID.
- Ostrý režim vyžaduje ověřený Cloudflare Turnstile token svázaný s aktuální doménou a akcí formuláře.
- Název akce musí být v serverovém allowlistu s platnou uzávěrkou a číselnou kapacitou.
- Výstup do HTML e-mailu se kontextově kóduje a hodnoty pro Sheets jsou chráněny proti formula injection.
- Zdravotní text se neposílá e-mailem. Ostré uložení vyžaduje omezenou Sheets evidenci a explicitní provozní přepínač.
- Apps Script pod zámkem znovu kontroluje délku, secret, počet sloupců, duplicity, kapacitu a nebezpečné začátky buněk.

In-memory rate limit a idempotence chrání jednotlivou instanci workeru. Napříč instancemi ochranu doplňuje Turnstile a atomická kontrola kapacity i duplicit v Google Sheets.

## Hlavičky

Worker nastavuje HSTS, CSP bez `unsafe-inline`, zákaz rámování vlastního webu a objektů, omezená oprávnění prohlížeče, ochranu MIME typu a bezpečnou referrer policy. Vložené rámce jsou omezené na mapový náhled z `www.openstreetmap.org` a ochranu formuláře z `challenges.cloudflare.com`.

## Provoz

1. Tajné hodnoty ukládat pouze jako hosting secrets.
2. Omezit Google API klíč na Calendar API a konkrétní projekt.
3. Omezit přístup k tabulce na pověřené organizátory a pravidelně jej kontrolovat.
4. Rotovat webhook secret a API klíče při změně správce nebo podezření na únik.
5. Pravidelně kontrolovat kapacitu, datum uzávěrky a termín výmazu každé akce.
6. Monitorovat anonymizované chyby podle ID přihlášky; nelogovat obsah formuláře.
7. Spouštět `pnpm qa` a `pnpm audit --prod` před každým nasazením.

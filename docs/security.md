# Bezpečnostní model

## Hranice systému

Prohlížeč komunikuje pouze se same-origin endpointy `/api/calendar` a `/api/registrations`. Přístupové klíče pro Google a Resend existují jen v runtime prostředí serverového workeru. Repo neobsahuje produkční tajné hodnoty.

## Přihlášky

- HTTPS je povinné; nezabezpečené POST požadavky se odmítají.
- API vyžaduje JSON, platný same-origin `Origin` a odmítá `Sec-Fetch-Site: cross-site`.
- Požadavek má limit 12 kB, omezenou sadu polí a syntaktickou i sémantickou validaci.
- Honeypot se zahodí bez doručení, klient má loading stav a server používá rate limit i idempotentní ID.
- Název akce musí být v serverovém allowlistu.
- Výstup do HTML e-mailu se kontextově kóduje a hodnoty pro Sheets jsou chráněny proti formula injection.
- Zdravotní text se neposílá e-mailem. Ostré uložení vyžaduje omezenou Sheets evidenci a explicitní provozní přepínač.
- Apps Script znovu kontroluje délku, secret, počet sloupců, duplicity a nebezpečné začátky buněk.

In-memory rate limit a idempotence chrání jednotlivou instanci workeru. Před vysokozátěžovým veřejným spuštěním je vhodné doplnit distribuované úložiště limitů nebo spravovaný anti-bot mechanismus.

## Hlavičky

Worker nastavuje HSTS, CSP bez `unsafe-inline`, zákaz rámování a objektů, omezená oprávnění prohlížeče, ochranu MIME typu a bezpečnou referrer policy.

## Provoz

1. Tajné hodnoty ukládat pouze jako hosting secrets.
2. Omezit Google API klíč na Calendar API a konkrétní projekt.
3. Omezit přístup k tabulce na pověřené organizátory a pravidelně jej kontrolovat.
4. Rotovat webhook secret a API klíče při změně správce nebo podezření na únik.
5. Monitorovat anonymizované chyby podle ID přihlášky; nelogovat obsah formuláře.
6. Spouštět `pnpm qa` a `pnpm audit --prod` před každým nasazením.

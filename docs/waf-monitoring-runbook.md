# WAF, rate limit a monitoring

## Co chrání aplikace

- Formulář přijímá pouze same-origin HTTPS JSON požadavky.
- Cloudflare Turnstile, honeypot a časová past odfiltrují běžný automatizovaný spam.
- Lokální limit zastaví více než pět pokusů za deset minut v jedné instanci Workeru.
- D1 limit počítá pokusy globálně napříč instancemi. IP se nikdy neukládá přímo; ukládá se SHA-256 hash s tajnou hodnotou `RATE_LIMIT_HASH_SECRET`.
- Ostrý režim bez D1 bindingu `DB` a hashovacího tajemství zůstane bezpečně vypnutý.

## Doporučená pravidla na hraně sítě

Nastavuje správce DNS/Cloudflare až na produkční doméně:

1. Managed WAF ruleset: zapnutý v režimu block pro high-confidence nálezy.
2. Bot Fight Mode nebo odpovídající ochrana botů: zapnutá.
3. Rate limiting pro `POST /api/registrations`: 10 požadavků za 10 minut na IP, akce block na 15 minut.
4. Rate limiting pro ostatní `/api/*`: 120 požadavků za minutu na IP, akce managed challenge.
5. Blokovat jiné metody než GET/HEAD mimo `/api/registrations`; aplikace je kontroluje znovu.
6. Neobcházet Turnstile ani CSP výjimkou `unsafe-inline` nebo `unsafe-eval`.

Pravidla je nutné nejprve 24 hodin sledovat v log režimu a ověřit, že neblokují legitimní sdílené sítě školy nebo obce.

## Monitoring

- Veřejný endpoint `/api/health` nevrací tajné hodnoty ani osobní údaje.
- Po ostrém zapojení nastavte `HEALTH_EXPECT_LIVE=true`; neúplná integrace pak vrátí HTTP 503.
- Nastavte GitHub Actions secret `MONITOR_URL` na kanonický origin bez koncového lomítka.
- Workflow `.github/workflows/uptime.yml` kontroluje službu dvakrát za hodinu. Selhání se projeví v GitHub Actions; oznámení musí správce repozitáře zapnout v GitHub Notifications.
- Pro klientský provoz je vhodný ještě nezávislý monitor z jiné sítě s e-mailovým a telefonním alertem.

## Reakce na incident

1. Při nefunkční integraci odstranit nebo deaktivovat neúplné produkční secrets; formulář se vrátí do demo režimu.
2. Při spamu zpřísnit edge limit, zkontrolovat Turnstile a rotovat `RATE_LIMIT_HASH_SECRET` pouze po vyprázdnění starých limitů.
3. Při podezření na únik rotovat Resend, Google API a webhook secrets a omezit přístup k tabulce.
4. Nelogovat tělo přihlášky, e-mail, telefon ani zdravotní údaje.

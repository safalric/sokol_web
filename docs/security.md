# Bezpečnost

Webový server přijímá pouze veřejné požadavky na HTML, assety, `/api/calendar` a `/api/health`. Endpoint pro osobní přihlášky neexistuje. Prohlížeč se na Google Forms dostane až po kliknutí na ověřený odkaz.

Registrace jsou oddělené v neveřejném Google Sheets souboru. Přístupy se přidělují jednotlivým účtům podle role, s dvoufázovým ověřením; nepoužívá se veřejné sdílení ani společné heslo.

Apps Script používá:

- dokumentový zámek proti souběžnému překročení kapacity,
- allowlist stabilních ID akcí v listu `Nastaveni`,
- kontrolu formátů, uzávěrky, kapacity a duplicit pomocí tajného HMAC otisku,
- sanitaci hodnot začínajících znaky vzorců,
- provozní log bez jmen a e-mailů,
- soukromé zálohy s krátkou retenční dobou,
- bezpečný výchozí režim, který pouze označuje záznamy k výmazu.

Worker nastavuje HSTS, CSP bez `unsafe-inline` a `unsafe-eval`, zákaz rámování a objektů, omezená oprávnění prohlížeče, ochranu MIME typu a bezpečnou referrer policy. Jediný povolený externí rámec je mapa OpenStreetMap.

# Přechod ze starého webu na sokoldoudleby.cz

Ověřeno 10. 9. 2026, pouze veřejnými čtecími dotazy. Nebyly změněny DNS, hosting, databáze ani e-maily.

## Zjištěný stav

| Položka | Výsledek |
| --- | --- |
| DNS servery | ns.forpsi.cz, ns.forpsi.net, ns.forpsi.it |
| A záznam | 81.2.194.154 |
| www | CNAME na sokoldoudleby.cz |
| MX | mxavas.forpsi.com, priorita 10 |
| HTTP | 200 OK, server aruba-proxy; WordPress API je veřejně dostupné |
| HTTPS | Kontrola curl/Schannel odmítla certifikát jako prošlý (SEC_E_CERT_EXPIRED) |
| Tarif, vlastník smlouvy, přístupy | Z veřejných dat nelze zjistit |

DNS a pošta ukazují na FORPSI. Konkrétní tarif a skutečného správce je nutné potvrdit v administraci nebo na faktuře. Není správné tvrdit, že certifikát úplně chybí: aktuálně selhalo ověření jeho platnosti.

## Co lze na původním hostingu

Doménu lze ponechat. Projekt není WordPress a nevyžaduje jeho administraci. Frontend jsou statické soubory z Vite, ale přihlášky, kalendářové API, bezpečnostní hlavičky, serverové SEO a 404 používají Cloudflare Worker a D1. Pouhé nahrání adresáře `dist` přes FTP celý systém nezprovozní; nikdy nevystavovat `.env`, zdroje serveru ani zálohu databáze v kořeni webu.

FORPSI u běžného hostingu uvádí nepodporované technologie včetně Node.js a odkazuje na Cloud/Managed server ([oficiální podmínky migrace](https://www.forpsi.com/webhosting/assisted-migration/?lang=cs-cz)). Konkrétní tarif může mít jiné možnosti. Ani obyčejný Node server neumí automaticky nahradit Worker binding D1.

### Doporučená varianta: ponechat doménu i poštu, web na kompatibilním hostingu

- Registrace domény a pošta mohou zůstat u FORPSI.
- Web a jeho API běží společně na hostingu podporujícím Cloudflare Workers a D1 (současné Sites nebo samostatný účet jednoty).
- Pro vlastní doménu použít přesné ověřovací a směrovací záznamy, které poskytne zvolený hosting. Nevymýšlet CNAME/A cíle. Případný požadavek na změnu DNS serverů posoudit podle zvolené platformy; není totožný s převodem registrátora.
- Zachovat MX a všechny e-mailové DNS záznamy, aliasy a schránky. Před změnou exportovat celou DNS zónu včetně SPF, DKIM, DMARC a ověřovacích TXT.
- Pro veřejnou prezentaci musí být výslovně schváleno veřejné zpřístupnění. Současné Sites je nastavené pouze pro vlastníka; samo nasazení tuto podmínku nemění.

### Pokud musí celý web zůstat fyzicky na stávajícím sdíleném hostingu

Je potřeba potvrdit jeho technologie. Možnosti: přepsat serverovou část do PHP s trvalou SQL evidencí, nebo zajistit podporovanou reverzní proxy `/api/*` do samostatného Workeru. Druhá možnost musí zachovat ověřený původ, IP, HTTPS a autentizaci, ne pouze vypnout CORS. Tyto varianty zatím nejsou implementované a nelze je vydávat za prosté nahrání souborů.

Statická varianta bez těchto funkcí je samostatná obchodní volba; nelze ji použít potichu jako náhradu požadovaného plného webu.

## Co potřebujeme od vlastníka

1. Název poskytovatele a přesný tarif, fakturačního vlastníka domény/hostingu.
2. Delegovaný přístup do správy domény, DNS, hostingu a WordPressu, případně SFTP/FTPS. Hesla a ověřovací kódy neposílat do chatu ani Gitu.
3. Úplnou zálohu původních souborů, databáze a mediální knihovny; ověřit možnost obnovy.
4. Inventář schránek, aliasů a přesměrování e-mailů. Při změně webu je nemažeme a neměníme MX.
5. Schválení cílového hostingu, provozních nákladů, termínu přepnutí a návratového plánu.

## Zpráva poskytovateli hostingu

Předmět: sokoldoudleby.cz – ověření hostingu, SSL a příprava nového webu

Dobrý den,

připravujeme náhradu stávajícího WordPress webu TJ Sokol Doudleby nad Orlicí. Prosíme zatím o informace, nikoli změny služby:

1. Jaký konkrétní tarif, operační systém a webový server pro doménu používáme a kdo má správcovský přístup?
2. Kontrola HTTPS aktuálně hlásí prošlý certifikát. Je aktivní automatická obnova pro sokoldoudleby.cz i www? Splňujeme podmínky DV SSL zdarma a co je potřeba napravit?
3. Podporuje tarif statický React/Vite web, správné MIME typy WOFF2/WebP, vlastní přepisovací pravidla a HTTP 404? Je dostupné mod_rewrite/mod_headers nebo ekvivalent?
4. Je dostupné SFTP/FTPS, testovací subdoména, úplná záloha souborů/databáze a rychlá obnova předchozího webu?
5. Podporujete Node.js/Cloudflare Workers, nebo bezpečnou reverzní proxy `/api/*` na externí HTTPS backend? Nový backend používá Workers a D1, nikoli PHP WordPress.
6. Pokud web přesuneme jinam, lze u vás ponechat registraci domény a všechny e-mailové schránky? Jakou službu a cenu by bylo potřeba zachovat?
7. Můžeme měnit potřebné A/AAAA/CNAME/TXT záznamy a TTL, aniž by se změnila funkčnost pošty? Prosíme také o export celé aktuální zóny.
8. Jaké jsou limity provozu, prostoru, logů a odchozích HTTPS požadavků a kdo řeší incidenty mimo pracovní dobu?

Prosíme o odpověď a potvrzení, že zatím nebude provedena žádná změna DNS ani e-mailových služeb.

Děkujeme.

## Příprava přesměrování

Inventář veřejných WordPress stránek byl načten z `/wp-json/wp/v2/pages`. Ověřené příklady pro migrační mapu:

| Staré URL | Navržený cíl |
| --- | --- |
| /about/ | /o-nas |
| /contact/ | /kontakt |
| /offer/ | /historie |
| /offer-2/ | /akce (po doplnění skutečného tábora ideálně jeho detail) |
| /atletika/ | /cviceni#atletika |
| /volejbal/ | /cviceni#volejbal |
| /vsestrannost/ | /cviceni |
| /foto-akce-2024/ a další starší alba | Nejprve převzít konkrétní album, pak jeho odpovídající URL |
| /dokumenty/ | Nejprve inventář a import dokumentů; nová samostatná stránka zatím neexistuje |
| /capoeira/, /floriteam/ | Rozhodnutí vedení: archiv či ukončená nabídka, nevydávat za aktuální cvičení |

Nepřesměrovávat slepě všechny staré stránky na úvod. Zachovat odkazy na přílohy a stará alba, nebo připravit přímé náhrady. Kompletní knihovna původních médií zatím nebyla celá přenesena.

## Přepnutí a ověření

1. Záloha a export DNS, ověřená obnova, snížení TTL s předstihem podle poskytovatele.
2. Testovací nasazení se skutečnými službami, ale pouze fiktivními přihláškami. Staging nesmí zapisovat do ostré evidence.
3. Připojení domény a platný certifikát ještě před vynucením HTTPS. Aktuální [postup aktivace FORPSI](https://support.forpsi.com/kb/a4013/jak-mohu-aktivovat-dv-ssl-certifikat-zdarma.aspx?translation-detect=false) a [podmínky DV SSL](https://support.forpsi.com/kb/a4005/podminky-pro-poskytnuti-dv-ssl-certifikatu-zdarma.aspx?translation-detect=false) ověřit pro konkrétní tarif.
4. Nastavit kanonickou doménu, přesměrování HTTP/www/starých URL a `PUBLIC_SITE_URL`.
5. HSTS nevynucovat pro všechny subdomény ani neposílat do preload seznamu bez inventáře jejich HTTPS. Kód nyní používá HSTS jen pro aktuální hostname.
6. Ověřit web z jiné sítě, mobil, mapu, fonty, PDF/JPG/WebP, formulář, kalendář, 404, SEO a nezměněné doručování e-mailů.
7. Prvních 48 hodin monitoring. Původní web ponechat jako neveřejnou zálohu pro rychlý návrat; WordPress po migraci nenechat opuštěný veřejně dostupný.

Odhad samotného přepnutí na kompatibilní platformu: 3–5 hodin aktivní práce po získání přístupů; šíření DNS, ověření domény a reakce podpory jsou čekání navíc. Přepis pro sdílený PHP hosting: přibližně dalších 16–28 hodin včetně nových testů, upřesní se podle tarifu.

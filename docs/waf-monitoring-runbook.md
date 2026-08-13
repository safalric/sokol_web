# Monitoring a reakce na incident

## Monitoring

GitHub workflow kontroluje každých 30 minut:

- domovskou stránku,
- `/api/health`,
- `/sitemap.xml`,
- při `MONITOR_EXPECT_LIVE=true` také skutečné připojení Google Kalendáře.
- při nastaveném secretu `FORM_MONITOR_URL` také dostupnost hlavního aktivního Google Formu.

Google Forms a Sheets monitorujte v Google účtu: jednou měsíčně ověřte funkčnost triggerů a naposledy provedené spuštění. Test používejte jen s fiktivními údaji a po testu jej smažte.

## Incident

1. Při problému s formulářem nastavte u akce v `site-content.json` `open: false` a nasaďte změnu.
2. Zkontrolujte historii spuštění Apps Scriptu a list `Provozni log`.
3. Neměňte ani nemažte odpovědi, dokud není jasná příčina a existuje ověřená záloha.
4. Při podezření na neoprávněný přístup odeberte sdílení, změňte oprávnění Google účtů a informujte vedení.
5. Obnovujte pouze do nové neveřejné tabulky; původní zachovejte do ukončení šetření.

Webové WAF pravidlo může povolit pouze GET/HEAD; veřejný web už nepřijímá registrační POST požadavky.

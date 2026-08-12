# Přístupnost a kompatibilita

## Automatizovaná kontrola

- Vitest + axe-core kontroluje všech 11 veřejných cest na závažná a kritická porušení přístupnosti.
- Playwright ověřuje Chromium, Firefox a WebKit při šířkách 375, 390, 768 a 1280 px.
- Testy kontrolují přítomnost hlavního nadpisu a patičky, rozbité obrázky, horizontální přetékání a zachování dark mode.
- Klávesnicový scénář ověřuje otevření a zavření mobilní navigace, otevření plakátu, dostupnost odkazu ke stažení, zavření Escape a návrat fokusu.

WebKit na Windows je automatizovaný kompatibilitní test vykreslovacího enginu, nikoli plná náhrada skutečného Safari na macOS nebo iOS.

## Ruční akceptace před zveřejněním

1. Safari na aktuálním macOS a iOS: navigace, formulář, kalendář, galerie, plakáty, mapa a dark mode.
2. Android Chrome: stejné scénáře při 360 až 412 px a se zvětšením textu na 200 %.
3. NVDA + Firefox nebo Chrome na Windows: pořadí nadpisů, landmarky, názvy ovládacích prvků, chybová hlášení formuláře a dialog lightboxu.
4. VoiceOver + Safari na iOS: pořadí prvků, mobilní menu, formulářové popisky a zavření dialogu.
5. Klávesnice bez myši: viditelný fokus, logické pořadí Tab, Enter/Space, Escape a žádná past fokusu.
6. Režim omezeného pohybu, vysoký kontrast systému a světlé i tmavé barevné schéma.

Výsledek ruční kontroly se zapíše s datem, zařízením, verzí prohlížeče, jménem testera a případnými vadami. Bez této akceptace nelze tvrdit, že proběhl plný test konkrétní čtečky nebo skutečného Safari.

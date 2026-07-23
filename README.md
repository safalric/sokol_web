# TJ Sokol Doudleby nad Orlicí

Nový moderní web pro TJ Sokol Doudleby nad Orlicí. Projekt je připraven jako rychlá React/Vite aplikace se stylingem přes Tailwind CSS.

## Struktura

- `src/App.tsx` - aktuální jednostránkový layout a obsahové bloky.
- `src/components/` - sdílené komponenty layoutu.
- `src/data/siteContent.ts` - navigace, aktuality, oddíly, akce, kontakty a GDPR obsah.
- `src/styles.css` - Tailwind vrstvy a vlastní komponentové třídy.
- `tailwind.config.js` - sokolská barevná paleta a základní design tokeny.

## Obsah webu

Homepage obsahuje hero rozcestník, aktuality, nadcházející akce, karty oddílů,
kontakt/pronájem sokolovny a základ samostatné GDPR sekce. Formulář
`EventRegistrationForm` je vložený do detailu vybrané akce.

Typografie je připravena pro oficiální sokolské písmo Tyrš / Fügner. Pokud budou
dodány licencované webfonty, stačí je přidat přes `@font-face`; současný fallback
používá kondenzovanou sportovní sazbu ve stejném duchu.

## Spusteni

```bash
pnpm install
pnpm run dev
```

## Prihlasky na akce

Komponenta `EventRegistrationForm` odesílá data na HTTPS webhook nastavený v `.env`:

```bash
VITE_EVENT_REGISTRATION_WEBHOOK_URL=https://example.com/api/event-registration
```

Webhook má zajistit poslání e-mailu organizátorovi, potvrzení účastníkovi a zápis řádku do Google Sheets. Tajné klíče pro Web3Forms, Tally, Make/Zapier nebo Google Apps Script patří na serverovou/webhook stranu, nikdy přímo do klienta.

Serverová ukázka webhooku je v `server/event-registration-webhook.example.ts`. Počítá s proměnnými prostředí `ALLOWED_ORIGIN`, `GOOGLE_SHEETS_WEBHOOK_URL`, `ORGANIZER_EMAIL` a `MAIL_WEBHOOK_URL`.

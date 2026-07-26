import { ExternalLink, ShieldCheck } from "lucide-react";
import { PageShell } from "../components/PagePrimitives";

const privacySections = [
  {
    title: "Správce a kontakt",
    text: "Správcem je Tělocvičná jednota Sokol Doudleby nad Orlicí, IČ 15040020, se sídlem Švermova 528, 517 42 Doudleby nad Orlicí. Žádosti a odvolání souhlasů přijímá e-mail sokoldoudleby@seznam.cz.",
  },
  {
    title: "Účel a právní titul",
    text: "Identifikační a kontaktní údaje se používají k vyřízení přihlášky, komunikaci a bezpečné organizaci konkrétní akce. Před ostrým provozem musí jednota písemně potvrdit odpovídající právní titul, typicky kroky před uzavřením dohody a její plnění. Potvrzení seznámení se zásadami není souhlasem s tímto nezbytným zpracováním.",
  },
  {
    title: "Zdravotní údaje",
    text: "Údaj o alergii nebo zdravotním omezení je nepovinný a patří mezi zvláštní kategorie osobních údajů. Zpracuje se pouze po samostatném výslovném souhlasu, jen pro bezpečný průběh akce a pouze v omezené evidenci. Běžný e-mail jeho obsah nepřenáší.",
  },
  {
    title: "Fotografie a video",
    text: "Souhlas s pořízením a zveřejněním fotografií nebo videa na webu a sociálních sítích jednoty je dobrovolný, oddělený od přihlášky a lze jej odvolat bez vlivu na účast. Odvoláním není dotčena zákonnost dřívějšího zpracování.",
  },
  {
    title: "Nezletilí účastníci",
    text: "U účastníka mladšího 18 let formulář vyžaduje jméno zákonného zástupce a potvrzení, že osoba odesílající přihlášku je oprávněna dítě přihlásit. Kontaktní údaje mají patřit osobě zajišťující komunikaci k akci.",
  },
  {
    title: "Uchování a výmaz",
    text: "Produkční evidence musí mít pro každou akci předem určené datum kontroly výmazu. Návrh pro tuto akci je 30 dní po jejím skončení; delší uchování je možné jen při doložené právní povinnosti nebo řešení nároku. Demo režim údaje neukládá ani neodesílá.",
  },
  {
    title: "Příjemci a zpracovatelé",
    text: "Přístup mají mít pouze pověření organizátoři. Před aktivací ostrého režimu musí jednota zveřejnit konkrétní poskytovatele hostingu, e-mailu a evidence, prověřit místo zpracování a uzavřít potřebné zpracovatelské smlouvy. Bez toho zůstává formulář pouze v demo režimu.",
  },
  {
    title: "Vaše práva",
    text: "Můžete žádat přístup, opravu, výmaz, omezení zpracování, přenositelnost tam, kde se uplatní, a vznést námitku. Dobrovolný souhlas lze kdykoli odvolat. Žádost bude vyřízena bez zbytečného odkladu, zpravidla nejpozději do jednoho měsíce.",
  },
  {
    title: "Cookies, mapa a automatizace",
    text: "Aplikační kód nepoužívá analytické ani marketingové cookies, reklamní profilování ani automatizované rozhodování. Kontaktní stránka načítá mapový náhled od OpenStreetMap; provozovatel mapy při tom může obdržet IP adresu a technické údaje požadavku. Odkaz na Google Mapy se otevře pouze na výslovný pokyn návštěvníka.",
  },
];

export function PrivacyPage() {
  return (
    <PageShell title="Ochrana osobních údajů">
      <div className="legal-draft">
        <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
        <p>
          Formulář je nyní bezpečný funkční prototyp v režimu bez ukládání. Níže uvedený text je věcný návrh informační povinnosti; před aktivací skutečného ukládání jej musí schválit vedení jednoty a právník včetně právních titulů, lhůt a smluv s dodavateli.
        </p>
      </div>
      <div className="privacy-summary" aria-label="Rychlé shrnutí">
        <strong>Aktuální režim</strong>
        <span>Demo bez ukládání osobních a zdravotních údajů</span>
        <strong>Kontakt správce</strong>
        <a href="mailto:sokoldoudleby@seznam.cz">sokoldoudleby@seznam.cz</a>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {privacySections.map((item) => (
          <article key={item.title} className="content-card">
            <ShieldCheck className="mb-4 h-6 w-6 text-sokol-red" aria-hidden="true" />
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
      <div className="privacy-complaint">
        <div>
          <strong>Dozorový úřad</strong>
          <p>Máte také právo podat stížnost u Úřadu pro ochranu osobních údajů.</p>
        </div>
        <a href="https://uoou.gov.cz/" target="_blank" rel="noopener noreferrer">
          Otevřít web ÚOOÚ
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </PageShell>
  );
}

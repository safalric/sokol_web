import { ExternalLink, ShieldCheck } from "lucide-react";
import { PageShell } from "../components/PagePrimitives";

const privacySections = [
  {
    "title": "Správce a kontakt",
    "text": "Správcem obsahu je Tělocvičná jednota Sokol Doudleby nad Orlicí, IČ 15040020, se sídlem Švermova 528, 517 42 Doudleby nad Orlicí. S dotazy k osobním údajům, fotografiím nebo zveřejněným kontaktům se obraťte na sokoldoudleby@seznam.cz."
  },
  {
    "title": "Přihlášky a členství",
    "text": "Tento web nyní nepřijímá online přihlášky na výlety ani tábory a nesbírá zdravotní údaje. Členská přihláška se otevírá na samostatném webu eČlen České obce sokolské. Údaje vyplňujete až tam; před odesláním si přečtěte informace o jejich zpracování v tomto systému."
  },
  {
    "title": "Návštěva webu",
    "text": "Pro načtení a zabezpečení webu hosting zpracovává technické údaje požadavku, například IP adresu, čas a požadovanou adresu stránky. Aktuální náhled běží na platformě Sites s hostingovou infrastrukturou Cloudflare. Přístup k soukromému náhledu může vyžadovat přihlášení k platformě; to není členský účet Sokola."
  },
  {
    "title": "Nastavení a externí služby",
    "text": "Aplikační kód nepoužívá reklamní ani analytické cookies. Volba světlého nebo tmavého vzhledu se ukládá do vašeho prohlížeče pod klíčem sokol-theme. Kontaktní stránka načítá mapu OpenStreetMap, jejíž poskytovatel obdrží technické údaje včetně IP adresy. Facebook, Instagram, Google Mapy a eČlen jsou odkazy na externí weby, které se otevřou po kliknutí."
  },
  {
    "title": "Kontakty a fotografie",
    "text": "Web zveřejňuje kontakty vedení a cvičitelů a fotografie z činnosti jednoty. S žádostí o opravu kontaktu nebo posouzení zveřejněné fotografie se obraťte na správce. V žádosti stačí uvést odkaz a popsat, čeho se týká; neposílejte zbytečně citlivé údaje."
  },
  {
    "title": "Vaše práva",
    "text": "Podle okolností zpracování můžete požádat o přístup k údajům, opravu, výmaz či omezení zpracování, vznést námitku a uplatnit právo na přenositelnost. Pokud je zpracování založené na souhlasu, můžete jej odvolat. Máte právo podat stížnost u Úřadu pro ochranu osobních údajů."
  }
];

export function PrivacyPage() {
  return (
    <PageShell title="Ochrana osobních údajů">
      <p className="page-intro">Informace k současnému informačnímu webu jednoty. Online přihlášky na akce nejsou otevřené.</p>
      <div className="privacy-summary mt-6" role="region" aria-label="Kontakt správce">
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
        <div><strong>Informace o právech</strong><p>Podrobnosti zveřejňuje Evropská komise a Úřad pro ochranu osobních údajů.</p></div>
        <a href="https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en" target="_blank" rel="noopener noreferrer">Evropská komise <ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
        <a href="https://uoou.gov.cz/" target="_blank" rel="noopener noreferrer">ÚOOÚ <ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
      </div>
    </PageShell>
  );
}

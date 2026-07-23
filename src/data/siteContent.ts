import {
  Baby,
  CalendarDays,
  Dumbbell,
  Goal,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export const memberApplicationUrl = "https://www.ecz-sokol.cz/clen/prihlaska";

export const navigation = [
  { label: "Home", href: "/" },
  { label: "O nás", href: "/o-nas" },
  { label: "Cvičení", href: "/cviceni" },
  { label: "Akce", href: "/akce" },
  { label: "Přihláška", href: "/prihlaska" },
  { label: "Fotogalerie", href: "/fotogalerie" },
  { label: "Historie", href: "/historie" },
  { label: "Kontakt", href: "/kontakt" },
];

export const quickLinks = [
  { label: "Chci cvičit", href: "/cviceni", icon: Dumbbell },
  { label: "Aktuální akce", href: "/akce", icon: CalendarDays },
  { label: "Přihláška do Sokola", href: "/prihlaska", icon: Users },
];

export const notices = [
  {
    title: "Zahájení nové sezóny",
    date: "září 2026",
    text: "Rozvrh cvičení bude potvrzen po domluvě s cvičiteli. Aktuální časy najdete vždy v přehledu oddílů.",
  },
  {
    title: "Přihlášky na akce",
    date: "průběžně",
    text: "Na výlety a tábory používejte online formulář u konkrétní akce. Po nastavení webhooku přijde potvrzení e-mailem.",
  },
  {
    title: "Členství v Sokole",
    date: "online",
    text: "Noví členové mohou vyplnit oficiální přihlášku ČOS přes elektronický systém eČlen.",
  },
];

export const departments = [
  {
    title: "Rodiče a děti",
    age: "2-4 roky s doprovodem",
    schedule: "úterý 16:00-17:00",
    place: "velký sál sokolovny",
    contact: "cvičitelka bude doplněna",
    description: "Hravé cvičení, základní pohybové návyky, koordinace a společný čas rodičů s dětmi.",
    icon: Baby,
  },
  {
    title: "Předškoláci",
    age: "4-6 let",
    schedule: "čtvrtek 16:00-17:00",
    place: "sokolovna",
    contact: "predskolaci@sokoldoudleby.cz",
    description: "Všeobecná pohybová příprava, překážkové dráhy, obratnost a jistota v pohybu.",
    icon: Sparkles,
  },
  {
    title: "Florbal",
    age: "mladší a starší žáci",
    schedule: "pondělí 17:00-18:30",
    place: "sportovní sál",
    contact: "florbal@sokoldoudleby.cz",
    description: "Týmová hra, rychlost, technika hole, spolupráce a pravidelný trénink.",
    icon: Goal,
  },
  {
    title: "Všestrannost",
    age: "děti 6-12 let",
    schedule: "středa 17:00-18:00",
    place: "sokolovna a venkovní hřiště",
    contact: "cviceni@sokoldoudleby.cz",
    description: "Základy gymnastiky, atletiky, her, posílení a celkové pohybové gramotnosti.",
    icon: Dumbbell,
  },
  {
    title: "Gymnastika",
    age: "školní děti",
    schedule: "pátek 16:30-18:00",
    place: "sokolovna",
    contact: "gymnastika@sokoldoudleby.cz",
    description: "Obratnost, síla, držení těla, základní prvky a práce na nářadí.",
    icon: ShieldCheck,
  },
  {
    title: "Rekreační pohyb",
    age: "mládež a dospělí",
    schedule: "dle aktuální domluvy",
    place: "sokolovna / venkovní prostor",
    contact: "info@sokoldoudleby.cz",
    description: "Volnější sportovní program, kondiční pohyb a komunitní setkání.",
    icon: Users,
  },
];

export const events = [
  {
    title: "Sokolský výlet do Orlických hor",
    date: "sobota 19. září 2026",
    time: "odjezd 8:30",
    place: "sraz u sokolovny",
    capacity: "30 míst",
    description:
      "Rodinný výlet pro děti, rodiče i členy jednoty. Počítá se s lehčí trasou, společným obědem a návratem odpoledne.",
    registration: true,
  },
  {
    title: "Sokolský běh republiky",
    date: "říjen 2026",
    time: "čas bude upřesněn",
    place: "Doudleby nad Orlicí",
    capacity: "otevřeno veřejnosti",
    description: "Komunitní běh pro všechny věkové kategorie. Připravujeme tratě pro děti i dospělé.",
    registration: false,
  },
  {
    title: "Letní tábor",
    date: "červenec 2027",
    time: "týdenní pobyt",
    place: "místo bude potvrzeno",
    capacity: "předběžný zájem",
    description: "Informační karta pro budoucí tábor. Později doplníme termín, cenu a pokyny pro rodiče.",
    registration: false,
  },
];

export const gallery = [
  { title: "Cvičení dětí", meta: "pohybová všestrannost", tone: "red" },
  { title: "Sokolské akce", meta: "setkání jednoty", tone: "navy" },
  { title: "Výlety", meta: "společné zážitky", tone: "sand" },
  { title: "Florbal", meta: "týmový sport", tone: "blue" },
  { title: "Tábor", meta: "léto se Sokolem", tone: "green" },
  { title: "Sokolovna", meta: "zázemí jednoty", tone: "gray" },
];

export const historyTimeline = [
  {
    year: "1862",
    title: "Vznik sokolstva",
    text: "Dne 16. února 1862 vznikla Pražská tělocvičná jednota, později Sokol pražský. U zrodu stáli Jindřich Fügner a Miroslav Tyrš.",
  },
  {
    year: "1885-1895",
    title: "Župa Orlická",
    text: "Sokolská župa východních Čech byla založena v Hradci Králové roku 1885. Dne 10. listopadu 1895 vznikla samostatná župa Orlická.",
  },
  {
    year: "1899",
    title: "Samostatná jednota v Doudlebách",
    text: "Na valné hromadě 8. ledna 1899 byla ustanovena samostatná Tělocvičná jednota Sokol Doudleby nad Orlicí. Prvním starostou byl zvolen Jindřich Pavlát.",
  },
  {
    year: "1914-1918",
    title: "První světová válka",
    text: "Válka silně zasáhla sokolské hnutí. Řada sokolů byla vězněna za účast v odboji a sokolové tvořili významnou část československých legií.",
  },
  {
    year: "1919",
    title: "Lípa Svobody",
    text: "Na počest vzniku Československé republiky uspořádala jednota 13. dubna 1919 slavnost sázení Lípy Svobody na Bělisku.",
  },
  {
    year: "1920-1928",
    title: "Třešňovka pro Sokol",
    text: "Od roku 1920 se jednalo o předání Třešňovky Sokolu pro sportovní zázemí. Roku 1928 byl pozemek převzat do vlastnictví jednoty.",
  },
  {
    year: "1940-1990",
    title: "Přerušení a obnova",
    text: "Po zrušení Sokola za druhé světové války sloužila část Třešňovky jiným účelům. Po obnovení Sokola v 90. letech se místo vrátilo sportovní činnosti.",
  },
];

export const historyStories = [
  {
    title: "Začátky doudlebské jednoty",
    paragraphs: [
      "TJ Sokol Doudleby nad Orlicí nejprve působila jako pobočka Sokola Kostelec nad Orlicí. Samostatná jednota vznikla 8. ledna 1899 a už v prvním roce vykazovala velmi živou činnost.",
      "V roce 1899 se uskutečnilo 64 cvičení. Členové se účastnili župního sletu v Týništi nad Orlicí i okrskových cvičení v Holicích, Kyšperku, Pěčíně a Vamberku. Na konci roku měla jednota 93 členů, z toho 43 činných a 50 přispívajících.",
    ],
  },
  {
    title: "Třešňovka a sportovní zázemí",
    paragraphs: [
      "Název Třešňovka připomíná starší třešňový sad, založený roku 1888 na památku čtyřicetiletého panování císaře Františka Josefa. Na místě bylo slavnostně vysazeno 91 třešňových stromků.",
      "Ve 20. letech se prostor stal předmětem jednání o zázemí pro Sokol. Po splnění podmínek byl pozemek předán jednotě; vznikly zde šatny, hřiště pro odbíjenou, venkovní hrazda, kruhy a doskočiště. Podél pozemku byly později vysazeny lípy.",
    ],
  },
  {
    title: "Sokol a obecní život",
    paragraphs: [
      "Doudlebský Sokol nebyl jen sportovním spolkem. Podílel se na slavnostech, veřejném životě a vytvářel prostor pro setkávání obyvatel. Výrazným příkladem byla slavnost Lípy Svobody v roce 1919.",
      "Historie jednoty ukazuje kontinuitu dobrovolné práce, pohybu a péče o místní komunitu. Tato tradice je základem, na který může současný web navazovat.",
    ],
  },
];

export const leadership = [
  { role: "Starostka", name: "Monika Šafaříková", phone: "724 121 564", email: "safarikova.monca@seznam.cz" },
  { role: "Místostarostka", name: "Lenka Divíšková", phone: "721 062 381", email: "stepkovaLenka@seznam.cz" },
  { role: "Náčelnice", name: "Daniela Vařeková", phone: "732 535 598", email: "danielasafarikova@seznam.cz" },
  { role: "Jednatelka", name: "Michaela Podolská", phone: "604 642 330", email: "michaelapodolska@seznam.cz" },
  { role: "Hospodářka", name: "Kateřina Lásková", phone: "777 558 709", email: "laskovakaterina@centrum.cz" },
  { role: "Členka výboru", name: "Radka Suchomelová", phone: "605 724 728", email: "raduza.su@seznam.cz" },
  { role: "Členka výboru", name: "Marta Šimperská", phone: "736 166 246" },
];

export const coachContacts = [
  { name: "Jana Florianová", phone: "723 019 752", email: "Florianova.J@seznam.cz" },
  { name: "Radka Suchomelová", phone: "605 724 728", email: "raduza.su@seznam.cz" },
  { name: "Monika Šafaříková", phone: "724 121 564", email: "safarikova.monca@seznam.cz" },
  { name: "Vlasta Lacinová", phone: "737 473 853", email: "vlacinova@seznam.cz" },
  { name: "Daniela Šafaříková", phone: "732 535 598", email: "danielasafarikova@seznam.cz" },
  { name: "Jan Merganc", focus: "Florbal", phone: "604 580 544" },
  { name: "Matyáš Leimer", focus: "1.-4. třída", phone: "736 221 206" },
  { name: "Barbora Pitter", focus: "Fit dance děti", phone: "606 569 122" },
  { name: "Veronika Šlajová", focus: "Gymnastika", phone: "739 315 527" },
  { name: "Matěj Řehák", phone: "603 472 150" },
  { name: "Valerie Forštová", phone: "792 314 319" },
  { name: "Monika Šimperská", phone: "737 764 847" },
];

export const contactDetails = [
  { label: "Název", value: "TJ Sokol Doudleby nad Orlicí", icon: Users },
  { label: "IČ", value: "15040020", icon: ShieldCheck },
  { label: "E-mail", value: "sokoldoudleby@seznam.cz", icon: Mail },
  { label: "Datová schránka", value: "c7sy84v", icon: ShieldCheck },
  { label: "Korespondenční adresa", value: "Na Benátkách 131\nDoudleby nad Orlicí\n517 42", icon: MapPin },
  { label: "Sídlo jednoty", value: "Švermova 528\nDoudleby nad Orlicí\n517 42", icon: MapPin },
];

export const privacyItems = [
  {
    title: "Jaké údaje zpracováváme",
    text: "Jméno, datum narození, kontaktní e-mail, telefon, případné zdravotní omezení a souhlasy nutné pro organizaci akce.",
  },
  {
    title: "Proč údaje potřebujeme",
    text: "Pro přihlášení, komunikaci s účastníky, bezpečnou organizaci akce a splnění základních povinností pořadatele.",
  },
  {
    title: "Jak dlouho je držíme",
    text: "Údaje k akci uchováváme jen po dobu nutnou pro organizaci, vyúčtování a případnou kontrolu.",
  },
  {
    title: "Práva účastníků",
    text: "Účastník nebo zákonný zástupce může požádat o přístup, opravu, výmaz nebo omezení zpracování.",
  },
];

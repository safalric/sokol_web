import {
  CalendarDays,
  Dumbbell,
  Mail,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";

export const memberApplicationUrl = "https://www.ecz-sokol.cz/clen/prihlaska";

export const socialLinks = [
  {
    label: "Facebook TJ Sokol Doudleby nad Orlicí",
    shortLabel: "Facebook",
    href: "https://www.facebook.com/sokoldoudlebyno/",
  },
  {
    label: "Instagram TJ Sokol Doudleby nad Orlicí",
    shortLabel: "Instagram Doudleby",
    href: "https://www.instagram.com/sokoldoudlebyno/",
  },
] as const;

export const navigation = [
  { label: "Úvod", href: "/" },
  { label: "Cvičení / Oddíly", href: "/cviceni" },
  { label: "Akce & Tábory", href: "/akce" },
  { label: "Kalendář", href: "/kalendar" },
  { label: "Kontakty", href: "/kontakt" },
];

export const secondaryNavigation = [
  { label: "O nás", href: "/o-nas" },
  { label: "Fotogalerie", href: "/fotogalerie" },
  { label: "Historie", href: "/historie" },
  { label: "Dotace", href: "/dotace" },
];

export const quickLinks = [
  { label: "Chci cvičit", href: "/cviceni", icon: Dumbbell },
  { label: "Aktuální program", href: "/kalendar", icon: CalendarDays },
  { label: "Přihláška do Sokola", href: "/prihlaska", icon: Users },
];

export const notices = [
  {
    title: "Cvičení v sezoně 2026/2027",
    date: "31. srpna 2026",
    type: "info",
    label: "Informace",
    text: "Vyberte si z nabídky cvičení pro nejmenší děti, školáky, dorost i dospělé. U každého oddílu najdete zveřejněné časy a kontakty.",
    href: "/cviceni",
    linkLabel: "Nabídka cvičení",
  },
  {
    title: "Florbal od třetí třídy",
    date: "31. srpna 2026",
    type: "info",
    label: "Oddíly",
    text: "Pondělí 17:30–18:30 v tělocvičně ZŠ Doudleby nad Orlicí. Cvičení vede Matěj Řehák.",
    href: "/cviceni#florbal",
    linkLabel: "Kontakt a plakát",
  },
  {
    title: "Baby cvičení už začalo",
    date: "6. září 2026",
    type: "info",
    label: "Nejmenší děti",
    text: "Hravý pohyb a smysly pro děti od 1 do 3 let. Pondělí 8:15–9:00 s Danielou Vařekovou.",
    href: "/cviceni#baby-pondeli",
    linkLabel: "Podrobnosti cvičení",
  },
] as const;


export const events = [
  {
    title: "Sokolský výlet do Orlických hor",
    date: "sobota 19. září 2026",
    time: "odjezd 8:30",
    place: "sraz u sokolovny",
    capacity: "30 míst",
    category: "Výlet",
    status: "Ukázkový termín",
    description:
      "Rodinný výlet pro děti, rodiče i členy jednoty. Počítá se s lehčí trasou, společným obědem a návratem odpoledne.",
    registration: true,
    registrationType: "trip" as const,
  },
  {
    title: "Sokolský běh republiky",
    date: "říjen 2026",
    time: "čas bude upřesněn",
    place: "Doudleby nad Orlicí",
    capacity: "otevřeno veřejnosti",
    category: "Komunitní akce",
    status: "Ukázkový obsah",
    description: "Komunitní běh pro všechny věkové kategorie. Připravujeme tratě pro děti i dospělé.",
    registration: false,
    registrationType: null,
  },
  {
    title: "Letní tábor",
    date: "červenec 2027",
    time: "týdenní pobyt",
    place: "místo bude potvrzeno",
    capacity: "40 míst",
    category: "Tábor",
    status: "Ukázkový tábor",
    description: "Ukázka táborové přihlášky. Nejde o vypsaný tábor ani rezervaci místa; skutečný termín, cenu a pokyny musí potvrdit organizátor.",
    registration: true,
    registrationType: "camp" as const,
  },
];

export type SiteEvent = (typeof events)[number];

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

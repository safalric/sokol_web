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
import content from "./site-content.json";

const contentIcons = {
  baby: Baby,
  calendar: CalendarDays,
  dumbbell: Dumbbell,
  goal: Goal,
  mail: Mail,
  "map-pin": MapPin,
  shield: ShieldCheck,
  sparkles: Sparkles,
  users: Users,
} as const;

type ContentIconName = keyof typeof contentIcons;

export const memberApplicationUrl = "https://www.ecz-sokol.cz/clen/prihlaska";

export const socialLinks = [
  {
    label: "Facebook TJ Sokol Doudleby nad Orlicí",
    shortLabel: "Facebook",
    href: "https://www.facebook.com/TJ-Sokol-Doudleby-nad-Orlic%C3%AD-1547925445429424",
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

export const quickLinks = content.quickLinks.map((item) => ({
  ...item,
  icon: contentIcons[item.icon as ContentIconName],
}));

export const notices = content.notices;

export const departments = content.departments.map((department) => ({
  ...department,
  icon: contentIcons[department.icon as ContentIconName],
}));

export const events = content.events.map((event) => ({
  ...event,
  capacity: event.capacityLabel,
  registration: event.registration !== null,
  registrationType: (event.registration?.type ?? null) as "trip" | "camp" | null,
  registrationOpen: event.registration?.open === true,
  registrationUrl: event.registration?.formUrl ?? null,
}));

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

export const leadership = content.leadership;

export const coachContacts = content.coachContacts;

export const contactDetails = content.contactDetails.map((detail) => ({
  ...detail,
  icon: contentIcons[detail.icon as ContentIconName],
}));

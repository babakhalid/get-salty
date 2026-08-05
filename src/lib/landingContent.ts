export type Locale = "en" | "fr" | "de" | "ru";

export type PriceItem = { icon: string; name: string; note?: string; price: string };

type Content = {
  topLocation: string;
  chip: string;
  tagline: string;
  heroText: string;
  viewPrices: string;
  surfPackage: string;
  galleryLocation: string;
  galleryLabels: string[];
  houseKicker: string;
  houseTitle: string;
  houseP1: string;
  houseP2: string;
  houseChips: string[];
  houseNote: string;
  pricesKicker: string;
  pricesTitle: string;
  tabs: { accommodation: string; services: string; transfers: string; activities: string };
  priceLists: {
    accommodation: PriceItem[];
    services: PriceItem[];
    transfers: PriceItem[];
    activities: PriceItem[];
  };
  packageKicker: string;
  packageTitle: string;
  packageSub: string;
  privateTag: string;
  sharedTag: string;
  flexTag: string;
  pkgPrivateName: string;
  pkgPrivateDesc: string;
  pkgPrivatePrice: string;
  pkgSharedName: string;
  pkgSharedDesc: string;
  pkgSharedPrice: string;
  pkgSuffix: string;
  includes: string[];
  bookPackage: string;
  bnbName: string;
  bnbDesc: string;
  bnbPrice: string;
  bnbSuffix: string;
  offerKicker: string;
  offerTitle: string;
  offerText: string;
  whatsapp: string;
  groupsKicker: string;
  groupsTitle: string;
  groupTiers: { pax: string; off: string; note: string }[];
  contactKicker: string;
  contactTitle: string;
  contactText: string;
  labels: { whatsapp: string; email: string; instagram: string; location: string };
  bookYourStay: string;
  bookNow: string;
  footerAddress: string;
  rights: string;
  staffLogin: string;
};

export const CONTACT = {
  whatsapp: "+212 641 749 938",
  whatsappLink: "https://wa.me/212641749938",
  email: "getsaltymorocco@gmail.com",
  instagram: "@getsaltymorocco",
  instagramLink: "https://instagram.com/getsaltymorocco",
  location: "Tamraght, Agadir",
};

export const LANDING: Record<Locale, Content> = {
  en: {
    topLocation: "Tamraght · Morocco",
    chip: "Guesthouse · Tamraght · Morocco",
    tagline: "A guesthouse in Tamraght where you feel at home",
    heroText:
      "Rooted in Moroccan hospitality, Get Salty Morocco is a calm surf house and guesthouse in Tamraght for surfers, digital nomads, creatives and solo travelers.",
    viewPrices: "View Prices",
    surfPackage: "Surf Camp Package",
    galleryLocation: "Tamraght · Agadir · Morocco",
    galleryLabels: ["Bright guest rooms", "Calm interior corners", "Room details", "Warm common area", "Rooftop & co-working"],
    houseKicker: "The House",
    houseTitle: "More than a place to sleep",
    houseP1:
      "Get Salty Morocco is a cozy guesthouse in Tamraght, created for travelers who value comfort, connection and authenticity. The house is calm, clean and intentional. Shared spaces invite you to slow down, work, rest or connect.",
    houseP2:
      "Rooted in Moroccan hospitality, where welcoming people is a way of life, we offer an experience built on trust, warmth and human connection. Art, music and daily life flow naturally through the guesthouse.",
    houseChips: ["🏄 Surf", "🧘 Yoga", "💻 Digital Nomads", "🎨 Creatives", "✈️ Solo Travelers", "🌍 Remote Workers"],
    houseNote:
      "This is not a hotel and not a party hostel. It is a place to arrive, land and feel comfortable.",
    pricesKicker: "Full Price List",
    pricesTitle: "Rooms, Services & Activities",
    tabs: { accommodation: "Accommodation", services: "Services", transfers: "Transfers", activities: "Activities" },
    priceLists: {
      accommodation: [
        { icon: "☀️", name: "Bed & Breakfast", note: "Choose your room · Min 2 nights", price: "from 35€ / night" },
        { icon: "🏄", name: "Surf Camp · Private Room", note: "7 nights all-inclusive", price: "665€ / room" },
        { icon: "🏄", name: "Surf Camp · Shared Room", note: "7 nights all-inclusive · 2–3 people", price: "525€ / person" },
      ],
      services: [
        { icon: "💆", name: "Massage / Hammam", price: "55€" },
        { icon: "👨‍🍳", name: "Cooking Classes", note: "Lunch included", price: "25€ / person" },
        { icon: "🏺", name: "Pottery Class", price: "30€ / person" },
        { icon: "🧺", name: "Laundry", note: "Free for package guests", price: "on request" },
      ],
      transfers: [
        { icon: "✈️", name: "Airport Transfer (Agadir)", note: "Included in surf camp packages", price: "on request" },
        { icon: "🚐", name: "Day Trip Transport", note: "Surf spots & excursions", price: "on request" },
      ],
      activities: [
        { icon: "🏄", name: "Surf Lesson", note: "Transport + equipment included", price: "45€" },
        { icon: "🌊", name: "Surf Guiding", note: "No transport / equipment", price: "40€" },
        { icon: "🧘", name: "Yoga", note: "Min 3 pax · Private class available", price: "12€" },
        { icon: "🛹", name: "Skate Lessons", note: "Min 2 pax · Private available", price: "30€" },
        { icon: "🏔", name: "Paradise Valley", note: "Min 3 pax · Tea included", price: "35€" },
        { icon: "🛒", name: "Souk Tour", note: "Min 3 pax", price: "12€ on-site · 10€ pre-booked" },
        { icon: "🏜", name: "Quads", note: "Transport included · 1–3 pax", price: "40€" },
        { icon: "🐴", name: "Horse Ride", note: "Transport included · 1–3 pax", price: "30€" },
        { icon: "🐪", name: "Camel Ride", note: "Transport included · 1–3 pax", price: "30€" },
        { icon: "💆", name: "Massage / Hammam", price: "55€" },
        { icon: "👨‍🍳", name: "Cooking Classes", note: "Lunch included", price: "25€ / person" },
        { icon: "🏺", name: "Pottery Class", price: "30€ / person" },
      ],
    },
    packageKicker: "Featured Package · 7 Nights All-Inclusive",
    packageTitle: "Choose your package",
    packageSub: "One all-inclusive week of waves, sun and authentic Moroccan living.",
    privateTag: "PRIVATE",
    sharedTag: "SHARED",
    flexTag: "FLEXIBLE",
    pkgPrivateName: "Surf Camp · Private Room",
    pkgPrivateDesc: "Private double room · more privacy",
    pkgPrivatePrice: "€665 / room",
    pkgSharedName: "Surf Camp · Shared Room",
    pkgSharedDesc: "Shared room · 2–3 people · best value",
    pkgSharedPrice: "€525 / person",
    pkgSuffix: "7 nights all-inclusive",
    includes: [
      "🏠 Shared room (2–3 people) · shared bathroom",
      "🥐 Healthy breakfast every day",
      "✈️ Airport transfer (Agadir) incl.",
      "🌊 4 surf lessons · 2h · instructor + gear",
      "🍽 5 Moroccan dinners + 1 BBQ night",
      "🧺 Free laundry · housekeeping ×2/week",
      "💻 200 Mb WiFi · co-working · rooftop",
      "✨ Optional: Sandboarding or Paradise Valley",
    ],
    bookPackage: "Book this package →",
    bnbName: "Bed & Breakfast",
    bnbDesc: "Choose your room · Min 2 nights",
    bnbPrice: "€35 / night",
    bnbSuffix: "from · breakfast included",
    offerKicker: "✨ Special offer",
    offerTitle: "Staying 5 nights or more?",
    offerText: "Get in touch — we'll put together a custom deal just for you.",
    whatsapp: "WhatsApp",
    groupsKicker: "Group Bookings",
    groupsTitle: "Special Group Rates",
    groupTiers: [
      { pax: "8–12", off: "4%", note: "No exclusivity · No free stays" },
      { pax: "11–20", off: "8%", note: "Partial exclusivity · 1 host stays free" },
      { pax: "21+", off: "11%+", note: "Custom quote · May require full buyout · 2 hosts free" },
    ],
    contactKicker: "Get in Touch",
    contactTitle: "Ready to book your stay?",
    contactText:
      "Reach out via WhatsApp or email. We'll get back to you personally and help you plan the perfect stay.",
    labels: { whatsapp: "WhatsApp", email: "Email", instagram: "Instagram", location: "Location" },
    bookYourStay: "Book Your Stay",
    bookNow: "Book Now",
    footerAddress: "📍 Tamraght · Agadir · Morocco",
    rights: "© 2025 Get Salty Morocco · All rights reserved",
    staffLogin: "Staff sign in",
  },

  fr: {
    topLocation: "Tamraght · Maroc",
    chip: "Maison d'hôtes · Tamraght · Maroc",
    tagline: "Une maison d'hôtes à Tamraght où l'on se sent chez soi",
    heroText:
      "Ancrée dans l'hospitalité marocaine, Get Salty Morocco est une surf house et maison d'hôtes paisible à Tamraght, pour surfeurs, nomades digitaux, créatifs et voyageurs solo.",
    viewPrices: "Voir les tarifs",
    surfPackage: "Forfait Surf Camp",
    galleryLocation: "Tamraght · Agadir · Maroc",
    galleryLabels: ["Chambres lumineuses", "Coins paisibles", "Détails des chambres", "Espace commun chaleureux", "Rooftop & co-working"],
    houseKicker: "La Maison",
    houseTitle: "Bien plus qu'un endroit où dormir",
    houseP1:
      "Get Salty Morocco est une maison d'hôtes chaleureuse à Tamraght, pensée pour les voyageurs qui recherchent confort, connexion et authenticité. La maison est calme, propre et pensée dans les moindres détails. Les espaces partagés invitent à ralentir, travailler, se reposer ou se rencontrer.",
    houseP2:
      "Ancrés dans l'hospitalité marocaine, où accueillir est un art de vivre, nous offrons une expérience fondée sur la confiance, la chaleur et le lien humain. L'art, la musique et la vie quotidienne circulent naturellement dans la maison.",
    houseChips: ["🏄 Surf", "🧘 Yoga", "💻 Nomades digitaux", "🎨 Créatifs", "✈️ Voyageurs solo", "🌍 Télétravailleurs"],
    houseNote:
      "Ce n'est ni un hôtel ni une auberge festive. C'est un lieu où arriver, se poser et se sentir bien.",
    pricesKicker: "Tarifs complets",
    pricesTitle: "Chambres, services & activités",
    tabs: { accommodation: "Hébergement", services: "Services", transfers: "Transferts", activities: "Activités" },
    priceLists: {
      accommodation: [
        { icon: "☀️", name: "Bed & Breakfast", note: "Chambre au choix · Min 2 nuits", price: "dès 35€ / nuit" },
        { icon: "🏄", name: "Surf Camp · Chambre privée", note: "7 nuits tout inclus", price: "665€ / chambre" },
        { icon: "🏄", name: "Surf Camp · Chambre partagée", note: "7 nuits tout inclus · 2–3 pers.", price: "525€ / pers." },
      ],
      services: [
        { icon: "💆", name: "Massage / Hammam", price: "55€" },
        { icon: "👨‍🍳", name: "Cours de cuisine", note: "Déjeuner inclus", price: "25€ / pers." },
        { icon: "🏺", name: "Atelier poterie", price: "30€ / pers." },
        { icon: "🧺", name: "Laverie", note: "Gratuite pour les forfaits", price: "sur demande" },
      ],
      transfers: [
        { icon: "✈️", name: "Transfert aéroport (Agadir)", note: "Inclus dans les forfaits surf camp", price: "sur demande" },
        { icon: "🚐", name: "Transport excursions", note: "Spots de surf & sorties", price: "sur demande" },
      ],
      activities: [
        { icon: "🏄", name: "Cours de surf", note: "Transport + matériel inclus", price: "45€" },
        { icon: "🌊", name: "Surf guiding", note: "Sans transport / matériel", price: "40€" },
        { icon: "🧘", name: "Yoga", note: "Min 3 pers. · Cours privé possible", price: "12€" },
        { icon: "🛹", name: "Cours de skate", note: "Min 2 pers. · Privé possible", price: "30€" },
        { icon: "🏔", name: "Paradise Valley", note: "Min 3 pers. · Thé inclus", price: "35€" },
        { icon: "🛒", name: "Tour du souk", note: "Min 3 pers.", price: "12€ sur place · 10€ à l'avance" },
        { icon: "🏜", name: "Quads", note: "Transport inclus · 1–3 pers.", price: "40€" },
        { icon: "🐴", name: "Balade à cheval", note: "Transport inclus · 1–3 pers.", price: "30€" },
        { icon: "🐪", name: "Balade à dos de chameau", note: "Transport inclus · 1–3 pers.", price: "30€" },
        { icon: "💆", name: "Massage / Hammam", price: "55€" },
        { icon: "👨‍🍳", name: "Cours de cuisine", note: "Déjeuner inclus", price: "25€ / pers." },
        { icon: "🏺", name: "Atelier poterie", price: "30€ / pers." },
      ],
    },
    packageKicker: "Forfait phare · 7 nuits tout inclus",
    packageTitle: "Choisissez votre forfait",
    packageSub: "Une semaine tout inclus : vagues, soleil et vie marocaine authentique.",
    privateTag: "PRIVÉ",
    sharedTag: "PARTAGÉ",
    flexTag: "FLEXIBLE",
    pkgPrivateName: "Surf Camp · Chambre privée",
    pkgPrivateDesc: "Chambre double privée · plus d'intimité",
    pkgPrivatePrice: "665€ / chambre",
    pkgSharedName: "Surf Camp · Chambre partagée",
    pkgSharedDesc: "Chambre partagée · 2–3 pers. · meilleur prix",
    pkgSharedPrice: "525€ / pers.",
    pkgSuffix: "7 nuits tout inclus",
    includes: [
      "🏠 Chambre partagée (2–3 pers.) · salle de bain commune",
      "🥐 Petit-déjeuner sain chaque jour",
      "✈️ Transfert aéroport (Agadir) inclus",
      "🌊 4 cours de surf · 2h · moniteur + matériel",
      "🍽 5 dîners marocains + 1 soirée BBQ",
      "🧺 Laverie gratuite · ménage ×2/semaine",
      "💻 WiFi 200 Mb · co-working · rooftop",
      "✨ En option : sandboard ou Paradise Valley",
    ],
    bookPackage: "Réserver ce forfait →",
    bnbName: "Bed & Breakfast",
    bnbDesc: "Chambre au choix · Min 2 nuits",
    bnbPrice: "35€ / nuit",
    bnbSuffix: "dès · petit-déjeuner inclus",
    offerKicker: "✨ Offre spéciale",
    offerTitle: "Vous restez 5 nuits ou plus ?",
    offerText: "Écrivez-nous — nous préparons une offre sur mesure rien que pour vous.",
    whatsapp: "WhatsApp",
    groupsKicker: "Réservations de groupe",
    groupsTitle: "Tarifs spéciaux groupes",
    groupTiers: [
      { pax: "8–12", off: "4%", note: "Sans exclusivité · Pas de séjour offert" },
      { pax: "11–20", off: "8%", note: "Exclusivité partielle · 1 accompagnateur offert" },
      { pax: "21+", off: "11%+", note: "Devis sur mesure · Privatisation possible · 2 accompagnateurs offerts" },
    ],
    contactKicker: "Contact",
    contactTitle: "Prêt à réserver votre séjour ?",
    contactText:
      "Contactez-nous par WhatsApp ou email. Nous vous répondons personnellement pour organiser le séjour parfait.",
    labels: { whatsapp: "WhatsApp", email: "Email", instagram: "Instagram", location: "Adresse" },
    bookYourStay: "Réservez votre séjour",
    bookNow: "Réserver",
    footerAddress: "📍 Tamraght · Agadir · Maroc",
    rights: "© 2025 Get Salty Morocco · Tous droits réservés",
    staffLogin: "Espace équipe",
  },

  de: {
    topLocation: "Tamraght · Marokko",
    chip: "Gästehaus · Tamraght · Marokko",
    tagline: "Ein Gästehaus in Tamraght, in dem du dich zuhause fühlst",
    heroText:
      "Verwurzelt in marokkanischer Gastfreundschaft ist Get Salty Morocco ein ruhiges Surfhaus und Gästehaus in Tamraght — für Surfer, digitale Nomaden, Kreative und Alleinreisende.",
    viewPrices: "Preise ansehen",
    surfPackage: "Surfcamp-Paket",
    galleryLocation: "Tamraght · Agadir · Marokko",
    galleryLabels: ["Helle Gästezimmer", "Ruhige Ecken", "Zimmerdetails", "Gemütlicher Gemeinschaftsraum", "Rooftop & Co-Working"],
    houseKicker: "Das Haus",
    houseTitle: "Mehr als nur ein Ort zum Schlafen",
    houseP1:
      "Get Salty Morocco ist ein gemütliches Gästehaus in Tamraght für Reisende, die Komfort, Verbundenheit und Authentizität schätzen. Das Haus ist ruhig, sauber und mit Bedacht gestaltet. Die Gemeinschaftsräume laden zum Entschleunigen, Arbeiten, Ausruhen und Kennenlernen ein.",
    houseP2:
      "Verwurzelt in marokkanischer Gastfreundschaft, wo Gäste zu empfangen eine Lebensart ist, bieten wir ein Erlebnis aus Vertrauen, Wärme und echter Begegnung. Kunst, Musik und Alltag fließen ganz natürlich durch das Haus.",
    houseChips: ["🏄 Surfen", "🧘 Yoga", "💻 Digitale Nomaden", "🎨 Kreative", "✈️ Alleinreisende", "🌍 Remote Worker"],
    houseNote:
      "Das ist kein Hotel und kein Party-Hostel. Es ist ein Ort zum Ankommen, Landen und Wohlfühlen.",
    pricesKicker: "Komplette Preisliste",
    pricesTitle: "Zimmer, Services & Aktivitäten",
    tabs: { accommodation: "Unterkunft", services: "Services", transfers: "Transfers", activities: "Aktivitäten" },
    priceLists: {
      accommodation: [
        { icon: "☀️", name: "Bed & Breakfast", note: "Zimmer nach Wahl · Min. 2 Nächte", price: "ab 35€ / Nacht" },
        { icon: "🏄", name: "Surfcamp · Privatzimmer", note: "7 Nächte all-inclusive", price: "665€ / Zimmer" },
        { icon: "🏄", name: "Surfcamp · geteiltes Zimmer", note: "7 Nächte all-inclusive · 2–3 Pers.", price: "525€ / Pers." },
      ],
      services: [
        { icon: "💆", name: "Massage / Hammam", price: "55€" },
        { icon: "👨‍🍳", name: "Kochkurse", note: "Mittagessen inklusive", price: "25€ / Pers." },
        { icon: "🏺", name: "Töpferkurs", price: "30€ / Pers." },
        { icon: "🧺", name: "Wäscheservice", note: "Für Paketgäste kostenlos", price: "auf Anfrage" },
      ],
      transfers: [
        { icon: "✈️", name: "Flughafentransfer (Agadir)", note: "In Surfcamp-Paketen enthalten", price: "auf Anfrage" },
        { icon: "🚐", name: "Ausflugstransport", note: "Surfspots & Touren", price: "auf Anfrage" },
      ],
      activities: [
        { icon: "🏄", name: "Surfkurs", note: "Transport + Material inklusive", price: "45€" },
        { icon: "🌊", name: "Surf-Guiding", note: "Ohne Transport / Material", price: "40€" },
        { icon: "🧘", name: "Yoga", note: "Min. 3 Pers. · Privatstunde möglich", price: "12€" },
        { icon: "🛹", name: "Skatekurse", note: "Min. 2 Pers. · Privat möglich", price: "30€" },
        { icon: "🏔", name: "Paradise Valley", note: "Min. 3 Pers. · Tee inklusive", price: "35€" },
        { icon: "🛒", name: "Souk-Tour", note: "Min. 3 Pers.", price: "12€ vor Ort · 10€ vorgebucht" },
        { icon: "🏜", name: "Quads", note: "Transport inklusive · 1–3 Pers.", price: "40€" },
        { icon: "🐴", name: "Reitausflug", note: "Transport inklusive · 1–3 Pers.", price: "30€" },
        { icon: "🐪", name: "Kamelritt", note: "Transport inklusive · 1–3 Pers.", price: "30€" },
        { icon: "💆", name: "Massage / Hammam", price: "55€" },
        { icon: "👨‍🍳", name: "Kochkurse", note: "Mittagessen inklusive", price: "25€ / Pers." },
        { icon: "🏺", name: "Töpferkurs", price: "30€ / Pers." },
      ],
    },
    packageKicker: "Top-Paket · 7 Nächte all-inclusive",
    packageTitle: "Wähle dein Paket",
    packageSub: "Eine All-inclusive-Woche voller Wellen, Sonne und echtem marokkanischem Leben.",
    privateTag: "PRIVAT",
    sharedTag: "GETEILT",
    flexTag: "FLEXIBEL",
    pkgPrivateName: "Surfcamp · Privatzimmer",
    pkgPrivateDesc: "Privates Doppelzimmer · mehr Privatsphäre",
    pkgPrivatePrice: "665€ / Zimmer",
    pkgSharedName: "Surfcamp · geteiltes Zimmer",
    pkgSharedDesc: "Geteiltes Zimmer · 2–3 Personen · bester Preis",
    pkgSharedPrice: "525€ / Person",
    pkgSuffix: "7 Nächte all-inclusive",
    includes: [
      "🏠 Geteiltes Zimmer (2–3 Pers.) · Gemeinschaftsbad",
      "🥐 Jeden Tag gesundes Frühstück",
      "✈️ Flughafentransfer (Agadir) inkl.",
      "🌊 4 Surfkurse · 2h · Lehrer + Ausrüstung",
      "🍽 5 marokkanische Abendessen + 1 BBQ-Abend",
      "🧺 Kostenlose Wäsche · Zimmerservice ×2/Woche",
      "💻 200 Mb WLAN · Co-Working · Rooftop",
      "✨ Optional: Sandboarding oder Paradise Valley",
    ],
    bookPackage: "Dieses Paket buchen →",
    bnbName: "Bed & Breakfast",
    bnbDesc: "Zimmer nach Wahl · Min. 2 Nächte",
    bnbPrice: "35€ / Nacht",
    bnbSuffix: "ab · Frühstück inklusive",
    offerKicker: "✨ Sonderangebot",
    offerTitle: "5 Nächte oder länger?",
    offerText: "Melde dich — wir schnüren dir ein individuelles Angebot.",
    whatsapp: "WhatsApp",
    groupsKicker: "Gruppenbuchungen",
    groupsTitle: "Spezielle Gruppentarife",
    groupTiers: [
      { pax: "8–12", off: "4%", note: "Keine Exklusivität · Keine Freiplätze" },
      { pax: "11–20", off: "8%", note: "Teilexklusivität · 1 Begleiter gratis" },
      { pax: "21+", off: "11%+", note: "Individuelles Angebot · ggf. Komplettbuchung · 2 Begleiter gratis" },
    ],
    contactKicker: "Kontakt",
    contactTitle: "Bereit, deinen Aufenthalt zu buchen?",
    contactText:
      "Schreib uns per WhatsApp oder E-Mail. Wir antworten persönlich und planen mit dir den perfekten Aufenthalt.",
    labels: { whatsapp: "WhatsApp", email: "E-Mail", instagram: "Instagram", location: "Lage" },
    bookYourStay: "Jetzt buchen",
    bookNow: "Buchen",
    footerAddress: "📍 Tamraght · Agadir · Marokko",
    rights: "© 2025 Get Salty Morocco · Alle Rechte vorbehalten",
    staffLogin: "Team-Login",
  },

  ru: {
    topLocation: "Тамрагт · Марокко",
    chip: "Гостевой дом · Тамрагт · Марокко",
    tagline: "Гостевой дом в Тамрагте, где чувствуешь себя как дома",
    heroText:
      "Get Salty Morocco — это спокойный сёрф-хаус и гостевой дом в Тамрагте, выросший из марокканского гостеприимства. Для сёрферов, цифровых кочевников, творческих людей и путешественников-одиночек.",
    viewPrices: "Смотреть цены",
    surfPackage: "Сёрф-кемп пакет",
    galleryLocation: "Тамрагт · Агадир · Марокко",
    galleryLabels: ["Светлые комнаты", "Тихие уголки", "Детали интерьера", "Уютная гостиная", "Крыша и коворкинг"],
    houseKicker: "Дом",
    houseTitle: "Больше, чем место для сна",
    houseP1:
      "Get Salty Morocco — уютный гостевой дом в Тамрагте для путешественников, которые ценят комфорт, общение и аутентичность. Дом спокойный, чистый и продуманный. Общие пространства приглашают замедлиться, поработать, отдохнуть или пообщаться.",
    houseP2:
      "Мы выросли из марокканского гостеприимства, где принимать гостей — образ жизни. Наш опыт построен на доверии, тепле и живом общении. Искусство, музыка и повседневная жизнь естественно наполняют дом.",
    houseChips: ["🏄 Сёрфинг", "🧘 Йога", "💻 Цифровые кочевники", "🎨 Творческие люди", "✈️ Соло-путешественники", "🌍 Удалённая работа"],
    houseNote:
      "Это не отель и не тусовочный хостел. Это место, куда приезжаешь, выдыхаешь и чувствуешь себя комфортно.",
    pricesKicker: "Полный прайс-лист",
    pricesTitle: "Комнаты, услуги и активности",
    tabs: { accommodation: "Проживание", services: "Услуги", transfers: "Трансферы", activities: "Активности" },
    priceLists: {
      accommodation: [
        { icon: "☀️", name: "Bed & Breakfast", note: "Комната на выбор · от 2 ночей", price: "от 35€ / ночь" },
        { icon: "🏄", name: "Сёрф-кемп · отдельная комната", note: "7 ночей всё включено", price: "665€ / комната" },
        { icon: "🏄", name: "Сёрф-кемп · общая комната", note: "7 ночей всё включено · 2–3 чел.", price: "525€ / чел." },
      ],
      services: [
        { icon: "💆", name: "Массаж / хаммам", price: "55€" },
        { icon: "👨‍🍳", name: "Кулинарные мастер-классы", note: "Обед включён", price: "25€ / чел." },
        { icon: "🏺", name: "Урок гончарного дела", price: "30€ / чел." },
        { icon: "🧺", name: "Прачечная", note: "Бесплатно для пакетов", price: "по запросу" },
      ],
      transfers: [
        { icon: "✈️", name: "Трансфер из аэропорта (Агадир)", note: "Включён в сёрф-кемп пакеты", price: "по запросу" },
        { icon: "🚐", name: "Транспорт для экскурсий", note: "Сёрф-споты и поездки", price: "по запросу" },
      ],
      activities: [
        { icon: "🏄", name: "Урок сёрфинга", note: "Транспорт + снаряжение включены", price: "45€" },
        { icon: "🌊", name: "Сёрф-гайдинг", note: "Без транспорта / снаряжения", price: "40€" },
        { icon: "🧘", name: "Йога", note: "От 3 чел. · Возможно индивидуально", price: "12€" },
        { icon: "🛹", name: "Уроки скейта", note: "От 2 чел. · Возможно индивидуально", price: "30€" },
        { icon: "🏔", name: "Paradise Valley", note: "От 3 чел. · Чай включён", price: "35€" },
        { icon: "🛒", name: "Тур по суку", note: "От 3 чел.", price: "12€ на месте · 10€ заранее" },
        { icon: "🏜", name: "Квадроциклы", note: "Транспорт включён · 1–3 чел.", price: "40€" },
        { icon: "🐴", name: "Прогулка на лошадях", note: "Транспорт включён · 1–3 чел.", price: "30€" },
        { icon: "🐪", name: "Прогулка на верблюдах", note: "Транспорт включён · 1–3 чел.", price: "30€" },
        { icon: "💆", name: "Массаж / хаммам", price: "55€" },
        { icon: "👨‍🍳", name: "Кулинарные мастер-классы", note: "Обед включён", price: "25€ / чел." },
        { icon: "🏺", name: "Урок гончарного дела", price: "30€ / чел." },
      ],
    },
    packageKicker: "Главный пакет · 7 ночей всё включено",
    packageTitle: "Выберите свой пакет",
    packageSub: "Неделя всё включено: волны, солнце и настоящая марокканская жизнь.",
    privateTag: "ОТДЕЛЬНАЯ",
    sharedTag: "ОБЩАЯ",
    flexTag: "ГИБКО",
    pkgPrivateName: "Сёрф-кемп · отдельная комната",
    pkgPrivateDesc: "Отдельная двухместная комната · больше приватности",
    pkgPrivatePrice: "665€ / комната",
    pkgSharedName: "Сёрф-кемп · общая комната",
    pkgSharedDesc: "Общая комната · 2–3 человека · лучшая цена",
    pkgSharedPrice: "525€ / чел.",
    pkgSuffix: "7 ночей всё включено",
    includes: [
      "🏠 Общая комната (2–3 чел.) · общая ванная",
      "🥐 Полезный завтрак каждый день",
      "✈️ Трансфер из аэропорта (Агадир) включён",
      "🌊 4 урока сёрфинга · 2ч · инструктор + снаряжение",
      "🍽 5 марокканских ужинов + 1 вечер BBQ",
      "🧺 Бесплатная стирка · уборка ×2/неделю",
      "💻 WiFi 200 Мб · коворкинг · терраса на крыше",
      "✨ Опционально: сэндбординг или Paradise Valley",
    ],
    bookPackage: "Забронировать пакет →",
    bnbName: "Bed & Breakfast",
    bnbDesc: "Комната на выбор · от 2 ночей",
    bnbPrice: "35€ / ночь",
    bnbSuffix: "от · завтрак включён",
    offerKicker: "✨ Спецпредложение",
    offerTitle: "Остаётесь на 5 ночей и больше?",
    offerText: "Напишите нам — соберём индивидуальное предложение специально для вас.",
    whatsapp: "WhatsApp",
    groupsKicker: "Групповые брони",
    groupsTitle: "Специальные цены для групп",
    groupTiers: [
      { pax: "8–12", off: "4%", note: "Без эксклюзива · Без бесплатных мест" },
      { pax: "11–20", off: "8%", note: "Частичный эксклюзив · 1 сопровождающий бесплатно" },
      { pax: "21+", off: "11%+", note: "Индивидуальный расчёт · Возможен полный выкуп · 2 сопровождающих бесплатно" },
    ],
    contactKicker: "Связаться",
    contactTitle: "Готовы забронировать?",
    contactText:
      "Напишите нам в WhatsApp или на почту. Ответим лично и поможем спланировать идеальное пребывание.",
    labels: { whatsapp: "WhatsApp", email: "Почта", instagram: "Instagram", location: "Адрес" },
    bookYourStay: "Забронировать",
    bookNow: "Бронировать",
    footerAddress: "📍 Тамрагт · Агадир · Марокко",
    rights: "© 2025 Get Salty Morocco · Все права защищены",
    staffLogin: "Вход для команды",
  },
};

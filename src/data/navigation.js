export const MAIN_NAV_CATEGORIES = [
  {
    name: "Led Avizeler",
    slug: "led-avizeler",
    href: "/kategori/led-avizeler",
    children: [
      {
        name: "Kumandalı Led Avizeler",
        slug: "kumandali-led-avizeler",
        href: "/kategori/kumandali-led-avizeler",
      },
      {
        name: "İşletme Ofis Led Avizeler",
        slug: "ofis-avize-ve-led-aydinlatma-modelleri",
        href: "/kategori/ofis-avize-ve-led-aydinlatma-modelleri",
      },
      {
        name: "Tavana Sıfır Led Avize",
        slug: "tavana-sifir-led-avize",
        href: "/kategori/tavana-sifir-led-avize",
      },
      {
        name: "Modern Led Avize",
        slug: "modern-led-avize",
        href: "/kategori/modern-led-avize",
      },
      {
        name: "Dekoratif Led Avize",
        slug: "dekoratif-led-avize",
        href: "/kategori/dekoratif-led-avize",
      },
      {
        name: "Led Salon Avize",
        slug: "led-salon-avize",
        href: "/kategori/led-salon-avize",
      },
      {
        name: "Mutfak Led Avize",
        slug: "mutfak-led-avize",
        href: "/kategori/mutfak-led-avize",
      },
      {
        name: "Sarkıt Led Avize",
        slug: "sarkit-led-avize",
        href: "/kategori/sarkit-led-avize",
      },
      {
        name: "3 Renkli Led Avize",
        slug: "3-renkli-led-avize",
        href: "/kategori/3-renkli-led-avize",
      },
    ],
  },
  {
    name: "Plafonyer",
    slug: "plafonyer-led-avize",
    href: "/kategori/plafonyer-led-avize",
    children: [],
  },
  {
    name: "Lineer Aydınlatma",
    slug: "lineer-aydinlatma",
    href: "/kategori/lineer-aydinlatma",
    children: [
      {
        name: "Sarkıt Lineer Aydınlatma",
        slug: "sarkit-lineer-aydinlatma",
        href: "/kategori/sarkit-lineer-aydinlatma",
      },
      {
        name: "Sıva Üstü Lineer Aydınlatma",
        slug: "siva-ustu-lineer-aydinlatma",
        href: "/kategori/siva-ustu-lineer-aydinlatma",
      },
    ],
  },
  {
    name: "Tekli Sarkıt Avizeler",
    slug: "sarkit-avizeler",
    href: "/kategori/sarkit-avizeler",
    children: [],
  },
  {
    name: "Aplikler",
    slug: "aplikler",
    href: "/kategori/aplikler",
    children: [],
  },
  {
    name: "Masa Lambaları",
    slug: "masa-lambalari",
    href: "/kategori/masa-lambalari",
    children: [],
  },
];

export const FLAT_MAIN_CATEGORIES = MAIN_NAV_CATEGORIES.flatMap((category) => [
  {
    name: category.name,
    slug: category.slug,
    href: category.href,
  },
  ...category.children.map((child) => ({
    name: child.name,
    slug: child.slug,
    href: child.href,
  })),
]);

export const SHOWROOM_CONTACT = {
  address:
    "Uğur Mumcu Mahallesi 2274. Sokak No:12 D:1 Sultançiftliği Sultangazi/İSTANBUL",
  phones: [
    { display: "0532 499 12 28", href: "tel:05324991228" },
    { display: "0212 931 28 07", href: "tel:02129312807" },
  ],
  mapUrl: "https://maps.app.goo.gl/tz4JV4jjvFkvqiXf9",
  mapLabel: "Showroom & İmalat Google Harita Konumu",
};

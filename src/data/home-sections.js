export const HOME_SHOWCASE_SECTIONS = [
  {
    key: "plafonyer",
    categorySlug: "plafonyer-led-avize",
    title: "Plafonyer Led Avize Modelleri",
    intro:
      "Plafonyer led avize modern sarkıt led avize modellerimiz sizin için sürekli güncellenmektedir.",
    ctaLabel: "Diğer Led Avize Ürünleri",
    limit: 8,
  },
  {
    key: "lineer",
    categorySlug: "lineer-aydinlatma",
    title: "Sarkıt ve Sıva Üstü Lineer Led Armatürler",
    intro:
      "Modern ofis ve mimari aydınlatma projeleriniz için sarkıt ve sıva üstü lineer led armatür modellerimiz sizin için sürekli güncellenmektedir.",
    ctaLabel: "Diğer Lineer Ürünleri",
    limit: 8,
  },
  {
    key: "aplik",
    categorySlug: "aplikler",
    title: "Led Aplik Lamba Ürünleri",
    intro:
      "Telefon tutucu özellikli başucu led aydınlatma aplik lamba modelleri sadece Lavabo Aydınlatma'da!",
    ctaLabel: "Diğer Aplik Ürünleri",
    limit: 4,
  },
];

export const LEGACY_SHOWCASE_SLUGS = HOME_SHOWCASE_SECTIONS.map(
  (section) => section.categorySlug
);

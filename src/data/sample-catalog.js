import { defaultSiteSettings } from "./catalog-validation.js";

const SAMPLE_VERSION = "2026-01-01T00:00:00.000Z";

function picsum(seed) {
  return `https://picsum.photos/seed/${seed}/800/800`;
}

export function createSampleCatalog() {
  return {
    version: SAMPLE_VERSION,
    siteSettings: {
      ...defaultSiteSettings(),
      siteName: "Katalog Sitesi",
      tagline: "Ürünlerinizi sergilemek için hazır katalog şablonu.",
      metaTitle: "Katalog Sitesi",
      metaDescription:
        "Örnek kategori, nitelik ve ürünlerle hazırlanmış katalog şablonu.",
      contact: {
        address:
          "Uğur Mumcu Mahallesi 2274. Sokak No:12 D:1 Sultançiftliği Sultangazi/İSTANBUL",
        phones: [
          { display: "0532 499 12 28", href: "tel:05324991228" },
          { display: "0212 931 28 07", href: "tel:02129312807" },
        ],
        mapUrl: "https://maps.app.goo.gl/tz4JV4jjvFkvqiXf9",
        mapLabel: "Showroom & İmalat Google Harita Konumu",
      },
      navCategoryIds: [1, 5, 6],
      showcaseSections: [
        {
          key: "ornek-koleksiyon",
          categorySlug: "ornek-koleksiyon",
          title: "Örnek Koleksiyon",
          intro:
            "Katalog şablonunu incelemeniz için hazırlanmış örnek ürünler.",
          ctaLabel: "Tümünü gör",
          limit: 8,
        },
      ],
    },
    categories: [
      {
        id: 1,
        slug: "ornek-koleksiyon",
        name: "Örnek Koleksiyon",
        parentId: null,
        count: 3,
        descriptionHtml:
          "<p>Katalog şablonunu incelemeniz için oluşturulmuş örnek ürün koleksiyonu.</p>",
      },
      {
        id: 2,
        slug: "klasik-seri",
        name: "Klasik Seri",
        parentId: 1,
        count: 1,
        descriptionHtml: "<p>Klasik seri örnek kategorisi.</p>",
      },
      {
        id: 3,
        slug: "minimalist-seri",
        name: "Minimalist Seri",
        parentId: 1,
        count: 1,
        descriptionHtml: "<p>Minimalist seri örnek kategorisi.</p>",
      },
      {
        id: 4,
        slug: "premium-seri",
        name: "Premium Seri",
        parentId: 1,
        count: 1,
        descriptionHtml: "<p>Premium seri örnek kategorisi.</p>",
      },
      {
        id: 5,
        slug: "yeni-urunler",
        name: "Yeni Ürünler",
        parentId: null,
        count: 3,
        descriptionHtml:
          "<p>Başlığa eklenen örnek yeni ürünler kategorisi.</p>",
      },
      {
        id: 6,
        slug: "one-cikanlar",
        name: "Öne Çıkanlar",
        parentId: null,
        count: 1,
        descriptionHtml:
          "<p>Başlığa eklenen örnek öne çıkanlar kategorisi.</p>",
      },
    ],
    attributes: [
      {
        slug: "renk",
        name: "Renk",
        terms: [
          { slug: "siyah", name: "Siyah", swatch: "#18181b" },
          { slug: "beyaz", name: "Beyaz", swatch: "#ffffff" },
          { slug: "antrasit", name: "Antrasit", swatch: "#4b5563" },
          { slug: "bej", name: "Bej", swatch: "#d6c7b2" },
        ],
      },
      {
        slug: "boyut",
        name: "Boyut",
        terms: [
          { slug: "kucuk", name: "Küçük (S)" },
          { slug: "orta", name: "Orta (M)" },
          { slug: "buyuk", name: "Büyük (L)" },
        ],
      },
      {
        slug: "malzeme",
        name: "Malzeme",
        terms: [
          { slug: "ahsap", name: "Ahşap" },
          { slug: "metal", name: "Metal" },
          { slug: "cam", name: "Cam" },
        ],
      },
    ],
    products: [
      {
        id: 101,
        slug: "klasik-tasarim-urun-01",
        name: "Klasik Tasarım Ürün 01",
        sku: "ORN-001",
        inStock: true,
        categoryIds: [1, 2, 5, 6],
        priceMin: 1250,
        priceMax: 1550,
        highlights: [
          "Dört varyantlı örnek ürün",
          "Renk ve boyut seçenekleri",
          "Metal gövde",
        ],
        descriptionHtml:
          "<p>Klasik tasarım örnek ürün, katalog şablonundaki varyant, fiyat aralığı ve stok davranışını göstermek için eklenmiştir.</p>",
        specs: {
          Menşei: "Örnek",
          Koleksiyon: "Klasik",
        },
        images: [picsum("catalog-sample-1a"), picsum("catalog-sample-1b")],
        attributes: {
          renk: ["siyah", "beyaz"],
          boyut: ["orta", "buyuk"],
          malzeme: ["metal"],
        },
        variants: [
          {
            id: 1001,
            sku: "ORN-001-SIYAH-ORTA",
            price: 1250,
            regularPrice: 1250,
            inStock: true,
            terms: { renk: "siyah", boyut: "orta", malzeme: "metal" },
          },
          {
            id: 1002,
            sku: "ORN-001-SIYAH-BUYUK",
            price: 1400,
            regularPrice: 1400,
            inStock: true,
            terms: { renk: "siyah", boyut: "buyuk", malzeme: "metal" },
          },
          {
            id: 1003,
            sku: "ORN-001-BEYAZ-ORTA",
            price: 1450,
            regularPrice: 1450,
            inStock: true,
            terms: { renk: "beyaz", boyut: "orta", malzeme: "metal" },
          },
          {
            id: 1004,
            sku: "ORN-001-BEYAZ-BUYUK",
            price: 1550,
            regularPrice: 1550,
            inStock: true,
            terms: { renk: "beyaz", boyut: "buyuk", malzeme: "metal" },
          },
        ],
        createdAt: "2026-01-03T10:00:00.000Z",
      },
      {
        id: 102,
        slug: "minimalist-seri-urun-02",
        name: "Minimalist Seri Ürün 02",
        sku: "ORN-002",
        inStock: true,
        categoryIds: [1, 3, 5],
        priceMin: 950,
        priceMax: 1100,
        highlights: ["İki varyantlı örnek ürün", "Ahşap malzeme"],
        descriptionHtml:
          "<p>Minimalist seri örnek ürün, daha sade bir varyant kombinasyonunu göstermek için eklenmiştir.</p>",
        specs: {
          Menşei: "Örnek",
          Koleksiyon: "Minimalist",
        },
        images: [picsum("catalog-sample-2a"), picsum("catalog-sample-2b")],
        attributes: {
          renk: ["antrasit", "bej"],
          boyut: ["kucuk", "orta"],
          malzeme: ["ahsap"],
        },
        variants: [
          {
            id: 1005,
            sku: "ORN-002-ANTRASIT-KUCUK",
            price: 950,
            regularPrice: 950,
            inStock: true,
            terms: { renk: "antrasit", boyut: "kucuk", malzeme: "ahsap" },
          },
          {
            id: 1006,
            sku: "ORN-002-BEJ-ORTA",
            price: 1100,
            regularPrice: 1100,
            inStock: true,
            terms: { renk: "bej", boyut: "orta", malzeme: "ahsap" },
          },
        ],
        createdAt: "2026-01-02T10:00:00.000Z",
      },
      {
        id: 103,
        slug: "premium-koleksiyon-urun-03",
        name: "Premium Koleksiyon Ürün 03",
        sku: "ORN-003",
        inStock: false,
        categoryIds: [1, 4, 5],
        priceMin: 2100,
        priceMax: 2100,
        highlights: ["Tek fiyatlı basit ürün", "Stokta olmayan örnek"],
        descriptionHtml:
          "<p>Premium koleksiyon örnek ürün, varyantsız fiyat ve stokta yok rozetini göstermek için eklenmiştir.</p>",
        specs: {
          Menşei: "Örnek",
          Koleksiyon: "Premium",
        },
        images: [picsum("catalog-sample-3a")],
        attributes: {
          renk: ["siyah"],
          malzeme: ["cam"],
        },
        variants: [],
        createdAt: "2026-01-01T10:00:00.000Z",
      },
    ],
  };
}

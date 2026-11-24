import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { indexCatalog, queryProducts } from "@/data/catalog-query";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogJsonPath = path.resolve(
  __dirname,
  "../../public/data/catalog.json"
);

function createFixtureCatalog() {
  return {
    version: "2026-11-11-test",
    categories: [
      {
        id: 1,
        slug: "aydinlatma",
        name: "Aydınlatma",
        parentId: null,
        count: 6,
      },
      {
        id: 2,
        slug: "avize",
        name: "Avize",
        parentId: 1,
        count: 4,
      },
      {
        id: 3,
        slug: "led-avizeler",
        name: "Led Avizeler",
        parentId: 2,
        count: 3,
      },
      {
        id: 4,
        slug: "cember-led-avize",
        name: "Çember Led Avize",
        parentId: 3,
        count: 2,
      },
      {
        id: 5,
        slug: "aplikler",
        name: "Aplikler",
        parentId: 1,
        count: 1,
      },
      {
        id: 6,
        slug: "masa-lambalari",
        name: "Masa Lambaları",
        parentId: null,
        count: 1,
      },
      {
        id: 7,
        slug: "bos-kategori",
        name: "Boş Kategori",
        parentId: null,
        count: 0,
      },
    ],
    attributes: [
      {
        slug: "avize-rengi",
        name: "Çerçeve Rengi",
        terms: [
          { slug: "siyah-renk", name: "Siyah", swatch: "#18181b" },
          { slug: "beyaz-renk", name: "Beyaz", swatch: "#ffffff" },
          { slug: "gold-renk", name: "Gold", swatch: "#d4af37" },
        ],
      },
      {
        slug: "aydinlatma-rengi",
        name: "Aydınlatma Rengi",
        terms: [
          { slug: "3000k", name: "3000K (Sarı Işık)" },
          { slug: "4000k", name: "4000K (Gün Işığı)" },
          { slug: "6500k", name: "6500K (Beyaz Işık)" },
        ],
      },
      {
        slug: "urun-boyutu",
        name: "Ürün Boyutu",
        terms: [
          { slug: "40x40cm", name: "40x40cm" },
          { slug: "60x60cm", name: "60x60cm" },
        ],
      },
      {
        slug: "kullanim-alani",
        name: "Kullanım Alanı",
        terms: [{ slug: "ofis", name: "Ofis" }],
      },
    ],
    products: [
      {
        id: 101,
        slug: "istanbul-cember-led-avize",
        name: "İstanbul Çember LED Avize",
        sku: "PRBK-IST-101",
        inStock: true,
        createdAt: "2026-01-10T10:00:00.000Z",
        categoryIds: [4], // deeply nested under aydinlatma -> avize -> led-avizeler -> cember-led-avize
        priceMin: 1500,
        priceMax: 2200,
        attributes: {
          "avize-rengi": ["siyah-renk", "gold-renk"],
          "aydinlatma-rengi": ["3000k", "4000k"],
          "urun-boyutu": ["40x40cm"],
        },
      },
      {
        id: 102,
        slug: "modern-gun-isigi-led-avize",
        name: "Modern Gün Işığı LED Avize",
        sku: "PRBK-MOD-102",
        inStock: true,
        createdAt: "2026-01-15T10:00:00.000Z",
        categoryIds: [3], // under aydinlatma -> avize -> led-avizeler
        priceMin: 1200,
        priceMax: 1200,
        attributes: {
          "avize-rengi": ["beyaz-renk"],
          "aydinlatma-rengi": ["4000k"],
          "urun-boyutu": ["60x60cm"],
        },
      },
      {
        id: 103,
        slug: "klasik-siyah-avize",
        name: "Klasik Siyah Avize",
        sku: "PRBK-KLS-103",
        inStock: false,
        createdAt: "2026-01-15T10:00:00.000Z", // same createdAt as 102 for tie-break test
        categoryIds: [2], // under aydinlatma -> avize
        priceMin: 1500,
        priceMax: 1800,
        attributes: {
          "avize-rengi": ["siyah"], // stored without "-renk" to test alias matching against "siyah-renk"
          "aydinlatma-rengi": ["3000k"],
        },
      },
      {
        id: 104,
        slug: "duvar-aplik-lamba",
        name: "Duvar Aplik Lamba",
        sku: "PRBK-APL-104",
        inStock: true,
        createdAt: "2026-01-05T10:00:00.000Z",
        categoryIds: [5], // under aydinlatma -> aplikler
        priceMin: 800,
        priceMax: 800,
        attributes: {
          "avize-rengi": ["siyah-renk", "beyaz-renk"],
        },
      },
      {
        id: 105,
        slug: "rgb-masa-lambasi",
        name: "Şık RGB Masa Lambası",
        sku: "PRBK-MSA-105",
        inStock: true,
        createdAt: "2026-01-20T10:00:00.000Z",
        categoryIds: [6], // root category masa-lambalari
        priceMin: 800, // same priceMin as 104 for price tie-break test
        priceMax: 950,
        attributes: {},
      },
      {
        id: 106,
        slug: "ikili-cember-led-avize",
        name: "İkili Çember LED Avize",
        sku: "PRBK-CMB-106",
        inStock: true,
        createdAt: "2026-01-12T10:00:00.000Z",
        categoryIds: [4],
        priceMin: 1500, // same priceMin as 101 and 103
        priceMax: 2200, // same priceMax as 101 for price-desc tie-break test
        attributes: {
          "avize-rengi": ["gold-renk"],
          "aydinlatma-rengi": ["6500k"],
          "urun-boyutu": ["60x60cm"],
        },
      },
    ],
  };
}

describe("indexCatalog", () => {
  it("preserves { version, categories, attributes, products } and populates all lookup Maps and descendant Sets", () => {
    const raw = createFixtureCatalog();
    const indexed = indexCatalog(raw);

    expect(indexed.version).toBe(raw.version);
    expect(indexed.categories).toBe(raw.categories);
    expect(indexed.attributes).toBe(raw.attributes);
    expect(indexed.products).toBe(raw.products);

    expect(indexed.productsBySlug).toBeInstanceOf(Map);
    expect(indexed.productsById).toBeInstanceOf(Map);
    expect(indexed.categoriesBySlug).toBeInstanceOf(Map);
    expect(indexed.categoriesById).toBeInstanceOf(Map);
    expect(indexed.childrenByCategoryId).toBeInstanceOf(Map);
    expect(indexed.descendantCategoryIdsBySlug).toBeInstanceOf(Map);
    expect(indexed.attributesBySlug).toBeInstanceOf(Map);

    expect(indexed.productsBySlug.size).toBe(6);
    expect(indexed.productsBySlug.get("istanbul-cember-led-avize")?.id).toBe(
      101
    );
    expect(indexed.productsById.get(101)?.slug).toBe(
      "istanbul-cember-led-avize"
    );

    expect(indexed.categoriesBySlug.size).toBe(7);
    expect(indexed.categoriesBySlug.get("led-avizeler")?.id).toBe(3);
    expect(indexed.categoriesById.get(3)?.slug).toBe("led-avizeler");

    // Root categories under parentId: null
    const rootChildren = indexed.childrenByCategoryId.get(null) ?? [];
    expect(rootChildren.map((c) => c.slug)).toEqual([
      "aydinlatma",
      "masa-lambalari",
      "bos-kategori",
    ]);

    // Direct children of aydinlatma (id: 1)
    const aydinlatmaChildren = indexed.childrenByCategoryId.get(1) ?? [];
    expect(aydinlatmaChildren.map((c) => c.slug)).toEqual([
      "avize",
      "aplikler",
    ]);

    // Recursive descendants across 4 levels: aydinlatma (1) -> avize (2) -> led-avizeler (3) -> cember-led-avize (4)
    expect(indexed.descendantCategoryIdsBySlug.get("aydinlatma")).toEqual(
      new Set([1, 2, 3, 4, 5])
    );
    expect(indexed.descendantCategoryIdsBySlug.get("avize")).toEqual(
      new Set([2, 3, 4])
    );
    expect(indexed.descendantCategoryIdsBySlug.get("led-avizeler")).toEqual(
      new Set([3, 4])
    );
    expect(indexed.descendantCategoryIdsBySlug.get("cember-led-avize")).toEqual(
      new Set([4])
    );

    // attributesBySlug with termsBySlug Map
    const colorAttr = indexed.attributesBySlug.get("avize-rengi");
    expect(colorAttr).toBeDefined();
    expect(colorAttr.termsBySlug).toBeInstanceOf(Map);
    expect(colorAttr.termsBySlug.get("siyah-renk")).toEqual({
      slug: "siyah-renk",
      name: "Siyah",
      swatch: "#18181b",
    });
  });

  it("is idempotent when called with an already-indexed catalog object", () => {
    const raw = createFixtureCatalog();
    const firstIndex = indexCatalog(raw);
    const secondIndex = indexCatalog(firstIndex);

    expect(secondIndex.productsBySlug.size).toBe(6);
    expect(secondIndex.categoriesBySlug.size).toBe(7);
    expect(secondIndex.attributesBySlug.size).toBe(4);
    expect(secondIndex.descendantCategoryIdsBySlug.get("aydinlatma")).toEqual(
      new Set([1, 2, 3, 4, 5])
    );
    expect(
      secondIndex.attributesBySlug
        .get("avize-rengi")
        ?.termsBySlug.get("gold-renk")?.name
    ).toBe("Gold");
  });

  it("handles null, undefined, or missing arrays gracefully without throwing", () => {
    for (const input of [null, undefined, {}, { version: "empty" }]) {
      const indexed = indexCatalog(input);
      expect(indexed.categories).toEqual([]);
      expect(indexed.attributes).toEqual([]);
      expect(indexed.products).toEqual([]);
      expect(indexed.productsBySlug).toBeInstanceOf(Map);
      expect(indexed.productsBySlug.size).toBe(0);
      expect(indexed.productsById.size).toBe(0);
      expect(indexed.categoriesBySlug.size).toBe(0);
      expect(indexed.categoriesById.size).toBe(0);
      expect(indexed.childrenByCategoryId.size).toBe(0);
      expect(indexed.descendantCategoryIdsBySlug.size).toBe(0);
      expect(indexed.attributesBySlug.size).toBe(0);
    }
  });

  it("guards against circular category parentId references without infinite recursion", () => {
    const cyclicCatalog = {
      version: "cycle-test",
      categories: [
        { id: 10, slug: "cat-a", name: "Cat A", parentId: 30, count: 0 },
        { id: 20, slug: "cat-b", name: "Cat B", parentId: 10, count: 0 },
        { id: 30, slug: "cat-c", name: "Cat C", parentId: 20, count: 0 },
        { id: 40, slug: "self-parent", name: "Self", parentId: 40, count: 0 },
      ],
      attributes: [],
      products: [],
    };

    const indexed = indexCatalog(cyclicCatalog);
    expect(indexed.descendantCategoryIdsBySlug.get("cat-a")).toEqual(
      new Set([10, 20, 30])
    );
    expect(indexed.descendantCategoryIdsBySlug.get("cat-b")).toEqual(
      new Set([20, 30, 10])
    );
    expect(indexed.descendantCategoryIdsBySlug.get("self-parent")).toEqual(
      new Set([40])
    );
  });
});

describe("queryProducts", () => {
  it("works with both raw and already-indexed catalog and defaults params when omitted", () => {
    const raw = createFixtureCatalog();
    const indexed = indexCatalog(raw);

    const resFromRaw = queryProducts(raw);
    const resFromIndexed = queryProducts(indexed);

    expect(resFromRaw.page).toBe(1);
    expect(resFromRaw.perPage).toBe(12);
    expect(resFromRaw.total).toBe(6);
    expect(resFromRaw.totalPages).toBe(1);
    // Default sort is "newest": 105 (Jan 20), 103 (Jan 15, id 103), 102 (Jan 15, id 102), 106 (Jan 12), 101 (Jan 10), 104 (Jan 05)
    expect(resFromRaw.items.map((p) => p.id)).toEqual([
      105, 103, 102, 106, 101, 104,
    ]);
    expect(resFromIndexed.items.map((p) => p.id)).toEqual(
      resFromRaw.items.map((p) => p.id)
    );
  });

  describe("recursive category filtering", () => {
    it("includes products from the selected category and all child and grandchild categories", () => {
      const catalog = indexCatalog(createFixtureCatalog());

      const aydinlatmaRes = queryProducts(catalog, {
        categorySlug: "aydinlatma",
      });
      expect(aydinlatmaRes.total).toBe(5);
      expect(aydinlatmaRes.items.map((p) => p.id).sort()).toEqual([
        101, 102, 103, 104, 106,
      ]);

      const avizeRes = queryProducts(catalog, { categorySlug: "avize" });
      expect(avizeRes.total).toBe(4);
      expect(avizeRes.items.map((p) => p.id).sort()).toEqual([
        101, 102, 103, 106,
      ]);

      const ledAvizeRes = queryProducts(catalog, {
        categorySlug: "led-avizeler",
      });
      expect(ledAvizeRes.total).toBe(3);
      expect(ledAvizeRes.items.map((p) => p.id).sort()).toEqual([
        101, 102, 106,
      ]);

      const cemberRes = queryProducts(catalog, {
        categorySlug: "cember-led-avize",
      });
      expect(cemberRes.total).toBe(2);
      expect(cemberRes.items.map((p) => p.id).sort()).toEqual([101, 106]);
    });

    it("returns empty items, total: 0, and totalPages: 1 for an unknown categorySlug", () => {
      const catalog = indexCatalog(createFixtureCatalog());
      const res = queryProducts(catalog, {
        categorySlug: "olmayan-kategori",
      });

      expect(res.items).toEqual([]);
      expect(res.total).toBe(0);
      expect(res.totalPages).toBe(1);
    });
  });

  describe("multi-attribute filtering and -renk alias matching", () => {
    it("applies OR logic within the same attribute and matches -renk suffix aliases bidirectionally", () => {
      const catalog = indexCatalog(createFixtureCatalog());

      // Filtering by "siyah-renk" should match 101 ("siyah-renk"), 103 ("siyah"), and 104 ("siyah-renk")
      const siyahWithSuffix = queryProducts(catalog, {
        attributes: { "avize-rengi": ["siyah-renk"] },
      });
      expect(siyahWithSuffix.items.map((p) => p.id).sort()).toEqual([
        101, 103, 104,
      ]);

      // Filtering by "siyah" (without -renk) should also match 101, 103, and 104
      const siyahWithoutSuffix = queryProducts(catalog, {
        attributes: { "avize-rengi": ["siyah"] },
      });
      expect(siyahWithoutSuffix.items.map((p) => p.id).sort()).toEqual([
        101, 103, 104,
      ]);

      // OR within "avize-rengi": ["beyaz-renk", "gold-renk"] matches 101, 102, 104, 106
      const beyazOrGold = queryProducts(catalog, {
        attributes: { "avize-rengi": ["beyaz-renk", "gold-renk"] },
      });
      expect(beyazOrGold.items.map((p) => p.id).sort()).toEqual([
        101, 102, 104, 106,
      ]);
    });

    it("applies AND logic across multiple distinct attributes", () => {
      const catalog = indexCatalog(createFixtureCatalog());

      // avize-rengi: siyah-renk or gold-renk (101, 103, 104, 106)
      // AND aydinlatma-rengi: 3000k (101, 103)
      // AND urun-boyutu: 40x40cm (101)
      const res = queryProducts(catalog, {
        attributes: {
          "avize-rengi": ["siyah-renk", "gold-renk"],
          "aydinlatma-rengi": ["3000k"],
          "urun-boyutu": ["40x40cm"],
        },
      });

      expect(res.total).toBe(1);
      expect(res.items.map((p) => p.id)).toEqual([101]);
    });

    it("ignores attribute filter entries with empty arrays, null, or whitespace-only term strings", () => {
      const catalog = indexCatalog(createFixtureCatalog());

      const res = queryProducts(catalog, {
        attributes: {
          "avize-rengi": [],
          "aydinlatma-rengi": null,
          "urun-boyutu": ["", "   "],
        },
      });

      expect(res.total).toBe(6);
    });

    it("returns 0 matches when an unknown attribute slug is requested with a non-empty term", () => {
      const catalog = indexCatalog(createFixtureCatalog());

      const res = queryProducts(catalog, {
        attributes: {
          "bilinmeyen-ozellik": ["deger"],
        },
      });

      expect(res.total).toBe(0);
      expect(res.items).toEqual([]);
      expect(res.totalPages).toBe(1);
    });
  });

  describe("inStockOnly filtering", () => {
    it("filters out products with inStock !== true when inStockOnly is true", () => {
      const catalog = indexCatalog(createFixtureCatalog());

      const inStockRes = queryProducts(catalog, { inStockOnly: true });
      expect(inStockRes.total).toBe(5);
      expect(inStockRes.items.some((p) => p.id === 103)).toBe(false);

      const allRes = queryProducts(catalog, { inStockOnly: false });
      expect(allRes.total).toBe(6);
      expect(allRes.items.some((p) => p.id === 103)).toBe(true);
    });
  });

  describe("Turkish case- and diacritic-insensitive search", () => {
    it("matches Turkish characters across product name and SKU regardless of case or diacritics", () => {
      const catalog = indexCatalog(createFixtureCatalog());

      // "İSTANBUL" and "istanbul" match "İstanbul Çember LED Avize" (101)
      expect(
        queryProducts(catalog, { search: "İSTANBUL" }).items.map((p) => p.id)
      ).toEqual([101]);
      expect(
        queryProducts(catalog, { search: "istanbul" }).items.map((p) => p.id)
      ).toEqual([101]);

      // "ışık" and "isik" -> let's check "ışığı" / "isigi" on "Modern Gün Işığı LED Avize" (102)
      expect(
        queryProducts(catalog, { search: "ışığı" }).items.map((p) => p.id)
      ).toEqual([102]);
      expect(
        queryProducts(catalog, { search: "ISIGI" }).items.map((p) => p.id)
      ).toEqual([102]);

      // "aplık" and "aplik" match "Duvar Aplik Lamba" (104)
      expect(
        queryProducts(catalog, { search: "aplık" }).items.map((p) => p.id)
      ).toEqual([104]);
      expect(
        queryProducts(catalog, { search: "APLİK" }).items.map((p) => p.id)
      ).toEqual([104]);

      // "ÇEMBER" and "cember" match 101 and 106
      expect(
        queryProducts(catalog, { search: "ÇEMBER" })
          .items.map((p) => p.id)
          .sort()
      ).toEqual([101, 106]);
      expect(
        queryProducts(catalog, { search: "cember" })
          .items.map((p) => p.id)
          .sort()
      ).toEqual([101, 106]);

      // "şık" and "sik" match "Şık RGB Masa Lambası" (105) and "Klasik Siyah Avize" ("sik" in klasik)
      expect(
        queryProducts(catalog, { search: "şık rgb" }).items.map((p) => p.id)
      ).toEqual([105]);
      expect(
        queryProducts(catalog, { search: "sik rgb" }).items.map((p) => p.id)
      ).toEqual([105]);

      // SKU substring match (case-insensitive, trimmed)
      expect(
        queryProducts(catalog, { search: "  prbk-msa-105 " }).items.map(
          (p) => p.id
        )
      ).toEqual([105]);

      // Empty or whitespace-only search does not filter out products
      expect(queryProducts(catalog, { search: "   " }).total).toBe(6);
    });
  });

  describe("sorting", () => {
    it("sorts by newest ('newest' / 'en-yeni' / omitted) using createdAt desc then id desc", () => {
      const catalog = indexCatalog(createFixtureCatalog());

      for (const sort of [undefined, "newest", "en-yeni", "invalid-sort-key"]) {
        const res = queryProducts(catalog, { sort });
        // 105 (Jan 20), 103 & 102 (Jan 15 -> 103 before 102), 106 (Jan 12), 101 (Jan 10), 104 (Jan 05)
        expect(res.items.map((p) => p.id)).toEqual([
          105, 103, 102, 106, 101, 104,
        ]);
      }
    });

    it("sorts by price ascending ('price-asc' / 'fiyat-artan') using priceMin asc then id asc", () => {
      const catalog = indexCatalog(createFixtureCatalog());

      for (const sort of ["price-asc", "fiyat-artan"]) {
        const res = queryProducts(catalog, { sort });
        // priceMin 800: 104, 105 (id asc: 104, 105)
        // priceMin 1200: 102
        // priceMin 1500: 101, 103, 106 (id asc: 101, 103, 106)
        expect(res.items.map((p) => p.id)).toEqual([
          104, 105, 102, 101, 103, 106,
        ]);
      }
    });

    it("sorts by price descending ('price-desc' / 'fiyat-azalan') using priceMin desc, priceMax desc, then id desc", () => {
      const catalog = indexCatalog(createFixtureCatalog());

      for (const sort of ["price-desc", "fiyat-azalan"]) {
        const res = queryProducts(catalog, { sort });
        // priceMin 1500: 106 (max 2200, id 106), 101 (max 2200, id 101), 103 (max 1800, id 103)
        // priceMin 1200: 102
        // priceMin 800: 105 (max 950), 104 (max 800)
        expect(res.items.map((p) => p.id)).toEqual([
          106, 101, 103, 102, 105, 104,
        ]);
      }
    });
  });

  describe("pagination", () => {
    it("supports allowed perPage values (9, 12, 18, 24) and falls back to 12 for invalid perPage", () => {
      const base = createFixtureCatalog();
      // Generate 25 products to test pagination across multiple pages
      const manyProducts = Array.from({ length: 25 }, (_, idx) => ({
        id: idx + 1,
        slug: `urun-${idx + 1}`,
        name: `Ürün ${idx + 1}`,
        sku: `SKU-${idx + 1}`,
        inStock: true,
        createdAt: `2026-01-${String((idx % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
        categoryIds: [1],
        priceMin: (idx + 1) * 100,
        priceMax: (idx + 1) * 100,
        attributes: {},
      }));
      const catalog = indexCatalog({ ...base, products: manyProducts });

      for (const allowed of [9, 12, 18, 24]) {
        const res = queryProducts(catalog, { perPage: allowed, page: 1 });
        expect(res.perPage).toBe(allowed);
        expect(res.items.length).toBe(allowed);
        expect(res.total).toBe(25);
        expect(res.totalPages).toBe(Math.ceil(25 / allowed));
      }

      for (const invalidPerPage of [0, -5, 15, 100, Number.NaN, "invalid"]) {
        const res = queryProducts(catalog, { perPage: invalidPerPage });
        expect(res.perPage).toBe(12);
        expect(res.items.length).toBe(12);
        expect(res.totalPages).toBe(3);
      }
    });

    it("clamps non-positive or non-numeric page to 1 and preserves out-of-range page > totalPages with empty items", () => {
      const catalog = indexCatalog(createFixtureCatalog());

      for (const invalidPage of [0, -2, Number.NaN, "abc", null]) {
        const res = queryProducts(catalog, { page: invalidPage });
        expect(res.page).toBe(1);
        expect(res.items.length).toBe(6);
      }

      const outOfRange = queryProducts(catalog, { page: 5, perPage: 9 });
      expect(outOfRange.page).toBe(5);
      expect(outOfRange.items).toEqual([]);
      expect(outOfRange.total).toBe(6);
      expect(outOfRange.totalPages).toBe(1);
      expect(outOfRange.facets.inStockCount).toBe(5);
    });
  });

  describe("disjunctive facets", () => {
    it("computes facets.categories across all categories (including descendants) ignoring active categorySlug", () => {
      const catalog = indexCatalog(createFixtureCatalog());

      const res = queryProducts(catalog, {
        categorySlug: "cember-led-avize",
        inStockOnly: true,
      });

      // Even though categorySlug is "cember-led-avize" (total: 2), facets.categories reflects all categories for inStockOnly: true
      expect(res.facets.categories).toEqual({
        aydinlatma: 4, // 101, 102, 104, 106 (103 is out of stock)
        avize: 3, // 101, 102, 106
        "led-avizeler": 3, // 101, 102, 106
        "cember-led-avize": 2, // 101, 106
        aplikler: 1, // 104
        "masa-lambalari": 1, // 105
        "bos-kategori": 0,
      });
    });

    it("computes facets.attributes disjunctively so selecting a term in an attribute preserves sibling term counts", () => {
      const catalog = indexCatalog(createFixtureCatalog());

      // Active category: "avize" (products 101, 102, 103, 106)
      // Active attribute filter: avize-rengi = ["siyah-renk"]
      // Matching items for the query itself: 101 and 103
      const res = queryProducts(catalog, {
        categorySlug: "avize",
        attributes: {
          "avize-rengi": ["siyah-renk"],
        },
      });

      expect(res.total).toBe(2);

      // Disjunctive counts for "avize-rengi" ignore the "avize-rengi" filter, counting across all 4 products in "avize":
      // siyah-renk: 101 ("siyah-renk") & 103 ("siyah" via -renk alias) -> 2
      // beyaz-renk: 102 -> 1
      // gold-renk: 101 & 106 -> 2
      expect(res.facets.attributes["avize-rengi"]).toEqual({
        "siyah-renk": 2,
        "beyaz-renk": 1,
        "gold-renk": 2,
      });

      // Counts for "aydinlatma-rengi" MUST respect the active "avize-rengi": ["siyah-renk"] filter (products 101, 103):
      // 3000k: 101, 103 -> 2
      // 4000k: 101 -> 1
      // 6500k: 0
      expect(res.facets.attributes["aydinlatma-rengi"]).toEqual({
        "3000k": 2,
        "4000k": 1,
        "6500k": 0,
      });
    });

    it("computes facets.availableAttributes scoped to categorySlug + search (plus any actively selected attribute)", () => {
      const catalog = indexCatalog(createFixtureCatalog());

      // In category "aplikler" (only product 104, which only has "avize-rengi"):
      const aplikRes = queryProducts(catalog, { categorySlug: "aplikler" });
      expect(aplikRes.facets.availableAttributes.map((a) => a.slug)).toEqual([
        "avize-rengi",
      ]);

      // If user also has an active selection on "urun-boyutu", it remains in availableAttributes so user can deselect it
      const aplikWithSelectedAttr = queryProducts(catalog, {
        categorySlug: "aplikler",
        attributes: { "urun-boyutu": ["40x40cm"] },
      });
      expect(
        aplikWithSelectedAttr.facets.availableAttributes.map((a) => a.slug)
      ).toEqual(["avize-rengi", "urun-boyutu"]);
    });

    it("computes facets.inStockCount ignoring inStockOnly while respecting categorySlug, attributes, and search", () => {
      const catalog = indexCatalog(createFixtureCatalog());

      // In category "avize", products are 101 (inStock), 102 (inStock), 103 (out of stock), 106 (inStock) -> 3 in stock
      const resAll = queryProducts(catalog, {
        categorySlug: "avize",
        inStockOnly: false,
      });
      expect(resAll.total).toBe(4);
      expect(resAll.facets.inStockCount).toBe(3);

      const resInStockOnly = queryProducts(catalog, {
        categorySlug: "avize",
        inStockOnly: true,
      });
      expect(resInStockOnly.total).toBe(3);
      expect(resInStockOnly.facets.inStockCount).toBe(3);
    });
  });
});

describe("Integration with public/data/catalog.json", () => {
  const rawCatalog = JSON.parse(fs.readFileSync(catalogJsonPath, "utf-8"));

  it("indexes the configured catalog, including an empty category and product list", () => {
    const indexed = indexCatalog(rawCatalog);

    expect(Array.isArray(rawCatalog.categories)).toBe(true);
    expect(Array.isArray(rawCatalog.products)).toBe(true);
    expect(indexed.productsBySlug.size).toBe(rawCatalog.products.length);
    expect(indexed.categoriesBySlug.size).toBe(rawCatalog.categories.length);
    expect(indexed.siteSettings?.siteName).toBe(
      rawCatalog.siteSettings.siteName
    );
  });

  it("returns no products for a category that is not in the configured catalog", () => {
    const indexed = indexCatalog(rawCatalog);
    const result = queryProducts(indexed, { categorySlug: "led-avizeler" });

    expect(result.page).toBe(1);
    expect(result.perPage).toBe(12);
    if (indexed.categoriesBySlug.has("led-avizeler")) {
      expect(result.total).toBeGreaterThan(0);
    } else {
      expect(result.total).toBe(0);
      expect(result.items).toEqual([]);
    }
  });
});

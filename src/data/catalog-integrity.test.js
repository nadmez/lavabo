import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildCatalogFromStoreApi } from "../../scripts/build-catalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const catalogJsonPath = path.join(repoRoot, "public", "data", "catalog.json");
const publicAssetsDir = path.join(repoRoot, "public", "assets");

describe("buildCatalogFromStoreApi unit transformation tests", () => {
  let tmpAssetsDir;

  beforeEach(() => {
    tmpAssetsDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "lavabo-catalog-assets-")
    );
  });

  afterEach(() => {
    fs.rmSync(tmpAssetsDir, { recursive: true, force: true });
  });

  function touchAssetFiles(productSlug, fileNames) {
    const dir = path.join(tmpAssetsDir, productSlug);
    fs.mkdirSync(dir, { recursive: true });
    for (const fileName of fileNames) {
      fs.writeFileSync(path.join(dir, fileName), "fake-image-bytes");
    }
  }

  function createSampleFixtures() {
    touchAssetFiles("pablo-kare-plafonyer-led-avize", [
      "variant-x.webp",
      "gallery-02.webp",
      "main.webp",
      "gallery-01.webp",
    ]);

    touchAssetFiles("aslan-model-rgb-led-masa-lambasi", [
      "gallery-01.webp",
      "main.webp",
    ]);

    // Empty directory with zero image files
    fs.mkdirSync(path.join(tmpAssetsDir, "bos-klasor-urun"), {
      recursive: true,
    });

    const categories = [
      {
        id: 10,
        name: "Avizeler",
        slug: "avizeler",
        parent: 0,
        count: 15,
        description: "<p>Modern LED avizeler</p>",
        image: null,
      },
      {
        id: 11,
        name: "Sarkıt Avizeler",
        slug: "sarkit-avizeler",
        parent: 10,
        count: 7,
        description: "<p>Sarkıt modeller</p>",
        image: {
          id: 501,
          src: "https://parbek.com.tr/wp-content/uploads/sarkit.webp",
        },
      },
    ];

    const products = [
      {
        id: 1001,
        name: "Pablo Kare Plafonyer LED Avize",
        slug: "pablo-kare-plafonyer-led-avize",
        parent: 0,
        type: "variable",
        sku: "PRBK-PABLO-01",
        is_in_stock: true,
        short_description:
          "<p><strong>Güç:</strong> 45W &amp; 3 Renk</p>\n<p>   </p>\n<ul><li>Yerli &quot;LED&quot; Üretim&#8211;Garantili</li></ul>",
        description: "<div><p>Detaylı ürün açıklaması.</p></div>",
        categories: [
          { id: 10, name: "Avizeler", slug: "avizeler" },
          { id: 11, name: "Sarkıt Avizeler", slug: "sarkit-avizeler" },
          { id: 9999, name: "Silinmiş Kategori", slug: "silinmis-kategori" },
        ],
        prices: {
          price: "150000",
          regular_price: "180000",
          sale_price: "150000",
          price_range: {
            min_amount: "150000",
            max_amount: "220000",
          },
          currency_code: "TRY",
          currency_minor_unit: 2,
        },
        attributes: [
          {
            id: 1,
            name: "► Çerçeve Rengi",
            taxonomy: "pa_cerceve-rengi",
            has_variations: true,
            terms: [
              { id: 101, name: "Siyah", slug: "siyah" },
              { id: 102, name: "Beyaz", slug: "beyaz" },
              { id: 103, name: "Antrasit Gri", slug: "antrasit-gri" },
            ],
          },
          {
            id: 2,
            name: "► Işık Rengi",
            taxonomy: null,
            has_variations: true,
            terms: [{ id: 201, name: "3 Renk", slug: "3-renk" }],
          },
          {
            id: 0,
            name: "Marka",
            taxonomy: null,
            has_variations: false,
            terms: [{ id: 0, name: "Parbek", slug: "parbek" }],
          },
          {
            id: 0,
            name: "Malzeme",
            taxonomy: null,
            has_variations: false,
            terms: [{ id: 0, name: "Alüminyum", slug: "aluminyum" }],
          },
        ],
        variations: [
          {
            id: 2001,
            attributes: [
              { name: "► Çerçeve Rengi", value: "siyah" },
              { name: "► Işık Rengi", value: "3-renk" },
            ],
          },
          {
            id: 2002,
            attributes: [
              { name: "► Çerçeve Rengi", value: "gold" },
              { name: "► Işık Rengi", value: "3-renk" },
            ],
          },
        ],
      },
      {
        id: 1002,
        name: "Aslan Model RGB LED Masa Lambası",
        slug: "aslan-model-rgb-led-masa-lambasi",
        parent: 0,
        type: "simple",
        sku: "PRBK-ASLAN-01",
        is_in_stock: true,
        short_description: "   <p>   </p>\n<div>  <span> </span> </div>  ",
        description: "<p>RGB masa lambası.</p>",
        categories: [{ id: 10, name: "Avizeler", slug: "avizeler" }],
        prices: {
          price: "85000",
          regular_price: "85000",
          sale_price: "85000",
          price_range: null,
          currency_code: "TRY",
          currency_minor_unit: 2,
        },
        attributes: [
          {
            id: 0,
            name: "Barkod",
            taxonomy: null,
            has_variations: false,
            terms: [{ id: 0, name: "8680001", slug: "8680001" }],
          },
        ],
        variations: [],
      },
      {
        id: 1003,
        name: "Klasörü Olmayan Ürün",
        slug: "klasoru-olmayan-urun",
        parent: 0,
        type: "simple",
        sku: "PRBK-MISSING-01",
        is_in_stock: true,
        short_description: "<p>Test</p>",
        description: "<p>Test</p>",
        categories: [{ id: 10, name: "Avizeler", slug: "avizeler" }],
        prices: {
          price: "50000",
          regular_price: "50000",
          sale_price: "50000",
          price_range: null,
          currency_code: "TRY",
          currency_minor_unit: 2,
        },
        attributes: [],
        variations: [],
      },
      {
        id: 1004,
        name: "Boş Klasör Ürün",
        slug: "bos-klasor-urun",
        parent: 0,
        type: "simple",
        sku: "PRBK-EMPTY-01",
        is_in_stock: true,
        short_description: "<p>Test</p>",
        description: "<p>Test</p>",
        categories: [{ id: 10, name: "Avizeler", slug: "avizeler" }],
        prices: {
          price: "50000",
          regular_price: "50000",
          sale_price: "50000",
          price_range: null,
          currency_code: "TRY",
          currency_minor_unit: 2,
        },
        attributes: [],
        variations: [],
      },
    ];

    const variations = [
      {
        id: 2001,
        parent: 1001,
        name: "Pablo Kare Plafonyer LED Avize - Siyah, 3 Renk",
        slug: "pablo-kare-plafonyer-led-avize-siyah-3-renk",
        type: "variation",
        sku: "PRBK-PABLO-01-BLK",
        is_in_stock: true,
        prices: {
          price: "150000",
          regular_price: "180000",
          sale_price: "150000",
          price_range: null,
          currency_code: "TRY",
          currency_minor_unit: 2,
        },
        attributes: [
          {
            name: "► Çerçeve Rengi",
            taxonomy: "pa_cerceve-rengi",
            value: "siyah",
          },
          {
            name: "► Işık Rengi",
            taxonomy: null,
            value: "3-renk",
          },
        ],
        images: [],
      },
      {
        id: 2002,
        parent: 1001,
        name: "Pablo Kare Plafonyer LED Avize - Gold, 3 Renk",
        slug: "pablo-kare-plafonyer-led-avize-gold-3-renk",
        type: "variation",
        sku: "PRBK-PABLO-01-GLD",
        is_in_stock: false,
        prices: {
          price: "220000",
          regular_price: "220000",
          sale_price: "220000",
          price_range: null,
          currency_code: "TRY",
          currency_minor_unit: 2,
        },
        attributes: [
          {
            name: "► Çerçeve Rengi",
            taxonomy: "pa_cerceve-rengi",
            value: "gold",
          },
          {
            name: "► Işık Rengi",
            taxonomy: null,
            value: "3-renk",
          },
        ],
        images: [],
      },
    ];

    return { categories, products, variations };
  }

  it("maps root category parent: 0 to parentId: null and child category parent: 10 to parentId: 10", () => {
    const { categories, products, variations } = createSampleFixtures();
    const catalog = buildCatalogFromStoreApi({
      categories,
      products,
      variations,
      assetsDir: tmpAssetsDir,
      version: "2026-11-11",
    });

    const rootCat = catalog.categories.find((c) => c.id === 10);
    const childCat = catalog.categories.find((c) => c.id === 11);

    expect(rootCat).toBeDefined();
    expect(rootCat?.parentId).toBeNull();
    expect(rootCat?.slug).toBe("avizeler");

    expect(childCat).toBeDefined();
    expect(childCat?.parentId).toBe(10);
    expect(childCat?.slug).toBe("sarkit-avizeler");
  });

  it("normalizes attribute names (stripping '► ') and attribute slugs (stripping 'pa_' or kebab-casing)", () => {
    const { categories, products, variations } = createSampleFixtures();
    const catalog = buildCatalogFromStoreApi({
      categories,
      products,
      variations,
      assetsDir: tmpAssetsDir,
      version: "2026-11-11",
    });

    const frameAttr = catalog.attributes.find(
      (a) => a.slug === "cerceve-rengi"
    );
    const lightAttr = catalog.attributes.find((a) => a.slug === "isik-rengi");

    expect(frameAttr).toBeDefined();
    expect(frameAttr?.name).toBe("Çerçeve Rengi");

    expect(lightAttr).toBeDefined();
    expect(lightAttr?.name).toBe("Işık Rengi");
  });

  it("generates swatch hex codes on recognized colour terms (siyah, beyaz, antrasit-gri, gold)", () => {
    const { categories, products, variations } = createSampleFixtures();
    const catalog = buildCatalogFromStoreApi({
      categories,
      products,
      variations,
      assetsDir: tmpAssetsDir,
      version: "2026-11-11",
    });

    const frameAttr = catalog.attributes.find(
      (a) => a.slug === "cerceve-rengi"
    );
    expect(frameAttr).toBeDefined();

    const bySlug = new Map((frameAttr?.terms ?? []).map((t) => [t.slug, t]));

    expect(bySlug.get("siyah")?.swatch).toBe("#18181b");
    expect(bySlug.get("beyaz")?.swatch).toBe("#ffffff");
    expect(bySlug.get("antrasit-gri")?.swatch).toBe("#4b5563");
    expect(bySlug.get("gold")?.swatch).toBe("#d4af37");
  });

  it("stores non-variation attributes in product.specs and variation attributes in product.attributes and catalog.attributes", () => {
    const { categories, products, variations } = createSampleFixtures();
    const catalog = buildCatalogFromStoreApi({
      categories,
      products,
      variations,
      assetsDir: tmpAssetsDir,
      version: "2026-11-11",
    });

    const variableProduct = catalog.products.find(
      (p) => p.slug === "pablo-kare-plafonyer-led-avize"
    );
    expect(variableProduct).toBeDefined();
    expect(variableProduct?.specs).toEqual({
      Marka: "Parbek",
      Malzeme: "Alüminyum",
    });

    expect(Object.keys(variableProduct?.attributes ?? {})).toEqual(
      expect.arrayContaining(["cerceve-rengi", "isik-rengi"])
    );
    expect(variableProduct?.attributes["marka"]).toBeUndefined();
    expect(
      catalog.attributes.some((a) => a.slug === "marka" || a.slug === "malzeme")
    ).toBe(false);
  });

  it("extracts plain-text highlights from short_description and returns [] when empty or whitespace-only", () => {
    const { categories, products, variations } = createSampleFixtures();
    const catalog = buildCatalogFromStoreApi({
      categories,
      products,
      variations,
      assetsDir: tmpAssetsDir,
      version: "2026-11-11",
    });

    const variableProduct = catalog.products.find(
      (p) => p.slug === "pablo-kare-plafonyer-led-avize"
    );
    const simpleProduct = catalog.products.find(
      (p) => p.slug === "aslan-model-rgb-led-masa-lambasi"
    );

    expect(variableProduct?.highlights).toEqual([
      "Güç: 45W & 3 Renk",
      'Yerli "LED" Üretim–Garantili',
    ]);
    expect(simpleProduct?.highlights).toEqual([]);
  });

  it("sets priceMin === priceMax === price and attributes to {} for a product with no variations", () => {
    const { categories, products, variations } = createSampleFixtures();
    const catalog = buildCatalogFromStoreApi({
      categories,
      products,
      variations,
      assetsDir: tmpAssetsDir,
      version: "2026-11-11",
    });

    const simpleProduct = catalog.products.find(
      (p) => p.slug === "aslan-model-rgb-led-masa-lambasi"
    );
    expect(simpleProduct).toBeDefined();
    expect(simpleProduct?.variants).toEqual([]);
    expect(simpleProduct?.attributes).toEqual({});
    expect(simpleProduct?.priceMin).toBe(850);
    expect(simpleProduct?.priceMax).toBe(850);
  });

  it("registers a variant term not initially listed on the parent attribute into both product.attributes and catalog.attributes", () => {
    const { categories, products, variations } = createSampleFixtures();
    const catalog = buildCatalogFromStoreApi({
      categories,
      products,
      variations,
      assetsDir: tmpAssetsDir,
      version: "2026-11-11",
    });

    const variableProduct = catalog.products.find(
      (p) => p.slug === "pablo-kare-plafonyer-led-avize"
    );
    const goldVariant = variableProduct?.variants.find((v) => v.id === 2002);

    expect(goldVariant).toBeDefined();
    expect(goldVariant?.terms["cerceve-rengi"]).toBe("gold");
    expect(variableProduct?.attributes["cerceve-rengi"]).toContain("gold");

    const frameAttr = catalog.attributes.find(
      (a) => a.slug === "cerceve-rengi"
    );
    expect(frameAttr?.terms.some((t) => t.slug === "gold")).toBe(true);
  });

  it("strips dangling category IDs from product.categoryIds when not present in categories", () => {
    const { categories, products, variations } = createSampleFixtures();
    const catalog = buildCatalogFromStoreApi({
      categories,
      products,
      variations,
      assetsDir: tmpAssetsDir,
      version: "2026-11-11",
    });

    const variableProduct = catalog.products.find(
      (p) => p.slug === "pablo-kare-plafonyer-led-avize"
    );
    expect(variableProduct?.categoryIds).toEqual([10, 11]);
    expect(variableProduct?.categoryIds).not.toContain(9999);
  });

  it("orders product images (main.* first, gallery-* sorted, then variant-*) and omits products with zero local images", () => {
    const { categories, products, variations } = createSampleFixtures();
    const catalog = buildCatalogFromStoreApi({
      categories,
      products,
      variations,
      assetsDir: tmpAssetsDir,
      version: "2026-11-11",
    });

    const variableProduct = catalog.products.find(
      (p) => p.slug === "pablo-kare-plafonyer-led-avize"
    );
    expect(variableProduct?.images).toEqual([
      "pablo-kare-plafonyer-led-avize/main.webp",
      "pablo-kare-plafonyer-led-avize/gallery-01.webp",
      "pablo-kare-plafonyer-led-avize/gallery-02.webp",
      "pablo-kare-plafonyer-led-avize/variant-x.webp",
    ]);

    expect(
      catalog.products.some((p) => p.slug === "klasoru-olmayan-urun")
    ).toBe(false);
    expect(catalog.products.some((p) => p.slug === "bos-klasor-urun")).toBe(
      false
    );
  });
});

describe("public/data/catalog.json static file and asset integrity", () => {
  function loadStaticCatalog() {
    expect(fs.existsSync(catalogJsonPath)).toBe(true);
    const raw = fs.readFileSync(catalogJsonPath, "utf-8");
    return JSON.parse(raw);
  }

  it("exists and parses as a valid Catalog with a version string and array fields", () => {
    const catalog = loadStaticCatalog();

    expect(typeof catalog.version).toBe("string");
    expect(catalog.version.trim().length).toBeGreaterThan(0);
    expect(Array.isArray(catalog.categories)).toBe(true);
    expect(Array.isArray(catalog.attributes)).toBe(true);
    expect(Array.isArray(catalog.products)).toBe(true);
  });

  it("keeps every variant out of stock when the parent product is out of stock", () => {
    const catalog = loadStaticCatalog();
    const outOfStock = catalog.products.filter(
      (product) => product.inStock !== true
    );

    for (const product of outOfStock) {
      const variants = Array.isArray(product.variants) ? product.variants : [];
      expect(variants.every((variant) => variant.inStock !== true)).toBe(true);
    }
  });

  it("ensures every product has at least one image, main.* is first when present, and all product/variant image paths exist on disk", () => {
    const catalog = loadStaticCatalog();

    for (const product of catalog.products) {
      expect(product.images.length).toBeGreaterThanOrEqual(1);

      const hasMainImage = product.images.some((img) =>
        /\/main\.[^/]+$/.test(img)
      );
      if (hasMainImage) {
        expect(product.images[0]).toMatch(/\/main\.[^/]+$/);
      }

      for (const imgRelPath of product.images) {
        if (/^https?:\/\//i.test(imgRelPath)) continue;
        const fullPath = path.join(publicAssetsDir, imgRelPath);
        expect(
          fs.existsSync(fullPath),
          `Missing product image file on disk: ${imgRelPath}`
        ).toBe(true);
        expect(fs.statSync(fullPath).isFile()).toBe(true);
      }

      for (const variant of product.variants) {
        if (variant.image) {
          if (/^https?:\/\//i.test(variant.image)) continue;
          const fullVariantImgPath = path.join(publicAssetsDir, variant.image);
          expect(
            fs.existsSync(fullVariantImgPath),
            `Missing variant image file on disk: ${variant.image}`
          ).toBe(true);
          expect(fs.statSync(fullVariantImgPath).isFile()).toBe(true);
        }
      }
    }
  });

  it("ensures every product slug and every category slug is unique", () => {
    const catalog = loadStaticCatalog();

    const productSlugs = catalog.products.map((p) => p.slug);
    expect(new Set(productSlugs).size).toBe(productSlugs.length);

    const categorySlugs = catalog.categories.map((c) => c.slug);
    expect(new Set(categorySlugs).size).toBe(categorySlugs.length);
  });

  it("ensures every product.categoryIds entry and every non-null category.parentId exists in catalog.categories", () => {
    const catalog = loadStaticCatalog();
    const categoryIds = new Set(catalog.categories.map((c) => c.id));

    for (const category of catalog.categories) {
      if (category.parentId !== null) {
        expect(
          categoryIds.has(category.parentId),
          `Category ${category.slug} has dangling parentId ${category.parentId}`
        ).toBe(true);
      }
    }

    for (const product of catalog.products) {
      for (const categoryId of product.categoryIds) {
        expect(
          categoryIds.has(categoryId),
          `Product ${product.slug} references nonexistent categoryId ${categoryId}`
        ).toBe(true);
      }
    }
  });

  it("ensures every attribute slug and term slug in product.attributes exists in catalog.attributes", () => {
    const catalog = loadStaticCatalog();
    const attrMap = new Map(
      catalog.attributes.map((attr) => [
        attr.slug,
        new Set(attr.terms.map((t) => t.slug)),
      ])
    );

    for (const product of catalog.products) {
      for (const [attrSlug, termSlugs] of Object.entries(product.attributes)) {
        const catalogTerms = attrMap.get(attrSlug);
        expect(
          catalogTerms,
          `Product ${product.slug} references missing catalog attribute "${attrSlug}"`
        ).toBeDefined();

        for (const termSlug of termSlugs) {
          expect(
            catalogTerms?.has(termSlug),
            `Product ${product.slug} references missing term "${termSlug}" on attribute "${attrSlug}"`
          ).toBe(true);
        }
      }
    }
  });

  it("ensures every attribute slug and term slug in variant.terms exists in both parent product.attributes and catalog.attributes", () => {
    const catalog = loadStaticCatalog();
    const attrMap = new Map(
      catalog.attributes.map((attr) => [
        attr.slug,
        new Set(attr.terms.map((t) => t.slug)),
      ])
    );

    for (const product of catalog.products) {
      for (const variant of product.variants) {
        for (const [attrSlug, termSlug] of Object.entries(variant.terms)) {
          const parentTerms = product.attributes[attrSlug];
          expect(
            parentTerms,
            `Variant ${variant.id} of ${product.slug} references attribute "${attrSlug}" missing on parent product`
          ).toBeDefined();
          expect(
            parentTerms?.includes(termSlug),
            `Variant ${variant.id} of ${product.slug} references term "${termSlug}" missing on parent product.attributes["${attrSlug}"]`
          ).toBe(true);

          const catalogTerms = attrMap.get(attrSlug);
          expect(
            catalogTerms?.has(termSlug),
            `Variant ${variant.id} of ${product.slug} references term "${termSlug}" missing on catalog.attributes["${attrSlug}"]`
          ).toBe(true);
        }
      }
    }
  });

  it("ensures every product has priceMin <= priceMax and priceMin > 0", () => {
    const catalog = loadStaticCatalog();

    for (const product of catalog.products) {
      expect(
        product.priceMin,
        `Product ${product.slug} has non-positive priceMin: ${product.priceMin}`
      ).toBeGreaterThan(0);
      expect(
        product.priceMax,
        `Product ${product.slug} has priceMax (${product.priceMax}) < priceMin (${product.priceMin})`
      ).toBeGreaterThanOrEqual(product.priceMin);
    }
  });
});

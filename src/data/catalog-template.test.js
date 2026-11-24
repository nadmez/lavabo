import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getHomeShowcaseSections, indexCatalog } from "@/data/catalog-query";
import { createSampleCatalog } from "@/data/sample-catalog";
import {
  addCategory,
  createEmptyCatalog,
  removeAttribute,
  removeCategory,
  updateAttribute,
  validateAndNormalizeCatalog,
} from "@/data/catalog-validation";
import HomePage from "@/pages/HomePage";
import { formatCurrency, formatPriceRange } from "@/utils/format-price";
import { resolveAssetUrl } from "@/utils/image-url";
import { toKebabSlug } from "@/utils/slugify";

function renderWithCatalog(ui, catalog) {
  const client = new QueryClient();
  if (catalog) client.setQueryData(["catalog"], indexCatalog(catalog));
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("catalog template data", () => {
  it("slugifies Turkish text", () => {
    expect(toKebabSlug("Örnek Koleksiyon")).toBe("ornek-koleksiyon");
    expect(toKebabSlug("Işık Rengi")).toBe("isik-rengi");
  });

  it("builds the fixed sample catalog", () => {
    const catalog = createSampleCatalog();
    expect(catalog.siteSettings.siteName).toBe("Katalog Sitesi");
    expect(catalog.siteSettings.contact).toEqual({
      address:
        "Uğur Mumcu Mahallesi 2274. Sokak No:12 D:1 Sultançiftliği Sultangazi/İSTANBUL",
      phones: [
        { display: "0532 499 12 28", href: "tel:05324991228" },
        { display: "0212 931 28 07", href: "tel:02129312807" },
      ],
      mapUrl: "https://maps.app.goo.gl/tz4JV4jjvFkvqiXf9",
      mapLabel: "Showroom & İmalat Google Harita Konumu",
    });
    expect(catalog.siteSettings.navCategoryIds).toEqual([1, 5, 6]);
    expect(catalog.categories.map((category) => category.name)).toEqual([
      "Örnek Koleksiyon",
      "Klasik Seri",
      "Minimalist Seri",
      "Premium Seri",
      "Yeni Ürünler",
      "Öne Çıkanlar",
    ]);
    expect(catalog.categories[0]).toEqual(
      expect.objectContaining({
        id: 1,
        slug: "ornek-koleksiyon",
        parentId: null,
        count: 3,
      })
    );
    expect(catalog.attributes.map((attribute) => attribute.slug)).toEqual([
      "renk",
      "boyut",
      "malzeme",
    ]);
    expect(
      catalog.attributes[0].terms.find((term) => term.slug === "siyah").swatch
    ).toBe("#18181b");
    expect(catalog.products).toHaveLength(3);
    expect(catalog.products[0].images[0]).toBe(
      "https://picsum.photos/seed/catalog-sample-1a/800/800"
    );
    expect(catalog.products[0].variants).toHaveLength(4);
    expect(catalog.products[0].priceMin).toBe(1250);
    expect(catalog.products[0].priceMax).toBe(1550);
    expect(catalog.products[2].inStock).toBe(false);
    expect(catalog.products[2].variants).toEqual([]);
    expect(catalog.products[2].priceMin).toBe(2100);
    const normalized = validateAndNormalizeCatalog(catalog);
    expect(normalized.ok).toBe(true);
    expect(normalized.catalog.categories[0].count).toBe(3);
  });

  it("reparents children, drops the category from products, and recomputes counts", () => {
    const catalog = {
      version: "test",
      categories: [
        {
          id: 1,
          slug: "ust",
          name: "Üst",
          parentId: null,
          count: 0,
          descriptionHtml: "",
        },
        {
          id: 2,
          slug: "orta",
          name: "Orta",
          parentId: 1,
          count: 0,
          descriptionHtml: "",
        },
        {
          id: 3,
          slug: "alt",
          name: "Alt",
          parentId: 2,
          count: 0,
          descriptionHtml: "",
        },
      ],
      attributes: [],
      products: [
        {
          id: 10,
          slug: "urun",
          name: "Ürün",
          sku: "U",
          inStock: true,
          categoryIds: [2, 3],
          priceMin: 10,
          priceMax: 10,
          highlights: [],
          descriptionHtml: "",
          specs: {},
          images: [],
          attributes: {},
          variants: [],
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    };
    const result = removeCategory(catalog, 2);
    expect(result.ok).toBe(true);
    expect(
      result.catalog.categories.find((category) => category.id === 3).parentId
    ).toBe(1);
    expect(result.catalog.products[0].categoryIds).toEqual([3]);
    expect(
      result.catalog.categories.find((category) => category.id === 1).count
    ).toBe(1);
  });

  it("renames attribute terms on products and removes deleted terms", () => {
    const catalog = validateAndNormalizeCatalog({
      categories: [],
      attributes: [
        {
          slug: "renk",
          name: "Renk",
          terms: [
            { slug: "siyah", name: "Siyah" },
            { slug: "beyaz", name: "Beyaz" },
          ],
        },
      ],
      products: [
        {
          id: 1,
          slug: "urun",
          name: "Ürün",
          sku: "U",
          priceMin: 20,
          priceMax: 20,
          categoryIds: [],
          attributes: { renk: ["siyah", "beyaz"] },
          variants: [
            {
              id: 2,
              sku: "V",
              price: 20,
              inStock: true,
              terms: { renk: "siyah" },
            },
          ],
        },
      ],
    }).catalog;
    const renamed = updateAttribute(catalog, "renk", {
      name: "Renk",
      slug: "renk",
      terms: [
        {
          name: "Siyah",
          slug: "antrasit",
          previousSlug: "siyah",
          swatch: "#18181b",
        },
      ],
    });
    expect(renamed.ok).toBe(true);
    expect(renamed.catalog.products[0].attributes.renk).toEqual(["antrasit"]);
    expect(renamed.catalog.products[0].variants[0].terms.renk).toBe("antrasit");
    expect(renamed.catalog.attributes[0].terms[0].swatch).toBe("#18181b");
    const removed = removeAttribute(renamed.catalog, "renk");
    expect(removed.catalog.products[0].attributes.renk).toBeUndefined();
    expect(removed.catalog.products[0].variants[0].terms.renk).toBeUndefined();
  });

  it("recomputes variant price range and stock", () => {
    const result = validateAndNormalizeCatalog({
      categories: [],
      attributes: [],
      products: [
        {
          id: 5,
          slug: "varyantli",
          name: "Varyantlı",
          priceMin: 1,
          priceMax: 1,
          inStock: false,
          variants: [
            { sku: "A", price: 100, inStock: false, terms: { boyut: "kucuk" } },
            { sku: "B", price: 300, inStock: true, terms: { boyut: "buyuk" } },
          ],
        },
      ],
    });
    expect(result.ok).toBe(true);
    expect(result.catalog.products[0].priceMin).toBe(100);
    expect(result.catalog.products[0].priceMax).toBe(300);
    expect(result.catalog.products[0].inStock).toBe(true);
    expect(result.catalog.attributes[0].slug).toBe("boyut");
    expect(result.catalog.products[0].attributes.boyut).toEqual([
      "kucuk",
      "buyuk",
    ]);
  });

  it("rejects a duplicate category slug and keeps an empty catalog empty", () => {
    const empty = createEmptyCatalog();
    expect(empty.products).toEqual([]);
    const withCategory = addCategory(empty, { name: "Masa", slug: "masa" });
    const duplicate = addCategory(withCategory.catalog, {
      name: "Masa 2",
      slug: "masa",
    });
    expect(duplicate.ok).toBe(false);
  });
});

describe("storefront template rendering", () => {
  it("keeps external image URLs and formats other currencies", () => {
    expect(
      resolveAssetUrl("https://picsum.photos/seed/catalog-sample-1a/800/800")
    ).toBe("https://picsum.photos/seed/catalog-sample-1a/800/800");
    expect(
      formatPriceRange(10, 20, { currency: "USD", locale: "en-US" })
    ).toContain("10");
    expect(
      formatCurrency(0, { currency: "EUR", locale: "de-DE" })
    ).toBeTruthy();
  });

  it("reads the site name and category links from the catalog, including an empty category list", () => {
    const sample = createSampleCatalog();
    renderWithCatalog(<Header />, sample);
    expect(screen.getByTestId("brand-logo")).toHaveTextContent(
      "Katalog Sitesi"
    );
    expect(
      screen.getByRole("link", { name: "Örnek Koleksiyon" })
    ).toHaveAttribute("href", "/kategori/ornek-koleksiyon");

    const empty = createEmptyCatalog();
    renderWithCatalog(
      <>
        <Header />
        <Footer />
      </>,
      empty
    );
    const logos = screen.getAllByTestId("brand-logo");
    expect(logos[logos.length - 1]).toHaveTextContent(
      empty.siteSettings.siteName
    );
    const footer = screen.getByTestId("site-footer");
    expect(footer).toHaveTextContent(empty.siteSettings.siteName);
    expect(within(footer).queryAllByRole("link")).toHaveLength(0);
    const menus = screen.getAllByTestId("desktop-mega-menu");
    expect(within(menus[menus.length - 1]).queryAllByRole("link")).toHaveLength(
      0
    );
  });

  it("shows an empty catalog state and derives a showcase for the sample category", () => {
    const sections = getHomeShowcaseSections(createSampleCatalog());
    expect(sections.map((section) => section.categorySlug)).toEqual([
      "ornek-koleksiyon",
    ]);

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(["catalog"], indexCatalog(createEmptyCatalog()));
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByTestId("empty-catalog-state")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Yönetim paneline git" })
    ).toHaveAttribute("href", "/admin");
  });
});

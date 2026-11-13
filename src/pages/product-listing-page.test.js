import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatTryCurrency,
  formatProductPriceRange,
} from "@/utils/format-price";
import Breadcrumbs from "@/components/catalog/Breadcrumbs";
import ProductCard from "@/components/catalog/ProductCard";
import ListingToolbar from "@/components/catalog/ListingToolbar";
import Pagination from "@/components/catalog/Pagination";
import ProductListingPage from "@/pages/ProductListingPage";
import App from "@/App";
import { indexCatalog } from "@/data/catalog-query";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="location-probe">
      {location.pathname}
      {location.search}
    </div>
  );
}

function renderWithProviders(
  ui,
  { initialEntries = ["/"], queryClient, includeLocationProbe = false } = {}
) {
  const client = queryClient || createTestQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>
        {ui}
        {includeLocationProbe ? <LocationProbe /> : null}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function createFixtureCatalog(overrides = {}) {
  const baseCategories = [
    {
      id: 1,
      slug: "aydinlatma",
      name: "Aydınlatma",
      parentId: null,
      count: 14,
      descriptionHtml:
        "<p>Genel aydınlatma ürünleri.</p>[embed]https://www.youtube.com/watch?v=abc123[/embed]<p>Yerli üretim.</p>",
    },
    {
      id: 2,
      slug: "avize",
      name: "Avize",
      parentId: 1,
      count: 13,
      descriptionHtml:
        "<p>[embed]https://youtu.be/xyz987[/embed]</p><p>   </p>",
    },
    {
      id: 3,
      slug: "led-avizeler",
      name: "Led Avizeler",
      parentId: 2,
      count: 12,
      descriptionHtml:
        "<h2>Modern Led Avize Modelleri</h2><p>[embed]https://www.youtube.com/watch?v=demo1[/embed]Enerji tasarruflu salon ve mutfak LED avizeleri.</p>",
    },
    {
      id: 4,
      slug: "aplikler",
      name: "Aplikler",
      parentId: 1,
      count: 1,
      descriptionHtml: "",
    },
    {
      id: 5,
      slug: "masa-lambalari",
      name: "Masa Lambaları",
      parentId: null,
      count: 0,
      descriptionHtml: "   ",
    },
  ];

  const baseProducts = Array.from({ length: 14 }, (_, idx) => {
    const num = idx + 1;
    const isAplik = num === 14;
    const priceMin = num * 100 + 500;
    const priceMax = num % 3 === 0 ? priceMin + 400 : priceMin;
    return {
      id: 100 + num,
      slug: `urun-model-${num}`,
      name: `Ürün Model ${num}`,
      sku: `PRBK-MDL-${String(num).padStart(3, "0")}`,
      inStock: num % 4 !== 0,
      createdAt: `2026-01-${String(num).padStart(2, "0")}T10:00:00.000Z`,
      categoryIds: [isAplik ? 4 : 3],
      priceMin,
      priceMax,
      images: [`urun-model-${num}/main.webp`],
      attributes: {
        "avize-rengi": num % 2 === 0 ? ["siyah-renk"] : ["gold-renk"],
      },
    };
  });

  return {
    version: "2026-11-11-phase5",
    categories: overrides.categories || baseCategories,
    attributes: overrides.attributes || [
      {
        slug: "avize-rengi",
        name: "Çerçeve Rengi",
        terms: [
          { slug: "siyah-renk", name: "Siyah", swatch: "#18181b" },
          { slug: "gold-renk", name: "Gold", swatch: "#d4af37" },
        ],
      },
    ],
    products: overrides.products || baseProducts,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

const OMITTED_TERMS = [
  "Sepete Ekle",
  "Satın Al",
  "Karşılaştır",
  "İstek listesine ekle",
  "Favoriler",
  "taksit",
];

describe("src/utils/format-price.js", () => {
  describe("formatTryCurrency", () => {
    it("formats positive finite numbers as Turkish Lira without decimals", () => {
      expect(formatTryCurrency(1500)).toBe("₺1.500");
      expect(formatTryCurrency(800)).toBe("₺800");
      expect(formatTryCurrency(24500)).toBe("₺24.500");
    });

    it("returns '₺0' for 0, negative numbers, NaN, Infinity, null, undefined, empty string, or non-numeric values without throwing", () => {
      expect(formatTryCurrency(0)).toBe("₺0");
      expect(formatTryCurrency(-500)).toBe("₺0");
      expect(formatTryCurrency(Number.NaN)).toBe("₺0");
      expect(formatTryCurrency(Number.POSITIVE_INFINITY)).toBe("₺0");
      expect(formatTryCurrency(Number.NEGATIVE_INFINITY)).toBe("₺0");
      expect(formatTryCurrency(null)).toBe("₺0");
      expect(formatTryCurrency(undefined)).toBe("₺0");
      expect(formatTryCurrency("")).toBe("₺0");
      expect(formatTryCurrency("abc")).toBe("₺0");
      expect(formatTryCurrency({})).toBe("₺0");
    });
  });

  describe("formatProductPriceRange", () => {
    it("returns a single formatted price when priceMin === priceMax or priceMax <= priceMin or priceMax is missing/invalid", () => {
      expect(formatProductPriceRange(1500, 1500)).toBe("₺1.500");
      expect(formatProductPriceRange(800, 800)).toBe("₺800");
      expect(formatProductPriceRange(1500, 1200)).toBe("₺1.500");
      expect(formatProductPriceRange(1500, null)).toBe("₺1.500");
      expect(formatProductPriceRange(1500, undefined)).toBe("₺1.500");
      expect(formatProductPriceRange(1500, Number.NaN)).toBe("₺1.500");
    });

    it("returns a price range separated by ' – ' when priceMax > priceMin", () => {
      expect(formatProductPriceRange(1500, 2200)).toBe("₺1.500 – ₺2.200");
      expect(formatProductPriceRange(800, 950)).toBe("₺800 – ₺950");
    });
  });
});

describe("Breadcrumbs component", () => {
  it("renders nav[aria-label='Sayfa yolu'][data-testid='catalog-breadcrumbs'] with Anasayfa ('/') and current page 'Ürünlerimiz' when no category is given", () => {
    const indexed = indexCatalog(createFixtureCatalog());
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexed);

    renderWithProviders(<Breadcrumbs catalog={indexed} />, {
      initialEntries: ["/"],
      queryClient,
    });

    const nav = screen.getByTestId("catalog-breadcrumbs");
    expect(nav.tagName).toBe("NAV");
    expect(nav).toHaveAttribute("aria-label", "Sayfa yolu");

    const homeLink = within(nav).getByRole("link", { name: "Anasayfa" });
    expect(homeLink).toHaveAttribute("href", "/");

    const currentItem = within(nav).getByText("Ürünlerimiz");
    expect(currentItem).toHaveAttribute("aria-current", "page");
  });

  it("walks ancestor chain in root-to-leaf order on /kategori/led-avizeler (Anasayfa -> Aydınlatma -> Avize -> Led Avizeler)", () => {
    const indexed = indexCatalog(createFixtureCatalog());
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexed);

    renderWithProviders(
      <Breadcrumbs catalog={indexed} categorySlug="led-avizeler" />,
      {
        initialEntries: ["/kategori/led-avizeler"],
        queryClient,
      }
    );

    const nav = screen.getByTestId("catalog-breadcrumbs");

    const homeLink = within(nav).getByRole("link", { name: "Anasayfa" });
    expect(homeLink).toHaveAttribute("href", "/");

    const rootAncestorLink = within(nav).getByRole("link", {
      name: "Aydınlatma",
    });
    expect(rootAncestorLink).toHaveAttribute("href", "/kategori/aydinlatma");

    const parentAncestorLink = within(nav).getByRole("link", { name: "Avize" });
    expect(parentAncestorLink).toHaveAttribute("href", "/kategori/avize");

    const activeCategoryItem = within(nav).getByText("Led Avizeler");
    expect(activeCategoryItem).toHaveAttribute("aria-current", "page");
    expect(
      within(nav).queryByRole("link", { name: "Led Avizeler" })
    ).not.toBeInTheDocument();

    const textContent = nav.textContent || "";
    expect(textContent.indexOf("Anasayfa")).toBeLessThan(
      textContent.indexOf("Aydınlatma")
    );
    expect(textContent.indexOf("Aydınlatma")).toBeLessThan(
      textContent.indexOf("Avize")
    );
    expect(textContent.indexOf("Avize")).toBeLessThan(
      textContent.indexOf("Led Avizeler")
    );
  });

  it("terminates cleanly without an infinite loop on circular parentId references or broken parentId references", () => {
    const cyclicCatalog = indexCatalog({
      version: "2026-11-11-cycle",
      categories: [
        { id: 10, slug: "kat-a", name: "Kategori A", parentId: 20, count: 1 },
        { id: 20, slug: "kat-b", name: "Kategori B", parentId: 10, count: 1 },
        {
          id: 30,
          slug: "kopuk-kategori",
          name: "Kopuk Kategori",
          parentId: 9999,
          count: 1,
        },
      ],
      attributes: [],
      products: [],
    });

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], cyclicCatalog);

    const { unmount } = renderWithProviders(
      <Breadcrumbs catalog={cyclicCatalog} categorySlug="kat-a" />,
      {
        initialEntries: ["/kategori/kat-a"],
        queryClient,
      }
    );

    const nav = screen.getByTestId("catalog-breadcrumbs");
    expect(within(nav).getByRole("link", { name: "Anasayfa" })).toHaveAttribute(
      "href",
      "/"
    );
    expect(within(nav).getByText("Kategori A")).toHaveAttribute(
      "aria-current",
      "page"
    );
    unmount();

    renderWithProviders(
      <Breadcrumbs catalog={cyclicCatalog} categorySlug="kopuk-kategori" />,
      {
        initialEntries: ["/kategori/kopuk-kategori"],
        queryClient,
      }
    );

    const brokenNav = screen.getByTestId("catalog-breadcrumbs");
    expect(
      within(brokenNav).getByRole("link", { name: "Anasayfa" })
    ).toHaveAttribute("href", "/");
    expect(within(brokenNav).getByText("Kopuk Kategori")).toHaveAttribute(
      "aria-current",
      "page"
    );
  });
});

describe("ProductCard component", () => {
  const inStockProduct = {
    id: 101,
    slug: "istanbul-cember-led-avize",
    name: "İstanbul Çember LED Avize",
    sku: "PRBK-IST-101",
    inStock: true,
    priceMin: 1500,
    priceMax: 2200,
    images: ["istanbul-cember-led-avize/main.webp"],
  };

  const outOfStockProduct = {
    id: 103,
    slug: "klasik-siyah-avize",
    name: "Klasik Siyah Avize",
    sku: "PRBK-KLS-103",
    inStock: false,
    priceMin: 1500,
    priceMax: 1500,
    images: ["klasik-siyah-avize/main.webp"],
  };

  it("renders a single <li data-testid='product-card'> with link, lazy image, fallback error handler, title, SKU, formatted price, and in-stock badge", () => {
    renderWithProviders(
      <ul>
        <ProductCard product={inStockProduct} />
      </ul>
    );

    const card = screen.getByTestId("product-card");
    expect(card.tagName).toBe("LI");
    expect(card.querySelectorAll("li")).toHaveLength(0);

    const link = within(card).getByTestId("product-card-link");
    expect(link).toHaveAttribute("href", "/urun/istanbul-cember-led-avize");

    const img = within(card).getByRole("img", {
      name: "İstanbul Çember LED Avize",
    });
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute(
      "src",
      "/assets/istanbul-cember-led-avize/main.webp"
    );

    fireEvent.error(img);
    expect(img).toHaveAttribute("src", "https://picsum.photos/600/600");
    expect(img.dataset.fallbackApplied).toBe("true");

    expect(card).toHaveTextContent("İstanbul Çember LED Avize");
    expect(card).toHaveTextContent("PRBK-IST-101");

    const priceEl = within(card).getByTestId("product-card-price");
    expect(priceEl).toHaveTextContent("₺1.500 – ₺2.200");

    const stockBadge = within(card).getByTestId("product-stock-badge");
    expect(stockBadge).toHaveTextContent(/^Stokta$/);
    expect(
      within(card).queryByTestId("product-out-of-stock-badge")
    ).not.toBeInTheDocument();
  });

  it("renders product-out-of-stock-badge ('Stokta Yok') and omits product-stock-badge when inStock is false", () => {
    renderWithProviders(
      <ul>
        <ProductCard product={outOfStockProduct} />
      </ul>
    );

    const card = screen.getByTestId("product-card");
    expect(
      within(card).queryByTestId("product-stock-badge")
    ).not.toBeInTheDocument();

    const outOfStockBadge = within(card).getByTestId(
      "product-out-of-stock-badge"
    );
    expect(outOfStockBadge).toHaveTextContent(/^Stokta Yok$/);

    const textWithoutStoktaYok = (card.textContent || "").replace(
      /Stokta Yok/g,
      ""
    );
    expect(textWithoutStoktaYok).not.toMatch(/\bStokta\b/);

    const priceEl = within(card).getByTestId("product-card-price");
    expect(priceEl).toHaveTextContent("₺1.500");
  });

  it("never renders omitted e-commerce or comparison terms", () => {
    const { container } = renderWithProviders(
      <ul>
        <ProductCard product={inStockProduct} />
        <ProductCard product={outOfStockProduct} />
      </ul>
    );

    const text = container.textContent || "";
    OMITTED_TERMS.forEach((term) => {
      expect(text).not.toMatch(new RegExp(term, "i"));
    });
  });
});

describe("ListingToolbar component", () => {
  it("renders result count, filter summary, sort select with 3 options, and per-page selector with 9/12/18/24 buttons", () => {
    const onSortChange = vi.fn();
    const onPerPageChange = vi.fn();

    renderWithProviders(
      <ListingToolbar
        total={14}
        page={1}
        totalPages={2}
        sort="en-yeni"
        perPage={12}
        inStockOnly={false}
        onSortChange={onSortChange}
        onPerPageChange={onPerPageChange}
      />
    );

    const resultCount = screen.getByTestId("debug-result-count");
    expect(resultCount).toHaveTextContent("14 ürün bulundu");

    expect(screen.getByTestId("debug-filter-summary")).toBeInTheDocument();

    const sortSelect = screen.getByTestId("sort-select");
    expect(sortSelect.tagName).toBe("SELECT");
    expect(sortSelect).toHaveAttribute("aria-label", "Sıralama");
    expect(sortSelect).toHaveValue("en-yeni");

    const options = within(sortSelect).getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveValue("en-yeni");
    expect(options[0]).toHaveTextContent("En yeniye göre sırala");
    expect(options[1]).toHaveValue("fiyat-artan");
    expect(options[1]).toHaveTextContent(
      "Fiyata göre sırala: Düşükten yükseğe"
    );
    expect(options[2]).toHaveValue("fiyat-azalan");
    expect(options[2]).toHaveTextContent(
      "Fiyata göre sırala: Yüksekten düşüğe"
    );

    const perPageSelector = screen.getByTestId("per-page-selector");
    expect(perPageSelector).toHaveAttribute(
      "aria-label",
      "Sayfa başına ürün sayısı"
    );

    const btn9 = screen.getByTestId("per-page-option-9");
    const btn12 = screen.getByTestId("per-page-option-12");
    const btn18 = screen.getByTestId("per-page-option-18");
    const btn24 = screen.getByTestId("per-page-option-24");

    expect(btn9).toHaveAttribute("aria-pressed", "false");
    expect(btn12).toHaveAttribute("aria-pressed", "true");
    expect(btn18).toHaveAttribute("aria-pressed", "false");
    expect(btn24).toHaveAttribute("aria-pressed", "false");

    fireEvent.change(sortSelect, { target: { value: "fiyat-artan" } });
    expect(onSortChange).toHaveBeenCalledWith("fiyat-artan");

    fireEvent.click(btn24);
    expect(onPerPageChange).toHaveBeenCalledWith(24);
  });
});

describe("Pagination component", () => {
  it("renders nothing when totalPages <= 1", () => {
    const onPageChange = vi.fn();
    const { rerender } = renderWithProviders(
      <Pagination page={1} totalPages={1} onPageChange={onPageChange} />
    );

    expect(screen.queryByTestId("catalog-pagination")).not.toBeInTheDocument();

    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <Pagination page={1} totalPages={0} onPageChange={onPageChange} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.queryByTestId("catalog-pagination")).not.toBeInTheDocument();
  });

  it("renders prev, numbered page buttons, and next with correct disabled and aria-current states when totalPages > 1", () => {
    const onPageChange = vi.fn();
    const { rerender } = renderWithProviders(
      <Pagination page={1} totalPages={3} onPageChange={onPageChange} />
    );

    const nav = screen.getByTestId("catalog-pagination");
    expect(nav.tagName).toBe("NAV");
    expect(nav).toHaveAttribute("aria-label", "Sayfalama");

    const prevBtn = screen.getByTestId("pagination-prev");
    const nextBtn = screen.getByTestId("pagination-next");
    const page1Btn = screen.getByTestId("pagination-page-1");
    const page2Btn = screen.getByTestId("pagination-page-2");
    const page3Btn = screen.getByTestId("pagination-page-3");

    expect(prevBtn).toHaveTextContent("Önceki");
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toHaveTextContent("Sonraki");
    expect(nextBtn).not.toBeDisabled();

    expect(page1Btn).toHaveAttribute("aria-current", "page");
    expect(page2Btn).not.toHaveAttribute("aria-current");
    expect(page3Btn).not.toHaveAttribute("aria-current");

    fireEvent.click(page2Btn);
    expect(onPageChange).toHaveBeenCalledWith(2);

    fireEvent.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(2);

    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <Pagination page={3} totalPages={3} onPageChange={onPageChange} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByTestId("pagination-prev")).not.toBeDisabled();
    expect(screen.getByTestId("pagination-next")).toBeDisabled();
    expect(screen.getByTestId("pagination-page-3")).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByTestId("pagination-page-1")).not.toHaveAttribute(
      "aria-current"
    );

    fireEvent.click(screen.getByTestId("pagination-prev"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

describe("ProductListingPage integrated in App on /kategori/:slug", () => {
  it("renders category Turkish name heading, ancestor breadcrumbs, and sanitized category-seo-content on /kategori/led-avizeler", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexCatalog(createFixtureCatalog()));

    renderWithProviders(<App />, {
      initialEntries: ["/kategori/led-avizeler"],
      queryClient,
    });

    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "13 ürün bulundu"
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Led Avizeler" })
    ).toBeInTheDocument();

    const breadcrumbs = screen.getByTestId("catalog-breadcrumbs");
    expect(
      within(breadcrumbs).getByRole("link", { name: "Aydınlatma" })
    ).toHaveAttribute("href", "/kategori/aydinlatma");
    expect(
      within(breadcrumbs).getByRole("link", { name: "Avize" })
    ).toHaveAttribute("href", "/kategori/avize");
    expect(within(breadcrumbs).getByText("Led Avizeler")).toHaveAttribute(
      "aria-current",
      "page"
    );

    const seoSection = screen.getByTestId("category-seo-content");
    expect(seoSection.tagName).toBe("SECTION");
    expect(seoSection).toHaveAttribute("aria-label", "Kategori açıklaması");
    expect(seoSection).toHaveTextContent("Modern Led Avize Modelleri");
    expect(seoSection).toHaveTextContent(
      "Enerji tasarruflu salon ve mutfak LED avizeleri."
    );
    expect(seoSection.textContent).not.toMatch(/\[embed\]|\[\/embed\]/i);
    expect(seoSection.textContent).not.toContain("youtube.com");
  });

  it("omits category-seo-content when category descriptionHtml is empty, whitespace-only, or contains only [embed]...[/embed] and empty tags", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexCatalog(createFixtureCatalog()));

    // Category 'avize' has descriptionHtml: "<p>[embed]https://youtu.be/xyz987[/embed]</p><p>   </p>"
    const { unmount } = renderWithProviders(<App />, {
      initialEntries: ["/kategori/avize"],
      queryClient,
    });

    await screen.findByTestId("debug-result-count");
    expect(
      screen.queryByTestId("category-seo-content")
    ).not.toBeInTheDocument();
    unmount();

    // Category 'aplikler' has descriptionHtml: ""
    renderWithProviders(<App />, {
      initialEntries: ["/kategori/aplikler"],
      queryClient,
    });

    await screen.findByTestId("debug-result-count");
    expect(
      screen.queryByTestId("category-seo-content")
    ).not.toBeInTheDocument();
  });

  it("updates displayed products and URL search params when changing sort, perPage, or pagination page, and resets page to 1 on sort or perPage change", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexCatalog(createFixtureCatalog()));

    renderWithProviders(<App />, {
      initialEntries: ["/kategori/aydinlatma"],
      queryClient,
      includeLocationProbe: true,
    });

    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "14 ürün bulundu"
    );

    // Initially page 1 with 12 items, sorted by newest (Ürün Model 14 first)
    let cards = screen.getAllByTestId("product-card");
    expect(cards).toHaveLength(12);
    expect(cards[0]).toHaveTextContent("Ürün Model 14");

    // Navigate to page 2
    fireEvent.click(screen.getByTestId("pagination-page-2"));

    cards = await screen.findAllByTestId("product-card");
    expect(cards).toHaveLength(2);
    expect(screen.getByTestId("location-probe")).toHaveTextContent(
      "/kategori/aydinlatma?sayfa=2"
    );

    // Changing sort to fiyat-artan resets page to 1 and updates sirala param
    fireEvent.change(screen.getByTestId("sort-select"), {
      target: { value: "fiyat-artan" },
    });

    cards = await screen.findAllByTestId("product-card");
    expect(cards).toHaveLength(12);
    expect(cards[0]).toHaveTextContent("Ürün Model 1");
    expect(screen.getByTestId("location-probe").textContent).toContain(
      "sirala=fiyat-artan"
    );
    expect(screen.getByTestId("location-probe").textContent).not.toContain(
      "sayfa=2"
    );

    // Navigate to page 2 again, then click per-page 9 -> resets page to 1 and sets goster=9
    fireEvent.click(screen.getByTestId("pagination-page-2"));
    expect(screen.getByTestId("location-probe").textContent).toContain(
      "sayfa=2"
    );

    fireEvent.click(screen.getByTestId("per-page-option-9"));
    cards = await screen.findAllByTestId("product-card");
    expect(cards).toHaveLength(9);
    expect(screen.getByTestId("location-probe").textContent).toContain(
      "goster=9"
    );
    expect(screen.getByTestId("location-probe").textContent).not.toContain(
      "sayfa=2"
    );
  });

  it("renders empty-catalog-results ('kriterlere uygun ürün bulunamadı') when no products match or when visiting an unknown category slug /kategori/olmayan-kategori", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexCatalog(createFixtureCatalog()));

    // 1. Unknown category slug
    const { unmount } = renderWithProviders(<App />, {
      initialEntries: ["/kategori/olmayan-kategori"],
      queryClient,
    });

    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "0 ürün bulundu"
    );
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId("catalog-breadcrumbs")).toBeInTheDocument();

    const emptyList = screen.getByTestId("debug-product-list");
    expect(emptyList).toBeInTheDocument();
    expect(within(emptyList).queryAllByTestId("product-card")).toHaveLength(0);

    const emptyNotice = screen.getByTestId("empty-catalog-results");
    expect(emptyNotice).toHaveTextContent(/kriterlere uygun ürün bulunamadı/i);
    expect(screen.queryByTestId("catalog-pagination")).not.toBeInTheDocument();
    unmount();

    // 2. Known category with 0 matching products
    renderWithProviders(<App />, {
      initialEntries: ["/kategori/masa-lambalari"],
      queryClient,
    });

    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "0 ürün bulundu"
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Masa Lambaları" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("empty-catalog-results")).toHaveTextContent(
      /kriterlere uygun ürün bulunamadı/i
    );
  });

  it("supports direct ProductListingPage rendering inside Routes and never renders omitted e-commerce terms", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexCatalog(createFixtureCatalog()));

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/kategori/led-avizeler"]}>
          <Routes>
            <Route path="/kategori/:slug" element={<ProductListingPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await screen.findByTestId("debug-result-count");

    const text = container.textContent || "";
    OMITTED_TERMS.forEach((term) => {
      expect(text).not.toMatch(new RegExp(term, "i"));
    });
  });
});

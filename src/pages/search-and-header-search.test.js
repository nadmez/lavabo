import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import HeaderSearch from "@/components/layout/HeaderSearch";
import SearchResultsPage from "@/pages/SearchResultsPage";
import Header from "@/components/layout/Header";
import App from "@/App";
import Breadcrumbs from "@/components/catalog/Breadcrumbs";
import { indexCatalog } from "@/data/catalog-query";

const OMITTED_TERMS = [
  "Sepete Ekle",
  "Satın Al",
  "Karşılaştır",
  "Favoriler",
  "taksit",
];

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

function createPhase9FixtureCatalog(overrides = {}) {
  const categories = [
    {
      id: 1,
      slug: "aydinlatma",
      name: "Aydınlatma",
      parentId: null,
      count: 14,
      descriptionHtml: "<p>Genel aydınlatma ürünleri</p>",
    },
    {
      id: 2,
      slug: "led-avizeler",
      name: "Led Avizeler",
      parentId: 1,
      count: 11,
      descriptionHtml: "<p>Modern LED avizeler</p>",
    },
    {
      id: 3,
      slug: "aplikler",
      name: "Aplikler",
      parentId: 1,
      count: 3,
      descriptionHtml: "",
    },
  ];

  const attributes = [
    {
      slug: "avize-rengi",
      name: "Çerçeve Rengi",
      terms: [
        { slug: "siyah-renk", name: "Siyah", swatch: "#18181b" },
        { slug: "gold-renk", name: "Gold", swatch: "#d4af37" },
      ],
    },
    {
      slug: "urun-boyutu",
      name: "Ürün Boyutu",
      terms: [
        { slug: "40-cm", name: "40 cm" },
        { slug: "60-cm", name: "60 cm" },
      ],
    },
  ];

  // 14 products:
  // - 8 products contain "İstanbul" in name (num 1..8) so searching "İSTANBUL" or "istanbul" yields 8 matches (> 6 cap in live dropdown)
  // - 3 products contain "Aplik" in name (num 9..11) so searching "aplık" or "APLIK" yields 3 matches
  // - 3 products contain "Sarkıt" in name (num 12..14) so searching "sarkit" yields 3 matches
  // - All 14 products contain "Avize" or "Aydınlatma" or "PRBK-" SKU so searching "PRBK-" yields 14 matches (> 12 for pagination)
  const products = Array.from({ length: 14 }, (_, idx) => {
    const num = idx + 1;
    let name;
    let slug;
    let sku;
    let categoryId = 2;

    if (num <= 8) {
      name = `İstanbul Çember LED Avize ${num}`;
      slug = `istanbul-cember-led-avize-${num}`;
      sku = `PRBK-IST-${String(num).padStart(3, "0")}`;
    } else if (num <= 11) {
      name = `Modern Duvar Aplik Model ${num}`;
      slug = `modern-duvar-aplik-model-${num}`;
      sku = `PRBK-APL-${String(num).padStart(3, "0")}`;
      categoryId = 3;
    } else {
      name = `Sarkıt Lineer Avize ${num}`;
      slug = `sarkit-lineer-avize-${num}`;
      sku = `PRBK-SRK-${String(num).padStart(3, "0")}`;
    }

    const priceMin = num * 100 + 1000;
    const priceMax = num % 2 === 0 ? priceMin + 500 : priceMin;

    return {
      id: 100 + num,
      slug,
      name,
      sku,
      inStock: num % 4 !== 0,
      createdAt: `2026-02-${String(num).padStart(2, "0")}T10:00:00.000Z`,
      categoryIds: [categoryId],
      priceMin,
      priceMax,
      images: [`${slug}/main.webp`],
      attributes: {
        "avize-rengi": num % 2 === 0 ? ["siyah-renk"] : ["gold-renk"],
        "urun-boyutu": num <= 7 ? ["40-cm"] : ["60-cm"],
      },
      variants: [],
    };
  });

  return {
    version: "2026-11-12-phase9",
    categories: overrides.categories || categories,
    attributes: overrides.attributes || attributes,
    products: overrides.products || products,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HeaderSearch and Header live search integration", () => {
  it("renders accessible search form, input, and trigger inside site-header", () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase9FixtureCatalog())
    );

    renderWithProviders(<Header />, { queryClient });

    const header = screen.getByTestId("site-header");
    const form = within(header).getByTestId("header-search-form");
    expect(form.tagName).toBe("FORM");
    expect(form).toHaveAttribute("role", "search");

    const input = within(form).getByTestId("header-search-input");
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveAttribute("type", "search");
    expect(input).toHaveAttribute("aria-label", "Ürün veya stok kodu ara");
    expect(input).toHaveAttribute(
      "placeholder",
      "Aradığınız ürünleri görmek için yazmaya başlayın..."
    );

    const trigger = within(form).getByTestId("header-search-trigger");
    expect(trigger).toHaveAttribute("aria-label", "Ürün ara");

    expect(
      screen.queryByTestId("header-search-dropdown")
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("header-search-clear")).not.toBeInTheDocument();
  });

  it("does not throw without QueryClientProvider, and clicking the search icon opens the text box without navigating", () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={["/"]}>
        <HeaderSearch />
        <Routes>
          <Route path="/" element={<div data-testid="route-home" />} />
          <Route path="/arama" element={<div data-testid="route-search" />} />
        </Routes>
      </MemoryRouter>
    );

    const input = screen.getByTestId("header-search-input");
    expect(input).not.toBeVisible();
    fireEvent.change(input, { target: { value: "istanbul" } });
    fireEvent.change(input, { target: { value: "   " } });

    expect(
      screen.queryByTestId("header-search-dropdown")
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("header-search-clear")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("header-search-trigger"));
    expect(input).toBeVisible();
    expect(screen.getByTestId("route-home")).toBeInTheDocument();
    expect(screen.queryByTestId("route-search")).not.toBeInTheDocument();

    fireEvent.submit(screen.getByTestId("header-search-form"));
    expect(screen.getByTestId("route-search")).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Header />
        <LocationProbe />
      </MemoryRouter>
    );

    const headerInput = screen.getByTestId("header-search-input");
    expect(headerInput).not.toBeVisible();
    fireEvent.click(screen.getByTestId("header-search-trigger"));
    expect(headerInput).toBeVisible();
    expect(screen.getByTestId("location-probe")).toHaveTextContent(/^\/$/);
  });

  it("opens live dropdown on Turkish and SKU queries, displaying thumbnail, title, SKU, formatted price, and view-all link", () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase9FixtureCatalog())
    );

    renderWithProviders(<Header />, { queryClient });

    const input = screen.getByTestId("header-search-input");

    // 1. Turkish diacritic-insensitive query "aplık" matches "Modern Duvar Aplik Model ..." (3 products)
    fireEvent.change(input, { target: { value: "aplık" } });

    const dropdown = screen.getByTestId("header-search-dropdown");
    expect(dropdown).toHaveAttribute("role", "region");
    expect(dropdown).toHaveAttribute("aria-label", "Canlı arama sonuçları");

    const resultsList = within(dropdown).getByTestId(
      "header-search-results-list"
    );
    expect(resultsList.tagName).toBe("UL");

    const items = within(resultsList).getAllByTestId(
      "header-search-result-item"
    );
    expect(items).toHaveLength(3);

    //Newest first: Model 11 (num=11, odd -> priceMin=2100, priceMax=2100 -> "₺2.100")
    // Model 10 (num=10, even -> priceMin=2000, priceMax=2500 -> "₺2.000 – ₺2.500")
    const link11 = within(dropdown).getByTestId(
      "header-search-result-link-modern-duvar-aplik-model-11"
    );
    expect(link11).toHaveAttribute("href", "/urun/modern-duvar-aplik-model-11");
    expect(link11).toHaveTextContent("Modern Duvar Aplik Model 11");
    expect(link11).toHaveTextContent("PRBK-APL-011");
    expect(link11).toHaveTextContent("₺2.100");

    const img11 = within(link11).getByRole("img", {
      name: "Modern Duvar Aplik Model 11",
    });
    expect(img11).toHaveAttribute(
      "src",
      "/assets/modern-duvar-aplik-model-11/main.webp"
    );
    fireEvent.error(img11);
    expect(img11.getAttribute("src")).toContain("https://picsum.photos/");

    const link10 = within(dropdown).getByTestId(
      "header-search-result-link-modern-duvar-aplik-model-10"
    );
    expect(link10).toHaveTextContent("₺2.000 – ₺2.500");

    const viewAll = within(dropdown).getByTestId("header-search-view-all");
    expect(viewAll).toHaveTextContent("Tüm sonuçları gör (3)");
    expect(viewAll).toHaveAttribute(
      "href",
      `/arama?q=${encodeURIComponent("aplık")}`
    );

    // 2. Partial SKU query (case-insensitive) "prbk-apl-009" matches Model 9
    fireEvent.change(input, { target: { value: "prbk-apl-009" } });
    expect(
      within(screen.getByTestId("header-search-dropdown")).getAllByTestId(
        "header-search-result-item"
      )
    ).toHaveLength(1);
    expect(
      screen.getByTestId("header-search-result-link-modern-duvar-aplik-model-9")
    ).toHaveTextContent("PRBK-APL-009");
  });

  it("caps dropdown list to 6 items when more than 6 products match while header-search-view-all displays full total count", () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase9FixtureCatalog())
    );

    renderWithProviders(<Header />, { queryClient });

    const input = screen.getByTestId("header-search-input");
    // "İSTANBUL" matches 8 products in fixture catalog
    fireEvent.change(input, { target: { value: "İSTANBUL" } });

    const dropdown = screen.getByTestId("header-search-dropdown");
    const items = within(dropdown).getAllByTestId("header-search-result-item");
    expect(items).toHaveLength(6);

    const viewAll = within(dropdown).getByTestId("header-search-view-all");
    expect(viewAll).toHaveTextContent("Tüm sonuçları gör (8)");
    expect(viewAll).toHaveAttribute(
      "href",
      `/arama?q=${encodeURIComponent("İSTANBUL")}`
    );
  });

  it("renders header-search-no-results ('Sonuç bulunamadı') and omits list and view-all link when 0 products match", () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase9FixtureCatalog())
    );

    renderWithProviders(<Header />, { queryClient });

    const input = screen.getByTestId("header-search-input");
    fireEvent.change(input, { target: { value: "olmayan-urun-xyz-999" } });

    const dropdown = screen.getByTestId("header-search-dropdown");
    const noResults = within(dropdown).getByTestId("header-search-no-results");
    expect(noResults.tagName).toBe("P");
    expect(noResults).toHaveTextContent("Sonuç bulunamadı");

    expect(
      within(dropdown).queryByTestId("header-search-results-list")
    ).not.toBeInTheDocument();
    expect(
      within(dropdown).queryByTestId("header-search-view-all")
    ).not.toBeInTheDocument();
  });

  it("renders header-search-clear when input is non-empty and clears input and closes dropdown on click", () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase9FixtureCatalog())
    );

    renderWithProviders(<Header />, { queryClient });

    const input = screen.getByTestId("header-search-input");
    expect(input).toHaveClass("hide-search-cancel");
    expect(screen.queryByTestId("header-search-clear")).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "aplik" } });
    expect(screen.getByTestId("header-search-dropdown")).toBeInTheDocument();

    const clearBtn = screen.getByTestId("header-search-clear");
    expect(clearBtn).toHaveAttribute("type", "button");
    expect(clearBtn).toHaveAttribute("aria-label", "Aramayı temizle");

    fireEvent.click(clearBtn);

    expect(input).toHaveValue("");
    expect(screen.queryByTestId("header-search-clear")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("header-search-dropdown")
    ).not.toBeInTheDocument();
  });

  it("submitting the form navigates to '/arama?q=<encoded>' when query is non-empty and closes the dropdown", () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase9FixtureCatalog())
    );

    renderWithProviders(<Header />, {
      queryClient,
      includeLocationProbe: true,
    });

    const input = screen.getByTestId("header-search-input");
    fireEvent.change(input, { target: { value: "  İSTANBUL avize  " } });
    expect(screen.getByTestId("header-search-dropdown")).toBeInTheDocument();

    fireEvent.submit(screen.getByTestId("header-search-form"));

    expect(
      screen.queryByTestId("header-search-dropdown")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("location-probe")).toHaveTextContent(
      `/arama?q=${encodeURIComponent("İSTANBUL avize")}`
    );
  });

  it("closes header-search-dropdown when clicking a result link, clicking header-search-view-all, pressing Escape, or clicking outside header-search-form", () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase9FixtureCatalog())
    );

    renderWithProviders(<Header />, {
      queryClient,
      includeLocationProbe: true,
    });

    const input = screen.getByTestId("header-search-input");

    // 1. Clicking a result link closes dropdown and navigates to /urun/:slug
    fireEvent.change(input, { target: { value: "aplik" } });
    expect(screen.getByTestId("header-search-dropdown")).toBeInTheDocument();
    fireEvent.click(
      screen.getByTestId(
        "header-search-result-link-modern-duvar-aplik-model-11"
      )
    );
    expect(
      screen.queryByTestId("header-search-dropdown")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("location-probe")).toHaveTextContent(
      "/urun/modern-duvar-aplik-model-11"
    );

    // 2. Clicking header-search-view-all closes dropdown and navigates to /arama?q=...
    fireEvent.change(input, { target: { value: "sarkıt" } });
    expect(screen.getByTestId("header-search-dropdown")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("header-search-view-all"));
    expect(
      screen.queryByTestId("header-search-dropdown")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("location-probe")).toHaveTextContent(
      `/arama?q=${encodeURIComponent("sarkıt")}`
    );

    // 3. Pressing Escape key closes dropdown
    fireEvent.change(input, { target: { value: "istanbul" } });
    expect(screen.getByTestId("header-search-dropdown")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.queryByTestId("header-search-dropdown")
    ).not.toBeInTheDocument();

    // 4. Clicking outside header-search-form closes dropdown
    fireEvent.change(input, { target: { value: "aplik" } });
    expect(screen.getByTestId("header-search-dropdown")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    fireEvent.click(document.body);
    expect(
      screen.queryByTestId("header-search-dropdown")
    ).not.toBeInTheDocument();
  });
});

describe("Breadcrumbs fallbackLabel when categorySlug is empty", () => {
  it("renders fallbackLabel ('Arama Sonuçları') instead of 'Ürünlerimiz' when categorySlug is omitted", () => {
    const indexed = indexCatalog(createPhase9FixtureCatalog());
    renderWithProviders(
      <Breadcrumbs catalog={indexed} fallbackLabel="Arama Sonuçları" />,
      { initialEntries: ["/arama"] }
    );

    const nav = screen.getByTestId("catalog-breadcrumbs");
    expect(within(nav).getByRole("link", { name: "Anasayfa" })).toHaveAttribute(
      "href",
      "/"
    );
    const current = within(nav).getByText("Arama Sonuçları");
    expect(current).toHaveAttribute("aria-current", "page");
  });
});

describe("SearchResultsPage integrated in App on /arama", () => {
  it("preserves search-results-placeholder synchronously while loading, includes trimmed q when non-empty, and never outputs 'undefined' or 'null'", () => {
    // Pending query (never resolves during synchronous assertion)
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () => new Promise(() => {})
    );

    const { unmount } = renderWithProviders(<App />, {
      initialEntries: ["/arama?q=sarkit"],
    });

    const loadingWithQuery = screen.getByTestId("search-results-placeholder");
    expect(loadingWithQuery).toBeInTheDocument();
    expect(loadingWithQuery).toHaveTextContent("sarkit");
    expect(loadingWithQuery.textContent).not.toMatch(/undefined|null/i);
    unmount();

    const { unmount: unmountEmpty } = renderWithProviders(<App />, {
      initialEntries: ["/arama"],
    });
    const loadingEmpty = screen.getByTestId("search-results-placeholder");
    expect(loadingEmpty).toBeInTheDocument();
    expect(loadingEmpty.textContent).not.toMatch(/undefined|null/i);
    unmountEmpty();

    renderWithProviders(<App />, {
      initialEntries: ["/arama?q=   "],
    });
    const loadingWhitespace = screen.getByTestId("search-results-placeholder");
    expect(loadingWhitespace).toBeInTheDocument();
    expect(loadingWhitespace.textContent).not.toMatch(/undefined|null/i);
  });

  it("renders role='alert' inside search-results-placeholder when catalog loading fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("Ağ bağlantısı kesildi")
    );

    renderWithProviders(<App />, {
      initialEntries: ["/arama?q=istanbul"],
    });

    const placeholder = screen.getByTestId("search-results-placeholder");
    const alert = await within(placeholder).findByRole("alert");
    expect(alert).toHaveTextContent(/Katalog verileri yüklenemedi:/i);
    expect(alert).toHaveTextContent(/Ağ bağlantısı kesildi/i);
  });

  it("renders Breadcrumbs ('Anasayfa' -> 'Arama Sonuçları'), dynamic h1 heading, and inline search form on /arama", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase9FixtureCatalog())
    );

    // 1. With non-empty query ?q=aplık
    const { unmount } = renderWithProviders(<App />, {
      initialEntries: ["/arama?q=apl%C4%B1k"],
      queryClient,
    });

    const wrapper = screen.getByTestId("search-results-placeholder");
    expect(wrapper).toBeInTheDocument();

    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "3 ürün bulundu"
    );

    const breadcrumbs = screen.getByTestId("catalog-breadcrumbs");
    expect(
      within(breadcrumbs).getByRole("link", { name: "Anasayfa" })
    ).toHaveAttribute("href", "/");
    expect(within(breadcrumbs).getByText("Arama Sonuçları")).toHaveAttribute(
      "aria-current",
      "page"
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: '"aplık" için arama sonuçları',
      })
    ).toBeInTheDocument();

    const searchForm = screen.getByTestId("search-page-form");
    const searchInput = within(searchForm).getByTestId("search-page-input");
    expect(searchInput).toHaveAttribute("type", "search");
    expect(searchInput).toHaveAttribute("aria-label", "Arama terimi");
    expect(searchInput).toHaveValue("aplık");
    expect(
      within(searchForm).getByTestId("search-page-submit")
    ).toBeInTheDocument();

    unmount();

    // 2. With empty query /arama
    renderWithProviders(<App />, {
      initialEntries: ["/arama"],
      queryClient,
    });

    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "14 ürün bulundu"
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Arama Sonuçları" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("search-page-input")).toHaveValue("");
  });

  it("submitting search-page-form updates ?q= in URL search params to trimmed value and resets page to 1", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase9FixtureCatalog())
    );

    renderWithProviders(<App />, {
      initialEntries: ["/arama?q=PRBK-&sayfa=2"],
      queryClient,
      includeLocationProbe: true,
    });

    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "14 ürün bulundu"
    );
    expect(screen.getAllByTestId("product-card")).toHaveLength(2);
    expect(screen.getByTestId("location-probe").textContent).toContain(
      "sayfa=2"
    );

    const searchInput = screen.getByTestId("search-page-input");
    expect(searchInput).toHaveValue("PRBK-");

    fireEvent.change(searchInput, { target: { value: "  İSTANBUL  " } });
    fireEvent.submit(screen.getByTestId("search-page-form"));

    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "8 ürün bulundu"
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: '"İSTANBUL" için arama sonuçları',
      })
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("product-card")).toHaveLength(8);

    const probeText = screen.getByTestId("location-probe").textContent || "";
    expect(probeText).toContain(`q=${encodeURIComponent("İSTANBUL")}`);
    expect(probeText).not.toContain("sayfa=2");
  });

  it("reuses FilterSidebar, ListingToolbar, ActiveFilterChips, ProductCard grid with quick view, empty state, Pagination, and MobileFilterDrawer", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase9FixtureCatalog())
    );

    const { unmount } = renderWithProviders(<App />, {
      initialEntries: ["/arama?q=PRBK-"],
      queryClient,
      includeLocationProbe: true,
    });

    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "14 ürün bulundu"
    );

    // Desktop FilterSidebar
    const sidebar = screen.getByTestId("desktop-filter-sidebar");
    expect(sidebar).toHaveAttribute("aria-label", "Ürün filtreleri");
    expect(
      within(sidebar).queryByTestId("filter-category-tree")
    ).not.toBeInTheDocument();
    expect(
      within(sidebar).getByTestId("filter-in-stock-checkbox")
    ).toBeInTheDocument();

    // ProductCard grid & Pagination (14 items -> 12 on page 1, 2 on page 2)
    const productList = screen.getByTestId("debug-product-list");
    expect(within(productList).getAllByTestId("product-card")).toHaveLength(12);
    expect(screen.getByTestId("catalog-pagination")).toBeInTheDocument();

    // Quick view modal opens from a product card in search results
    fireEvent.click(
      screen.getByTestId("quick-view-trigger-sarkit-lineer-avize-14")
    );
    expect(screen.getByTestId("quick-view-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("quick-view-close"));
    expect(screen.queryByTestId("quick-view-modal")).not.toBeInTheDocument();

    // MobileFilterDrawer opens via ListingToolbar trigger
    fireEvent.click(screen.getByTestId("mobile-filter-open"));
    expect(screen.getByTestId("mobile-filter-drawer")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("mobile-filter-close"));
    expect(
      screen.queryByTestId("mobile-filter-drawer")
    ).not.toBeInTheDocument();

    unmount();

    // Empty state when 0 products match search query
    renderWithProviders(<App />, {
      initialEntries: ["/arama?q=hic-olmayan-urun-999"],
      queryClient,
    });

    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "0 ürün bulundu"
    );
    const emptyState = screen.getByTestId("empty-catalog-results");
    expect(emptyState).toHaveTextContent(
      "Aradığınız kriterlere uygun ürün bulunamadı."
    );
  });

  it("clears inStockOnly and attributes on 'Filtreleri temizle' while preserving search (q), sort (sirala), and perPage (goster)", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase9FixtureCatalog())
    );

    renderWithProviders(<App />, {
      initialEntries: [
        "/arama?q=istanbul&avize-rengi=siyah-renk&urun-boyutu=40-cm&stok=1&sirala=fiyat-artan&goster=9&sayfa=1",
      ],
      queryClient,
      includeLocationProbe: true,
    });

    // Among İstanbul products 1..8:
    // - 40-cm: 1..7
    // - siyah-renk (even): 2, 4, 6
    // - inStock (num % 4 !== 0): 2, 6 -> 2 products
    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "2 ürün bulundu"
    );

    const chips = screen.getByTestId("active-filter-chips");
    expect(
      within(chips).getByTestId("active-filter-chip-in-stock")
    ).toBeInTheDocument();
    expect(
      within(chips).getByTestId("active-filter-chip-avize-rengi-siyah-renk")
    ).toBeInTheDocument();
    expect(
      within(chips).getByTestId("active-filter-chip-urun-boyutu-40-cm")
    ).toBeInTheDocument();

    fireEvent.click(within(chips).getByTestId("clear-all-filters"));

    // All 8 İstanbul products now match
    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "8 ürün bulundu"
    );
    expect(screen.queryByTestId("active-filter-chips")).not.toBeInTheDocument();

    const finalUrl = screen.getByTestId("location-probe").textContent || "";
    expect(finalUrl).toContain("q=istanbul");
    expect(finalUrl).toContain("sirala=fiyat-artan");
    expect(finalUrl).toContain("goster=9");
    expect(finalUrl).not.toContain("stok=");
    expect(finalUrl).not.toContain("avize-rengi=");
    expect(finalUrl).not.toContain("urun-boyutu=");
  });

  it("supports direct SearchResultsPage rendering and never renders omitted e-commerce terms across HeaderSearch and SearchResultsPage", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase9FixtureCatalog())
    );

    const { container } = renderWithProviders(
      <>
        <Header />
        <SearchResultsPage />
      </>,
      {
        initialEntries: ["/arama?q=istanbul"],
        queryClient,
      }
    );

    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "8 ürün bulundu"
    );

    fireEvent.change(screen.getByTestId("header-search-input"), {
      target: { value: "istanbul" },
    });
    await waitFor(() => {
      expect(screen.getByTestId("header-search-dropdown")).toBeInTheDocument();
    });

    const text = container.textContent || "";
    OMITTED_TERMS.forEach((term) => {
      expect(text).not.toMatch(new RegExp(term, "i"));
    });
  });
});

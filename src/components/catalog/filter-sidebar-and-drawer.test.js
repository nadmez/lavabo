import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import FilterSidebar from "@/components/catalog/FilterSidebar";
import ActiveFilterChips from "@/components/catalog/ActiveFilterChips";
import MobileFilterDrawer from "@/components/catalog/MobileFilterDrawer";
import ListingToolbar from "@/components/catalog/ListingToolbar";
import App from "@/App";
import { indexCatalog, queryProducts } from "@/data/catalog-query";

const OMITTED_TERMS = [
  "Sepete Ekle",
  "Satın Al",
  "Karşılaştır",
  "İstek listesine ekle",
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

function createPhase6FixtureCatalog(overrides = {}) {
  const baseCategories = [
    {
      id: 1,
      slug: "aydinlatma",
      name: "Aydınlatma",
      parentId: null,
      count: 14,
      descriptionHtml: "<p>Aydınlatma kategorisi</p>",
    },
    {
      id: 2,
      slug: "avize",
      name: "Avize",
      parentId: 1,
      count: 13,
      descriptionHtml: "",
    },
    {
      id: 3,
      slug: "led-avizeler",
      name: "Led Avizeler",
      parentId: 2,
      count: 12,
      descriptionHtml: "<p>Modern LED avizeler</p>",
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
      descriptionHtml: "",
    },
  ];

  const baseAttributes = [
    {
      slug: "avize-rengi",
      name: "Çerçeve Rengi",
      terms: [
        { slug: "siyah-renk", name: "Siyah", swatch: "#18181b" },
        { slug: "gold-renk", name: "Gold", swatch: "#d4af37" },
        { slug: "krom-renk", name: "Krom", swatch: "#cbd5e1" },
      ],
    },
    {
      slug: "urun-boyutu",
      name: "Ürün Boyutu",
      terms: [
        { slug: "40-cm", name: "40 cm" },
        { slug: "60-cm", name: "60 cm" },
        { slug: "100-cm", name: "100 cm" },
      ],
    },
    {
      slug: "aydinlatma-rengi",
      name: "Aydınlatma Rengi",
      terms: [
        { slug: "3-renk", name: "3 Renk (Günışığı / Beyaz / Sarı)" },
        { slug: "gunisigi", name: "Günışığı" },
      ],
    },
  ];

  // 14 products:
  // - num 1..13 in category 3 (led-avizeler), num 14 in category 4 (aplikler)
  // - even num -> siyah-renk (7 products: 2,4,6,8,10,12,14)
  // - odd num -> gold-renk (7 products: 1,3,5,7,9,11,13)
  // - krom-renk -> 0 products
  // - num 1..6 -> 40-cm (6 products)
  // - num 7..14 -> 60-cm (8 products)
  // - 100-cm -> 0 products
  // - num % 3 === 0 -> gunisigi (3,6,9,12 -> 4 products), others -> 3-renk (10 products)
  // - num % 4 === 0 -> out of stock (4,8,12 -> 3 out of stock, 11 in stock)
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
        "urun-boyutu": num <= 6 ? ["40-cm"] : ["60-cm"],
        "aydinlatma-rengi": num % 3 === 0 ? ["gunisigi"] : ["3-renk"],
      },
    };
  });

  return {
    version: "2026-11-12-phase6",
    categories: overrides.categories || baseCategories,
    attributes: overrides.attributes || baseAttributes,
    products: overrides.products || baseProducts,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FilterSidebar component", () => {
  it("does not render a Kategoriler tree and lists Sadece stoktakiler above the current category's attribute filters", () => {
    const catalog = indexCatalog(createPhase6FixtureCatalog());
    const { facets } = queryProducts(catalog, {
      categorySlug: "led-avizeler",
    });

    renderWithProviders(
      <FilterSidebar
        catalog={catalog}
        facets={facets}
        categorySlug="led-avizeler"
        inStockOnly={false}
        attributes={{}}
        onToggleInStock={vi.fn()}
        onToggleAttributeTerm={vi.fn()}
      />
    );

    expect(
      screen.queryByTestId("filter-category-tree")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Kategoriler" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("filter-category-link-led-avizeler")
    ).not.toBeInTheDocument();

    const stockCheckbox = screen.getByTestId("filter-in-stock-checkbox");
    const colorGroup = screen.getByTestId("filter-attribute-group-avize-rengi");
    expect(
      stockCheckbox.compareDocumentPosition(colorGroup) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(stockCheckbox.closest("label")).toHaveTextContent(
      "Sadece stoktakiler"
    );
  });

  it("renders 'Sadece stoktakiler' checkbox with inStockCount, disables when inStockCount === 0 and !inStockOnly, and calls onToggleInStock(!inStockOnly)", () => {
    const catalog = indexCatalog(createPhase6FixtureCatalog());
    const { facets } = queryProducts(catalog, {});
    const onToggleInStock = vi.fn();

    const { rerender } = renderWithProviders(
      <FilterSidebar
        catalog={catalog}
        facets={facets}
        categorySlug=""
        inStockOnly={false}
        attributes={{}}
        onToggleInStock={onToggleInStock}
        onToggleAttributeTerm={vi.fn()}
      />
    );

    const checkbox = screen.getByTestId("filter-in-stock-checkbox");
    expect(checkbox).toHaveAttribute("type", "checkbox");
    expect(checkbox).not.toBeChecked();
    expect(checkbox).not.toBeDisabled();

    const label = checkbox.closest("label");
    expect(label).not.toBeNull();
    expect(label).toHaveTextContent("Sadece stoktakiler");
    expect(label).toHaveTextContent("(11)");

    fireEvent.click(checkbox);
    expect(onToggleInStock).toHaveBeenCalledWith(true);

    // When inStockCount === 0 and !inStockOnly -> disabled
    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <FilterSidebar
            catalog={catalog}
            facets={{ ...facets, inStockCount: 0 }}
            categorySlug=""
            inStockOnly={false}
            attributes={{}}
            onToggleInStock={onToggleInStock}
            onToggleAttributeTerm={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByTestId("filter-in-stock-checkbox")).toBeDisabled();
    expect(
      screen.getByTestId("filter-in-stock-checkbox").closest("label")
    ).toHaveTextContent("(0)");

    // When inStockCount === 0 and inStockOnly === true -> remains enabled so user can uncheck
    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <FilterSidebar
            catalog={catalog}
            facets={{ ...facets, inStockCount: 0 }}
            categorySlug=""
            inStockOnly={true}
            attributes={{}}
            onToggleInStock={onToggleInStock}
            onToggleAttributeTerm={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const checkedBox = screen.getByTestId("filter-in-stock-checkbox");
    expect(checkedBox).toBeChecked();
    expect(checkedBox).not.toBeDisabled();

    fireEvent.click(checkedBox);
    expect(onToggleInStock).toHaveBeenCalledWith(false);
  });

  it("renders swatch buttons for colour terms with swatch and checkboxes for non-swatch terms, handles disabled/selected states, and recognizes -renk suffix aliases", () => {
    const catalog = indexCatalog(createPhase6FixtureCatalog());
    const { facets } = queryProducts(catalog, {});
    const onToggleAttributeTerm = vi.fn();

    const { rerender } = renderWithProviders(
      <FilterSidebar
        catalog={catalog}
        facets={facets}
        categorySlug=""
        inStockOnly={false}
        attributes={{
          "avize-rengi": ["siyah"], // short alias for "siyah-renk"
          "urun-boyutu": ["60-cm"],
        }}
        onToggleInStock={vi.fn()}
        onToggleAttributeTerm={onToggleAttributeTerm}
      />
    );

    // 1. Colour attribute group (swatch buttons)
    const colorGroup = screen.getByTestId("filter-attribute-group-avize-rengi");
    expect(colorGroup).toHaveTextContent("Çerçeve Rengi");

    const siyahSwatch = within(colorGroup).getByTestId(
      "filter-swatch-avize-rengi-siyah-renk"
    );
    expect(siyahSwatch.tagName).toBe("BUTTON");
    expect(siyahSwatch).toHaveAttribute("type", "button");
    expect(siyahSwatch).toHaveAttribute("aria-pressed", "true");
    expect(siyahSwatch).not.toBeDisabled();
    expect(siyahSwatch).toHaveTextContent("Siyah");
    expect(siyahSwatch).toHaveTextContent("(7)");

    const siyahColorDot = within(siyahSwatch).getByTestId(
      "swatch-color-siyah-renk"
    );
    expect(siyahColorDot).toHaveStyle({ backgroundColor: "#18181b" });

    const goldSwatch = within(colorGroup).getByTestId(
      "filter-swatch-avize-rengi-gold-renk"
    );
    expect(goldSwatch).toHaveAttribute("aria-pressed", "false");
    expect(goldSwatch).not.toBeDisabled();
    expect(goldSwatch).toHaveTextContent("Gold");
    expect(goldSwatch).toHaveTextContent("(7)");
    expect(
      within(goldSwatch).getByTestId("swatch-color-gold-renk")
    ).toHaveStyle({ backgroundColor: "#d4af37" });

    // krom-renk has count 0 and is NOT selected -> disabled
    const kromSwatch = within(colorGroup).getByTestId(
      "filter-swatch-avize-rengi-krom-renk"
    );
    expect(kromSwatch).toHaveAttribute("aria-pressed", "false");
    expect(kromSwatch).toBeDisabled();
    expect(kromSwatch).toHaveTextContent("Krom");
    expect(kromSwatch).toHaveTextContent("(0)");

    fireEvent.click(goldSwatch);
    expect(onToggleAttributeTerm).toHaveBeenCalledWith(
      "avize-rengi",
      "gold-renk"
    );

    // 2. Non-swatch attribute group (checkbox inputs)
    const sizeGroup = screen.getByTestId("filter-attribute-group-urun-boyutu");
    expect(sizeGroup).toHaveTextContent("Ürün Boyutu");

    const checkbox40 = within(sizeGroup).getByTestId(
      "filter-checkbox-urun-boyutu-40-cm"
    );
    expect(checkbox40).toHaveAttribute("type", "checkbox");
    expect(checkbox40).not.toBeChecked();
    expect(checkbox40).not.toBeDisabled();
    expect(checkbox40.closest("label")).toHaveTextContent("40 cm");
    expect(checkbox40.closest("label")).toHaveTextContent("(6)");

    const checkbox60 = within(sizeGroup).getByTestId(
      "filter-checkbox-urun-boyutu-60-cm"
    );
    expect(checkbox60).toBeChecked();
    expect(checkbox60).not.toBeDisabled();
    expect(checkbox60.closest("label")).toHaveTextContent("60 cm");
    expect(checkbox60.closest("label")).toHaveTextContent("(8)");

    // 100-cm has count 0 and is NOT selected -> disabled
    const checkbox100 = within(sizeGroup).getByTestId(
      "filter-checkbox-urun-boyutu-100-cm"
    );
    expect(checkbox100).not.toBeChecked();
    expect(checkbox100).toBeDisabled();
    expect(checkbox100.closest("label")).toHaveTextContent("100 cm");
    expect(checkbox100.closest("label")).toHaveTextContent("(0)");

    fireEvent.click(checkbox40);
    expect(onToggleAttributeTerm).toHaveBeenCalledWith("urun-boyutu", "40-cm");

    // 3. Zero-count options that ARE currently selected remain enabled so user can deselect them
    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <FilterSidebar
            catalog={catalog}
            facets={facets}
            categorySlug=""
            inStockOnly={false}
            attributes={{
              "avize-rengi": ["krom-renk"],
              "urun-boyutu": ["100-cm"],
            }}
            onToggleInStock={vi.fn()}
            onToggleAttributeTerm={onToggleAttributeTerm}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const selectedZeroSwatch = screen.getByTestId(
      "filter-swatch-avize-rengi-krom-renk"
    );
    expect(selectedZeroSwatch).toHaveAttribute("aria-pressed", "true");
    expect(selectedZeroSwatch).not.toBeDisabled();
    fireEvent.click(selectedZeroSwatch);
    expect(onToggleAttributeTerm).toHaveBeenCalledWith(
      "avize-rengi",
      "krom-renk"
    );

    const selectedZeroCheckbox = screen.getByTestId(
      "filter-checkbox-urun-boyutu-100-cm"
    );
    expect(selectedZeroCheckbox).toBeChecked();
    expect(selectedZeroCheckbox).not.toBeDisabled();
    fireEvent.click(selectedZeroCheckbox);
    expect(onToggleAttributeTerm).toHaveBeenCalledWith("urun-boyutu", "100-cm");
  });

  it("handles null or undefined catalog and facets safely without throwing", () => {
    renderWithProviders(
      <FilterSidebar
        catalog={null}
        facets={undefined}
        categorySlug=""
        inStockOnly={false}
        attributes={undefined}
        onToggleInStock={vi.fn()}
        onToggleAttributeTerm={vi.fn()}
      />
    );

    expect(
      screen.queryByTestId("filter-category-tree")
    ).not.toBeInTheDocument();
    const inStockCheckbox = screen.getByTestId("filter-in-stock-checkbox");
    expect(inStockCheckbox).toBeDisabled();
    expect(inStockCheckbox.closest("label")).toHaveTextContent("(0)");
  });
});

describe("ActiveFilterChips component", () => {
  it("renders nothing when no filters are active", () => {
    const catalog = indexCatalog(createPhase6FixtureCatalog());

    const { rerender } = renderWithProviders(
      <ActiveFilterChips
        catalog={catalog}
        inStockOnly={false}
        attributes={{}}
        onRemoveInStock={vi.fn()}
        onRemoveAttributeTerm={vi.fn()}
        onClearAll={vi.fn()}
      />
    );

    expect(screen.queryByTestId("active-filter-chips")).not.toBeInTheDocument();

    // Also renders nothing when attributes object only has empty arrays
    rerender(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <ActiveFilterChips
            catalog={catalog}
            inStockOnly={false}
            attributes={{ "avize-rengi": [] }}
            onRemoveInStock={vi.fn()}
            onRemoveAttributeTerm={vi.fn()}
            onClearAll={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.queryByTestId("active-filter-chips")).not.toBeInTheDocument();
  });

  it("renders chips for inStockOnly and active attribute terms (including -renk alias lookup and raw slug fallback) and triggers removal callbacks", () => {
    const catalog = indexCatalog(createPhase6FixtureCatalog());
    const onRemoveInStock = vi.fn();
    const onRemoveAttributeTerm = vi.fn();
    const onClearAll = vi.fn();

    renderWithProviders(
      <ActiveFilterChips
        catalog={catalog}
        inStockOnly={true}
        attributes={{
          "avize-rengi": ["siyah", "gold-renk"],
          "urun-boyutu": ["60-cm", "bilinmeyen-boyut"],
          "bilinmeyen-ozellik": ["ozel-deger"],
        }}
        onRemoveInStock={onRemoveInStock}
        onRemoveAttributeTerm={onRemoveAttributeTerm}
        onClearAll={onClearAll}
      />
    );

    const container = screen.getByTestId("active-filter-chips");
    expect(container).toBeInTheDocument();

    const inStockChip = within(container).getByTestId(
      "active-filter-chip-in-stock"
    );
    expect(inStockChip.tagName).toBe("BUTTON");
    expect(inStockChip).toHaveTextContent("Sadece stoktakiler");
    fireEvent.click(inStockChip);
    expect(onRemoveInStock).toHaveBeenCalledTimes(1);

    // "siyah" resolves via -renk alias to "Siyah"
    const siyahChip = within(container).getByTestId(
      "active-filter-chip-avize-rengi-siyah"
    );
    expect(siyahChip).toHaveTextContent("Siyah");
    fireEvent.click(siyahChip);
    expect(onRemoveAttributeTerm).toHaveBeenCalledWith("avize-rengi", "siyah");

    // "gold-renk" resolves by exact match to "Gold"
    const goldChip = within(container).getByTestId(
      "active-filter-chip-avize-rengi-gold-renk"
    );
    expect(goldChip).toHaveTextContent("Gold");
    fireEvent.click(goldChip);
    expect(onRemoveAttributeTerm).toHaveBeenCalledWith(
      "avize-rengi",
      "gold-renk"
    );

    // "60-cm" resolves to "60 cm"
    const sizeChip = within(container).getByTestId(
      "active-filter-chip-urun-boyutu-60-cm"
    );
    expect(sizeChip).toHaveTextContent("60 cm");

    // Unknown term on known attribute falls back to raw termSlug
    const unknownTermChip = within(container).getByTestId(
      "active-filter-chip-urun-boyutu-bilinmeyen-boyut"
    );
    expect(unknownTermChip).toHaveTextContent("bilinmeyen-boyut");

    // Unknown attribute falls back to raw termSlug
    const unknownAttrChip = within(container).getByTestId(
      "active-filter-chip-bilinmeyen-ozellik-ozel-deger"
    );
    expect(unknownAttrChip).toHaveTextContent("ozel-deger");

    const clearAllBtn = within(container).getByTestId("clear-all-filters");
    expect(clearAllBtn.tagName).toBe("BUTTON");
    expect(clearAllBtn).toHaveTextContent("Filtreleri temizle");
    fireEvent.click(clearAllBtn);
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });
});

describe("MobileFilterDrawer component", () => {
  it("renders nothing when isOpen is false and pressing Escape is a safe no-op", () => {
    const catalog = indexCatalog(createPhase6FixtureCatalog());
    const { facets } = queryProducts(catalog, {});
    const onClose = vi.fn();

    renderWithProviders(
      <MobileFilterDrawer
        isOpen={false}
        onClose={onClose}
        catalog={catalog}
        facets={facets}
        categorySlug=""
        inStockOnly={false}
        attributes={{}}
        onToggleInStock={vi.fn()}
        onToggleAttributeTerm={vi.fn()}
      />
    );

    expect(
      screen.queryByTestId("mobile-filter-drawer")
    ).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders dialog, backdrop, close button, and FilterSidebar when isOpen is true, and closes on close button click, backdrop click, or Escape keydown", () => {
    const catalog = indexCatalog(createPhase6FixtureCatalog());
    const { facets } = queryProducts(catalog, {});
    const onClose = vi.fn();

    renderWithProviders(
      <MobileFilterDrawer
        isOpen={true}
        onClose={onClose}
        catalog={catalog}
        facets={facets}
        categorySlug="led-avizeler"
        inStockOnly={false}
        attributes={{}}
        onToggleInStock={vi.fn()}
        onToggleAttributeTerm={vi.fn()}
      />
    );

    const dialog = screen.getByTestId("mobile-filter-drawer");
    expect(dialog).toHaveAttribute("role", "dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "Filtreler");

    expect(
      within(dialog).queryByTestId("filter-category-tree")
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByTestId("filter-in-stock-checkbox")
    ).toBeInTheDocument();
    expect(
      within(dialog).getByTestId("filter-in-stock-checkbox")
    ).toBeInTheDocument();

    const closeBtn = screen.getByTestId("mobile-filter-close");
    expect(closeBtn).toHaveAttribute("type", "button");
    expect(closeBtn).toHaveAttribute("aria-label", "Filtreleri kapat");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const backdrop = screen.getByTestId("mobile-filter-backdrop");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

describe("ListingToolbar mobile filter trigger", () => {
  it("renders mobile-filter-open button with aria-label='Filtreler' and aria-expanded and calls onOpenMobileFilters when clicked", () => {
    const onOpenMobileFilters = vi.fn();

    renderWithProviders(
      <ListingToolbar
        total={14}
        page={1}
        totalPages={2}
        sort="en-yeni"
        perPage={12}
        inStockOnly={false}
        isFilterDrawerOpen={false}
        onOpenMobileFilters={onOpenMobileFilters}
        onSortChange={vi.fn()}
        onPerPageChange={vi.fn()}
      />
    );

    const openBtn = screen.getByTestId("mobile-filter-open");
    expect(openBtn.tagName).toBe("BUTTON");
    expect(openBtn).toHaveAttribute("type", "button");
    expect(openBtn).toHaveAttribute("aria-label", "Filtreler");
    expect(openBtn).toHaveAttribute("aria-expanded", "false");
    expect(openBtn).toHaveTextContent("Filtreler");

    fireEvent.click(openBtn);
    expect(onOpenMobileFilters).toHaveBeenCalledTimes(1);
  });
});

describe("ProductListingPage full filter integration via <App />", () => {
  it("renders sticky desktop filter sidebar and opens/closes MobileFilterDrawer via mobile-filter-open", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase6FixtureCatalog())
    );

    renderWithProviders(<App />, {
      initialEntries: ["/kategori/aydinlatma"],
      queryClient,
    });

    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "14 ürün bulundu"
    );

    const desktopSidebar = screen.getByTestId("desktop-filter-sidebar");
    expect(desktopSidebar.tagName).toBe("ASIDE");
    expect(desktopSidebar).toHaveAttribute("aria-label", "Ürün filtreleri");
    expect(desktopSidebar.className).toContain("lg:sticky");
    expect(desktopSidebar.className).toContain("lg:top-6");
    expect(
      within(desktopSidebar).queryByTestId("filter-category-tree")
    ).not.toBeInTheDocument();
    expect(
      within(desktopSidebar).getByTestId("filter-in-stock-checkbox")
    ).toBeInTheDocument();

    // Mobile drawer is closed initially
    expect(
      screen.queryByTestId("mobile-filter-drawer")
    ).not.toBeInTheDocument();
    const openBtn = screen.getByTestId("mobile-filter-open");
    expect(openBtn).toHaveAttribute("aria-expanded", "false");

    // Open mobile drawer
    fireEvent.click(openBtn);
    const drawer = screen.getByTestId("mobile-filter-drawer");
    expect(drawer).toBeInTheDocument();
    expect(openBtn).toHaveAttribute("aria-expanded", "true");

    // Close mobile drawer via Escape
    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.queryByTestId("mobile-filter-drawer")
    ).not.toBeInTheDocument();
    expect(openBtn).toHaveAttribute("aria-expanded", "false");
  });

  it("updates product list, disjunctive facet counts, active filter chips, and URL search params when toggling swatches, checkboxes, and in-stock filter, and resets page to 1 from sayfa=2", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase6FixtureCatalog())
    );

    renderWithProviders(<App />, {
      initialEntries: ["/kategori/aydinlatma?sayfa=2"],
      queryClient,
      includeLocationProbe: true,
    });

    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "14 ürün bulundu"
    );
    expect(screen.getAllByTestId("product-card")).toHaveLength(2);
    expect(screen.getByTestId("location-probe")).toHaveTextContent(
      "/kategori/aydinlatma?sayfa=2"
    );

    const sidebar = screen.getByTestId("desktop-filter-sidebar");

    // 1. Click colour swatch "siyah-renk" -> 7 products (even numbers 2,4,6,8,10,12,14), page resets to 1 (sayfa=2 removed)
    fireEvent.click(
      within(sidebar).getByTestId("filter-swatch-avize-rengi-siyah-renk")
    );

    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "7 ürün bulundu"
    );
    expect(screen.getAllByTestId("product-card")).toHaveLength(7);
    expect(screen.getByTestId("location-probe").textContent).toContain(
      "avize-rengi=siyah-renk"
    );
    expect(screen.getByTestId("location-probe").textContent).not.toContain(
      "sayfa=2"
    );

    // Disjunctive facet count for gold-renk within the same attribute is still 7
    expect(
      within(sidebar).getByTestId("filter-swatch-avize-rengi-gold-renk")
    ).toHaveTextContent("(7)");

    // Active filter chip for siyah-renk is rendered
    const chips = screen.getByTestId("active-filter-chips");
    expect(
      within(chips).getByTestId("active-filter-chip-avize-rengi-siyah-renk")
    ).toHaveTextContent("Siyah");

    // 2. Multi-select OR within attribute: also select "gold-renk" -> back to 14 products
    fireEvent.click(
      within(sidebar).getByTestId("filter-swatch-avize-rengi-gold-renk")
    );

    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "14 ürün bulundu"
    );
    expect(
      within(screen.getByTestId("active-filter-chips")).getByTestId(
        "active-filter-chip-avize-rengi-gold-renk"
      )
    ).toHaveTextContent("Gold");

    // Deselect "gold-renk" via swatch click -> back to 7 products (only siyah-renk)
    fireEvent.click(
      within(sidebar).getByTestId("filter-swatch-avize-rengi-gold-renk")
    );
    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "7 ürün bulundu"
    );

    // 3. AND across attributes: select "40-cm" checkbox under "urun-boyutu"
    // Even products in 1..6 are 2, 4, 6 -> 3 products
    fireEvent.click(
      within(sidebar).getByTestId("filter-checkbox-urun-boyutu-40-cm")
    );

    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "3 ürün bulundu"
    );
    expect(screen.getAllByTestId("product-card")).toHaveLength(3);
    expect(screen.getByTestId("location-probe").textContent).toContain(
      "urun-boyutu=40-cm"
    );

    // 4. Toggle "Sadece stoktakiler": among 2, 4, 6, product 4 is out of stock (4 % 4 === 0), leaving 2 products (2 and 6)
    const inStockCheckbox = within(sidebar).getByTestId(
      "filter-in-stock-checkbox"
    );
    expect(inStockCheckbox.closest("label")).toHaveTextContent("(2)");
    fireEvent.click(inStockCheckbox);

    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "2 ürün bulundu"
    );
    expect(screen.getAllByTestId("product-card")).toHaveLength(2);
    expect(screen.getByTestId("location-probe").textContent).toContain(
      "stok=1"
    );
    expect(
      within(screen.getByTestId("active-filter-chips")).getByTestId(
        "active-filter-chip-in-stock"
      )
    ).toHaveTextContent("Sadece stoktakiler");
  });

  it("removes individual filters via ActiveFilterChips, handles short -renk alias removal, and clears all filters while preserving sort and perPage", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase6FixtureCatalog())
    );

    // Start with short alias renk=siyah, boyut=60-cm, stok=1, sirala=fiyat-artan, goster=9
    renderWithProviders(<App />, {
      initialEntries: [
        "/kategori/aydinlatma?renk=siyah&boyut=60-cm&stok=1&sirala=fiyat-artan&goster=9",
      ],
      queryClient,
      includeLocationProbe: true,
    });

    // Even products in 7..14 are 8, 10, 12, 14; out of stock are 8 and 12 -> 10 and 14 remain (2 products)
    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "2 ürün bulundu"
    );

    const sidebar = screen.getByTestId("desktop-filter-sidebar");
    // Short alias "siyah" is recognized as selected on "siyah-renk" swatch
    expect(
      within(sidebar).getByTestId("filter-swatch-avize-rengi-siyah-renk")
    ).toHaveAttribute("aria-pressed", "true");

    // Removing in-stock filter via chip restores products 8 and 12 -> 4 products
    fireEvent.click(screen.getByTestId("active-filter-chip-in-stock"));
    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "4 ürün bulundu"
    );
    expect(screen.getByTestId("location-probe").textContent).not.toContain(
      "stok=1"
    );

    // Deselecting "siyah-renk" swatch removes the short alias "siyah" from avize-rengi -> all 8 products in 60-cm
    fireEvent.click(
      within(sidebar).getByTestId("filter-swatch-avize-rengi-siyah-renk")
    );
    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "8 ürün bulundu"
    );
    expect(
      within(sidebar).getByTestId("filter-swatch-avize-rengi-siyah-renk")
    ).toHaveAttribute("aria-pressed", "false");

    // Re-enable inStockOnly and click "Filtreleri temizle" -> clears all filters, preserves sirala=fiyat-artan and goster=9
    fireEvent.click(within(sidebar).getByTestId("filter-in-stock-checkbox"));
    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "6 ürün bulundu"
    );

    fireEvent.click(screen.getByTestId("clear-all-filters"));
    expect(await screen.findByTestId("debug-result-count")).toHaveTextContent(
      "14 ürün bulundu"
    );
    expect(screen.queryByTestId("active-filter-chips")).not.toBeInTheDocument();

    const finalUrl = screen.getByTestId("location-probe").textContent || "";
    expect(finalUrl).toContain("sirala=fiyat-artan");
    expect(finalUrl).toContain("goster=9");
    expect(finalUrl).not.toContain("stok=");
    expect(finalUrl).not.toContain("urun-boyutu=");
    expect(finalUrl).not.toContain("avize-rengi=");

    // Never renders omitted e-commerce or comparison terms
    const pageText = document.body.textContent || "";
    OMITTED_TERMS.forEach((term) => {
      expect(pageText).not.toMatch(new RegExp(term, "i"));
    });
  });
});

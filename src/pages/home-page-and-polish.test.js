import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomePage, { HOME_SHOWCASE_SECTIONS } from "@/pages/HomePage";
import { usePageMeta } from "@/hooks/use-page-meta";
import LoadingSkeleton from "@/components/catalog/LoadingSkeleton";
import Layout from "@/components/layout/Layout";
import App from "@/App";
import { indexCatalog } from "@/data/catalog-query";

const DEFAULT_META_DESCRIPTION =
  "Yerli üretim modern LED avize, plafonyer, lineer aydınlatma ve aplik kataloğu.";

const OMITTED_TERMS = [
  "Müşteri Referans Görsellerimiz",
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
  return {
    queryClient: client,
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={initialEntries}>
          {ui}
          {includeLocationProbe ? <LocationProbe /> : null}
        </MemoryRouter>
      </QueryClientProvider>
    ),
  };
}

function createPhase10FixtureCatalog(overrides = {}) {
  const categories = overrides.categories || [
    {
      id: 1,
      slug: "led-avizeler",
      name: "Led Avizeler",
      parentId: null,
      count: 10,
      descriptionHtml:
        "<h2>Modern Led Avize Modelleri</h2><p>[embed]https://www.youtube.com/watch?v=demo1[/embed]Enerji tasarruflu salon ve mutfak LED avizeleri.</p>",
    },
    {
      id: 2,
      slug: "plafonyer-led-avize",
      name: "Plafonyer",
      parentId: null,
      count: 10,
      descriptionHtml: "<p>Plafonyer tavan LED avize modelleri.</p>",
    },
    {
      id: 3,
      slug: "lineer-aydinlatma",
      name: "Lineer Aydınlatma",
      parentId: null,
      count: 9,
      descriptionHtml: "<p>Sarkıt ve sıva üstü lineer LED armatürler.</p>",
    },
    {
      id: 4,
      slug: "sarkit-lineer-aydinlatma",
      name: "Sarkıt Lineer Aydınlatma",
      parentId: 3,
      count: 4,
      descriptionHtml: "",
    },
    {
      id: 5,
      slug: "aplikler",
      name: "Aplikler",
      parentId: null,
      count: 6,
      descriptionHtml: "<p>Başucu ve duvar LED aplik modelleri.</p>",
    },
  ];

  const attributes = overrides.attributes || [
    {
      slug: "cerceve-rengi",
      name: "Çerçeve Rengi",
      terms: [
        { slug: "siyah-renk", name: "Siyah", swatch: "#18181b" },
        { slug: "gold-renk", name: "Gold", swatch: "#d4af37" },
      ],
    },
  ];

  // Build products:
  // - 10 products in plafonyer-led-avize (id 2, also id 1) -> exceeds limit 8
  // - 9 products in lineer-aydinlatma / sarkit-lineer-aydinlatma (id 3 / 4) -> exceeds limit 8
  // - 6 products in aplikler (id 5) -> exceeds limit 4
  const plafonyerProducts = Array.from({ length: 10 }, (_, idx) => {
    const num = idx + 1;
    const isFirst = num === 1;
    const slug = isFirst
      ? "pablo-kare-plafonyer-led-avize"
      : `plafonyer-model-${num}`;
    const name = isFirst
      ? "Pablo Kare Plafonyer LED Avize"
      : `Plafonyer Model ${num}`;
    return {
      id: 100 + num,
      slug,
      name,
      sku: `PRBK-PLF-${String(num).padStart(3, "0")}`,
      inStock: num % 3 !== 0,
      createdAt: `2026-03-${String(num).padStart(2, "0")}T10:00:00.000Z`,
      categoryIds: [1, 2],
      priceMin: 1200 + num * 100,
      priceMax: 1200 + num * 100,
      images: [`${slug}/main.webp`],
      highlights: isFirst
        ? ["Güç: 45W Yüksek Lümen LED", "Kumandalı 3 Renk Işık Modu"]
        : [],
      descriptionHtml: isFirst
        ? "<div><p>Salon ve mutfak için ideal plafonyer.</p>[embed]https://www.youtube.com/watch?v=demo123[/embed]</div>"
        : `<p>${name} açıklaması.</p>`,
      specs: { Marka: "Lavabo" },
      attributes: {
        "cerceve-rengi": num % 2 === 0 ? ["siyah-renk"] : ["gold-renk"],
      },
      variants: [],
    };
  });

  const lineerProducts = Array.from({ length: 9 }, (_, idx) => {
    const num = idx + 1;
    const slug = `lineer-armatur-model-${num}`;
    const name = `Lineer Armatür Model ${num}`;
    return {
      id: 200 + num,
      slug,
      name,
      sku: `PRBK-LIN-${String(num).padStart(3, "0")}`,
      inStock: true,
      createdAt: `2026-02-${String(num).padStart(2, "0")}T10:00:00.000Z`,
      categoryIds: [num <= 4 ? 4 : 3],
      priceMin: 1800 + num * 50,
      priceMax: 2100 + num * 50,
      images: [`${slug}/main.webp`],
      highlights: [],
      descriptionHtml: `<p>[embed]https://youtu.be/lin${num}[/embed]Ofis ve mimari projeler için ${name}.</p>`,
      specs: { Marka: "Lavabo" },
      attributes: {},
      variants: [],
    };
  });

  const aplikProducts = Array.from({ length: 6 }, (_, idx) => {
    const num = idx + 1;
    const slug = `duvar-aplik-model-${num}`;
    const name = `Duvar Aplik Model ${num}`;
    return {
      id: 300 + num,
      slug,
      name,
      sku: `PRBK-APL-${String(num).padStart(3, "0")}`,
      inStock: true,
      createdAt: `2026-01-${String(num).padStart(2, "0")}T10:00:00.000Z`,
      categoryIds: [5],
      priceMin: 750 + num * 50,
      priceMax: 750 + num * 50,
      images: [`${slug}/main.webp`],
      highlights: ["Telefon tutucu başucu tasarım"],
      descriptionHtml: `<p>${name} başucu aplik.</p>`,
      specs: {},
      attributes: {},
      variants: [],
    };
  });

  return {
    version: "2026-11-12-phase10",
    categories,
    attributes,
    products: overrides.products || [
      ...plafonyerProducts,
      ...lineerProducts,
      ...aplikProducts,
    ],
  };
}

beforeEach(() => {
  document.title = "";
  document.head
    .querySelectorAll('meta[name="description"]')
    .forEach((node) => node.remove());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("HOME_SHOWCASE_SECTIONS and HomePage", () => {
  it("exports HOME_SHOWCASE_SECTIONS with the 3 showcase configurations in exact order", () => {
    expect(HOME_SHOWCASE_SECTIONS).toEqual([
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
    ]);
  });

  it("does not render home-hero across loading, error, and loaded states", async () => {
    // 1. Loading state (pending fetch)
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () => new Promise(() => {})
    );

    const { unmount: unmountLoading } = renderWithProviders(<HomePage />);

    expect(screen.queryByTestId("home-hero")).not.toBeInTheDocument();
    expect(screen.getByTestId("catalog-loading-skeleton")).toBeInTheDocument();
    unmountLoading();

    // 2. Error state (failed fetch)
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("Bağlantı zaman aşımı")
    );
    const { unmount: unmountError } = renderWithProviders(<HomePage />);

    const alertEl = await screen.findByTestId("catalog-error-state");
    expect(alertEl).toBeInTheDocument();
    expect(screen.queryByTestId("home-hero")).not.toBeInTheDocument();
    unmountError();

    // 3. Loaded state
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase10FixtureCatalog())
    );
    renderWithProviders(<App />, {
      initialEntries: ["/"],
      queryClient,
    });

    expect(screen.queryByTestId("home-hero")).not.toBeInTheDocument();
    expect(screen.getByTestId("home-section-plafonyer")).toBeInTheDocument();
  });

  it("renders the 3 showcase sections with h2 headings, intro text, category links, and product grids capped at section.limit with quick view support", () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase10FixtureCatalog())
    );

    renderWithProviders(<App />, {
      initialEntries: ["/"],
      queryClient,
    });

    const main = screen.getByTestId("layout-main");
    const headings = within(main).getAllByRole("heading");
    const h2Headings = headings.filter((h) => h.tagName === "H2");

    expect(h2Headings.map((h) => h.textContent)).toEqual([
      "Plafonyer Led Avize Modelleri",
      "Sarkıt ve Sıva Üstü Lineer Led Armatürler",
      "Led Aplik Lamba Ürünleri",
    ]);

    HOME_SHOWCASE_SECTIONS.forEach((section) => {
      const sectionEl = screen.getByTestId(`home-section-${section.key}`);
      expect(sectionEl.tagName).toBe("SECTION");
      expect(sectionEl).toHaveAttribute("aria-label", section.title);

      const h2 = within(sectionEl).getByRole("heading", {
        level: 2,
        name: section.title,
      });
      expect(h2).toBeInTheDocument();

      const introParagraph = within(sectionEl).getByText(section.intro);
      expect(introParagraph.tagName).toBe("P");

      const categoryLink = within(sectionEl).getByTestId(
        `home-section-link-${section.key}`
      );
      expect(categoryLink).toHaveAttribute(
        "href",
        `/kategori/${section.categorySlug}`
      );
      expect(categoryLink).toHaveTextContent(section.ctaLabel);

      const grid = within(sectionEl).getByTestId(
        `home-section-grid-${section.key}`
      );
      expect(grid.tagName).toBe("UL");

      const cards = within(grid).getAllByTestId("product-card");
      expect(cards).toHaveLength(section.limit);
    });

    // Quick view modal opens and closes from a ProductCard inside a showcase section
    fireEvent.click(
      screen.getByTestId("quick-view-trigger-plafonyer-model-10")
    );
    const modal = screen.getByTestId("quick-view-modal");
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveTextContent("Plafonyer Model 10");

    fireEvent.click(screen.getByTestId("quick-view-close"));
    expect(screen.queryByTestId("quick-view-modal")).not.toBeInTheDocument();
  });

  it("handles showcase categories with fewer than section.limit or 0 products cleanly without throwing", () => {
    const rawFixture = createPhase10FixtureCatalog();
    // Keep only 2 plafonyer products, 1 lineer product, and 0 aplik products
    const sparseCatalog = indexCatalog({
      ...rawFixture,
      products: [
        rawFixture.products[0],
        rawFixture.products[1],
        rawFixture.products[10],
      ],
    });

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], sparseCatalog);

    renderWithProviders(<HomePage />, { queryClient });

    const plafonyerGrid = screen.getByTestId("home-section-grid-plafonyer");
    expect(within(plafonyerGrid).getAllByTestId("product-card")).toHaveLength(
      2
    );

    const lineerGrid = screen.getByTestId("home-section-grid-lineer");
    expect(within(lineerGrid).getAllByTestId("product-card")).toHaveLength(1);

    const aplikSection = screen.getByTestId("home-section-aplik");
    const aplikGrid = within(aplikSection).getByTestId(
      "home-section-grid-aplik"
    );
    expect(within(aplikGrid).queryAllByTestId("product-card")).toHaveLength(0);
  });

  it("strictly omits customer reference photos, Google reviews, workshop video, WhatsApp links, and e-commerce controls on HomePage", () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase10FixtureCatalog())
    );

    const { container } = renderWithProviders(<App />, {
      initialEntries: ["/"],
      queryClient,
    });

    const text = container.textContent || "";
    OMITTED_TERMS.forEach((term) => {
      expect(text).not.toMatch(new RegExp(term, "i"));
    });
    expect(text).not.toMatch(/\[embed\]|\[\/embed\]/i);
    expect(text).not.toMatch(/Google Yorum/i);

    expect(container.querySelectorAll("video, iframe")).toHaveLength(0);

    const allLinks = container.querySelectorAll("a[href]");
    allLinks.forEach((anchor) => {
      const href = anchor.getAttribute("href") || "";
      expect(href).not.toMatch(/wa\.me|whatsapp/i);
    });
  });
});

describe("usePageMeta hook and route-level metadata updates", () => {
  function MetaProbe({ title, description }) {
    usePageMeta({ title, description });
    return <div data-testid="meta-probe" />;
  }

  it("sets default title and meta description when omitted or whitespace-only, formats custom titles, and updates a single <meta name='description'> without duplicates", () => {
    const { rerender } = render(<MetaProbe />);

    expect(document.title).toBe("Lavabo Aydınlatma Katalog");
    let metaTags = document.head.querySelectorAll('meta[name="description"]');
    expect(metaTags).toHaveLength(1);
    expect(metaTags[0]).toHaveAttribute("content", DEFAULT_META_DESCRIPTION);

    // Custom title without "Lavabo Aydınlatma" appends " | Lavabo Aydınlatma"
    rerender(
      <MetaProbe
        title="Plafonyer Modelleri"
        description="  Modern tavan plafonyer LED avizeler.  "
      />
    );
    expect(document.title).toBe("Plafonyer Modelleri | Lavabo Aydınlatma");
    metaTags = document.head.querySelectorAll('meta[name="description"]');
    expect(metaTags).toHaveLength(1);
    expect(metaTags[0]).toHaveAttribute(
      "content",
      "Modern tavan plafonyer LED avizeler."
    );

    // Title that already includes "Lavabo Aydınlatma" is kept as-is
    rerender(
      <MetaProbe
        title="Özel Koleksiyon | Lavabo Aydınlatma"
        description="   "
      />
    );
    expect(document.title).toBe("Özel Koleksiyon | Lavabo Aydınlatma");
    metaTags = document.head.querySelectorAll('meta[name="description"]');
    expect(metaTags).toHaveLength(1);
    expect(metaTags[0]).toHaveAttribute("content", DEFAULT_META_DESCRIPTION);

    // Whitespace-only title falls back to "Lavabo Aydınlatma Katalog"
    rerender(<MetaProbe title="   " description={null} />);
    expect(document.title).toBe("Lavabo Aydınlatma Katalog");
    metaTags = document.head.querySelectorAll('meta[name="description"]');
    expect(metaTags).toHaveLength(1);
    expect(metaTags[0]).toHaveAttribute("content", DEFAULT_META_DESCRIPTION);
  });

  it("updates document.title and <meta name='description'> across /, /urunlerimiz, /kategori/led-avizeler, /urun/:slug (found & not-found), /arama?q=pablo, /arama, and * (404)", async () => {
    const indexedCatalog = indexCatalog(createPhase10FixtureCatalog());
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexedCatalog);

    // 1. Home route "/"
    const { unmount: unmountHome } = renderWithProviders(<App />, {
      initialEntries: ["/"],
      queryClient,
    });
    expect(document.title).toBe("Lavabo Aydınlatma Katalog");
    expect(
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute("content")
    ).toBe(DEFAULT_META_DESCRIPTION);
    unmountHome();

    // 2. Removed all-products path "/urunlerimiz" is a 404
    const { unmount: unmountAllProducts } = renderWithProviders(<App />, {
      initialEntries: ["/urunlerimiz"],
      queryClient,
    });
    expect(screen.getByTestId("not-found-page")).toBeInTheDocument();
    expect(document.title).toBe("Sayfa Bulunamadı | Lavabo Aydınlatma");
    expect(
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute("content")
    ).toBe(DEFAULT_META_DESCRIPTION);
    unmountAllProducts();

    // 3. Category "/kategori/led-avizeler"
    const { unmount: unmountCategory } = renderWithProviders(<App />, {
      initialEntries: ["/kategori/led-avizeler"],
      queryClient,
    });
    expect(document.title).toBe("Led Avizeler | Lavabo Aydınlatma");
    const catDescription =
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute("content") || "";
    expect(catDescription).toMatch(
      /Enerji tasarruflu salon ve mutfak LED avizeleri|Led Avizeler/i
    );
    expect(catDescription).not.toMatch(/\[embed\]|\[\/embed\]/i);
    unmountCategory();

    // 4a. Product detail found (with highlights): "/urun/pablo-kare-plafonyer-led-avize"
    const { unmount: unmountProductFound } = renderWithProviders(<App />, {
      initialEntries: ["/urun/pablo-kare-plafonyer-led-avize"],
      queryClient,
    });
    expect(document.title).toBe(
      "Pablo Kare Plafonyer LED Avize | Lavabo Aydınlatma"
    );
    expect(
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute("content")
    ).toContain("Güç: 45W Yüksek Lümen LED");
    unmountProductFound();

    // 4b. Product detail found (without highlights, falls back to stripped descriptionHtml): "/urun/lineer-armatur-model-1"
    const { unmount: unmountProductExcerpt } = renderWithProviders(<App />, {
      initialEntries: ["/urun/lineer-armatur-model-1"],
      queryClient,
    });
    expect(document.title).toBe("Lineer Armatür Model 1 | Lavabo Aydınlatma");
    const excerptMeta =
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute("content") || "";
    expect(excerptMeta).toContain(
      "Ofis ve mimari projeler için Lineer Armatür Model 1."
    );
    expect(excerptMeta).not.toMatch(/\[embed\]|\[\/embed\]|youtu\.be/i);
    unmountProductExcerpt();

    // 5. Product detail not-found: "/urun/olmayan-urun-slug"
    const { unmount: unmountProductNotFound } = renderWithProviders(<App />, {
      initialEntries: ["/urun/olmayan-urun-slug"],
      queryClient,
    });
    expect(document.title).toBe("Ürün Bulunamadı | Lavabo Aydınlatma");
    unmountProductNotFound();

    // 6. Search with query: "/arama?q=pablo"
    const { unmount: unmountSearchWithQuery } = renderWithProviders(<App />, {
      initialEntries: ["/arama?q=pablo"],
      queryClient,
    });
    expect(document.title).toBe('"pablo" Arama Sonuçları | Lavabo Aydınlatma');
    unmountSearchWithQuery();

    // 7. Search without query: "/arama"
    const { unmount: unmountSearchEmpty } = renderWithProviders(<App />, {
      initialEntries: ["/arama"],
      queryClient,
    });
    expect(document.title).toBe("Arama Sonuçları | Lavabo Aydınlatma");
    unmountSearchEmpty();

    // 8. 404 NotFoundPage: "/olmayan-sayfa-404"
    renderWithProviders(<App />, {
      initialEntries: ["/olmayan-sayfa-404"],
      queryClient,
    });
    expect(document.title).toBe("Sayfa Bulunamadı | Lavabo Aydınlatma");

    // Verify only a single <meta name="description"> exists after all transitions
    expect(
      document.head.querySelectorAll('meta[name="description"]')
    ).toHaveLength(1);
  });
});

describe("LoadingSkeleton component and page loading / retryable error states", () => {
  it("renders catalog-loading-skeleton with aria-busy='true', data-variant, 'Yükleniyor...', and clamps count to >= 1", () => {
    const { rerender } = render(<LoadingSkeleton />);

    const skeleton = screen.getByTestId("catalog-loading-skeleton");
    expect(skeleton).toHaveAttribute("aria-busy", "true");
    expect(skeleton).toHaveAttribute("data-variant", "grid");
    expect(within(skeleton).getByText("Yükleniyor...")).toBeInTheDocument();
    expect(within(skeleton).getAllByTestId("skeleton-card")).toHaveLength(6);

    rerender(<LoadingSkeleton count={4} variant="detail" />);
    expect(screen.getByTestId("catalog-loading-skeleton")).toHaveAttribute(
      "data-variant",
      "detail"
    );
    expect(screen.getAllByTestId("skeleton-card")).toHaveLength(4);

    // Invalid or non-positive count clamps to at least 1
    rerender(<LoadingSkeleton count={0} />);
    expect(
      screen.getAllByTestId("skeleton-card").length
    ).toBeGreaterThanOrEqual(1);

    rerender(<LoadingSkeleton count={-5} />);
    expect(
      screen.getAllByTestId("skeleton-card").length
    ).toBeGreaterThanOrEqual(1);

    rerender(<LoadingSkeleton count={Number.NaN} />);
    expect(
      screen.getAllByTestId("skeleton-card").length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders LoadingSkeleton while pending on /, /kategori/led-avizeler, /urun/:slug, and /arama", () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () => new Promise(() => {})
    );

    // 1. "/"
    const { unmount: unmountHome } = renderWithProviders(<App />, {
      initialEntries: ["/"],
    });
    expect(screen.queryByTestId("home-hero")).not.toBeInTheDocument();
    expect(screen.getByTestId("catalog-loading-skeleton")).toBeInTheDocument();
    unmountHome();

    // 2. "/kategori/led-avizeler"
    const { unmount: unmountListing } = renderWithProviders(<App />, {
      initialEntries: ["/kategori/led-avizeler"],
    });
    expect(screen.getByTestId("catalog-loading-skeleton")).toBeInTheDocument();
    expect(screen.getByText("Yükleniyor...")).toBeInTheDocument();
    unmountListing();

    // 3. "/urun/:slug"
    const { unmount: unmountDetail } = renderWithProviders(<App />, {
      initialEntries: ["/urun/pablo-kare-plafonyer-led-avize"],
    });
    const detailPlaceholder = screen.getByTestId("product-detail-placeholder");
    expect(detailPlaceholder).toHaveTextContent(
      "pablo-kare-plafonyer-led-avize"
    );
    expect(
      within(detailPlaceholder).getByTestId("catalog-loading-skeleton")
    ).toBeInTheDocument();
    unmountDetail();

    // 4. "/arama?q=pablo"
    renderWithProviders(<App />, {
      initialEntries: ["/arama?q=pablo"],
    });
    const searchPlaceholder = screen.getByTestId("search-results-placeholder");
    expect(
      within(searchPlaceholder).getByRole("heading", {
        level: 1,
        name: '"pablo" için arama sonuçları',
      })
    ).toBeInTheDocument();
    expect(
      within(searchPlaceholder).getByTestId("catalog-loading-skeleton")
    ).toBeInTheDocument();
  });

  it.each([
    {
      route: "/",
      expectedSuccessTestId: "home-section-plafonyer",
    },
    {
      route: "/kategori/led-avizeler",
      expectedSuccessTestId: "debug-product-list",
    },
    {
      route: "/urun/pablo-kare-plafonyer-led-avize",
      expectedSuccessTestId: "product-detail-price",
    },
    {
      route: "/arama?q=pablo",
      expectedSuccessTestId: "debug-result-count",
    },
  ])(
    "renders catalog-error-state with catalog-retry-button on $route when fetch fails and recovers on click",
    async ({ route, expectedSuccessTestId }) => {
      const rawFixture = createPhase10FixtureCatalog();
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockRejectedValueOnce(new Error("Sunucu hatası 503"))
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => rawFixture,
        });

      renderWithProviders(<App />, {
        initialEntries: [route],
      });

      const errorAlert = await screen.findByTestId("catalog-error-state");
      expect(errorAlert).toHaveAttribute("role", "alert");
      expect(errorAlert).toHaveTextContent(
        "Katalog verileri yüklenemedi: Sunucu hatası 503"
      );

      if (route === "/") {
        expect(screen.queryByTestId("home-hero")).not.toBeInTheDocument();
      }

      const retryBtn = within(errorAlert).getByTestId("catalog-retry-button");
      expect(retryBtn.tagName).toBe("BUTTON");
      expect(retryBtn).toHaveAttribute("type", "button");
      expect(retryBtn).toHaveTextContent("Tekrar Dene");

      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(2);
      });

      expect(
        await screen.findByTestId(expectedSuccessTestId)
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("catalog-error-state")
      ).not.toBeInTheDocument();
    }
  );
});

describe("Layout keyboard and landmark accessibility", () => {
  it("renders skip-to-content link before Header and layout-main with id='layout-main' and tabIndex={-1}", () => {
    renderWithProviders(<Layout />);

    const skipLink = screen.getByTestId("skip-to-content");
    expect(skipLink.tagName).toBe("A");
    expect(skipLink).toHaveAttribute("href", "#layout-main");
    expect(skipLink).toHaveTextContent("Ana içeriğe atla");

    const header = screen.getByTestId("site-header");
    const main = screen.getByTestId("layout-main");

    // skip-to-content appears before site-header in DOM order
    expect(
      skipLink.compareDocumentPosition(header) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    expect(main.tagName).toBe("MAIN");
    expect(main).toHaveAttribute("id", "layout-main");
    expect(main).toHaveAttribute("tabindex", "-1");
  });
});

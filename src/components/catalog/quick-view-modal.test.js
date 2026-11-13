import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import QuickViewModal from "@/components/catalog/QuickViewModal";
import ProductCard from "@/components/catalog/ProductCard";
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

function createQuickViewFixtureCatalog(overrides = {}) {
  const categories = overrides.categories || [
    {
      id: 1,
      slug: "aydinlatma",
      name: "Aydınlatma",
      parentId: null,
      count: 3,
      descriptionHtml: "<p>Aydınlatma kategorisi</p>",
    },
    {
      id: 2,
      slug: "led-avizeler",
      name: "Led Avizeler",
      parentId: 1,
      count: 3,
      descriptionHtml: "<p>Led avizeler</p>",
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
    {
      slug: "isik-rengi",
      name: "Işık Rengi",
      terms: [
        { slug: "3-renk", name: "3 Renk" },
        { slug: "gun-isigi", name: "Gün Işığı" },
      ],
    },
  ];

  const products = overrides.products || [
    {
      id: 101,
      slug: "pablo-kare-plafonyer-led-avize",
      name: "Pablo Kare Plafonyer LED Avize",
      sku: "PRBK-PABLO-101",
      inStock: true,
      createdAt: "2026-01-15T10:00:00.000Z",
      categoryIds: [2, 1],
      priceMin: 1500,
      priceMax: 2200,
      images: [
        "pablo-kare-plafonyer-led-avize/main.webp",
        "pablo-kare-plafonyer-led-avize/gallery-01.webp",
        "pablo-kare-plafonyer-led-avize/gallery-02.webp",
      ],
      highlights: [
        "Güç: 45W Yüksek Lümen LED",
        "Kumandalı 3 Renk Işık Modu",
        "Yerli Üretim 2 Yıl Garantili",
      ],
      descriptionHtml: "<p>Pablo serisi modern LED avize.</p>",
      specs: {
        Marka: "Parbek",
        Malzeme: "Alüminyum",
      },
      attributes: {
        "cerceve-rengi": ["siyah", "gold"],
        "isik-rengi": ["3-renk", "gun-isigi"],
      },
      variants: [
        {
          id: 2001,
          sku: "PRBK-PABLO-101-BLK-3",
          price: 1500,
          inStock: true,
          image: "pablo-kare-plafonyer-led-avize/variant-siyah.webp",
          terms: {
            "cerceve-rengi": "siyah-renk",
            "isik-rengi": "3-renk",
          },
        },
        {
          id: 2002,
          sku: "PRBK-PABLO-101-GLD-GUN",
          price: 2200,
          inStock: false,
          image: "pablo-kare-plafonyer-led-avize/variant-gold.webp",
          terms: {
            "cerceve-rengi": "gold-renk",
            "isik-rengi": "gun-isigi",
          },
        },
      ],
    },
    {
      id: 102,
      slug: "aslan-model-rgb-masa-lambasi",
      name: "Aslan Model RGB Masa Lambası",
      sku: "PRBK-ASLAN-102",
      inStock: false,
      createdAt: "2026-01-12T10:00:00.000Z",
      categoryIds: [2, 1],
      priceMin: 850,
      priceMax: 850,
      images: ["aslan-model-rgb-masa-lambasi/main.webp"],
      highlights: [],
      descriptionHtml: "<p>Dekoratif RGB masa lambası.</p>",
      specs: {
        Marka: "Parbek",
      },
      attributes: {},
      variants: [],
    },
    {
      id: 103,
      slug: "kuzey-halka-sarkit-avize",
      name: "Kuzey Halka Sarkıt Avize",
      sku: "PRBK-KZY-103",
      inStock: true,
      createdAt: "2026-01-10T10:00:00.000Z",
      categoryIds: [2, 1],
      priceMin: 1900,
      priceMax: 1900,
      images: [
        "kuzey-halka-sarkit-avize/main.webp",
        "kuzey-halka-sarkit-avize/side.webp",
      ],
      highlights: ["Modern Halka Tasarım"],
      descriptionHtml: "<p>Kuzey serisi sarkıt.</p>",
      specs: {},
      attributes: {
        "cerceve-rengi": ["gold-renk"],
      },
      variants: [],
    },
  ];

  return {
    version: "2026-11-12-phase8-quick-view",
    categories,
    attributes,
    products,
  };
}

const OMITTED_TERMS = [
  "Sepete Ekle",
  "Satın Al",
  "Şimdi satın al",
  "Karşılaştır",
  "İstek listesine ekle",
  "Favoriler",
  "taksit",
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("QuickViewModal component", () => {
  it("renders nothing when isOpen is false or product is null/undefined, and pressing Escape or Tab is a safe no-op", () => {
    const indexed = indexCatalog(createQuickViewFixtureCatalog());
    const product = indexed.productsBySlug.get(
      "pablo-kare-plafonyer-led-avize"
    );
    const onClose = vi.fn();

    const { rerender } = render(
      <MemoryRouter>
        <QuickViewModal
          isOpen={false}
          product={product}
          catalog={indexed}
          onClose={onClose}
        />
      </MemoryRouter>
    );

    expect(screen.queryByTestId("quick-view-modal")).not.toBeInTheDocument();
    expect(() => {
      fireEvent.keyDown(document, { key: "Escape" });
      fireEvent.keyDown(document, { key: "Tab" });
    }).not.toThrow();
    expect(onClose).not.toHaveBeenCalled();

    rerender(
      <MemoryRouter>
        <QuickViewModal
          isOpen={true}
          product={null}
          catalog={indexed}
          onClose={onClose}
        />
      </MemoryRouter>
    );

    expect(screen.queryByTestId("quick-view-modal")).not.toBeInTheDocument();
    expect(() => {
      fireEvent.keyDown(document, { key: "Escape" });
      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    }).not.toThrow();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders accessible dialog, backdrop, close button, image gallery with thumbnails, summary details, highlights, read-only variant badges with swatches, and product link", () => {
    const indexed = indexCatalog(createQuickViewFixtureCatalog());
    const product = indexed.productsBySlug.get(
      "pablo-kare-plafonyer-led-avize"
    );
    const onClose = vi.fn();

    render(
      <MemoryRouter initialEntries={["/kategori/led-avizeler"]}>
        <QuickViewModal
          isOpen={true}
          product={product}
          catalog={indexed}
          onClose={onClose}
        />
        <LocationProbe />
      </MemoryRouter>
    );

    const modal = screen.getByTestId("quick-view-modal");
    expect(modal).toHaveAttribute("role", "dialog");
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAttribute(
      "aria-label",
      "Pablo Kare Plafonyer LED Avize hızlı görünüm"
    );

    expect(screen.getByTestId("quick-view-backdrop")).toBeInTheDocument();

    const closeBtn = screen.getByTestId("quick-view-close");
    expect(closeBtn).toHaveAttribute("type", "button");
    expect(closeBtn).toHaveAttribute("aria-label", "Hızlı görünümü kapat");

    // Main image and fallback error handler
    const mainImg = screen.getByTestId("quick-view-main-image");
    expect(mainImg.tagName).toBe("IMG");
    expect(mainImg).toHaveAttribute("alt", "Pablo Kare Plafonyer LED Avize");
    expect(mainImg).toHaveAttribute(
      "src",
      "/assets/pablo-kare-plafonyer-led-avize/main.webp"
    );

    fireEvent.error(mainImg);
    expect(mainImg).toHaveAttribute("src", "https://picsum.photos/600/600");
    expect(mainImg.dataset.fallbackApplied).toBe("true");

    // Thumbnails when images.length > 1
    const thumb0 = screen.getByTestId("quick-view-thumb-0");
    const thumb1 = screen.getByTestId("quick-view-thumb-1");
    const thumb2 = screen.getByTestId("quick-view-thumb-2");

    expect(thumb0).toHaveAttribute("type", "button");
    expect(thumb0).toHaveAttribute(
      "aria-label",
      "Pablo Kare Plafonyer LED Avize görsel 1"
    );
    expect(thumb1).toHaveAttribute(
      "aria-label",
      "Pablo Kare Plafonyer LED Avize görsel 2"
    );
    expect(thumb2).toHaveAttribute(
      "aria-label",
      "Pablo Kare Plafonyer LED Avize görsel 3"
    );

    expect(thumb0).toHaveAttribute("aria-pressed", "true");
    expect(thumb1).toHaveAttribute("aria-pressed", "false");
    expect(thumb2).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(thumb1);
    expect(thumb0).toHaveAttribute("aria-pressed", "false");
    expect(thumb1).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("quick-view-main-image")).toHaveAttribute(
      "src",
      "/assets/pablo-kare-plafonyer-led-avize/gallery-01.webp"
    );

    // Summary details
    expect(screen.getByTestId("quick-view-stock")).toHaveTextContent(
      /^Stokta$/
    );
    expect(screen.getByTestId("quick-view-sku")).toHaveTextContent(
      "PRBK-PABLO-101"
    );
    expect(screen.getByTestId("quick-view-title")).toHaveTextContent(
      "Pablo Kare Plafonyer LED Avize"
    );
    expect(screen.getByTestId("quick-view-price")).toHaveTextContent(
      "₺1.500 – ₺2.200"
    );

    // Highlights
    const highlightsList = screen.getByTestId("quick-view-highlights");
    expect(highlightsList.tagName).toBe("UL");
    const highlightItems = within(highlightsList).getAllByRole("listitem");
    expect(highlightItems).toHaveLength(3);
    expect(highlightItems[0]).toHaveTextContent("Güç: 45W Yüksek Lümen LED");
    expect(highlightItems[1]).toHaveTextContent("Kumandalı 3 Renk Işık Modu");
    expect(highlightItems[2]).toHaveTextContent("Yerli Üretim 2 Yıl Garantili");

    // Read-only variant option groups and badges with swatches
    const variantsContainer = screen.getByTestId("quick-view-variants");
    expect(variantsContainer).toBeInTheDocument();

    const frameGroup = within(variantsContainer).getByTestId(
      "quick-view-variant-group-cerceve-rengi"
    );
    const lightGroup = within(variantsContainer).getByTestId(
      "quick-view-variant-group-isik-rengi"
    );
    expect(frameGroup).toHaveTextContent("Çerçeve Rengi");
    expect(lightGroup).toHaveTextContent("Işık Rengi");

    const badgeSiyah = within(frameGroup).getByTestId(
      "quick-view-variant-term-cerceve-rengi-siyah"
    );
    const badgeGold = within(frameGroup).getByTestId(
      "quick-view-variant-term-cerceve-rengi-gold"
    );
    const badge3Renk = within(lightGroup).getByTestId(
      "quick-view-variant-term-isik-rengi-3-renk"
    );
    const badgeGunIsigi = within(lightGroup).getByTestId(
      "quick-view-variant-term-isik-rengi-gun-isigi"
    );

    expect(badgeSiyah.tagName).toBe("SPAN");
    expect(badgeGold.tagName).toBe("SPAN");
    expect(badge3Renk.tagName).toBe("SPAN");
    expect(badgeGunIsigi.tagName).toBe("SPAN");

    expect(badgeSiyah).toHaveTextContent("Siyah");
    expect(badgeGold).toHaveTextContent("Gold");
    expect(badge3Renk).toHaveTextContent("3 Renk");
    expect(badgeGunIsigi).toHaveTextContent("Gün Işığı");

    const siyahSwatch = badgeSiyah.querySelector("[style]");
    expect(siyahSwatch).not.toBeNull();
    expect(siyahSwatch).toHaveStyle({ backgroundColor: "#18181b" });

    const goldSwatch = badgeGold.querySelector("[style]");
    expect(goldSwatch).not.toBeNull();
    expect(goldSwatch).toHaveStyle({ backgroundColor: "#d4af37" });

    // Product detail link
    const productLink = screen.getByTestId("quick-view-product-link");
    expect(productLink).toHaveTextContent("Ürün Detayına Git");
    expect(productLink).toHaveAttribute(
      "href",
      "/urun/pablo-kare-plafonyer-led-avize"
    );

    fireEvent.click(productLink);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("location-probe")).toHaveTextContent(
      "/urun/pablo-kare-plafonyer-led-avize"
    );
  });

  it("omits thumbnails when images.length <= 1, omits highlights when empty, omits variants when attributes are empty, and renders 'Stokta Yok' when out of stock", () => {
    const indexed = indexCatalog(createQuickViewFixtureCatalog());
    const singleSimpleProduct = indexed.productsBySlug.get(
      "aslan-model-rgb-masa-lambasi"
    );

    const { rerender } = render(
      <MemoryRouter>
        <QuickViewModal
          isOpen={true}
          product={singleSimpleProduct}
          catalog={indexed}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId("quick-view-stock")).toHaveTextContent(
      /^Stokta Yok$/
    );
    expect(screen.getByTestId("quick-view-price")).toHaveTextContent("₺850");
    expect(screen.queryByTestId(/^quick-view-thumb-/)).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("quick-view-highlights")
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("quick-view-variants")).not.toBeInTheDocument();

    // Also test with 0 images
    rerender(
      <MemoryRouter>
        <QuickViewModal
          isOpen={true}
          product={{ ...singleSimpleProduct, images: [] }}
          catalog={indexed}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );
    expect(screen.queryByTestId(/^quick-view-thumb-/)).not.toBeInTheDocument();
  });

  it("resets activeIndex to 0 when product changes or when modal reopens", () => {
    const indexed = indexCatalog(createQuickViewFixtureCatalog());
    const productA = indexed.productsBySlug.get(
      "pablo-kare-plafonyer-led-avize"
    );
    const productB = indexed.productsBySlug.get("kuzey-halka-sarkit-avize");

    const { rerender } = render(
      <MemoryRouter>
        <QuickViewModal
          isOpen={true}
          product={productA}
          catalog={indexed}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId("quick-view-thumb-1"));
    expect(screen.getByTestId("quick-view-main-image")).toHaveAttribute(
      "src",
      "/assets/pablo-kare-plafonyer-led-avize/gallery-01.webp"
    );

    // Switch to another product while open -> resets to index 0
    rerender(
      <MemoryRouter>
        <QuickViewModal
          isOpen={true}
          product={productB}
          catalog={indexed}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );
    expect(screen.getByTestId("quick-view-main-image")).toHaveAttribute(
      "src",
      "/assets/kuzey-halka-sarkit-avize/main.webp"
    );
    expect(screen.getByTestId("quick-view-thumb-0")).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    // Select second thumb of productB, then close and reopen -> resets to index 0
    fireEvent.click(screen.getByTestId("quick-view-thumb-1"));
    expect(screen.getByTestId("quick-view-main-image")).toHaveAttribute(
      "src",
      "/assets/kuzey-halka-sarkit-avize/side.webp"
    );

    rerender(
      <MemoryRouter>
        <QuickViewModal
          isOpen={false}
          product={productB}
          catalog={indexed}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );
    rerender(
      <MemoryRouter>
        <QuickViewModal
          isOpen={true}
          product={productB}
          catalog={indexed}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );
    expect(screen.getByTestId("quick-view-main-image")).toHaveAttribute(
      "src",
      "/assets/kuzey-halka-sarkit-avize/main.webp"
    );
  });

  it("focuses quick-view-close when opened, traps Tab and Shift+Tab inside the modal, and closes on close button, backdrop click, or Escape", () => {
    const indexed = indexCatalog(createQuickViewFixtureCatalog());
    const product = indexed.productsBySlug.get(
      "pablo-kare-plafonyer-led-avize"
    );
    const onClose = vi.fn();

    render(
      <MemoryRouter>
        <QuickViewModal
          isOpen={true}
          product={product}
          catalog={indexed}
          onClose={onClose}
        />
      </MemoryRouter>
    );

    const closeBtn = screen.getByTestId("quick-view-close");
    const productLink = screen.getByTestId("quick-view-product-link");

    // Initial focus moves to close button
    expect(document.activeElement).toBe(closeBtn);

    // Shift+Tab on first focusable element wraps to last focusable element (productLink)
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(productLink);

    // Tab on last focusable element wraps to first focusable element (closeBtn)
    fireEvent.keyDown(document, { key: "Tab", shiftKey: false });
    expect(document.activeElement).toBe(closeBtn);

    // Close via close button click
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Close via backdrop click
    fireEvent.click(screen.getByTestId("quick-view-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(2);

    // Close via Escape keydown
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

describe("ProductCard quick view trigger and integration", () => {
  it("renders quick-view-trigger without crashing outside QueryClientProvider, preserves single <li> when closed, and opens QuickViewModal or invokes onQuickView without navigating", () => {
    const indexed = indexCatalog(createQuickViewFixtureCatalog());
    const product = indexed.productsBySlug.get(
      "pablo-kare-plafonyer-led-avize"
    );
    const onQuickView = vi.fn();

    // 1. With custom onQuickView callback outside QueryClientProvider
    const { unmount } = render(
      <MemoryRouter initialEntries={["/kategori/led-avizeler"]}>
        <ul>
          <ProductCard product={product} onQuickView={onQuickView} />
        </ul>
        <LocationProbe />
      </MemoryRouter>
    );

    const card = screen.getByTestId("product-card");
    expect(card.tagName).toBe("LI");
    expect(card.querySelectorAll("li")).toHaveLength(0);

    const trigger = within(card).getByTestId(
      "quick-view-trigger-pablo-kare-plafonyer-led-avize"
    );
    expect(trigger).toHaveAttribute("type", "button");
    expect(trigger).toHaveAttribute(
      "aria-label",
      "Pablo Kare Plafonyer LED Avize hızlı görünüm"
    );

    fireEvent.click(trigger);
    expect(onQuickView).toHaveBeenCalledTimes(1);
    expect(onQuickView).toHaveBeenCalledWith(product);
    expect(screen.getByTestId("location-probe")).toHaveTextContent(
      "/kategori/led-avizeler"
    );
    expect(screen.queryByTestId("quick-view-modal")).not.toBeInTheDocument();
    unmount();

    // 2. Without onQuickView prop outside QueryClientProvider -> manages its own QuickViewModal state
    render(
      <MemoryRouter initialEntries={["/kategori/led-avizeler"]}>
        <ul>
          <ProductCard product={product} />
        </ul>
        <LocationProbe />
      </MemoryRouter>
    );

    const internalTrigger = screen.getByTestId(
      "quick-view-trigger-pablo-kare-plafonyer-led-avize"
    );
    fireEvent.click(internalTrigger);

    expect(screen.getByTestId("location-probe")).toHaveTextContent(
      "/kategori/led-avizeler"
    );
    const modal = screen.getByTestId("quick-view-modal");
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByTestId("quick-view-title")).toHaveTextContent(
      "Pablo Kare Plafonyer LED Avize"
    );

    // Close modal via close button
    fireEvent.click(within(modal).getByTestId("quick-view-close"));
    expect(screen.queryByTestId("quick-view-modal")).not.toBeInTheDocument();
  });

  it("opens QuickViewModal with resolved Turkish attribute/term names from /kategori/led-avizeler, /kategori/:slug, and /urun/:slug similar products inside App, and never renders omitted e-commerce terms", async () => {
    const indexed = indexCatalog(createQuickViewFixtureCatalog());
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexed);

    // 1. On /kategori/led-avizeler
    const { container, unmount: unmountListing } = renderWithProviders(
      <App />,
      {
        initialEntries: ["/kategori/led-avizeler"],
        queryClient,
        includeLocationProbe: true,
      }
    );

    await screen.findByTestId("debug-result-count");
    fireEvent.click(
      screen.getByTestId("quick-view-trigger-pablo-kare-plafonyer-led-avize")
    );

    let modal = screen.getByTestId("quick-view-modal");
    expect(
      within(modal).getByTestId("quick-view-variant-group-cerceve-rengi")
    ).toHaveTextContent("Çerçeve Rengi");
    expect(
      within(modal).getByTestId("quick-view-variant-term-cerceve-rengi-siyah")
    ).toHaveTextContent("Siyah");

    const modalText = container.textContent || "";
    OMITTED_TERMS.forEach((term) => {
      expect(modalText).not.toMatch(new RegExp(term, "i"));
    });

    // Clicking "Ürün Detayına Git" closes modal and navigates to /urun/pablo-kare-plafonyer-led-avize
    fireEvent.click(within(modal).getByTestId("quick-view-product-link"));
    expect(screen.queryByTestId("quick-view-modal")).not.toBeInTheDocument();
    expect(screen.getByTestId("location-probe")).toHaveTextContent(
      "/urun/pablo-kare-plafonyer-led-avize"
    );
    unmountListing();

    // 2. On /kategori/led-avizeler
    const { unmount: unmountCategory } = renderWithProviders(<App />, {
      initialEntries: ["/kategori/led-avizeler"],
      queryClient,
    });

    await screen.findByTestId("debug-result-count");
    fireEvent.click(
      screen.getByTestId("quick-view-trigger-kuzey-halka-sarkit-avize")
    );
    modal = screen.getByTestId("quick-view-modal");
    expect(within(modal).getByTestId("quick-view-title")).toHaveTextContent(
      "Kuzey Halka Sarkıt Avize"
    );
    expect(
      within(modal).getByTestId(
        "quick-view-variant-term-cerceve-rengi-gold-renk"
      )
    ).toHaveTextContent("Gold");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("quick-view-modal")).not.toBeInTheDocument();
    unmountCategory();

    // 3. On /urun/:slug similar products section
    renderWithProviders(<App />, {
      initialEntries: ["/urun/pablo-kare-plafonyer-led-avize"],
      queryClient,
    });

    const similarSection = await screen.findByTestId(
      "similar-products-section"
    );
    const similarTrigger = within(similarSection).getByTestId(
      "quick-view-trigger-kuzey-halka-sarkit-avize"
    );
    fireEvent.click(similarTrigger);

    modal = screen.getByTestId("quick-view-modal");
    expect(within(modal).getByTestId("quick-view-title")).toHaveTextContent(
      "Kuzey Halka Sarkıt Avize"
    );
  });
});

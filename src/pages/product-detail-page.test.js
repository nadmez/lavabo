import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProductGallery from "@/components/catalog/ProductGallery";
import VariantSelector from "@/components/catalog/VariantSelector";
import ProductDetailPage from "@/pages/ProductDetailPage";
import Breadcrumbs from "@/components/catalog/Breadcrumbs";
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

function renderWithProviders(ui, { initialEntries = ["/"], queryClient } = {}) {
  const client = queryClient || createTestQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

function createPhase7FixtureCatalog(overrides = {}) {
  const categories = overrides.categories || [
    {
      id: 1,
      slug: "aydinlatma",
      name: "Aydınlatma",
      parentId: null,
      count: 6,
      descriptionHtml: "<p>Aydınlatma kategorisi</p>",
    },
    {
      id: 2,
      slug: "led-avizeler",
      name: "Led Avizeler",
      parentId: 1,
      count: 5,
      descriptionHtml: "<p>Led avizeler</p>",
    },
    {
      id: 3,
      slug: "modern-led-avize",
      name: "Modern Led Avize",
      parentId: 2,
      count: 4,
      descriptionHtml: "<p>Modern led avizeler</p>",
    },
    {
      id: 4,
      slug: "aplikler",
      name: "Aplikler",
      parentId: 1,
      count: 1,
      descriptionHtml: "<p>Aplikler</p>",
    },
    {
      id: 90,
      slug: "ozel-koleksiyon",
      name: "Özel Koleksiyon",
      parentId: null,
      count: 2,
      descriptionHtml: "",
    },
    {
      id: 91,
      slug: "butik-seri",
      name: "Butik Seri",
      parentId: 90,
      count: 1,
      descriptionHtml: "",
    },
  ];

  const attributes = overrides.attributes || [
    {
      slug: "cerceve-rengi",
      name: "Çerçeve Rengi",
      terms: [
        { slug: "siyah-renk", name: "Siyah", swatch: "#18181b" },
        { slug: "gold-renk", name: "Gold", swatch: "#d4af37" },
        { slug: "beyaz-renk", name: "Beyaz", swatch: "#ffffff" },
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
      createdAt: "2026-01-10T10:00:00.000Z",
      categoryIds: [90, 3, 2],
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
      descriptionHtml:
        "<div><h2>Pablo Serisi</h2><p>Salon ve mutfak için ideal.</p>[embed]https://www.youtube.com/watch?v=demo123[/embed]<p>Alüminyum gövde.</p></div>",
      specs: {
        Marka: "Parbek",
        Malzeme: "Alüminyum",
        Barkod: "8680001101",
      },
      attributes: {
        "cerceve-rengi": ["siyah", "gold", "beyaz"],
        "isik-rengi": ["3-renk", "gun-isigi"],
      },
      variants: [
        {
          id: 2001,
          sku: "PRBK-PABLO-101-BLK-3",
          price: 1500,
          regularPrice: 1800,
          inStock: true,
          image: "pablo-kare-plafonyer-led-avize/variant-siyah.webp",
          terms: {
            "cerceve-rengi": "siyah-renk",
            "isik-rengi": "3-renk",
          },
        },
        {
          id: 2002,
          sku: "PRBK-PABLO-101-BLK-GUN",
          price: 1700,
          regularPrice: 1900,
          inStock: true,
          image: "pablo-kare-plafonyer-led-avize/variant-siyah-gun.webp",
          terms: {
            "cerceve-rengi": "siyah",
            "isik-rengi": "gun-isigi",
          },
        },
        {
          id: 2003,
          sku: "PRBK-PABLO-101-GLD-3",
          price: 2200,
          regularPrice: 2400,
          inStock: false,
          image: "pablo-kare-plafonyer-led-avize/variant-gold.webp",
          terms: {
            "cerceve-rengi": "gold",
            "isik-rengi": "3-renk",
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
      categoryIds: [3, 2],
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
      createdAt: "2026-01-13T10:00:00.000Z",
      categoryIds: [90, 3, 2],
      priceMin: 1900,
      priceMax: 1900,
      images: ["kuzey-halka-sarkit-avize/main.webp"],
      highlights: ["Modern Halka Tasarım"],
      descriptionHtml: "<p>Kuzey serisi sarkıt.</p>",
      specs: {},
      attributes: {},
      variants: [],
    },
    {
      id: 104,
      slug: "vera-ikili-led-avize",
      name: "Vera İkili LED Avize",
      sku: "PRBK-VERA-104",
      inStock: true,
      createdAt: "2026-01-14T10:00:00.000Z",
      categoryIds: [3],
      priceMin: 1350,
      priceMax: 1350,
      images: ["vera-ikili-led-avize/main.webp"],
      highlights: [],
      descriptionHtml: "<p>Vera ikili avize.</p>",
      specs: {},
      attributes: {},
      variants: [],
    },
    {
      id: 105,
      slug: "luna-kristal-led-avize",
      name: "Luna Kristal LED Avize",
      sku: "PRBK-LUNA-105",
      inStock: true,
      createdAt: "2026-01-15T10:00:00.000Z",
      categoryIds: [2],
      priceMin: 2600,
      priceMax: 2600,
      images: ["luna-kristal-led-avize/main.webp"],
      highlights: [],
      descriptionHtml: "<p>Luna kristal avize.</p>",
      specs: {},
      attributes: {},
      variants: [],
    },
    {
      id: 106,
      slug: "zen-minimal-led-avize",
      name: "Zen Minimal LED Avize",
      sku: "PRBK-ZEN-106",
      inStock: true,
      createdAt: "2026-01-16T10:00:00.000Z",
      categoryIds: [2],
      priceMin: 1100,
      priceMax: 1100,
      images: ["zen-minimal-led-avize/main.webp"],
      highlights: [],
      descriptionHtml: "<p>Zen minimal avize.</p>",
      specs: {},
      attributes: {},
      variants: [],
    },
    {
      id: 107,
      slug: "solo-duvar-aplik",
      name: "Solo Duvar Aplik",
      sku: "PRBK-SOLO-107",
      inStock: true,
      createdAt: "2026-01-17T10:00:00.000Z",
      categoryIds: [4],
      priceMin: 600,
      priceMax: 600,
      images: ["solo-duvar-aplik/main.webp"],
      highlights: [],
      descriptionHtml: "<p>Duvar aplik modeli.</p>",
      specs: {},
      attributes: {},
      variants: [],
    },
  ];

  return {
    version: "2026-11-12-phase7",
    categories,
    attributes,
    products,
  };
}

function StatefulVariantSelector({
  product,
  catalog,
  initialSelectedTerms = {},
}) {
  const [selectedTerms, setSelectedTerms] = useState(initialSelectedTerms);

  const handleSelectOrChange = (attrSlugOrNext, maybeTermSlug) => {
    if (typeof attrSlugOrNext === "function") {
      setSelectedTerms(attrSlugOrNext);
      return;
    }
    if (attrSlugOrNext && typeof attrSlugOrNext === "object") {
      setSelectedTerms(attrSlugOrNext);
      return;
    }
    if (typeof attrSlugOrNext === "string") {
      const next = { ...selectedTerms };
      if (!maybeTermSlug || selectedTerms[attrSlugOrNext] === maybeTermSlug) {
        delete next[attrSlugOrNext];
      } else {
        next[attrSlugOrNext] = maybeTermSlug;
      }
      setSelectedTerms(next);
    }
  };

  const handleClear = () => {
    setSelectedTerms({});
  };

  return (
    <VariantSelector
      product={product}
      catalog={catalog}
      selectedTerms={selectedTerms}
      onSelectTerm={handleSelectOrChange}
      onToggleTerm={handleSelectOrChange}
      onChange={handleSelectOrChange}
      onSelectedTermsChange={handleSelectOrChange}
      setSelectedTerms={handleSelectOrChange}
      onClear={handleClear}
    />
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

const OMITTED_ECOMMERCE_TERMS = [
  "Sepete Ekle",
  "Şimdi satın al",
  "Satın Al",
  "Bekleme listesi",
  "Karşılaştır",
  "İstek listesi",
  "Favoriler",
  "Taksit Seçenekleri",
];

describe("ProductGallery component", () => {
  const multiImageProduct = {
    id: 101,
    slug: "pablo-kare-plafonyer-led-avize",
    name: "Pablo Kare Plafonyer LED Avize",
    images: [
      "pablo-kare-plafonyer-led-avize/main.webp",
      "pablo-kare-plafonyer-led-avize/gallery-01.webp",
      "pablo-kare-plafonyer-led-avize/gallery-02.webp",
    ],
  };

  const singleImageProduct = {
    id: 102,
    slug: "aslan-model-rgb-masa-lambasi",
    name: "Aslan Model RGB Masa Lambası",
    images: ["aslan-model-rgb-masa-lambasi/main.webp"],
  };

  it("renders gallery-main-stage and gallery-main-image with resolved asset URL and fallback error handler", () => {
    render(
      <ProductGallery
        product={multiImageProduct}
        images={multiImageProduct.images}
      />
    );

    const stage = screen.getByTestId("gallery-main-stage");
    expect(stage).toBeInTheDocument();

    const mainImg = screen.getByTestId("gallery-main-image");
    expect(mainImg.tagName).toBe("IMG");
    expect(mainImg).toHaveAttribute("alt", "Pablo Kare Plafonyer LED Avize");
    expect(mainImg).toHaveAttribute(
      "src",
      "/assets/pablo-kare-plafonyer-led-avize/main.webp"
    );

    fireEvent.error(mainImg);
    expect(mainImg).toHaveAttribute("src", "https://picsum.photos/600/600");
    expect(mainImg.dataset.fallbackApplied).toBe("true");
  });

  it("supports hover zoom on gallery-main-stage: data-zoomed is 'false' initially, 'true' on mouseEnter/mouseMove, and 'false' on mouseLeave", () => {
    render(
      <ProductGallery
        product={multiImageProduct}
        images={multiImageProduct.images}
      />
    );

    const stage = screen.getByTestId("gallery-main-stage");
    const mainImg = screen.getByTestId("gallery-main-image");

    expect(mainImg).toHaveAttribute("data-zoomed", "false");

    fireEvent.mouseEnter(stage, { clientX: 120, clientY: 80 });
    expect(mainImg).toHaveAttribute("data-zoomed", "true");

    fireEvent.mouseMove(stage, { clientX: 200, clientY: 150 });
    expect(mainImg).toHaveAttribute("data-zoomed", "true");

    fireEvent.mouseLeave(stage);
    expect(mainImg).toHaveAttribute("data-zoomed", "false");
  });

  it("renders thumbnail buttons with aria-pressed and aria-label, and updates gallery-main-image when a thumbnail is clicked", () => {
    render(
      <ProductGallery
        product={multiImageProduct}
        images={multiImageProduct.images}
      />
    );

    const thumb0 = screen.getByTestId("gallery-thumb-0");
    const thumb1 = screen.getByTestId("gallery-thumb-1");
    const thumb2 = screen.getByTestId("gallery-thumb-2");

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
    expect(screen.getByTestId("gallery-main-image")).toHaveAttribute(
      "src",
      "/assets/pablo-kare-plafonyer-led-avize/gallery-01.webp"
    );
  });

  it("opens full-screen lightbox via gallery-lightbox-open or gallery-main-image, cycles images with wrap-around when images.length > 1, and closes on close button, backdrop click, or Escape", () => {
    render(
      <ProductGallery
        product={multiImageProduct}
        images={multiImageProduct.images}
      />
    );

    // Pressing Escape while closed is a safe no-op
    expect(screen.queryByTestId("gallery-lightbox")).not.toBeInTheDocument();
    expect(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    }).not.toThrow();
    expect(screen.queryByTestId("gallery-lightbox")).not.toBeInTheDocument();

    // Open via trigger button
    const openBtn = screen.getByTestId("gallery-lightbox-open");
    expect(openBtn).toHaveAttribute("type", "button");
    expect(openBtn).toHaveTextContent(/Büyütmek için tıklayın/i);
    fireEvent.click(openBtn);

    const lightbox = screen.getByTestId("gallery-lightbox");
    expect(lightbox).toHaveAttribute("role", "dialog");
    expect(lightbox).toHaveAttribute("aria-modal", "true");
    expect(lightbox).toHaveAttribute("aria-label", "Ürün görseli tam ekran");

    const lightboxImg = within(lightbox).getByTestId("lightbox-image");
    expect(lightboxImg).toHaveAttribute(
      "src",
      "/assets/pablo-kare-plafonyer-led-avize/main.webp"
    );
    expect(lightboxImg).toHaveAttribute(
      "alt",
      "Pablo Kare Plafonyer LED Avize"
    );

    const prevBtn = within(lightbox).getByTestId("lightbox-prev");
    const nextBtn = within(lightbox).getByTestId("lightbox-next");
    const closeBtn = within(lightbox).getByTestId("lightbox-close");
    expect(closeBtn).toHaveAttribute("aria-label", "Tam ekranı kapat");

    // Wrap-around backward from index 0 -> index 2
    fireEvent.click(prevBtn);
    expect(within(lightbox).getByTestId("lightbox-image")).toHaveAttribute(
      "src",
      "/assets/pablo-kare-plafonyer-led-avize/gallery-02.webp"
    );

    // Wrap-around forward from index 2 -> index 0
    fireEvent.click(nextBtn);
    expect(within(lightbox).getByTestId("lightbox-image")).toHaveAttribute(
      "src",
      "/assets/pablo-kare-plafonyer-led-avize/main.webp"
    );

    // Close via close button
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId("gallery-lightbox")).not.toBeInTheDocument();

    // Open via clicking gallery-main-image and close via backdrop
    fireEvent.click(screen.getByTestId("gallery-main-image"));
    expect(screen.getByTestId("gallery-lightbox")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("lightbox-backdrop"));
    expect(screen.queryByTestId("gallery-lightbox")).not.toBeInTheDocument();

    // Open again and close via Escape key
    fireEvent.click(screen.getByTestId("gallery-lightbox-open"));
    expect(screen.getByTestId("gallery-lightbox")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("gallery-lightbox")).not.toBeInTheDocument();
  });

  it("omits lightbox-prev and lightbox-next inside the open lightbox when images has only 1 image", () => {
    render(
      <ProductGallery
        product={singleImageProduct}
        images={singleImageProduct.images}
      />
    );

    fireEvent.click(screen.getByTestId("gallery-lightbox-open"));

    const lightbox = screen.getByTestId("gallery-lightbox");
    expect(within(lightbox).getByTestId("lightbox-image")).toHaveAttribute(
      "src",
      "/assets/aslan-model-rgb-masa-lambasi/main.webp"
    );
    expect(
      within(lightbox).queryByTestId("lightbox-prev")
    ).not.toBeInTheDocument();
    expect(
      within(lightbox).queryByTestId("lightbox-next")
    ).not.toBeInTheDocument();
  });
});

describe("VariantSelector component", () => {
  it("renders nothing when product.variants is empty or product.attributes is empty", () => {
    const indexed = indexCatalog(createPhase7FixtureCatalog());
    const simpleProduct = indexed.productsBySlug.get(
      "aslan-model-rgb-masa-lambasi"
    );

    const { container, rerender } = render(
      <StatefulVariantSelector product={simpleProduct} catalog={indexed} />
    );
    expect(container).toBeEmptyDOMElement();

    const noVariantsProduct = {
      ...simpleProduct,
      attributes: { "cerceve-rengi": ["siyah"] },
      variants: [],
    };
    rerender(
      <StatefulVariantSelector product={noVariantsProduct} catalog={indexed} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders attribute groups, swatch indicators, cross-attribute availability disabling, toggle deselection, and Temizle button", () => {
    const indexed = indexCatalog(createPhase7FixtureCatalog());
    const variableProduct = indexed.productsBySlug.get(
      "pablo-kare-plafonyer-led-avize"
    );

    render(
      <StatefulVariantSelector product={variableProduct} catalog={indexed} />
    );

    const frameGroup = screen.getByTestId(
      "variant-attribute-group-cerceve-rengi"
    );
    const lightGroup = screen.getByTestId("variant-attribute-group-isik-rengi");

    expect(frameGroup).toHaveTextContent("Çerçeve Rengi");
    expect(lightGroup).toHaveTextContent("Işık Rengi");

    const optSiyah = screen.getByTestId("variant-option-cerceve-rengi-siyah");
    const optGold = screen.getByTestId("variant-option-cerceve-rengi-gold");
    const optBeyaz = screen.getByTestId("variant-option-cerceve-rengi-beyaz");
    const opt3Renk = screen.getByTestId("variant-option-isik-rengi-3-renk");
    const optGunIsigi = screen.getByTestId(
      "variant-option-isik-rengi-gun-isigi"
    );

    // Resolves Turkish names and swatches via -renk alias matching
    expect(optSiyah).toHaveTextContent("Siyah");
    expect(optGold).toHaveTextContent("Gold");
    expect(optBeyaz).toHaveTextContent("Beyaz");

    const siyahSwatch = optSiyah.querySelector("[style]");
    expect(siyahSwatch).not.toBeNull();
    expect(siyahSwatch).toHaveStyle({ backgroundColor: "#18181b" });

    // Initially: siyah and gold have variants, beyaz has no matching variant
    expect(optSiyah).not.toBeDisabled();
    expect(optGold).not.toBeDisabled();
    expect(optBeyaz).toBeDisabled();
    expect(opt3Renk).not.toBeDisabled();
    expect(optGunIsigi).not.toBeDisabled();

    // No clear button when nothing is selected
    expect(
      screen.queryByTestId("variant-clear-button")
    ).not.toBeInTheDocument();

    // Select 'gold' -> only '3-renk' is available with 'gold', so 'gun-isigi' becomes disabled
    fireEvent.click(optGold);
    expect(optGold).toHaveAttribute("aria-pressed", "true");
    expect(optSiyah).toHaveAttribute("aria-pressed", "false");
    expect(opt3Renk).not.toBeDisabled();
    expect(optGunIsigi).toBeDisabled();

    const clearBtn = screen.getByTestId("variant-clear-button");
    expect(clearBtn).toHaveTextContent("Temizle");

    // Clicking 'gold' again deselects it and re-enables 'gun-isigi'
    fireEvent.click(optGold);
    expect(optGold).toHaveAttribute("aria-pressed", "false");
    expect(optGunIsigi).not.toBeDisabled();
    expect(
      screen.queryByTestId("variant-clear-button")
    ).not.toBeInTheDocument();

    // Select 'siyah' and 'gun-isigi', then click Temizle
    fireEvent.click(optSiyah);
    fireEvent.click(optGunIsigi);
    expect(optSiyah).toHaveAttribute("aria-pressed", "true");
    expect(optGunIsigi).toHaveAttribute("aria-pressed", "true");
    // Because 'gun-isigi' is selected, 'gold' (which only has '3-renk') is now disabled
    expect(optGold).toBeDisabled();

    fireEvent.click(screen.getByTestId("variant-clear-button"));
    expect(optSiyah).toHaveAttribute("aria-pressed", "false");
    expect(optGunIsigi).toHaveAttribute("aria-pressed", "false");
    expect(optGold).not.toBeDisabled();
    expect(
      screen.queryByTestId("variant-clear-button")
    ).not.toBeInTheDocument();
  });
});

describe("Breadcrumbs component for a product on ProductDetailPage", () => {
  it("picks the first product category whose slug is in FLAT_MAIN_CATEGORIES, walks its parentId ancestor chain root-to-leaf, and renders product.name with aria-current='page'", () => {
    const indexed = indexCatalog(createPhase7FixtureCatalog());
    const product = indexed.productsBySlug.get(
      "pablo-kare-plafonyer-led-avize"
    );

    // product.categoryIds is [90 ("ozel-koleksiyon", not in FLAT_MAIN_CATEGORIES), 3 ("modern-led-avize", in FLAT_MAIN_CATEGORIES), 2]
    renderWithProviders(<Breadcrumbs catalog={indexed} product={product} />, {
      initialEntries: ["/urun/pablo-kare-plafonyer-led-avize"],
    });

    const nav = screen.getByTestId("catalog-breadcrumbs");
    expect(nav.tagName).toBe("NAV");
    expect(nav).toHaveAttribute("aria-label", "Sayfa yolu");

    const homeLink = within(nav).getByRole("link", { name: "Anasayfa" });
    expect(homeLink).toHaveAttribute("href", "/");

    const rootCatLink = within(nav).getByRole("link", { name: "Aydınlatma" });
    expect(rootCatLink).toHaveAttribute("href", "/kategori/aydinlatma");

    const parentCatLink = within(nav).getByRole("link", {
      name: "Led Avizeler",
    });
    expect(parentCatLink).toHaveAttribute("href", "/kategori/led-avizeler");

    const leafCatLink = within(nav).getByRole("link", {
      name: "Modern Led Avize",
    });
    expect(leafCatLink).toHaveAttribute("href", "/kategori/modern-led-avize");

    const currentItem = within(nav).getByText("Pablo Kare Plafonyer LED Avize");
    expect(currentItem).toHaveAttribute("aria-current", "page");

    const text = nav.textContent || "";
    expect(text.indexOf("Anasayfa")).toBeLessThan(text.indexOf("Aydınlatma"));
    expect(text.indexOf("Aydınlatma")).toBeLessThan(
      text.indexOf("Led Avizeler")
    );
    expect(text.indexOf("Led Avizeler")).toBeLessThan(
      text.indexOf("Modern Led Avize")
    );
    expect(text.indexOf("Modern Led Avize")).toBeLessThan(
      text.indexOf("Pablo Kare Plafonyer LED Avize")
    );
  });

  it("falls back to the first category ID in product.categoryIds that exists in catalog.categoriesById when no category is in FLAT_MAIN_CATEGORIES", () => {
    const indexed = indexCatalog(createPhase7FixtureCatalog());
    const boutiqueProduct = {
      id: 999,
      slug: "butik-ozel-urun",
      name: "Butik Özel Ürün",
      categoryIds: [9999, 91],
    };

    renderWithProviders(
      <Breadcrumbs catalog={indexed} product={boutiqueProduct} />,
      {
        initialEntries: ["/urun/butik-ozel-urun"],
      }
    );

    const nav = screen.getByTestId("catalog-breadcrumbs");
    expect(
      within(nav).getByRole("link", { name: "Özel Koleksiyon" })
    ).toHaveAttribute("href", "/kategori/ozel-koleksiyon");
    expect(
      within(nav).getByRole("link", { name: "Butik Seri" })
    ).toHaveAttribute("href", "/kategori/butik-seri");
    expect(within(nav).getByText("Butik Özel Ürün")).toHaveAttribute(
      "aria-current",
      "page"
    );
  });
});

describe("ProductDetailPage integrated in App on /urun/:slug", () => {
  it("preserves data-testid='product-detail-placeholder' containing :slug across loading, error, and not-found states", async () => {
    // 1. Loading state (never-resolving fetch)
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () => new Promise(() => {})
    );
    const loadingClient = createTestQueryClient();
    const { unmount: unmountLoading } = renderWithProviders(<App />, {
      initialEntries: ["/urun/pablo-kare-plafonyer-led-avize"],
      queryClient: loadingClient,
    });

    const loadingWrapper = screen.getByTestId("product-detail-placeholder");
    expect(loadingWrapper).toHaveTextContent("Yükleniyor...");
    expect(loadingWrapper).toHaveTextContent("pablo-kare-plafonyer-led-avize");
    unmountLoading();

    // 2. Error state (rejected fetch)
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("Catalog network failure")
    );
    const errorClient = createTestQueryClient();
    const { unmount: unmountError } = renderWithProviders(<App />, {
      initialEntries: ["/urun/pablo-kare-plafonyer-led-avize"],
      queryClient: errorClient,
    });

    const alertEl = await screen.findByRole("alert");
    const errorWrapper = screen.getByTestId("product-detail-placeholder");
    expect(errorWrapper).toContainElement(alertEl);
    expect(errorWrapper).toHaveTextContent("pablo-kare-plafonyer-led-avize");
    unmountError();

    // 3. Not-found product state
    const loadedClient = createTestQueryClient();
    loadedClient.setQueryData(
      ["catalog"],
      indexCatalog(createPhase7FixtureCatalog())
    );
    renderWithProviders(<App />, {
      initialEntries: ["/urun/olmayan-urun-slug"],
      queryClient: loadedClient,
    });

    const notFoundWrapper = screen.getByTestId("product-detail-placeholder");
    expect(notFoundWrapper).toHaveTextContent("olmayan-urun-slug");

    const notFoundBox =
      within(notFoundWrapper).getByTestId("product-not-found");
    expect(notFoundBox).toHaveTextContent("Ürün Bulunamadı");

    const backAllLink = within(notFoundBox).getByRole("link", {
      name: /Tüm Ürünlere Dön/i,
    });
    expect(backAllLink).toHaveAttribute("href", "/urunlerimiz");
  });

  it("renders back / previous / next navigation and omits prev-product-link on first product and next-product-link on last product", () => {
    const indexed = indexCatalog(createPhase7FixtureCatalog());
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexed);

    // First product (index 0: pablo-kare-plafonyer-led-avize)
    const { unmount: unmountFirst } = renderWithProviders(<App />, {
      initialEntries: ["/urun/pablo-kare-plafonyer-led-avize"],
      queryClient,
    });

    const firstNav = screen.getByTestId("product-prev-next-nav");
    const backLink = within(firstNav).getByTestId("back-to-products-link");
    expect(backLink).toHaveAttribute("href", "/urunlerimiz");
    expect(backLink).toHaveTextContent(/Ürünlere geri dön/i);

    expect(
      within(firstNav).queryByTestId("prev-product-link")
    ).not.toBeInTheDocument();

    const nextFromFirst = within(firstNav).getByTestId("next-product-link");
    expect(nextFromFirst).toHaveAttribute(
      "href",
      "/urun/aslan-model-rgb-masa-lambasi"
    );
    expect(nextFromFirst).toHaveTextContent(/Sonraki Ürün/i);
    expect(nextFromFirst).toHaveTextContent("Aslan Model RGB Masa Lambası");
    unmountFirst();

    // Middle product (index 1: aslan-model-rgb-masa-lambasi)
    const { unmount: unmountMiddle } = renderWithProviders(<App />, {
      initialEntries: ["/urun/aslan-model-rgb-masa-lambasi"],
      queryClient,
    });

    const middleNav = screen.getByTestId("product-prev-next-nav");
    const prevFromMiddle = within(middleNav).getByTestId("prev-product-link");
    expect(prevFromMiddle).toHaveAttribute(
      "href",
      "/urun/pablo-kare-plafonyer-led-avize"
    );
    expect(prevFromMiddle).toHaveTextContent(/Önceki Ürün/i);
    expect(prevFromMiddle).toHaveTextContent("Pablo Kare Plafonyer LED Avize");

    const nextFromMiddle = within(middleNav).getByTestId("next-product-link");
    expect(nextFromMiddle).toHaveAttribute(
      "href",
      "/urun/kuzey-halka-sarkit-avize"
    );
    unmountMiddle();

    // Last product (index 6: solo-duvar-aplik)
    renderWithProviders(<App />, {
      initialEntries: ["/urun/solo-duvar-aplik"],
      queryClient,
    });

    const lastNav = screen.getByTestId("product-prev-next-nav");
    expect(within(lastNav).getByTestId("prev-product-link")).toHaveAttribute(
      "href",
      "/urun/zen-minimal-led-avize"
    );
    expect(
      within(lastNav).queryByTestId("next-product-link")
    ).not.toBeInTheDocument();
  });

  it("dynamically updates price, SKU, stock badge, and gallery image when selecting variant options and resets when clicking Temizle", () => {
    const indexed = indexCatalog(createPhase7FixtureCatalog());
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexed);

    renderWithProviders(<App />, {
      initialEntries: ["/urun/pablo-kare-plafonyer-led-avize"],
      queryClient,
    });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Pablo Kare Plafonyer LED Avize",
      })
    ).toBeInTheDocument();

    const priceEl = screen.getByTestId("product-detail-price");
    const skuEl = screen.getByTestId("product-detail-sku");
    const stockEl = screen.getByTestId("product-detail-stock");
    const mainImg = screen.getByTestId("gallery-main-image");

    // Initial state (no variant selected)
    expect(priceEl).toHaveTextContent("₺1.500 – ₺2.200");
    expect(skuEl).toHaveTextContent("PRBK-PABLO-101");
    expect(stockEl).toHaveTextContent(/^Stokta$/);
    expect(mainImg).toHaveAttribute(
      "src",
      "/assets/pablo-kare-plafonyer-led-avize/main.webp"
    );

    // Partial selection: select 'siyah' (matches 2 variants: 1500 and 1700)
    fireEvent.click(screen.getByTestId("variant-option-cerceve-rengi-siyah"));
    expect(priceEl).toHaveTextContent("₺1.500 – ₺1.700");
    expect(skuEl).toHaveTextContent("PRBK-PABLO-101");
    expect(stockEl).toHaveTextContent(/^Stokta$/);

    // Complete selection: select '3-renk' -> resolves Variant 2001 (1500, PRBK-PABLO-101-BLK-3, inStock: true, variant-siyah.webp)
    fireEvent.click(screen.getByTestId("variant-option-isik-rengi-3-renk"));
    expect(priceEl).toHaveTextContent(/^₺1\.500$/);
    expect(skuEl).toHaveTextContent("PRBK-PABLO-101-BLK-3");
    expect(stockEl).toHaveTextContent(/^Stokta$/);
    expect(screen.getByTestId("gallery-main-image")).toHaveAttribute(
      "src",
      "/assets/pablo-kare-plafonyer-led-avize/variant-siyah.webp"
    );

    // Switch frame colour to 'gold' (with '3-renk' still selected) -> resolves Variant 2003 (2200, PRBK-PABLO-101-GLD-3, inStock: false, variant-gold.webp)
    fireEvent.click(screen.getByTestId("variant-option-cerceve-rengi-gold"));
    expect(priceEl).toHaveTextContent(/^₺2\.200$/);
    expect(skuEl).toHaveTextContent("PRBK-PABLO-101-GLD-3");
    expect(stockEl).toHaveTextContent(/^Stokta Yok$/);
    expect(screen.getByTestId("gallery-main-image")).toHaveAttribute(
      "src",
      "/assets/pablo-kare-plafonyer-led-avize/variant-gold.webp"
    );

    // Click Temizle -> resets to product range, SKU, stock, and main image
    fireEvent.click(screen.getByTestId("variant-clear-button"));
    expect(priceEl).toHaveTextContent("₺1.500 – ₺2.200");
    expect(skuEl).toHaveTextContent("PRBK-PABLO-101");
    expect(stockEl).toHaveTextContent(/^Stokta$/);
    expect(screen.getByTestId("gallery-main-image")).toHaveAttribute(
      "src",
      "/assets/pablo-kare-plafonyer-led-avize/main.webp"
    );
  });

  it("renders product-highlights when highlights are present and omits it when highlights are empty", () => {
    const indexed = indexCatalog(createPhase7FixtureCatalog());
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexed);

    const { unmount } = renderWithProviders(<App />, {
      initialEntries: ["/urun/pablo-kare-plafonyer-led-avize"],
      queryClient,
    });

    const highlightsList = screen.getByTestId("product-highlights");
    expect(highlightsList.tagName).toBe("UL");
    const items = within(highlightsList).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Güç: 45W Yüksek Lümen LED");
    expect(items[1]).toHaveTextContent("Kumandalı 3 Renk Işık Modu");
    expect(items[2]).toHaveTextContent("Yerli Üretim 2 Yıl Garantili");
    unmount();

    // Product with highlights: []
    renderWithProviders(<App />, {
      initialEntries: ["/urun/aslan-model-rgb-masa-lambasi"],
      queryClient,
    });

    expect(screen.queryByTestId("product-highlights")).not.toBeInTheDocument();
    expect(screen.getByTestId("product-detail-stock")).toHaveTextContent(
      /^Stokta Yok$/
    );
  });

  it("renders Açıklama (stripping [embed]...[/embed]) and Ek bilgi tabs with product.specs and human-readable product.attributes rows", () => {
    const indexed = indexCatalog(createPhase7FixtureCatalog());
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexed);

    renderWithProviders(<App />, {
      initialEntries: ["/urun/pablo-kare-plafonyer-led-avize"],
      queryClient,
    });

    const tablist = screen.getByTestId("product-detail-tabs");
    expect(tablist).toHaveAttribute("role", "tablist");
    expect(tablist).toHaveAttribute("aria-label", "Ürün detay sekmeleri");

    const descTabBtn = screen.getByTestId("tab-btn-description");
    const specsTabBtn = screen.getByTestId("tab-btn-specs");

    expect(descTabBtn).toHaveAttribute("role", "tab");
    expect(descTabBtn).toHaveAttribute("aria-selected", "true");
    expect(descTabBtn).toHaveTextContent("Açıklama");

    expect(specsTabBtn).toHaveAttribute("role", "tab");
    expect(specsTabBtn).toHaveAttribute("aria-selected", "false");
    expect(specsTabBtn).toHaveTextContent("Ek bilgi");

    const descPanel = screen.getByTestId("tab-panel-description");
    expect(descPanel).toHaveAttribute("role", "tabpanel");
    expect(descPanel).toHaveTextContent("Pablo Serisi");
    expect(descPanel).toHaveTextContent("Salon ve mutfak için ideal.");
    expect(descPanel).toHaveTextContent("Alüminyum gövde.");
    expect(descPanel.textContent).not.toMatch(/\[embed\]|\[\/embed\]/i);
    expect(descPanel.textContent).not.toContain("youtube.com");

    // Switch to Ek bilgi tab
    fireEvent.click(specsTabBtn);
    expect(specsTabBtn).toHaveAttribute("aria-selected", "true");
    expect(descTabBtn).toHaveAttribute("aria-selected", "false");

    const specsPanel = screen.getByTestId("tab-panel-specs");
    expect(specsPanel).toHaveAttribute("role", "tabpanel");

    const specsTable = within(specsPanel).getByTestId("product-specs-table");
    expect(specsTable.tagName).toBe("TABLE");

    expect(specsTable).toHaveTextContent("Marka");
    expect(specsTable).toHaveTextContent("Parbek");
    expect(specsTable).toHaveTextContent("Malzeme");
    expect(specsTable).toHaveTextContent("Alüminyum");
    expect(specsTable).toHaveTextContent("Barkod");
    expect(specsTable).toHaveTextContent("8680001101");

    // Attribute rows with Turkish attribute name and comma-separated human-readable term names
    expect(specsTable).toHaveTextContent("Çerçeve Rengi");
    expect(specsTable).toHaveTextContent("Siyah, Gold, Beyaz");
    expect(specsTable).toHaveTextContent("Işık Rengi");
    expect(specsTable).toHaveTextContent("3 Renk, Gün Işığı");
  });

  it("renders similar-products-section with up to 4 similar products sorted by shared category count descending then id ascending, excluding current product", () => {
    const indexed = indexCatalog(createPhase7FixtureCatalog());
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexed);

    renderWithProviders(<App />, {
      initialEntries: ["/urun/pablo-kare-plafonyer-led-avize"],
      queryClient,
    });

    const similarSection = screen.getByTestId("similar-products-section");
    expect(similarSection.tagName).toBe("SECTION");
    expect(similarSection).toHaveAttribute("aria-label", "Benzer ürünler");
    expect(similarSection).toHaveTextContent("Benzer Ürünler");

    const cards = within(similarSection).getAllByTestId("product-card");
    // Up to 4 similar products (out of 5 that share categories [90, 3, 2])
    expect(cards).toHaveLength(4);

    // Product 103 shares 3 categories ([90, 3, 2]), Product 102 shares 2 ([3, 2]), Product 104 shares 1 ([3]), Product 105 shares 1 ([2], id 105 < 106)
    expect(cards[0]).toHaveTextContent("Kuzey Halka Sarkıt Avize");
    expect(cards[1]).toHaveTextContent("Aslan Model RGB Masa Lambası");
    expect(cards[2]).toHaveTextContent("Vera İkili LED Avize");
    expect(cards[3]).toHaveTextContent("Luna Kristal LED Avize");

    // Does not include current product
    cards.forEach((card) => {
      expect(card).not.toHaveTextContent("Pablo Kare Plafonyer LED Avize");
    });
  });

  it("resets selectedTerms, activeTab, and gallery active image when navigating to another /urun/:otherSlug route", () => {
    const indexed = indexCatalog(createPhase7FixtureCatalog());
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexed);

    renderWithProviders(
      <Routes>
        <Route path="/urun/:slug" element={<ProductDetailPage />} />
      </Routes>,
      {
        initialEntries: ["/urun/pablo-kare-plafonyer-led-avize"],
        queryClient,
      }
    );

    // Change thumbnail, select a variant option, and switch tab to specs
    fireEvent.click(screen.getByTestId("gallery-thumb-1"));
    expect(screen.getByTestId("gallery-main-image")).toHaveAttribute(
      "src",
      "/assets/pablo-kare-plafonyer-led-avize/gallery-01.webp"
    );

    fireEvent.click(screen.getByTestId("variant-option-cerceve-rengi-siyah"));
    expect(screen.getByTestId("variant-clear-button")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("tab-btn-specs"));
    expect(screen.getByTestId("tab-btn-specs")).toHaveAttribute(
      "aria-selected",
      "true"
    );

    // Navigate to next product (/urun/aslan-model-rgb-masa-lambasi)
    fireEvent.click(screen.getByTestId("next-product-link"));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Aslan Model RGB Masa Lambası",
      })
    ).toBeInTheDocument();
    expect(screen.getByTestId("tab-btn-description")).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByTestId("tab-panel-description")).toBeInTheDocument();
    expect(screen.getByTestId("gallery-main-image")).toHaveAttribute(
      "src",
      "/assets/aslan-model-rgb-masa-lambasi/main.webp"
    );

    // Navigate back to previous product (/urun/pablo-kare-plafonyer-led-avize) and confirm variant selection was reset
    fireEvent.click(screen.getByTestId("prev-product-link"));
    expect(
      screen.queryByTestId("variant-clear-button")
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("variant-option-cerceve-rengi-siyah")
    ).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("gallery-main-image")).toHaveAttribute(
      "src",
      "/assets/pablo-kare-plafonyer-led-avize/main.webp"
    );
  });

  it("never renders omitted e-commerce, quantity, wishlist, comparison, installment, or WhatsApp CTA elements", () => {
    const indexed = indexCatalog(createPhase7FixtureCatalog());
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexed);

    const { container } = renderWithProviders(<App />, {
      initialEntries: ["/urun/pablo-kare-plafonyer-led-avize"],
      queryClient,
    });

    const text = container.textContent || "";
    OMITTED_ECOMMERCE_TERMS.forEach((term) => {
      expect(text).not.toMatch(new RegExp(term, "i"));
    });

    const allLinks = container.querySelectorAll("a[href]");
    allLinks.forEach((anchor) => {
      const href = anchor.getAttribute("href") || "";
      expect(href).not.toMatch(/wa\.me|whatsapp/i);
    });
  });
});

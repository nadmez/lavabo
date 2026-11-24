import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MAIN_NAV_CATEGORIES,
  FLAT_MAIN_CATEGORIES,
  SHOWROOM_CONTACT,
} from "@/data/navigation";
import Header from "@/components/layout/Header";
import MobileDrawer from "@/components/layout/MobileDrawer";
import Footer from "@/components/layout/Footer";
import Layout from "@/components/layout/Layout";
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

function createFixtureCatalog() {
  return {
    version: "2026-11-11-phase4",
    categories: [
      {
        id: 1,
        slug: "led-avizeler",
        name: "Led Avizeler",
        parentId: null,
        count: 1,
      },
    ],
    attributes: [],
    products: [
      {
        id: 101,
        slug: "pablo-kare-plafonyer-led-avize",
        name: "Pablo Kare Plafonyer LED Avize",
        sku: "PRBK-PBL-101",
        inStock: true,
        createdAt: "2026-01-10T10:00:00.000Z",
        categoryIds: [1],
        priceMin: 1500,
        priceMax: 1500,
        images: ["pablo-kare-plafonyer-led-avize/main.webp"],
        attributes: {},
      },
    ],
  };
}

function renderWithProviders(ui, { initialEntries = ["/"], queryClient } = {}) {
  const client = queryClient || createTestQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

function createChromeCatalog() {
  let nextId = 1;
  const categories = [];
  for (const category of MAIN_NAV_CATEGORIES) {
    const id = nextId;
    nextId += 1;
    categories.push({
      id,
      slug: category.slug,
      name: category.name,
      parentId: null,
      count: 0,
      descriptionHtml: "",
    });
    for (const child of category.children) {
      categories.push({
        id: nextId,
        slug: child.slug,
        name: child.name,
        parentId: id,
        count: 0,
        descriptionHtml: "",
      });
      nextId += 1;
    }
  }
  return {
    version: "chrome",
    siteSettings: {
      siteName: "Lavabo Aydınlatma",
      tagline:
        "Yerli üretim modern LED avize, plafonyer, lineer aydınlatma, aplik ve masa lambası koleksiyonları.",
      metaTitle: "Lavabo Aydınlatma",
      metaDescription: "",
      currency: "TRY",
      locale: "tr-TR",
      contact: SHOWROOM_CONTACT,
      navCategoryIds: [],
      showcaseSections: [],
    },
    categories,
    attributes: [],
    products: [],
  };
}

function createChromeQueryClient() {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(["catalog"], indexCatalog(createChromeCatalog()));
  return queryClient;
}

function renderChrome(ui, options = {}) {
  return renderWithProviders(ui, {
    ...options,
    queryClient: createChromeQueryClient(),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

const EXPECTED_TOP_LEVEL_CATEGORIES = [
  {
    name: "Led Avizeler",
    slug: "led-avizeler",
    href: "/kategori/led-avizeler",
    children: [
      {
        name: "Kumandalı Led Avizeler",
        slug: "kumandali-led-avizeler",
        href: "/kategori/kumandali-led-avizeler",
      },
      {
        name: "İşletme Ofis Led Avizeler",
        slug: "ofis-avize-ve-led-aydinlatma-modelleri",
        href: "/kategori/ofis-avize-ve-led-aydinlatma-modelleri",
      },
      {
        name: "Tavana Sıfır Led Avize",
        slug: "tavana-sifir-led-avize",
        href: "/kategori/tavana-sifir-led-avize",
      },
      {
        name: "Modern Led Avize",
        slug: "modern-led-avize",
        href: "/kategori/modern-led-avize",
      },
      {
        name: "Dekoratif Led Avize",
        slug: "dekoratif-led-avize",
        href: "/kategori/dekoratif-led-avize",
      },
      {
        name: "Led Salon Avize",
        slug: "led-salon-avize",
        href: "/kategori/led-salon-avize",
      },
      {
        name: "Mutfak Led Avize",
        slug: "mutfak-led-avize",
        href: "/kategori/mutfak-led-avize",
      },
      {
        name: "Sarkıt Led Avize",
        slug: "sarkit-led-avize",
        href: "/kategori/sarkit-led-avize",
      },
      {
        name: "3 Renkli Led Avize",
        slug: "3-renkli-led-avize",
        href: "/kategori/3-renkli-led-avize",
      },
    ],
  },
  {
    name: "Plafonyer",
    slug: "plafonyer-led-avize",
    href: "/kategori/plafonyer-led-avize",
    children: [],
  },
  {
    name: "Lineer Aydınlatma",
    slug: "lineer-aydinlatma",
    href: "/kategori/lineer-aydinlatma",
    children: [
      {
        name: "Sarkıt Lineer Aydınlatma",
        slug: "sarkit-lineer-aydinlatma",
        href: "/kategori/sarkit-lineer-aydinlatma",
      },
      {
        name: "Sıva Üstü Lineer Aydınlatma",
        slug: "siva-ustu-lineer-aydinlatma",
        href: "/kategori/siva-ustu-lineer-aydinlatma",
      },
    ],
  },
  {
    name: "Tekli Sarkıt Avizeler",
    slug: "sarkit-avizeler",
    href: "/kategori/sarkit-avizeler",
    children: [],
  },
  {
    name: "Aplikler",
    slug: "aplikler",
    href: "/kategori/aplikler",
    children: [],
  },
  {
    name: "Masa Lambaları",
    slug: "masa-lambalari",
    href: "/kategori/masa-lambalari",
    children: [],
  },
];

const OMITTED_TERMS = [
  "Sepet",
  "Ödeme",
  "Satın Al",
  "Sepete Ekle",
  "Hesabım",
  "Giriş",
  "Üyelik",
  "Sipariş Takip",
  "İstek listesi",
  "Favoriler",
  "Karşılaştır",
  "Mağaza",
  "Fiyatlı Katalog İndir",
  "Fiyatsız Katalog İndir",
  "Premium Series Export Catalogue",
  "Gizlilik politikası",
  "Mesafeli Satış Sözleşmesi",
  "Ön Bilgilendirme Formu",
  "Teslimat ve İade Şartları",
  "Üyelik Sözleşmesi",
  "Kullanıcı Verilerinin Silinmesi",
];

describe("src/data/navigation.js", () => {
  it("exports MAIN_NAV_CATEGORIES with the 6 top-level categories and exact children", () => {
    expect(Array.isArray(MAIN_NAV_CATEGORIES)).toBe(true);
    expect(MAIN_NAV_CATEGORIES).toHaveLength(6);

    MAIN_NAV_CATEGORIES.forEach((cat, idx) => {
      const expected = EXPECTED_TOP_LEVEL_CATEGORIES[idx];
      expect(cat.name).toBe(expected.name);
      expect(cat.slug).toBe(expected.slug);
      expect(cat.href).toBe(expected.href);
      expect(Array.isArray(cat.children)).toBe(true);
      expect(cat.children).toHaveLength(expected.children.length);

      cat.children.forEach((child, childIdx) => {
        const expectedChild = expected.children[childIdx];
        expect(child).toEqual(
          expect.objectContaining({
            name: expectedChild.name,
            slug: expectedChild.slug,
            href: expectedChild.href,
          })
        );
      });
    });
  });

  it("exports FLAT_MAIN_CATEGORIES with all 17 categories flattened in depth-first order", () => {
    expect(Array.isArray(FLAT_MAIN_CATEGORIES)).toBe(true);
    expect(FLAT_MAIN_CATEGORIES).toHaveLength(17);

    const expectedFlat = EXPECTED_TOP_LEVEL_CATEGORIES.flatMap((cat) => [
      { name: cat.name, slug: cat.slug, href: cat.href },
      ...cat.children.map((child) => ({
        name: child.name,
        slug: child.slug,
        href: child.href,
      })),
    ]);

    FLAT_MAIN_CATEGORIES.forEach((entry, index) => {
      expect(entry).toEqual(expect.objectContaining(expectedFlat[index]));
    });
  });

  it("exports SHOWROOM_CONTACT with showroom address, phone objects, mapUrl, and mapLabel", () => {
    expect(SHOWROOM_CONTACT).toEqual({
      address:
        "Uğur Mumcu Mahallesi 2274. Sokak No:12 D:1 Sultançiftliği Sultangazi/İSTANBUL",
      phones: [
        { display: "0532 499 12 28", href: "tel:05324991228" },
        { display: "0212 931 28 07", href: "tel:02129312807" },
      ],
      mapUrl: "https://maps.app.goo.gl/tz4JV4jjvFkvqiXf9",
      mapLabel: "Showroom & İmalat Google Harita Konumu",
    });
  });
});

describe("Header component", () => {
  it("renders site-header and brand-logo linking to '/' with text containing 'Lavabo'", () => {
    renderChrome(<Header />);

    const header = screen.getByTestId("site-header");
    expect(header.tagName).toBe("HEADER");

    const logo = screen.getByTestId("brand-logo");
    expect(logo).toHaveAttribute("href", "/");
    expect(logo).toHaveTextContent(/Lavabo/i);
  });

  it("renders desktop-mega-menu nav with all 6 top-level categories and all 11 child categories, without Tüm Ürünler", () => {
    renderChrome(<Header />);

    const nav = screen.getByTestId("desktop-mega-menu");
    expect(nav.tagName).toBe("NAV");
    expect(nav).toHaveAttribute("aria-label", "Ana navigasyon");
    expect(
      within(nav).queryByRole("link", { name: /Tüm Ürünler/i })
    ).not.toBeInTheDocument();

    FLAT_MAIN_CATEGORIES.forEach((category) => {
      const link = within(nav).getByRole("link", { name: category.name });
      expect(link).toHaveAttribute("href", `/kategori/${category.slug}`);
    });
  });

  it("puts the logo and circular search icon on the first row and keeps menu titles on one line", () => {
    render(
      <QueryClientProvider client={createChromeQueryClient()}>
        <MemoryRouter initialEntries={["/"]}>
          <Header />
          <Routes>
            <Route path="/" element={<div data-testid="route-home" />} />
            <Route path="/arama" element={<div data-testid="route-search" />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const header = screen.getByTestId("site-header");
    expect(header).not.toHaveClass("sticky", "fixed");

    const topRow = screen.getByTestId("header-top-row");
    const menuRow = screen.getByTestId("header-menu-row");
    expect(topRow).toContainElement(screen.getByTestId("brand-logo"));
    expect(topRow).toContainElement(
      screen.getByTestId("header-search-trigger")
    );
    expect(menuRow).toContainElement(screen.getByTestId("desktop-mega-menu"));
    expect(topRow).toHaveClass("items-center", "pr-5", "h-[120px]");

    const searchTrigger = screen.getByTestId("header-search-trigger");
    expect(searchTrigger).toHaveAttribute("aria-label", "Ürün ara");
    expect(searchTrigger).toHaveClass("rounded-full", "h-[42px]", "w-[42px]");

    const nav = screen.getByTestId("desktop-mega-menu");
    expect(nav).toHaveClass("flex-nowrap");
    expect(
      within(nav).queryByRole("link", { name: /Tüm Ürünler/i })
    ).not.toBeInTheDocument();
    MAIN_NAV_CATEGORIES.forEach((category) => {
      expect(
        within(nav).getByRole("link", { name: category.name })
      ).toHaveClass("whitespace-nowrap");
    });

    const input = screen.getByTestId("header-search-input");
    expect(input).not.toBeVisible();
    fireEvent.click(searchTrigger);
    expect(input).toBeVisible();
    const panel = screen.getByTestId("header-search-panel");
    expect(panel).toHaveClass("right-full");
    expect(panel).not.toHaveClass("fixed");
    expect(
      input.compareDocumentPosition(searchTrigger) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    fireEvent.change(input, { target: { value: "plafonyer" } });
    expect(input).toHaveValue("plafonyer");
    expect(screen.queryByTestId("route-search")).not.toBeInTheDocument();
    expect(screen.getByTestId("route-home")).toBeInTheDocument();
  });

  it("renders mobile-menu-open button with aria-expanded='false' initially and 'true' after clicking", () => {
    renderChrome(<Header />);

    const openBtn = screen.getByTestId("mobile-menu-open");
    expect(openBtn).toHaveAttribute("aria-label", "Menüyü aç");
    expect(openBtn).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("mobile-menu-drawer")).not.toBeInTheDocument();

    fireEvent.click(openBtn);

    expect(openBtn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("mobile-menu-drawer")).toBeInTheDocument();
  });
});

describe("MobileDrawer component", () => {
  it("does not render mobile-menu-drawer when isOpen is false and pressing Escape is a safe no-op", () => {
    const onClose = vi.fn();
    const { unmount } = renderWithProviders(
      <MobileDrawer isOpen={false} onClose={onClose} />
    );

    expect(screen.queryByTestId("mobile-menu-drawer")).not.toBeInTheDocument();

    expect(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    }).not.toThrow();
    expect(onClose).not.toHaveBeenCalled();

    expect(() => unmount()).not.toThrow();
  });

  it("renders dialog with navigation links when isOpen is true", () => {
    const onClose = vi.fn();
    renderChrome(<MobileDrawer isOpen={true} onClose={onClose} />);

    const drawer = screen.getByTestId("mobile-menu-drawer");
    expect(drawer).toHaveAttribute("role", "dialog");
    expect(drawer).toHaveAttribute("aria-modal", "true");
    expect(drawer).toHaveAttribute("aria-label", "Mobil menü");

    expect(screen.getByTestId("mobile-menu-backdrop")).toBeInTheDocument();

    const closeBtn = screen.getByTestId("mobile-menu-close");
    expect(closeBtn).toHaveAttribute("aria-label", "Menüyü kapat");

    const homeLink = within(drawer).getByRole("link", { name: "Anasayfa" });
    expect(homeLink).toHaveAttribute("href", "/");
    expect(
      within(drawer).queryByRole("link", { name: "Tüm Ürünler" })
    ).not.toBeInTheDocument();

    MAIN_NAV_CATEGORIES.forEach((cat) => {
      const catLink = within(drawer).getByRole("link", { name: cat.name });
      expect(catLink).toHaveAttribute("href", `/kategori/${cat.slug}`);
    });
  });

  it("closes via Header when clicking mobile-menu-close, mobile-menu-backdrop, pressing Escape, or clicking a category link", () => {
    renderChrome(<Header />);
    const openBtn = screen.getByTestId("mobile-menu-open");

    // 1. Close via close button
    fireEvent.click(openBtn);
    expect(screen.getByTestId("mobile-menu-drawer")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("mobile-menu-close"));
    expect(screen.queryByTestId("mobile-menu-drawer")).not.toBeInTheDocument();
    expect(openBtn).toHaveAttribute("aria-expanded", "false");

    // 2. Close via backdrop
    fireEvent.click(openBtn);
    expect(screen.getByTestId("mobile-menu-drawer")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("mobile-menu-backdrop"));
    expect(screen.queryByTestId("mobile-menu-drawer")).not.toBeInTheDocument();
    expect(openBtn).toHaveAttribute("aria-expanded", "false");

    // 3. Close via Escape key
    fireEvent.click(openBtn);
    expect(screen.getByTestId("mobile-menu-drawer")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("mobile-menu-drawer")).not.toBeInTheDocument();
    expect(openBtn).toHaveAttribute("aria-expanded", "false");

    // 4. Close via clicking a category link inside the drawer
    fireEvent.click(openBtn);
    const drawer = screen.getByTestId("mobile-menu-drawer");
    const categoryLink = within(drawer).getByRole("link", {
      name: "Led Avizeler",
    });
    fireEvent.click(categoryLink);
    expect(screen.queryByTestId("mobile-menu-drawer")).not.toBeInTheDocument();
    expect(openBtn).toHaveAttribute("aria-expanded", "false");
  });
});

describe("Footer component", () => {
  it("renders site-footer with showroom address, both tel links, Google Maps link, and category links", () => {
    renderChrome(<Footer />);

    const footer = screen.getByTestId("site-footer");
    expect(footer.tagName).toBe("FOOTER");

    expect(footer).toHaveTextContent(
      "Uğur Mumcu Mahallesi 2274. Sokak No:12 D:1 Sultançiftliği Sultangazi/İSTANBUL"
    );

    const phone1 = within(footer).getByRole("link", {
      name: /0532 499 12 28/,
    });
    expect(phone1).toHaveAttribute("href", "tel:05324991228");

    const phone2 = within(footer).getByRole("link", {
      name: /0212 931 28 07/,
    });
    expect(phone2).toHaveAttribute("href", "tel:02129312807");

    const mapLink = within(footer).getByRole("link", {
      name: /Showroom & İmalat Google Harita Konumu/i,
    });
    expect(mapLink).toHaveAttribute(
      "href",
      "https://maps.app.goo.gl/tz4JV4jjvFkvqiXf9"
    );

    expect(footer).toHaveTextContent(/Kategoriler/i);
    expect(
      within(footer).queryByRole("link", { name: "Ürünlerimiz" })
    ).not.toBeInTheDocument();

    MAIN_NAV_CATEGORIES.forEach((cat) => {
      const catLink = within(footer).getByRole("link", { name: cat.name });
      expect(catLink).toHaveAttribute("href", `/kategori/${cat.slug}`);
    });
  });
});

describe("Omitted e-commerce, WhatsApp, PDF catalogue, and legal links check", () => {
  it("never renders omitted features across Header, MobileDrawer, and Footer", () => {
    const { container } = renderWithProviders(
      <>
        <Header />
        <MobileDrawer isOpen={true} onClose={() => {}} />
        <Footer />
      </>
    );

    const text = container.textContent || "";
    OMITTED_TERMS.forEach((term) => {
      expect(text).not.toMatch(new RegExp(term, "i"));
    });

    const allLinks = container.querySelectorAll("a[href]");
    allLinks.forEach((anchor) => {
      const href = anchor.getAttribute("href") || "";
      expect(href).not.toMatch(/wa\.me|whatsapp/i);
    });
  });
});

describe("Layout and App route table", () => {
  it("renders Layout with Header, main[data-testid='layout-main'], Outlet content, and Footer", () => {
    render(
      <MemoryRouter initialEntries={["/test"]}>
        <Routes>
          <Route element={<Layout />}>
            <Route
              path="/test"
              element={<div data-testid="outlet-child">İçerik</div>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("site-header")).toBeInTheDocument();
    const main = screen.getByTestId("layout-main");
    expect(main.tagName).toBe("MAIN");
    expect(within(main).getByTestId("outlet-child")).toHaveTextContent(
      "İçerik"
    );
    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
  });

  it("renders home route '/' with Header, layout-main, and Footer without home-hero", () => {
    renderWithProviders(<App />, { initialEntries: ["/"] });

    expect(screen.getByTestId("site-header")).toBeInTheDocument();
    const main = screen.getByTestId("layout-main");
    expect(main).toBeInTheDocument();
    expect(within(main).queryByTestId("home-hero")).not.toBeInTheDocument();

    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
  });

  it("renders catalogue listing inside Layout on /kategori/:slug", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexCatalog(createFixtureCatalog()));

    renderWithProviders(<App />, {
      initialEntries: ["/kategori/led-avizeler"],
      queryClient,
    });

    expect(screen.getByTestId("site-header")).toBeInTheDocument();
    const main = screen.getByTestId("layout-main");
    expect(
      await within(main).findByTestId("debug-result-count")
    ).toHaveTextContent("1 ürün bulundu");
    expect(
      within(main).getByTestId("debug-filter-summary")
    ).toBeInTheDocument();
    expect(within(main).getByTestId("debug-product-list")).toBeInTheDocument();
    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
  });

  it("renders product-detail-placeholder with the product slug on /urun/:slug", () => {
    renderWithProviders(<App />, {
      initialEntries: ["/urun/pablo-kare-plafonyer-led-avize"],
    });

    expect(screen.getByTestId("site-header")).toBeInTheDocument();
    const placeholder = screen.getByTestId("product-detail-placeholder");
    expect(placeholder).toHaveTextContent("pablo-kare-plafonyer-led-avize");
    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
  });

  it("renders search-results-placeholder with query param on /arama?q=sarkit and handles missing or whitespace q cleanly", () => {
    const { unmount } = renderWithProviders(<App />, {
      initialEntries: ["/arama?q=sarkit"],
    });

    const withQuery = screen.getByTestId("search-results-placeholder");
    expect(withQuery).toHaveTextContent("sarkit");
    unmount();

    const { unmount: unmountEmpty } = renderWithProviders(<App />, {
      initialEntries: ["/arama"],
    });
    const withoutQuery = screen.getByTestId("search-results-placeholder");
    expect(withoutQuery).toBeInTheDocument();
    expect(withoutQuery.textContent).not.toMatch(/undefined|null/i);
    unmountEmpty();

    renderWithProviders(<App />, {
      initialEntries: ["/arama?q=   "],
    });
    const whitespaceQuery = screen.getByTestId("search-results-placeholder");
    expect(whitespaceQuery).toBeInTheDocument();
    expect(whitespaceQuery.textContent).not.toMatch(/undefined|null/i);
  });

  it("renders not-found-page with 'Sayfa Bulunamadı' and 'Anasayfaya Dön' link to '/' on unknown routes and /urunlerimiz", () => {
    const { unmount } = renderWithProviders(<App />, {
      initialEntries: ["/olmayan-sayfa-xyz"],
    });

    expect(screen.getByTestId("site-header")).toBeInTheDocument();
    const notFound = screen.getByTestId("not-found-page");
    expect(notFound).toHaveTextContent(/Sayfa Bulunamadı/i);

    const backHomeLink = within(notFound).getByRole("link", {
      name: /Anasayfaya Dön/i,
    });
    expect(backHomeLink).toHaveAttribute("href", "/");

    expect(
      screen.queryByRole("heading", { name: /Lavabo Aydınlatma Katalog/i })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
    unmount();

    renderWithProviders(<App />, {
      initialEntries: ["/urunlerimiz"],
    });

    expect(screen.getByTestId("not-found-page")).toHaveTextContent(
      /Sayfa Bulunamadı/i
    );
    expect(screen.queryByTestId("debug-product-list")).not.toBeInTheDocument();
  });
});

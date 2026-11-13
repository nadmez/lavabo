import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPicsumFallbackUrl,
  resolveAssetUrl,
  handleImageError,
} from "@/utils/image-url";
import {
  parseCatalogSearchParams,
  serializeCatalogSearchParams,
  useCatalogSearchParams,
} from "@/hooks/use-catalog-search-params";
import {
  catalogQueryOptions,
  useCatalog,
  useProducts,
} from "@/hooks/use-products";
import App from "@/App";
import { indexCatalog } from "@/data/catalog-query";

function createFixtureCatalog() {
  return {
    version: "2026-11-11-phase3b",
    categories: [
      {
        id: 1,
        slug: "aydinlatma",
        name: "Aydınlatma",
        parentId: null,
        count: 5,
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
    ],
    products: [
      {
        id: 101,
        slug: "istanbul-cember-led-avize",
        name: "İstanbul Çember LED Avize",
        sku: "PRBK-IST-101",
        inStock: true,
        createdAt: "2026-01-10T10:00:00.000Z",
        categoryIds: [4],
        priceMin: 1500,
        priceMax: 2200,
        images: ["istanbul-cember-led-avize/main.webp"],
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
        categoryIds: [3],
        priceMin: 1200,
        priceMax: 1200,
        images: ["modern-gun-isigi-led-avize/main.webp"],
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
        createdAt: "2026-01-15T10:00:00.000Z",
        categoryIds: [2],
        priceMin: 1500,
        priceMax: 1800,
        images: ["klasik-siyah-avize/main.webp"],
        attributes: {
          "avize-rengi": ["siyah"],
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
        categoryIds: [5],
        priceMin: 800,
        priceMax: 800,
        images: ["duvar-aplik-lamba/main.webp"],
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
        categoryIds: [6],
        priceMin: 800,
        priceMax: 950,
        images: ["rgb-masa-lambasi/main.webp"],
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
        priceMin: 1500,
        priceMax: 2200,
        images: ["ikili-cember-led-avize/main.webp"],
        attributes: {
          "avize-rengi": ["gold-renk"],
          "aydinlatma-rengi": ["6500k"],
          "urun-boyutu": ["60x60cm"],
        },
      },
    ],
  };
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("src/utils/image-url.js", () => {
  describe("getPicsumFallbackUrl", () => {
    it("defaults width and height to 600 and accepts custom positive dimensions", () => {
      expect(getPicsumFallbackUrl()).toBe("https://picsum.photos/600/600");
      expect(getPicsumFallbackUrl({})).toBe("https://picsum.photos/600/600");
      expect(getPicsumFallbackUrl({ width: 800, height: 450 })).toBe(
        "https://picsum.photos/800/450"
      );
    });

    it("falls back to 600 for 0, negative, NaN, or non-numeric dimensions", () => {
      expect(getPicsumFallbackUrl({ width: 0, height: -200 })).toBe(
        "https://picsum.photos/600/600"
      );
      expect(getPicsumFallbackUrl({ width: Number.NaN, height: "abc" })).toBe(
        "https://picsum.photos/600/600"
      );
      expect(getPicsumFallbackUrl({ width: 400, height: 0 })).toBe(
        "https://picsum.photos/400/600"
      );
      expect(getPicsumFallbackUrl({ width: null, height: 500 })).toBe(
        "https://picsum.photos/600/500"
      );
    });
  });

  describe("resolveAssetUrl", () => {
    it("resolves relative paths with BASE_URL and strips leading '/' or 'assets/' without double prefixes", () => {
      const base = import.meta.env.BASE_URL;
      expect(resolveAssetUrl("istanbul-avize/main.webp")).toBe(
        `${base}assets/istanbul-avize/main.webp`
      );
      expect(resolveAssetUrl("/istanbul-avize/main.webp")).toBe(
        `${base}assets/istanbul-avize/main.webp`
      );
      expect(resolveAssetUrl("assets/istanbul-avize/main.webp")).toBe(
        `${base}assets/istanbul-avize/main.webp`
      );
      expect(resolveAssetUrl("/assets/istanbul-avize/main.webp")).toBe(
        `${base}assets/istanbul-avize/main.webp`
      );
    });

    it("returns getPicsumFallbackUrl when given null, undefined, non-string, or empty/whitespace-only string", () => {
      expect(resolveAssetUrl(null)).toBe("https://picsum.photos/600/600");
      expect(resolveAssetUrl(undefined, { width: 320, height: 240 })).toBe(
        "https://picsum.photos/320/240"
      );
      expect(resolveAssetUrl("")).toBe("https://picsum.photos/600/600");
      expect(resolveAssetUrl("   ", { width: 500, height: 500 })).toBe(
        "https://picsum.photos/500/500"
      );
      expect(resolveAssetUrl(12345)).toBe("https://picsum.photos/600/600");
      expect(resolveAssetUrl({})).toBe("https://picsum.photos/600/600");
    });
  });

  describe("handleImageError", () => {
    it("sets img.src to getPicsumFallbackUrl and marks dataset.fallbackApplied = 'true'", () => {
      const img = document.createElement("img");
      img.src = "http://localhost/assets/missing.webp";

      handleImageError(
        { currentTarget: img, target: img },
        { width: 400, height: 300 }
      );

      expect(img.src).toBe("https://picsum.photos/400/300");
      expect(img.dataset.fallbackApplied).toBe("true");
    });

    it("does not reassign img.src when dataset.fallbackApplied is already 'true'", () => {
      const img = document.createElement("img");
      img.src = "https://existing-fallback.example/already-applied.jpg";
      img.dataset.fallbackApplied = "true";

      handleImageError({ currentTarget: img, target: img });

      expect(img.src).toBe(
        "https://existing-fallback.example/already-applied.jpg"
      );
      expect(img.dataset.fallbackApplied).toBe("true");
    });
  });
});

describe("src/hooks/use-catalog-search-params.js", () => {
  describe("parseCatalogSearchParams", () => {
    it("returns default filter/sort/pagination values for an empty query string or URLSearchParams", () => {
      expect(parseCatalogSearchParams("")).toEqual({
        inStockOnly: false,
        sort: "en-yeni",
        page: 1,
        perPage: 12,
        search: "",
        attributes: {},
      });
      expect(parseCatalogSearchParams(new URLSearchParams())).toEqual({
        inStockOnly: false,
        sort: "en-yeni",
        page: 1,
        perPage: 12,
        search: "",
        attributes: {},
      });
    });

    it("parses stok, sirala (including English alias normalization), sayfa, goster, and trimmed q", () => {
      expect(
        parseCatalogSearchParams(
          "?stok=1&sirala=fiyat-artan&sayfa=3&goster=24&q=++modern+avize++"
        )
      ).toEqual({
        inStockOnly: true,
        sort: "fiyat-artan",
        page: 3,
        perPage: 24,
        search: "modern avize",
        attributes: {},
      });

      expect(parseCatalogSearchParams("stok=true&sirala=fiyat-azalan")).toEqual(
        expect.objectContaining({
          inStockOnly: true,
          sort: "fiyat-azalan",
        })
      );

      expect(parseCatalogSearchParams("sirala=newest").sort).toBe("en-yeni");
      expect(parseCatalogSearchParams("sirala=price-asc").sort).toBe(
        "fiyat-artan"
      );
      expect(parseCatalogSearchParams("sirala=price-desc").sort).toBe(
        "fiyat-azalan"
      );
    });

    it("falls back to defaults for invalid stok, sirala, sayfa (<=0 or NaN), and goster values", () => {
      expect(
        parseCatalogSearchParams(
          "stok=0&sirala=gecersiz&sayfa=0&goster=15&q=   "
        )
      ).toEqual({
        inStockOnly: false,
        sort: "en-yeni",
        page: 1,
        perPage: 12,
        search: "",
        attributes: {},
      });

      expect(parseCatalogSearchParams("sayfa=-5&goster=abc")).toEqual(
        expect.objectContaining({
          page: 1,
          perPage: 12,
        })
      );

      expect(parseCatalogSearchParams("sayfa=abc&goster=9")).toEqual(
        expect.objectContaining({
          page: 1,
          perPage: 9,
        })
      );

      expect(parseCatalogSearchParams("goster=18").perPage).toBe(18);
    });

    it("parses all 8 known catalogue attribute slugs and shorthand aliases (renk, boyut, isik)", () => {
      const parsedKnown = parseCatalogSearchParams(
        "lineer-urun-boyutu=100cm&lineer-kasa-rengi=siyah&lineer-aydinlatma-rengi=3000k&lineer-kasa-yuksekligi=5cm&urun-boyutu=40x40cm&avize-rengi=gold-renk&aydinlatma-rengi=4000k&sarkit-avize-rengi=krom"
      );
      expect(parsedKnown.attributes).toEqual({
        "lineer-urun-boyutu": ["100cm"],
        "lineer-kasa-rengi": ["siyah"],
        "lineer-aydinlatma-rengi": ["3000k"],
        "lineer-kasa-yuksekligi": ["5cm"],
        "urun-boyutu": ["40x40cm"],
        "avize-rengi": ["gold-renk"],
        "aydinlatma-rengi": ["4000k"],
        "sarkit-avize-rengi": ["krom"],
      });

      const parsedAliases = parseCatalogSearchParams(
        "renk=siyah-renk,gold-renk&boyut=60x60cm&isik=3000k,4000k"
      );
      expect(parsedAliases.attributes).toEqual({
        "avize-rengi": ["siyah-renk", "gold-renk"],
        "urun-boyutu": ["60x60cm"],
        "aydinlatma-rengi": ["3000k", "4000k"],
      });
    });

    it("merges and deduplicates in order when both shorthand alias and canonical attribute key appear, and ignores unknown or empty keys", () => {
      const parsed = parseCatalogSearchParams(
        "?renk=siyah-renk&avize-rengi=beyaz-renk,siyah-renk&boyut=,,,&sarkit-avize-rengi=&bilinmeyen=deger"
      );
      expect(parsed.attributes).toEqual({
        "avize-rengi": ["siyah-renk", "beyaz-renk"],
      });
    });
  });

  describe("serializeCatalogSearchParams", () => {
    it("omits default values and returns an empty URLSearchParams string", () => {
      const serialized = serializeCatalogSearchParams({
        inStockOnly: false,
        sort: "en-yeni",
        page: 1,
        perPage: 12,
        search: "   ",
        attributes: {
          "avize-rengi": [],
          "urun-boyutu": ["", "  "],
        },
      });

      expect(serialized).toBeInstanceOf(URLSearchParams);
      expect(serialized.toString()).toBe("");
    });

    it("includes only non-default values cleanly", () => {
      const serialized = serializeCatalogSearchParams({
        inStockOnly: true,
        sort: "fiyat-artan",
        page: 2,
        perPage: 24,
        search: "  çember avize ",
        attributes: {
          "avize-rengi": ["siyah-renk", "gold-renk", "siyah-renk"],
          "urun-boyutu": [],
        },
      });

      expect(serialized.get("stok")).toBe("1");
      expect(serialized.get("sirala")).toBe("fiyat-artan");
      expect(serialized.get("sayfa")).toBe("2");
      expect(serialized.get("goster")).toBe("24");
      expect(serialized.get("q")).toBe("çember avize");
      expect(serialized.get("avize-rengi")).toBe("siyah-renk,gold-renk");
      expect(serialized.has("urun-boyutu")).toBe(false);
    });
  });

  describe("useCatalogSearchParams", () => {
    it("reads URL search params inside MemoryRouter and updates them via patch object or updater function", () => {
      const wrapper = ({ children }) => (
        <MemoryRouter
          initialEntries={[
            "/kategori/led-avizeler?renk=siyah-renk&sirala=fiyat-artan&sayfa=2",
          ]}
        >
          {children}
        </MemoryRouter>
      );

      const { result } = renderHook(() => useCatalogSearchParams(), {
        wrapper,
      });

      expect(result.current.params).toEqual({
        inStockOnly: false,
        sort: "fiyat-artan",
        page: 2,
        perPage: 12,
        search: "",
        attributes: {
          "avize-rengi": ["siyah-renk"],
        },
      });

      act(() => {
        result.current.setParams({ inStockOnly: true, page: 1 });
      });

      expect(result.current.params.inStockOnly).toBe(true);
      expect(result.current.params.page).toBe(1);
      expect(result.current.params.sort).toBe("fiyat-artan");
      expect(result.current.params.attributes).toEqual({
        "avize-rengi": ["siyah-renk"],
      });
      expect(result.current.searchParams.get("stok")).toBe("1");
      expect(result.current.searchParams.has("sayfa")).toBe(false);

      act(() => {
        result.current.setParams((prev) => ({
          ...prev,
          sort: "fiyat-azalan",
          search: "istanbul",
        }));
      });

      expect(result.current.params.sort).toBe("fiyat-azalan");
      expect(result.current.params.search).toBe("istanbul");
      expect(result.current.searchParams.get("sirala")).toBe("fiyat-azalan");
      expect(result.current.searchParams.get("q")).toBe("istanbul");
    });
  });
});

describe("src/hooks/use-products.js", () => {
  describe("catalogQueryOptions", () => {
    it("configures queryKey ['catalog'] with staleTime: Infinity and returns an indexed catalog when fetch succeeds", async () => {
      const fixture = createFixtureCatalog();
      const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => fixture,
      });

      const options = catalogQueryOptions();
      expect(options.queryKey).toEqual(["catalog"]);
      expect(options.staleTime).toBe(Infinity);
      expect(typeof options.queryFn).toBe("function");

      const indexed = await options.queryFn();
      expect(fetchMock).toHaveBeenCalledWith(
        `${import.meta.env.BASE_URL}data/catalog.json`
      );
      expect(indexed.productsBySlug).toBeInstanceOf(Map);
      expect(indexed.productsBySlug.size).toBe(6);
      expect(indexed.categoriesBySlug).toBeInstanceOf(Map);
    });

    it("throws an Error containing the HTTP status when fetch returns !response.ok", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
      });

      const options = catalogQueryOptions();
      await expect(options.queryFn()).rejects.toThrow(/503/);
    });
  });

  describe("useCatalog and useProducts", () => {
    it("returns the cached indexed catalog from useCatalog and derived filtered/paginated results from useProducts", async () => {
      const queryClient = createTestQueryClient();
      const indexed = indexCatalog(createFixtureCatalog());
      queryClient.setQueryData(["catalog"], indexed);

      const wrapper = ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result: catalogResult } = renderHook(() => useCatalog(), {
        wrapper,
      });
      await waitFor(() => {
        expect(catalogResult.current.isSuccess).toBe(true);
      });
      expect(catalogResult.current.data.productsBySlug).toBeInstanceOf(Map);

      const { result: productsResult } = renderHook(
        () =>
          useProducts({
            categorySlug: "led-avizeler",
            sort: "fiyat-artan",
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(productsResult.current.isSuccess).toBe(true);
      });

      expect(productsResult.current.data.total).toBe(3);
      expect(productsResult.current.data.items.map((p) => p.id)).toEqual([
        102, 101, 106,
      ]);
    });
  });
});

describe("src/App.js temporary debug listing routes", () => {
  it("renders filtered and sorted products on /kategori/aydinlatma?renk=siyah-renk&sirala=fiyat-artan", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexCatalog(createFixtureCatalog()));

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={[
            "/kategori/aydinlatma?renk=siyah-renk&sirala=fiyat-artan",
          ]}
        >
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const countEl = await screen.findByTestId("debug-result-count");
    expect(countEl).toHaveTextContent("3 ürün bulundu");

    const summaryEl = screen.getByTestId("debug-filter-summary");
    expect(summaryEl).toBeInTheDocument();

    const listEl = screen.getByTestId("debug-product-list");
    const items = within(listEl).getAllByRole("listitem");
    expect(items).toHaveLength(3);

    // Sorted by price-asc: 104 (800), 101 (1500), 103 (1500)
    expect(items[0]).toHaveTextContent("Duvar Aplik Lamba");
    expect(items[0]).toHaveTextContent("PRBK-APL-104");
    expect(items[0]).toHaveTextContent(/800/);

    expect(items[1]).toHaveTextContent("İstanbul Çember LED Avize");
    expect(items[1]).toHaveTextContent("PRBK-IST-101");
    expect(items[1]).toHaveTextContent(/1[.,]?500/);
    expect(items[1]).toHaveTextContent(/2[.,]?200/);

    expect(items[2]).toHaveTextContent("Klasik Siyah Avize");
    expect(items[2]).toHaveTextContent("PRBK-KLS-103");

    const firstImg = within(items[0]).getByRole("img");
    expect(firstImg.getAttribute("src")).toBe(
      "/assets/duvar-aplik-lamba/main.webp"
    );

    // Firing error on image applies Picsum fallback via handleImageError
    fireEvent.error(firstImg);
    expect(firstImg.getAttribute("src")).toBe("https://picsum.photos/600/600");
    expect(firstImg.dataset.fallbackApplied).toBe("true");
  });

  it("scopes results to the category slug on /kategori/led-avizeler", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["catalog"], indexCatalog(createFixtureCatalog()));

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/kategori/led-avizeler"]}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const countEl = await screen.findByTestId("debug-result-count");
    expect(countEl).toHaveTextContent("3 ürün bulundu");

    const listEl = screen.getByTestId("debug-product-list");
    expect(listEl).toHaveTextContent("Modern Gün Işığı LED Avize");
    expect(listEl).toHaveTextContent("İkili Çember LED Avize");
    expect(listEl).toHaveTextContent("İstanbul Çember LED Avize");
    expect(listEl).not.toHaveTextContent("Duvar Aplik Lamba");
    expect(listEl).not.toHaveTextContent("Şık RGB Masa Lambası");
  });

  it("shows 'Yükleniyor...' while the catalog query is pending", () => {
    vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/kategori/led-avizeler"]}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/Yükleniyor\.\.\./i)).toBeInTheDocument();
  });

  it("renders role='alert' when the catalog query rejects", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/kategori/led-avizeler"]}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const alertEl = await screen.findByRole("alert");
    expect(alertEl).toBeInTheDocument();
  });
});

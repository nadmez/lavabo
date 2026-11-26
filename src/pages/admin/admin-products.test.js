import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminProductsPage from "@/pages/admin/AdminProductsPage";
import { createSampleCatalog } from "@/data/sample-catalog";

function ok(data) {
  return { ok: true, status: 200, text: async () => JSON.stringify(data) };
}
function fail(message, status = 400) {
  return {
    ok: false,
    status,
    text: async () => JSON.stringify({ error: message }),
  };
}
function mockCatalog(catalog, handler) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (url, options = {}) => {
      const method = options.method || "GET";
      if (method === "GET") return ok(catalog);
      if (handler) {
        const result = await handler(String(url), options, method);
        if (result) return result;
      }
      return ok(catalog);
    });
}
function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location-path">{location.pathname}</p>;
}
function renderPage(ui) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/admin/urunler"]}>
        {ui}
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>
  );
}
function parsedCalls(fetchMock, method, urlPart) {
  return fetchMock.mock.calls
    .filter(
      ([url, opts]) =>
        String(url).includes(urlPart) && (opts?.method || "GET") === method
    )
    .map(([url, opts]) => ({
      url: String(url),
      body: opts?.body ? JSON.parse(opts.body) : undefined,
    }));
}
function rows() {
  return screen.queryAllByTestId(/^admin-product-row-/);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("admin products page", () => {
  it("renders list only with dedicated editor page links, row actions, stock text and a 35% wrapping product column", async () => {
    mockCatalog(createSampleCatalog());
    const { container } = renderPage(<AdminProductsPage />);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Ürünler" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("admin-products")).toBeInTheDocument();
    expect(screen.getByTestId("admin-product-search")).toBeInTheDocument();
    expect(
      screen.getByTestId("admin-product-category-filter")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("admin-product-stock-filter")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("admin-product-form")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const newLink = screen.getByRole("link", { name: /Yeni Ürün/ });
    expect(newLink).toHaveAttribute("href", "/admin/urunler/yeni");
    expect(
      container.querySelector('a[href="/admin/urunler/yeni"]')
    ).not.toBeNull();

    // Ürün column is 35% of the table and product names may wrap.
    const productHeader = screen.getByRole("columnheader", { name: "Ürün" });
    expect(productHeader.className).toContain("w-[35%]");
    expect(rows()).toHaveLength(3);
    const row101 = screen.getByTestId(
      "admin-product-row-klasik-tasarim-urun-01"
    );
    const nameCell = within(row101).getByText("Klasik Tasarım Ürün 01");
    expect(nameCell.className).toContain("whitespace-normal");
    expect(nameCell.className).toContain("break-words");

    const editLinks = {
      101: "klasik-tasarim-urun-01",
      102: "minimalist-seri-urun-02",
      103: "premium-koleksiyon-urun-03",
    };
    for (const [id, slug] of Object.entries(editLinks)) {
      const row = screen.getByTestId(`admin-product-row-${slug}`);
      const edit = within(row).getByRole("link", { name: "Düzenle" });
      expect(edit).toHaveAttribute("href", `/admin/urunler/${id}`);
      expect(
        within(row).getByRole("button", { name: "Çoğalt" })
      ).toBeInTheDocument();
      expect(
        within(row).getByRole("button", { name: "Sil" })
      ).toBeInTheDocument();
    }

    const row103 = screen.getByTestId(
      "admin-product-row-premium-koleksiyon-urun-03"
    );
    expect(row101).toHaveTextContent("Stokta");
    expect(row101).not.toHaveTextContent("Stokta yok");
    expect(row103).toHaveTextContent("Stokta yok");

    expect(
      screen.getByRole("columnheader", { name: "Ürün Tipi" })
    ).toBeInTheDocument();
    expect(
      within(row101)
        .getByRole("img", { name: "Varyasyonlu ürün" })
        .querySelector("svg")
    ).not.toBeNull();
    expect(
      within(
        screen.getByTestId("admin-product-row-minimalist-seri-urun-02")
      ).getByRole("img", { name: "Varyasyonlu ürün" })
    ).toBeInTheDocument();
    expect(
      within(row103).queryByRole("img", { name: "Varyasyonlu ürün" })
    ).not.toBeInTheDocument();
  });

  it("filters the list to variant products or simple products", async () => {
    mockCatalog(createSampleCatalog());
    renderPage(<AdminProductsPage />);
    await screen.findByTestId("admin-product-row-klasik-tasarim-urun-01");
    const filter = screen.getByRole("combobox", { name: "Ürün Tipi" });

    fireEvent.change(filter, { target: { value: "variant" } });
    expect(rows()).toHaveLength(2);
    expect(
      screen.queryByTestId("admin-product-row-premium-koleksiyon-urun-03")
    ).not.toBeInTheDocument();

    fireEvent.change(filter, { target: { value: "simple" } });
    expect(rows()).toHaveLength(1);
    expect(
      screen.getByTestId("admin-product-row-premium-koleksiyon-urun-03")
    ).toBeInTheDocument();
  });

  it("filters by search, category and stock; empty result keeps filters and shows no rows", async () => {
    mockCatalog(createSampleCatalog());
    renderPage(<AdminProductsPage />);
    await screen.findByTestId("admin-product-row-klasik-tasarim-urun-01");

    fireEvent.change(screen.getByTestId("admin-product-search"), {
      target: { value: "ORN-003" },
    });
    expect(rows()).toHaveLength(1);
    expect(
      screen.getByTestId("admin-product-row-premium-koleksiyon-urun-03")
    ).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("admin-product-search"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByTestId("admin-product-category-filter"), {
      target: { value: "2" },
    });
    expect(rows()).toHaveLength(1);
    expect(
      screen.getByTestId("admin-product-row-klasik-tasarim-urun-01")
    ).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("admin-product-category-filter"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByTestId("admin-product-stock-filter"), {
      target: { value: "out" },
    });
    expect(rows()).toHaveLength(1);
    expect(
      screen.getByTestId("admin-product-row-premium-koleksiyon-urun-03")
    ).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("admin-product-search"), {
      target: { value: "boyle-bir-urun-yok" },
    });
    expect(rows()).toHaveLength(0);
    expect(screen.getByTestId("admin-product-search")).toBeInTheDocument();
  });

  it("duplicates with kopya/-kopya/-KOPYA payload and navigates to the created product page", async () => {
    const catalog = createSampleCatalog();
    const fetchMock = mockCatalog(catalog, async (url, options, method) => {
      if (method === "POST" && url === "/api/admin/products") {
        const body = JSON.parse(options.body);
        catalog.products = [...catalog.products, { ...body, id: 999 }];
        return ok(catalog);
      }
      return null;
    });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage(<AdminProductsPage />);
    const row = await screen.findByTestId(
      "admin-product-row-klasik-tasarim-urun-01"
    );
    fireEvent.click(within(row).getByRole("button", { name: "Çoğalt" }));
    await waitFor(() => {
      const posts = parsedCalls(fetchMock, "POST", "/api/admin/products");
      expect(posts).toHaveLength(1);
      expect(posts[0].body.name).toBe("Klasik Tasarım Ürün 01 kopya");
      expect(posts[0].body.slug).toBe("klasik-tasarim-urun-01-kopya");
      expect(posts[0].body.sku).toBe("ORN-001-KOPYA");
      expect(posts[0].body).not.toHaveProperty("id");
    });
    await waitFor(() =>
      expect(screen.getByTestId("location-path")).toHaveTextContent(
        "/admin/urunler/999"
      )
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("shows the duplicate error and stays on the list when duplication fails", async () => {
    mockCatalog(createSampleCatalog(), async (url, options, method) => {
      if (method === "POST") return fail("Kopyalama başarısız.");
      return null;
    });
    renderPage(<AdminProductsPage />);
    const row = await screen.findByTestId(
      "admin-product-row-klasik-tasarim-urun-01"
    );
    fireEvent.click(within(row).getByRole("button", { name: "Çoğalt" }));
    expect(await screen.findByText("Kopyalama başarısız.")).toBeInTheDocument();
    expect(screen.getByTestId("location-path")).toHaveTextContent(
      "/admin/urunler"
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("confirms product deletion via alertdialog naming the product, Vazgeç cancels, Sil DELETEs 101", async () => {
    const fetchMock = mockCatalog(createSampleCatalog());
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage(<AdminProductsPage />);
    const row = await screen.findByTestId(
      "admin-product-row-klasik-tasarim-urun-01"
    );
    fireEvent.click(within(row).getByRole("button", { name: "Sil" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Klasik Tasarım Ürün 01");
    expect(
      parsedCalls(fetchMock, "DELETE", "/api/admin/products")
    ).toHaveLength(0);
    fireEvent.click(within(dialog).getByRole("button", { name: "Vazgeç" }));
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    );
    expect(
      parsedCalls(fetchMock, "DELETE", "/api/admin/products")
    ).toHaveLength(0);
    expect(confirmSpy).not.toHaveBeenCalled();

    fireEvent.click(
      within(
        screen.getByTestId("admin-product-row-klasik-tasarim-urun-01")
      ).getByRole("button", { name: "Sil" })
    );
    const dialog2 = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog2).getByRole("button", { name: "Sil" }));
    await waitFor(() => {
      const dels = parsedCalls(fetchMock, "DELETE", "/api/admin/products");
      expect(dels).toHaveLength(1);
      expect(dels[0].url).toBe("/api/admin/products/101");
    });
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("shows loading, error, and empty-product states", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () => new Promise(() => {})
    );
    const first = renderPage(<AdminProductsPage />);
    expect(screen.getByText("Yükleniyor...")).toBeInTheDocument();
    first.unmount();
    vi.restoreAllMocks();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      fail("Ürünler yüklenemedi.", 500)
    );
    const second = renderPage(<AdminProductsPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ürünler yüklenemedi."
    );
    second.unmount();
    vi.restoreAllMocks();
    const catalog = createSampleCatalog();
    catalog.products = [];
    mockCatalog(catalog);
    renderPage(<AdminProductsPage />);
    expect(
      await screen.findByRole("link", { name: /Yeni Ürün/ })
    ).toBeInTheDocument();
    expect(rows()).toHaveLength(0);
    expect(screen.getByTestId("admin-product-search")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-product-form")).not.toBeInTheDocument();
  });
});

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
import AdminProductEditorPage from "@/pages/admin/AdminProductEditorPage";
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
function renderEditor(route) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route
            path="/admin/urunler/yeni"
            element={<AdminProductEditorPage />}
          />
          <Route
            path="/admin/urunler/:id"
            element={<AdminProductEditorPage />}
          />
        </Routes>
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
function hasIcon(button) {
  return button.querySelector("svg") !== null;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("admin product editor page", () => {
  it("renders a dedicated create page with all fields and icons for URL ekle, Sil, Terim ekle and Ürünü kaydet", async () => {
    mockCatalog(createSampleCatalog());
    renderEditor("/admin/urunler/yeni");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Yeni ürün" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Listeye dön" })).toHaveAttribute(
      "href",
      "/admin/urunler"
    );
    const form = screen.getByTestId("admin-product-form");
    expect(within(form).getByTestId("admin-product-name")).toHaveValue("");
    expect(within(form).getByTestId("admin-product-slug")).toBeInTheDocument();
    expect(
      within(form).getByTestId("admin-product-variable")
    ).toBeInTheDocument();
    expect(within(form).getByTestId("admin-product-price")).toBeInTheDocument();
    expect(
      within(form).getByTestId("admin-product-upload")
    ).toBeInTheDocument();
    expect(
      within(form).getByTestId("admin-product-image-url")
    ).toBeInTheDocument();

    const urlAdd = within(form).getByRole("button", { name: "URL ekle" });
    expect(hasIcon(urlAdd)).toBe(true);
    const save = within(form).getByTestId("admin-product-save");
    expect(save).toHaveTextContent("Ürünü kaydet");
    expect(hasIcon(save)).toBe(true);
    const addTerm = within(form).getByRole("button", { name: "Terim ekle" });
    expect(hasIcon(addTerm)).toBe(true);
    const silButtons = within(form).getAllByRole("button", { name: "Sil" });
    expect(silButtons.length).toBeGreaterThan(0);
    for (const button of silButtons) expect(hasIcon(button)).toBe(true);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("location-path")).toHaveTextContent(
      "/admin/urunler/yeni"
    );
  });

  it("prefills Minimalist Seri Ürün 02 on its dedicated page and PUTs to 102", async () => {
    const fetchMock = mockCatalog(createSampleCatalog());
    renderEditor("/admin/urunler/102");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Ürünü düzenle" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("admin-product-name")).toHaveValue(
      "Minimalist Seri Ürün 02"
    );
    expect(screen.getByTestId("admin-product-slug")).toHaveValue(
      "minimalist-seri-urun-02"
    );
    fireEvent.click(screen.getByTestId("admin-product-save"));
    await waitFor(() => {
      const puts = parsedCalls(fetchMock, "PUT", "/api/admin/products/");
      expect(puts).toHaveLength(1);
      expect(puts[0].url).toBe("/api/admin/products/102");
      expect(puts[0].body.name).toBe("Minimalist Seri Ürün 02");
    });
    expect(
      await screen.findByTestId("admin-product-message")
    ).toHaveTextContent("Ürün kaydedildi.");
    expect(screen.getByTestId("location-path")).toHaveTextContent(
      "/admin/urunler/102"
    );
  });

  it("creates with POST then navigates to the created product page where a second save PUTs", async () => {
    const catalog = createSampleCatalog();
    const fetchMock = mockCatalog(catalog, async (url, options, method) => {
      if (method === "POST" && url === "/api/admin/products") {
        const body = JSON.parse(options.body);
        catalog.products = [
          ...catalog.products,
          { ...body, id: 999, variants: body.variants || [] },
        ];
        return ok(catalog);
      }
      return null;
    });
    renderEditor("/admin/urunler/yeni");
    await screen.findByTestId("admin-product-form");
    fireEvent.change(screen.getByTestId("admin-product-name"), {
      target: { value: "Yeni Deneme Ürün" },
    });
    fireEvent.click(screen.getByTestId("admin-product-save"));
    await waitFor(() => {
      const posts = parsedCalls(fetchMock, "POST", "/api/admin/products");
      expect(posts).toHaveLength(1);
      expect(posts[0].body.slug).toBe("yeni-deneme-urun");
    });
    await waitFor(() =>
      expect(screen.getByTestId("location-path")).toHaveTextContent(
        "/admin/urunler/999"
      )
    );
    expect(screen.getByTestId("admin-product-name")).toHaveValue(
      "Yeni Deneme Ürün"
    );
    fireEvent.click(screen.getByTestId("admin-product-save"));
    await waitFor(() => {
      const puts = parsedCalls(fetchMock, "PUT", "/api/admin/products/");
      expect(puts).toHaveLength(1);
      expect(puts[0].url).toBe("/api/admin/products/999");
    });
    expect(parsedCalls(fetchMock, "POST", "/api/admin/products")).toHaveLength(
      1
    );
  });

  it("generates exactly 2 variant rows from Siyah, Beyaz and Orta (M)", async () => {
    mockCatalog(createSampleCatalog());
    renderEditor("/admin/urunler/yeni");
    await screen.findByTestId("admin-product-form");
    fireEvent.click(screen.getByTestId("admin-product-variable"));
    fireEvent.click(screen.getByRole("checkbox", { name: "Siyah" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Beyaz" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Orta (M)" }));
    fireEvent.click(screen.getByTestId("admin-generate-variants"));
    expect(screen.getAllByTestId("admin-variant-row")).toHaveLength(2);
  });

  it("shows the save error on the page and shows Ürün bulunamadı for a missing id", async () => {
    mockCatalog(createSampleCatalog(), async (url, options, method) => {
      if (method === "POST") return fail("Ürün kaydedilemedi.");
      return null;
    });
    const first = renderEditor("/admin/urunler/yeni");
    await screen.findByTestId("admin-product-form");
    fireEvent.change(screen.getByTestId("admin-product-name"), {
      target: { value: "Hata Ürün" },
    });
    fireEvent.click(screen.getByTestId("admin-product-save"));
    expect(
      await screen.findByTestId("admin-product-message")
    ).toHaveTextContent("Ürün kaydedilemedi.");
    first.unmount();

    mockCatalog(createSampleCatalog());
    renderEditor("/admin/urunler/9999");
    expect(await screen.findByText("Ürün bulunamadı.")).toBeInTheDocument();
  });
});

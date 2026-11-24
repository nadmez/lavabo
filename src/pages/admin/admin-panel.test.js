import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateVariantRows } from "@/admin/variants";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
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
      if (method === "GET" && String(url).includes("/api/admin/catalog")) {
        return ok(catalog);
      }
      if (handler) {
        const result = await handler(String(url), options, method);
        if (result) return result;
      }
      return ok(catalog);
    });
}

function renderPage(ui, { route = "/admin" } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

function renderDashboard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("admin login", () => {
  it("shows a Turkish login error when the password is rejected", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: "Parola hatalı." }),
    });
    const onSuccess = vi.fn();
    renderPage(<AdminLoginPage onSuccess={onSuccess} />);
    fireEvent.change(screen.getByTestId("admin-password"), {
      target: { value: "yanlis" },
    });
    fireEvent.click(screen.getByTestId("admin-login-submit"));
    expect(await screen.findByTestId("admin-login-error")).toHaveTextContent(
      "Parola hatalı."
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe("variant generation helper", () => {
  it("generates variant rows from selected terms", () => {
    expect(
      generateVariantRows(
        [
          { slug: "renk", termSlugs: ["siyah", "beyaz"] },
          { slug: "boyut", termSlugs: ["orta"] },
        ],
        [
          {
            id: 7,
            sku: "KEEP",
            price: 10,
            inStock: true,
            terms: { renk: "siyah", boyut: "orta" },
          },
        ]
      )
    ).toEqual([
      expect.objectContaining({ id: 7, sku: "KEEP", price: 10 }),
      expect.objectContaining({
        terms: { renk: "beyaz", boyut: "orta" },
        inStock: true,
      }),
    ]);
  });
});

describe("admin dashboard", () => {
  it("renders Dashboard nav and heading, no Özet and no create shortcuts, with sample metrics", async () => {
    mockCatalog(createSampleCatalog());
    const { container } = renderDashboard();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Dashboard" })
    ).toBeInTheDocument();
    const dashboardLink = container.querySelector('a[href="/admin"]');
    expect(dashboardLink).not.toBeNull();
    expect(dashboardLink).toHaveTextContent("Dashboard");
    expect(screen.queryByText("Özet")).not.toBeInTheDocument();
    expect(screen.getByTestId("admin-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("admin-metric-products")).toHaveTextContent("3");
    expect(screen.getByTestId("admin-metric-products")).toHaveTextContent(
      "2 stokta / 1 stokta yok"
    );
    expect(
      screen.getByTestId("admin-metric-products").parentElement.className
    ).toContain("lg:grid-cols-[15fr_11fr_11fr_11fr]");
    expect(screen.getByTestId("admin-metric-categories")).toHaveTextContent(
      "6"
    );
    expect(screen.getByTestId("admin-metric-attributes")).toHaveTextContent(
      "3"
    );
    expect(
      screen.queryByRole("link", { name: "Yeni Ürün Ekle" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Yeni Ürün Ekle" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Yeni Kategori Ekle" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Yeni Kategori Ekle" })
    ).not.toBeInTheDocument();
    expect(container.querySelector('a[href="/admin/urunler/yeni"]')).toBeNull();
  });

  it("shows a simple stock pie with in-stock and out-of-stock percentages", async () => {
    mockCatalog(createSampleCatalog());
    renderDashboard();
    await screen.findByTestId("admin-metric-products");
    const pie = screen.getByTestId("admin-stock-pie");
    expect(pie).toBeInTheDocument();
    expect(pie).toHaveAttribute("aria-label", expect.stringContaining("%67"));
    expect(screen.getByTestId("admin-metric-products")).toHaveTextContent(
      "%67 Stokta"
    );
    expect(screen.getByTestId("admin-metric-products")).toHaveTextContent(
      "%33 Stokta yok"
    );
  });

  it("shows loading without metrics, then error alert on failure", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () => new Promise(() => {})
    );
    renderPage(<AdminDashboardPage />);
    expect(screen.getByText("Yükleniyor...")).toBeInTheDocument();
    expect(
      screen.queryByTestId("admin-metric-products")
    ).not.toBeInTheDocument();
  });

  it("renders role=alert with the error message when the catalog query fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      fail("Katalog yüklenemedi.", 500)
    );
    renderPage(<AdminDashboardPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Katalog yüklenemedi."
    );
  });

  it("exports catalog.json without any non-GET fetch call", async () => {
    const catalog = createSampleCatalog();
    const fetchMock = mockCatalog(catalog);
    if (typeof URL.createObjectURL !== "function") {
      URL.createObjectURL = vi.fn(() => "blob:mock-catalog");
    }
    if (typeof URL.revokeObjectURL !== "function") {
      URL.revokeObjectURL = vi.fn();
    }
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock-catalog");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    renderPage(<AdminDashboardPage />);
    await screen.findByTestId("admin-metric-products");

    fetchMock.mockClear();
    fireEvent.click(screen.getByTestId("admin-export-json"));
    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    const blobArg = createObjectURL.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
    if (typeof blobArg.text === "function") {
      expect(JSON.parse(await blobArg.text())).toEqual(catalog);
    }
    const nonGet = fetchMock.mock.calls.filter(
      ([, opts]) => (opts?.method || "GET") !== "GET"
    );
    expect(nonGet).toHaveLength(0);
  });

  it("loads sample data with POST {mode:sample} without an alertdialog or window.confirm", async () => {
    const catalog = createSampleCatalog();
    const fetchMock = mockCatalog(catalog);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage(<AdminDashboardPage />);
    await screen.findByTestId("admin-metric-products");

    fireEvent.click(screen.getByTestId("admin-load-sample"));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/reset",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ mode: "sample" }),
        })
      );
    });
    expect(
      await screen.findByTestId("admin-dashboard-message")
    ).toHaveTextContent("Örnek veriler yüklendi.");
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("imports a valid JSON file with PUT and shows the success message", async () => {
    const catalog = createSampleCatalog();
    const fetchMock = mockCatalog(catalog);
    renderPage(<AdminDashboardPage />);
    await screen.findByTestId("admin-metric-products");

    const imported = { ...catalog, products: [] };
    // jsdom File.text() is unreliable; a file-like object exercises the same path
    const file = { text: async () => JSON.stringify(imported) };
    fireEvent.change(screen.getByTestId("admin-import-json"), {
      target: { files: [file] },
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/catalog",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(imported),
        })
      );
    });
    expect(
      await screen.findByTestId("admin-dashboard-message")
    ).toHaveTextContent("Katalog içe aktarıldı.");
  });

  it("shows a message and does not PUT when the imported file is invalid JSON", async () => {
    const catalog = createSampleCatalog();
    const fetchMock = mockCatalog(catalog);
    renderPage(<AdminDashboardPage />);
    await screen.findByTestId("admin-metric-products");
    fetchMock.mockClear();

    const file = { text: async () => "{gecersiz json" };
    fireEvent.change(screen.getByTestId("admin-import-json"), {
      target: { files: [file] },
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("admin-dashboard-message").textContent.trim()
      ).not.toBe("");
    });
    const putCalls = fetchMock.mock.calls.filter(
      ([url, opts]) =>
        String(url).includes("/api/admin/catalog") && opts?.method === "PUT"
    );
    expect(putCalls).toHaveLength(0);
  });

  it("confirms reset via alertdialog: no POST before confirm, Vazgeç cancels, Sıfırla resets", async () => {
    const catalog = createSampleCatalog();
    const fetchMock = mockCatalog(catalog);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage(<AdminDashboardPage />);
    await screen.findByTestId("admin-metric-products");
    fetchMock.mockClear();

    fireEvent.click(screen.getByTestId("admin-reset-empty"));
    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByRole("button", { name: "Sıfırla" })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Vazgeç" })
    ).toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(
      fetchMock.mock.calls.filter(
        ([url, opts]) =>
          String(url).includes("/api/admin/reset") && opts?.method === "POST"
      )
    ).toHaveLength(0);

    fireEvent.click(within(dialog).getByRole("button", { name: "Vazgeç" }));
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        String(url).includes("/api/admin/reset")
      )
    ).toHaveLength(0);
    expect(confirmSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("admin-reset-empty"));
    const dialog2 = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog2).getByRole("button", { name: "Sıfırla" }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/reset",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ mode: "empty" }),
        })
      );
    });
    expect(
      await screen.findByTestId("admin-dashboard-message")
    ).toHaveTextContent("Katalog sıfırlandı.");
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("shows the utility error in the dashboard message when a request fails", async () => {
    const catalog = createSampleCatalog();
    mockCatalog(catalog, async (url, options, method) => {
      if (String(url).includes("/api/admin/reset") && method === "POST") {
        return fail("Sıfırlama başarısız.");
      }
      return null;
    });
    renderPage(<AdminDashboardPage />);
    await screen.findByTestId("admin-metric-products");
    fireEvent.click(screen.getByTestId("admin-load-sample"));
    expect(
      await screen.findByTestId("admin-dashboard-message")
    ).toHaveTextContent("Sıfırlama başarısız.");
  });
});

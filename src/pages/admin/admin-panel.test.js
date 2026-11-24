import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { generateVariantRows } from "@/admin/variants";
import AdminAttributesPage from "@/pages/admin/AdminAttributesPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminProductEditorPage from "@/pages/admin/AdminProductEditorPage";
import { createSampleCatalog } from "@/data/sample-catalog";

function renderPage(ui, { route = "/admin" } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/admin" element={ui} />
          <Route path="/admin/urunler/yeni" element={ui} />
          <Route path="/admin/nitelikler" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("admin panel", () => {
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

  it("asks before resetting the catalog to empty", async () => {
    const catalog = createSampleCatalog();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (url, options) => {
        const method = options?.method || "GET";
        if (String(url).includes("/api/admin/catalog") && method === "GET") {
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify(catalog),
          };
        }
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              ...catalog,
              products: [],
              categories: [],
              attributes: [],
            }),
        };
      });
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderPage(<AdminDashboardPage />);
    expect(
      await screen.findByTestId("admin-metric-products")
    ).toHaveTextContent("3");
    fireEvent.click(screen.getByTestId("admin-reset-empty"));
    expect(window.confirm).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("saves a swatch term and generates variant rows from selected terms", async () => {
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

    const catalog = createSampleCatalog();
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async (url, options = {}) => {
        if (options.method === "PUT") {
          const body = JSON.parse(options.body);
          const slug = String(url).split("/").pop();
          catalog.attributes = catalog.attributes.map((attribute) =>
            attribute.slug === slug
              ? {
                  ...attribute,
                  terms: body.terms.map((term) => {
                    const next = { ...term };
                    delete next.previousSlug;
                    return next;
                  }),
                }
              : attribute
          );
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify(catalog),
          };
        }
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify(catalog),
        };
      }
    );
    renderPage(<AdminAttributesPage />, { route: "/admin/nitelikler" });
    fireEvent.click(
      (await screen.findAllByRole("button", { name: "Düzenle" }))[0]
    );
    fireEvent.click(screen.getByTestId("admin-add-term"));
    const nameInputs = screen.getAllByLabelText("Terim adı");
    fireEvent.change(nameInputs[nameInputs.length - 1], {
      target: { value: "Turuncu" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Kaydet" }));
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/admin/attributes/renk",
        expect.objectContaining({ method: "PUT" })
      );
    });
    cleanup();

    renderPage(<AdminProductEditorPage />, { route: "/admin/urunler/yeni" });
    fireEvent.click(await screen.findByTestId("admin-product-variable"));
    fireEvent.click(screen.getByRole("checkbox", { name: "Siyah" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Beyaz" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Orta (M)" }));
    fireEvent.click(screen.getByTestId("admin-generate-variants"));
    expect(screen.getAllByTestId("admin-variant-row")).toHaveLength(2);
  });
});

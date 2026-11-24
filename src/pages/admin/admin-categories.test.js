import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminAttributesPage from "@/pages/admin/AdminAttributesPage";
import AdminCategoriesPage from "@/pages/admin/AdminCategoriesPage";
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
function renderPage(ui) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
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

function categoryRow(name) {
  // DOM-scoped (not role-based): a modal dialog aria-hides the list behind it.
  const rows = screen.getByTestId("admin-categories").querySelectorAll("li");
  const row = Array.from(rows).find((item) => item.textContent.includes(name));
  if (!row) throw new Error(`category row not found: ${name}`);
  return row;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("admin categories modal", () => {
  it("initially renders the list only: no form, no dialog, Yeni Kategori, rows and row actions", async () => {
    mockCatalog(createSampleCatalog());
    renderPage(<AdminCategoriesPage />);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Kategoriler" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("admin-categories")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-category-form")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Yeni Kategori" })
    ).toBeInTheDocument();
    expect(
      within(categoryRow("Örnek Koleksiyon")).getByText("Örnek Koleksiyon")
    ).toBeInTheDocument();
    expect(categoryRow("Örnek Koleksiyon")).toHaveTextContent(
      "ornek-koleksiyon"
    );
    expect(categoryRow("Örnek Koleksiyon")).toHaveTextContent("3 ürün");
    expect(categoryRow("Yeni Ürünler")).toHaveTextContent("3 ürün");
    expect(categoryRow("Klasik Seri")).toHaveTextContent("1 ürün");
    expect(categoryRow("Minimalist Seri")).toHaveTextContent("1 ürün");
    expect(categoryRow("Premium Seri")).toHaveTextContent("1 ürün");
    expect(categoryRow("Öne Çıkanlar")).toHaveTextContent("1 ürün");
    expect(
      within(categoryRow("Klasik Seri")).getByText("Klasik Seri")
    ).toBeInTheDocument();
    // header chip counts categories, not products
    expect(screen.getByText("6 kategori")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Düzenle" })).toHaveLength(6);
    expect(screen.getAllByRole("button", { name: "Sil" })).toHaveLength(6);
    expect(
      screen.queryByRole("button", { name: "Çoğalt" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Çoğalt" })
    ).not.toBeInTheDocument();
  });

  it("opens a create dialog over the still-visible list", async () => {
    mockCatalog(createSampleCatalog());
    renderPage(<AdminCategoriesPage />);
    await screen.findByText("Örnek Koleksiyon");
    fireEvent.click(screen.getByRole("button", { name: "Yeni Kategori" }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByTestId("admin-category-form")
    ).toBeInTheDocument();
    // list stays mounted (scoped to rows: the dialog's parent <option>s
    // also carry these names)
    expect(
      within(categoryRow("Örnek Koleksiyon")).getByText("Örnek Koleksiyon")
    ).toBeInTheDocument();
    expect(
      within(categoryRow("Klasik Seri")).getByText("Klasik Seri")
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("option", { name: "Örnek Koleksiyon" })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("option", { name: "Klasik Seri" })
    ).toBeInTheDocument();
  });

  it("auto-derives the kebab slug until the slug is manually touched", async () => {
    mockCatalog(createSampleCatalog());
    renderPage(<AdminCategoriesPage />);
    await screen.findByText("Örnek Koleksiyon");
    fireEvent.click(screen.getByRole("button", { name: "Yeni Kategori" }));
    const dialog = await screen.findByRole("dialog");
    const name = within(dialog).getByTestId("admin-category-name");
    const slug = within(dialog).getByTestId("admin-category-slug");
    fireEvent.change(name, { target: { value: "Deneme Kategori" } });
    expect(slug).toHaveValue("deneme-kategori");
    fireEvent.change(slug, { target: { value: "ozel-slug" } });
    fireEvent.change(name, { target: { value: "Baska Kategori" } });
    expect(slug).toHaveValue("ozel-slug");
  });

  it("prefills the edit dialog for Klasik Seri including parent 1 and description", async () => {
    mockCatalog(createSampleCatalog());
    renderPage(<AdminCategoriesPage />);
    await screen.findByText("Klasik Seri");
    // flattened order: Örnek Koleksiyon, Klasik Seri, ...
    fireEvent.click(screen.getAllByRole("button", { name: "Düzenle" })[1]);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByTestId("admin-category-name")).toHaveValue(
      "Klasik Seri"
    );
    expect(within(dialog).getByTestId("admin-category-slug")).toHaveValue(
      "klasik-seri"
    );
    expect(within(dialog).getByTestId("admin-category-parent")).toHaveValue(
      "1"
    );
    expect(within(dialog).getByLabelText("Açıklama")).toHaveValue(
      "<p>Klasik seri örnek kategorisi.</p>"
    );
  });

  it("excludes the edited category and its descendants from parent options; new dialog includes all", async () => {
    mockCatalog(createSampleCatalog());
    renderPage(<AdminCategoriesPage />);
    await screen.findByText("Örnek Koleksiyon");

    fireEvent.click(screen.getByRole("button", { name: "Yeni Kategori" }));
    let dialog = await screen.findByRole("dialog");
    let parent = within(dialog).getByTestId("admin-category-parent");
    let optionTexts = Array.from(parent.options).map((o) => o.textContent);
    expect(optionTexts).toContain("Yok");
    expect(optionTexts).toContain("Örnek Koleksiyon");
    expect(optionTexts).toContain("Klasik Seri");
    expect(optionTexts).toContain("Minimalist Seri");
    expect(optionTexts).toContain("Premium Seri");
    expect(optionTexts).toContain("Yeni Ürünler");
    expect(optionTexts).toContain("Öne Çıkanlar");
    fireEvent.click(within(dialog).getByRole("button", { name: "Kapat" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );

    // edit Örnek Koleksiyon (id 1): itself + Klasik/Minimalist/Premium excluded
    fireEvent.click(screen.getAllByRole("button", { name: "Düzenle" })[0]);
    dialog = await screen.findByRole("dialog");
    parent = within(dialog).getByTestId("admin-category-parent");
    optionTexts = Array.from(parent.options).map((o) => o.textContent);
    expect(optionTexts).not.toContain("Örnek Koleksiyon");
    expect(optionTexts).not.toContain("Klasik Seri");
    expect(optionTexts).not.toContain("Minimalist Seri");
    expect(optionTexts).not.toContain("Premium Seri");
    expect(optionTexts).toContain("Yeni Ürünler");
    expect(optionTexts).toContain("Öne Çıkanlar");
  });

  it("POSTs the exact payload for a new category, closes and shows Kategori kaydedildi.", async () => {
    const catalog = createSampleCatalog();
    const fetchMock = mockCatalog(catalog);
    renderPage(<AdminCategoriesPage />);
    await screen.findByText("Örnek Koleksiyon");
    fireEvent.click(screen.getByRole("button", { name: "Yeni Kategori" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByTestId("admin-category-name"), {
      target: { value: "Deneme Kategori" },
    });
    fireEvent.change(within(dialog).getByTestId("admin-category-parent"), {
      target: { value: "1" },
    });
    fireEvent.change(within(dialog).getByLabelText("Açıklama"), {
      target: { value: "<p>Deneme</p>" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    await waitFor(() => {
      const posts = parsedCalls(fetchMock, "POST", "/api/admin/categories");
      expect(posts).toHaveLength(1);
      expect(posts[0].url).toBe("/api/admin/categories");
      expect(posts[0].body).toEqual({
        name: "Deneme Kategori",
        slug: "deneme-kategori",
        parentId: 1,
        descriptionHtml: "<p>Deneme</p>",
      });
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(screen.getByText("Kategori kaydedildi.")).toBeInTheDocument();
  });

  it("PUTs an edited category to its id and derives the slug when the slug is cleared", async () => {
    const fetchMock = mockCatalog(createSampleCatalog());
    renderPage(<AdminCategoriesPage />);
    await screen.findByText("Örnek Koleksiyon");
    fireEvent.click(screen.getAllByRole("button", { name: "Düzenle" })[1]);
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByTestId("admin-category-slug"), {
      target: { value: "" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    await waitFor(() => {
      const puts = parsedCalls(fetchMock, "PUT", "/api/admin/categories/");
      expect(puts).toHaveLength(1);
      expect(puts[0].url).toBe("/api/admin/categories/2");
      expect(puts[0].body).toEqual({
        name: "Klasik Seri",
        slug: "klasik-seri",
        parentId: 1,
        descriptionHtml: "<p>Klasik seri örnek kategorisi.</p>",
      });
    });
  });

  it("POSTs parentId null when creating without a parent", async () => {
    const fetchMock = mockCatalog(createSampleCatalog());
    renderPage(<AdminCategoriesPage />);
    await screen.findByText("Örnek Koleksiyon");
    fireEvent.click(screen.getByRole("button", { name: "Yeni Kategori" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByTestId("admin-category-name"), {
      target: { value: "Ust Olmayan" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    await waitFor(() => {
      const posts = parsedCalls(fetchMock, "POST", "/api/admin/categories");
      expect(posts).toHaveLength(1);
      expect(posts[0].body.parentId).toBeNull();
      expect(posts[0].body.slug).toBe("ust-olmayan");
    });
  });

  it("confirms category deletion via alertdialog naming the category, Vazgeç cancels", async () => {
    const fetchMock = mockCatalog(createSampleCatalog());
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage(<AdminCategoriesPage />);
    await screen.findByText("Örnek Koleksiyon");
    fireEvent.click(screen.getAllByRole("button", { name: "Sil" })[0]);
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Örnek Koleksiyon");
    expect(
      parsedCalls(fetchMock, "DELETE", "/api/admin/categories")
    ).toHaveLength(0);
    fireEvent.click(within(dialog).getByRole("button", { name: "Vazgeç" }));
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    );
    expect(
      parsedCalls(fetchMock, "DELETE", "/api/admin/categories")
    ).toHaveLength(0);
    expect(confirmSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: "Sil" })[0]);
    const dialog2 = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog2).getByRole("button", { name: "Sil" }));
    await waitFor(() => {
      const dels = parsedCalls(fetchMock, "DELETE", "/api/admin/categories");
      expect(dels).toHaveLength(1);
      expect(dels[0].url).toBe("/api/admin/categories/1");
    });
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("closes with Kapat and with Escape without POST/PUT", async () => {
    const fetchMock = mockCatalog(createSampleCatalog());
    renderPage(<AdminCategoriesPage />);
    await screen.findByText("Örnek Koleksiyon");

    fireEvent.click(screen.getByRole("button", { name: "Yeni Kategori" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Kapat" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: "Yeni Kategori" }));
    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(
      parsedCalls(fetchMock, "POST", "/api/admin/categories")
    ).toHaveLength(0);
    expect(parsedCalls(fetchMock, "PUT", "/api/admin/categories")).toHaveLength(
      0
    );
  });

  it("keeps the dialog open and shows the error inside it when save fails", async () => {
    mockCatalog(createSampleCatalog(), async (url, options, method) => {
      if (method === "POST") return fail("Kategori kaydedilemedi.");
      return null;
    });
    renderPage(<AdminCategoriesPage />);
    await screen.findByText("Örnek Koleksiyon");
    fireEvent.click(screen.getByRole("button", { name: "Yeni Kategori" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByTestId("admin-category-name"), {
      target: { value: "Hata Kategori" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    await waitFor(() =>
      expect(
        within(screen.getByRole("dialog")).getByText("Kategori kaydedilemedi.")
      ).toBeInTheDocument()
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows Henüz kategori yok. with Yeni Kategori for an empty catalog", async () => {
    const catalog = createSampleCatalog();
    catalog.categories = [];
    mockCatalog(catalog);
    renderPage(<AdminCategoriesPage />);
    expect(await screen.findByText("Henüz kategori yok.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Yeni Kategori" })
    ).toBeInTheDocument();
  });

  it("shows loading and error states", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () => new Promise(() => {})
    );
    const { unmount } = renderPage(<AdminCategoriesPage />);
    expect(screen.getByText("Yükleniyor...")).toBeInTheDocument();
    unmount();
    vi.restoreAllMocks();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      fail("Kategoriler yüklenemedi.", 500)
    );
    renderPage(<AdminCategoriesPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Kategoriler yüklenemedi."
    );
  });
});

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

afterEach(() => {
  vi.restoreAllMocks();
});

describe("admin attributes modal", () => {
  it("initially renders the list only: no form/dialog, terms, swatches, row actions, no Çoğalt", async () => {
    mockCatalog(createSampleCatalog());
    renderPage(<AdminAttributesPage />);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Nitelikler" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("admin-attributes")).toBeInTheDocument();
    expect(
      screen.queryByTestId("admin-attribute-form")
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Yeni Nitelik" })
    ).toBeInTheDocument();
    expect(screen.getByText("Renk")).toBeInTheDocument();
    expect(screen.getByText(/renk · 4 terim/)).toBeInTheDocument();
    expect(screen.getByText(/boyut · 3 terim/)).toBeInTheDocument();
    expect(screen.getByText("Siyah")).toBeInTheDocument();
    expect(screen.getByText("Orta (M)")).toBeInTheDocument();
    expect(screen.getByTestId("admin-swatch-siyah")).toBeInTheDocument();
    expect(screen.getByTestId("admin-swatch-beyaz")).toBeInTheDocument();
    // Boyut / Malzeme terms have no swatches
    expect(screen.queryByTestId("admin-swatch-kucuk")).not.toBeInTheDocument();
    expect(screen.queryByTestId("admin-swatch-orta")).not.toBeInTheDocument();
    expect(screen.queryByTestId("admin-swatch-ahsap")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Düzenle" })).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "Sil" })).toHaveLength(3);
    expect(
      screen.queryByRole("button", { name: "Çoğalt" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Çoğalt" })
    ).not.toBeInTheDocument();
  });

  it("filters the list by attribute name with Turkish case-insensitive search", async () => {
    mockCatalog(createSampleCatalog());
    renderPage(<AdminAttributesPage />);
    await screen.findByText("Renk");
    const search = screen.getByRole("searchbox", { name: "Nitelik ara" });

    fireEvent.change(search, { target: { value: "BOYUT" } });
    expect(screen.getByText("Boyut")).toBeInTheDocument();
    expect(screen.queryByText("Renk")).not.toBeInTheDocument();
    expect(screen.queryByText("Malzeme")).not.toBeInTheDocument();
    expect(screen.queryByText("Siyah")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Düzenle" })).toHaveLength(1);

    fireEvent.change(search, { target: { value: "siyah" } });
    expect(screen.queryByText("Renk")).not.toBeInTheDocument();
    expect(screen.getByText("Nitelik bulunamadı.")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "" } });
    expect(screen.getByText("Renk")).toBeInTheDocument();
    expect(screen.getByText("Malzeme")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Düzenle" })).toHaveLength(3);
  });

  it("opens a create dialog over the still-visible list and auto-derives slug until touched", async () => {
    mockCatalog(createSampleCatalog());
    renderPage(<AdminAttributesPage />);
    await screen.findByText("Renk");
    fireEvent.click(screen.getByRole("button", { name: "Yeni Nitelik" }));
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByTestId("admin-attribute-form")
    ).toBeInTheDocument();
    expect(screen.getByText("Boyut")).toBeInTheDocument();
    const name = within(dialog).getByTestId("admin-attribute-name");
    const slug = within(dialog).getByLabelText("Kısa ad");
    fireEvent.change(name, { target: { value: "Deneme Nitelik" } });
    expect(slug).toHaveValue("deneme-nitelik");
    fireEvent.change(slug, { target: { value: "ozel-nitelik" } });
    fireEvent.change(name, { target: { value: "Baska Nitelik" } });
    expect(slug).toHaveValue("ozel-nitelik");
  });

  it("prefills the edit dialog for Renk with one Terim adı input per term", async () => {
    mockCatalog(createSampleCatalog());
    renderPage(<AdminAttributesPage />);
    await screen.findByText("Renk");
    fireEvent.click(screen.getAllByRole("button", { name: "Düzenle" })[0]);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByTestId("admin-attribute-name")).toHaveValue(
      "Renk"
    );
    expect(within(dialog).getByLabelText("Kısa ad")).toHaveValue("renk");
    const termInputs = within(dialog).getAllByLabelText("Terim adı");
    expect(termInputs).toHaveLength(4);
    expect(termInputs.map((i) => i.value)).toEqual([
      "Siyah",
      "Beyaz",
      "Antrasit",
      "Bej",
    ]);
  });

  it("adds a term, reveals swatch inputs on Renk örneği, and removes a term with Terimi sil", async () => {
    mockCatalog(createSampleCatalog());
    renderPage(<AdminAttributesPage />);
    await screen.findByText("Renk");
    fireEvent.click(screen.getAllByRole("button", { name: "Düzenle" })[0]);
    const dialog = await screen.findByRole("dialog");
    const addTerm = within(dialog).getByTestId("admin-add-term");
    expect(addTerm).toHaveTextContent("Terim ekle");
    expect(addTerm.querySelector("svg")).not.toBeNull();
    const before = within(dialog).getAllByLabelText("Terim adı").length;
    fireEvent.click(addTerm);
    expect(within(dialog).getAllByLabelText("Terim adı")).toHaveLength(
      before + 1
    );
    const termInputs = within(dialog).getAllByLabelText("Terim adı");
    fireEvent.change(termInputs[termInputs.length - 1], {
      target: { value: "Turuncu" },
    });
    const swatchBoxes = within(dialog).getAllByLabelText("Renk örneği");
    const colorCodesBefore =
      within(dialog).queryAllByLabelText("Renk kodu").length;
    fireEvent.click(swatchBoxes[swatchBoxes.length - 1]);
    expect(within(dialog).getAllByLabelText("Renk kodu")).toHaveLength(
      colorCodesBefore + 1
    );
    expect(
      within(dialog).getAllByLabelText("Renk seçici").length
    ).toBeGreaterThan(0);
    // remove the newly added term
    const deleteButtons = within(dialog).getAllByRole("button", {
      name: "Terimi sil",
    });
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);
    expect(within(dialog).getAllByLabelText("Terim adı")).toHaveLength(before);
  });

  it("PUTs edited Renk with previousSlug for existing terms, '' for new terms, swatch only when checked+present", async () => {
    const fetchMock = mockCatalog(createSampleCatalog());
    renderPage(<AdminAttributesPage />);
    await screen.findByText("Renk");
    fireEvent.click(screen.getAllByRole("button", { name: "Düzenle" })[0]);
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByTestId("admin-add-term"));
    const termInputs = within(dialog).getAllByLabelText("Terim adı");
    fireEvent.change(termInputs[termInputs.length - 1], {
      target: { value: "Turuncu" },
    });
    const swatchBoxes = within(dialog).getAllByLabelText("Renk örneği");
    fireEvent.click(swatchBoxes[swatchBoxes.length - 1]);
    const colorCodes = within(dialog).getAllByLabelText("Renk kodu");
    fireEvent.change(colorCodes[colorCodes.length - 1], {
      target: { value: "#f97316" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    await waitFor(() => {
      const puts = parsedCalls(fetchMock, "PUT", "/api/admin/attributes/");
      expect(puts).toHaveLength(1);
      expect(puts[0].url).toBe("/api/admin/attributes/renk");
      expect(puts[0].body).toEqual({
        name: "Renk",
        slug: "renk",
        terms: [
          {
            name: "Siyah",
            slug: "siyah",
            previousSlug: "siyah",
            swatch: "#18181b",
          },
          {
            name: "Beyaz",
            slug: "beyaz",
            previousSlug: "beyaz",
            swatch: "#ffffff",
          },
          {
            name: "Antrasit",
            slug: "antrasit",
            previousSlug: "antrasit",
            swatch: "#4b5563",
          },
          { name: "Bej", slug: "bej", previousSlug: "bej", swatch: "#d6c7b2" },
          {
            name: "Turuncu",
            slug: "turuncu",
            previousSlug: "",
            swatch: "#f97316",
          },
        ],
      });
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(screen.getByText("Nitelik kaydedildi.")).toBeInTheDocument();
  });

  it("POSTs a new attribute omitting empty terms and swatch when unchecked", async () => {
    const fetchMock = mockCatalog(createSampleCatalog());
    renderPage(<AdminAttributesPage />);
    await screen.findByText("Renk");
    fireEvent.click(screen.getByRole("button", { name: "Yeni Nitelik" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByTestId("admin-attribute-name"), {
      target: { value: "Yeni Nitelik" },
    });
    fireEvent.click(within(dialog).getByTestId("admin-add-term"));
    fireEvent.click(within(dialog).getByTestId("admin-add-term"));
    const termInputs = within(dialog).getAllByLabelText("Terim adı");
    fireEvent.change(termInputs[0], { target: { value: "Turuncu" } });
    // second term left empty/whitespace -> omitted
    fireEvent.change(termInputs[1], { target: { value: "   " } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    await waitFor(() => {
      const posts = parsedCalls(fetchMock, "POST", "/api/admin/attributes");
      expect(posts).toHaveLength(1);
      expect(posts[0].url).toBe("/api/admin/attributes");
      expect(posts[0].body).toEqual({
        name: "Yeni Nitelik",
        slug: "yeni-nitelik",
        terms: [{ name: "Turuncu", slug: "turuncu", previousSlug: "" }],
      });
      expect(posts[0].body.terms[0]).not.toHaveProperty("swatch");
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(screen.getByText("Nitelik kaydedildi.")).toBeInTheDocument();
  });

  it("confirms attribute deletion via alertdialog naming the attribute, Vazgeç cancels", async () => {
    const fetchMock = mockCatalog(createSampleCatalog());
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage(<AdminAttributesPage />);
    await screen.findByText("Renk");
    fireEvent.click(screen.getAllByRole("button", { name: "Sil" })[0]);
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Renk");
    expect(
      parsedCalls(fetchMock, "DELETE", "/api/admin/attributes")
    ).toHaveLength(0);
    fireEvent.click(within(dialog).getByRole("button", { name: "Vazgeç" }));
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    );
    expect(
      parsedCalls(fetchMock, "DELETE", "/api/admin/attributes")
    ).toHaveLength(0);
    expect(confirmSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: "Sil" })[0]);
    const dialog2 = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog2).getByRole("button", { name: "Sil" }));
    await waitFor(() => {
      const dels = parsedCalls(fetchMock, "DELETE", "/api/admin/attributes");
      expect(dels).toHaveLength(1);
      expect(dels[0].url).toBe("/api/admin/attributes/renk");
    });
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("closes with Kapat and with Escape without POST/PUT", async () => {
    const fetchMock = mockCatalog(createSampleCatalog());
    renderPage(<AdminAttributesPage />);
    await screen.findByText("Renk");
    fireEvent.click(screen.getByRole("button", { name: "Yeni Nitelik" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Kapat" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: "Yeni Nitelik" }));
    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(
      parsedCalls(fetchMock, "POST", "/api/admin/attributes")
    ).toHaveLength(0);
    expect(parsedCalls(fetchMock, "PUT", "/api/admin/attributes")).toHaveLength(
      0
    );
  });

  it("keeps the dialog open and shows the error inside it when save fails", async () => {
    mockCatalog(createSampleCatalog(), async (url, options, method) => {
      if (method === "POST") return fail("Nitelik kaydedilemedi.");
      return null;
    });
    renderPage(<AdminAttributesPage />);
    await screen.findByText("Renk");
    fireEvent.click(screen.getByRole("button", { name: "Yeni Nitelik" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByTestId("admin-attribute-name"), {
      target: { value: "Hata Nitelik" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    await waitFor(() =>
      expect(
        within(screen.getByRole("dialog")).getByText("Nitelik kaydedilemedi.")
      ).toBeInTheDocument()
    );
  });

  it("shows loading, error, and empty-list states", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () => new Promise(() => {})
    );
    const first = renderPage(<AdminAttributesPage />);
    expect(screen.getByText("Yükleniyor...")).toBeInTheDocument();
    first.unmount();
    vi.restoreAllMocks();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      fail("Nitelikler yüklenemedi.", 500)
    );
    const second = renderPage(<AdminAttributesPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nitelikler yüklenemedi."
    );
    second.unmount();
    vi.restoreAllMocks();
    const catalog = createSampleCatalog();
    catalog.attributes = [];
    mockCatalog(catalog);
    renderPage(<AdminAttributesPage />);
    expect(
      await screen.findByRole("button", { name: "Yeni Nitelik" })
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("admin-attribute-form")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Düzenle" })
    ).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminMenuCategoriesPage from "@/pages/admin/AdminMenuCategoriesPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminShowcasePage from "@/pages/admin/AdminShowcasePage";
import { createSampleCatalog } from "@/data/sample-catalog";

function ok(data) {
  return { ok: true, status: 200, text: async () => JSON.stringify(data) };
}

function mockCatalog(catalog) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () => ok(catalog));
}

function renderAt(ui, route) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route element={<AdminLayout />}>{ui}</Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("admin settings submenu", () => {
  it("lists Site Ayarları, Menü Kategorileri, and Vitrin under Ayarlar", () => {
    mockCatalog(createSampleCatalog());
    renderAt(<Route path="/admin" element={<p>Panel</p>} />, "/admin");

    const settings = screen.getByRole("button", { name: "Ayarlar" });
    expect(settings).toHaveAttribute("aria-expanded", "true");
    const submenu = screen.getByTestId("admin-settings-submenu");
    expect(submenu).toHaveTextContent("Site Ayarları");
    expect(submenu.querySelector('a[href="/admin/ayarlar"]')).not.toBeNull();
    expect(
      submenu.querySelector('a[href="/admin/ayarlar/menu-kategorileri"]')
    ).not.toBeNull();
    expect(
      submenu.querySelector('a[href="/admin/ayarlar/vitrin"]')
    ).not.toBeNull();

    fireEvent.click(settings);
    expect(settings).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByTestId("admin-settings-submenu")
    ).not.toBeInTheDocument();
  });
});

describe("site settings page", () => {
  it("edits site identity and contact, and saves the rest of the settings unchanged", async () => {
    const catalog = createSampleCatalog();
    const fetchMock = mockCatalog(catalog);
    renderAt(
      <Route path="/admin/ayarlar" element={<AdminSettingsPage />} />,
      "/admin/ayarlar"
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Site Ayarları" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("admin-site-settings")).toBeInTheDocument();
    expect(
      screen.queryByText("Menüde gösterilecek kategoriler")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Vitrin ekle" })
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("admin-setting-siteName"), {
      target: { value: "Yeni Katalog" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ayarları kaydet" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/site-settings",
        expect.objectContaining({ method: "PUT" })
      );
    });
    const body = JSON.parse(
      fetchMock.mock.calls.find(
        ([url, opts]) =>
          String(url) === "/api/admin/site-settings" && opts?.method === "PUT"
      )[1].body
    );
    expect(body.siteName).toBe("Yeni Katalog");
    expect(body.navCategoryIds).toEqual(catalog.siteSettings.navCategoryIds);
    expect(body.showcaseSections).toEqual(
      catalog.siteSettings.showcaseSections
    );
    expect(
      await screen.findByTestId("admin-settings-message")
    ).toHaveTextContent("Ayarlar kaydedildi.");
  });
});

describe("menu categories page", () => {
  it("toggles nav categories and saves them with the other settings intact", async () => {
    const catalog = createSampleCatalog();
    const fetchMock = mockCatalog(catalog);
    renderAt(
      <Route
        path="/admin/ayarlar/menu-kategorileri"
        element={<AdminMenuCategoriesPage />}
      />,
      "/admin/ayarlar/menu-kategorileri"
    );

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Menü Kategorileri",
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("admin-setting-siteName")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Vitrin ekle" })
    ).not.toBeInTheDocument();

    const category = screen.getByRole("checkbox", { name: "Örnek Koleksiyon" });
    expect(category).toBeChecked();
    fireEvent.click(category);
    fireEvent.click(screen.getByRole("button", { name: "Ayarları kaydet" }));

    await waitFor(() => {
      const body = JSON.parse(
        fetchMock.mock.calls.find(
          ([url, opts]) =>
            String(url) === "/api/admin/site-settings" && opts?.method === "PUT"
        )[1].body
      );
      expect(body.navCategoryIds).toEqual([5, 6]);
      expect(body.siteName).toBe(catalog.siteSettings.siteName);
      expect(body.showcaseSections).toEqual(
        catalog.siteSettings.showcaseSections
      );
    });
  });
});

describe("showcase page", () => {
  it("edits homepage showcases without the site or menu fields", async () => {
    const catalog = createSampleCatalog();
    const fetchMock = mockCatalog(catalog);
    renderAt(
      <Route path="/admin/ayarlar/vitrin" element={<AdminShowcasePage />} />,
      "/admin/ayarlar/vitrin"
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Vitrin" })
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("admin-setting-siteName")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Menüde gösterilecek kategoriler")
    ).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("Vitrin başlığı")).toHaveLength(1);
    const addShowcase = screen.getByRole("button", { name: "Vitrin ekle" });
    const removeShowcase = screen.getByRole("button", { name: "Vitrini sil" });
    expect(addShowcase.querySelector("svg")).not.toBeNull();
    expect(removeShowcase.querySelector("svg")).not.toBeNull();

    fireEvent.change(screen.getByLabelText("Vitrin başlığı"), {
      target: { value: "Yeni Vitrin" },
    });
    fireEvent.click(addShowcase);
    expect(screen.getAllByLabelText("Vitrin başlığı")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Ayarları kaydet" }));

    await waitFor(() => {
      const body = JSON.parse(
        fetchMock.mock.calls.find(
          ([url, opts]) =>
            String(url) === "/api/admin/site-settings" && opts?.method === "PUT"
        )[1].body
      );
      expect(body.showcaseSections[0].title).toBe("Yeni Vitrin");
      expect(body.showcaseSections).toHaveLength(2);
      expect(body.siteName).toBe(catalog.siteSettings.siteName);
      expect(body.navCategoryIds).toEqual(catalog.siteSettings.navCategoryIds);
    });
  });
});

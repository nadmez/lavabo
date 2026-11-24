# Admin Dashboard Rename and Utilities

## Summary

Renames the admin landing page from `Özet` to `Dashboard` in the sidebar navigation and page heading, removes its create shortcuts, and keeps its metrics and catalogue utilities working — with the destructive reset now confirmed through an accessible alert dialog instead of a native confirm.

## Scope

Covers `src/components/admin/AdminLayout.js` (navigation label only for this spec) and `src/pages/admin/AdminDashboardPage.js`, exercised through the existing Vitest + Testing Library setup in `src/pages/admin/admin-panel.test.js` using `createSampleCatalog()` from `src/data/sample-catalog.js` and mocked `fetch` calls. Split from the Phase 11 admin redesign: category/attribute overlays are in `specs/phase-11/admin-category-attribute-modals.md` and the product drawer is in `specs/phase-11/admin-product-drawer.md`.

## Acceptance criteria

- The system must render the admin navigation link to `/admin` with the visible text `Dashboard`.
- The system must not render the visible text `Özet` in the admin navigation.
- The system must render the dashboard page heading as an `h1` with the text `Dashboard`.
- The system must not render the visible text `Özet` as the dashboard page heading.
- The system must not render a link or button with the visible text `Yeni Ürün Ekle` on the dashboard page.
- The system must not render a link or button with the visible text `Yeni Kategori Ekle` on the dashboard page.
- The system must keep `data-testid="admin-dashboard"` on the dashboard page container.
- The system must keep `data-testid="admin-metric-products"` showing `3` for the sample catalog.
- The system must show the text `2 stokta / 1 stokta yok` inside `data-testid="admin-metric-products"` for the sample catalog (3 products: 2 with `inStock: true`, 1 with `inStock: false`).
- The system must keep `data-testid="admin-metric-categories"` showing `6` for the sample catalog.
- The system must keep `data-testid="admin-metric-attributes"` showing `3` for the sample catalog.
- The system must keep a clickable `data-testid="admin-export-json"` control with the visible text `JSON Dışa Aktar`.
- The system must keep a file input at `data-testid="admin-import-json"` labelled with the visible text `JSON İçe Aktar`.
- The system must keep a clickable `data-testid="admin-load-sample"` control with the visible text `Örnek Verileri Yükle`.
- The system must keep a clickable `data-testid="admin-reset-empty"` control with the visible text `Kataloğu Sıfırla (Boş Katalog)`.
- The system must keep `data-testid="admin-dashboard-message"` as the element that shows utility result and error messages on the page.
- When `Örnek Verileri Yükle` is clicked, the system must call `fetch` with `/api/admin/reset` and method `POST` with a JSON body of `{ mode: "sample" }`.
- When the sample load succeeds, the system must show the text `Örnek veriler yüklendi.` in `data-testid="admin-dashboard-message"`.
- When a valid JSON file is chosen through `data-testid="admin-import-json"`, the system must call `fetch` with `/api/admin/catalog` and method `PUT` with the parsed JSON as the request body.
- When the import succeeds, the system must show the text `Katalog içe aktarıldı.` in `data-testid="admin-dashboard-message"`.
- When `data-testid="admin-reset-empty"` is clicked, the system must open a confirmation with `role="alertdialog"` before any reset request is made.
- The system must show a confirm control with the visible text `Sıfırla` inside the `role="alertdialog"` confirmation.
- The system must show a cancel control with the visible text `Vazgeç` inside the `role="alertdialog"` confirmation.
- When `Vazgeç` is clicked in the reset confirmation, the system must close the `role="alertdialog"` and must not call `fetch` with `/api/admin/reset`.
- When `Sıfırla` is clicked in the reset confirmation, the system must call `fetch` with `/api/admin/reset` and method `POST` with a JSON body of `{ mode: "empty" }`.
- When the reset succeeds, the system must show the text `Katalog sıfırlandı.` in `data-testid="admin-dashboard-message"`.
- The system must never call `window.confirm` for the reset action or for any other dashboard utility.

## Edge cases and error handling

- When the dashboard catalog query is pending, the system must show the text `Yükleniyor...` and must not yet render the metric testids.
- When the dashboard catalog query fails, the system must render an element with `role="alert"` containing the error message text.
- When the reset confirmation is open but neither `Sıfırla` nor `Vazgeç` has been clicked, the system must not call `fetch` with `/api/admin/reset` and must not use method `POST` for a reset.
- When an invalid JSON file is chosen through `data-testid="admin-import-json"`, the system must show a non-empty message in `data-testid="admin-dashboard-message"`.
- When an invalid JSON file is chosen through `data-testid="admin-import-json"`, the system must not call `fetch` with `/api/admin/catalog` and method `PUT`.
- When a utility request fails, the system must show the error message text in `data-testid="admin-dashboard-message"`.

## Out of scope

- Creating products or categories from the dashboard (those create actions live on their own list pages).
- Any change to the metrics themselves, the sample catalog contents, or the export file format.
- Category, attribute, and product overlays, row actions, and delete confirmations on those pages.
- The `Ayarlar` page form, the login page, and all storefront pages.

## Context / notes

- Relevant existing files: `src/pages/admin/AdminDashboardPage.js`, `src/components/admin/AdminLayout.js`, `src/pages/admin/admin-panel.test.js`, `src/data/sample-catalog.js`, `src/admin/api.js` (`adminFetch`), and `src/admin/use-admin-catalog.js` (`useAdminCatalog`, query key `["admin-catalog"]`).
- The sample catalog fixture is the source of the expected counts: 3 products (2 in stock, 1 out of stock), 6 categories, and 3 attributes.
- Icon and overlay stack for the redesign: `lucide-react` icons, `@radix-ui/react-dialog`, `@radix-ui/react-alert-dialog`, Tailwind CSS, and in-repo chip components. Tests assert on visible text, roles, `aria-label` values, `data-testid` values, and mocked `fetch` calls — not on icon or overlay internals.
- The dashboard reset test in `src/pages/admin/admin-panel.test.js` currently mocks `window.confirm`; it must be rewritten to drive the `role="alertdialog"` interaction instead.
- All criteria are observable with Vitest + Testing Library (`src/**/*.test.js`): rendered text, roles, `data-testid` values, and mocked `fetch` calls.

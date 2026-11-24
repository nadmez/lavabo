# Admin Product Editor Page

## Summary

Ürünler stays a filterable list whose create, edit, and duplicate flows go to a dedicated product editor page at `/admin/urunler/yeni` and `/admin/urunler/:id`. Deleting uses an accessible alert dialog instead of a native confirm. The dashboard and category/attribute flows are covered by the sibling Phase 11 specs.

## Scope

Covers `src/pages/admin/AdminProductsPage.js`, `src/pages/admin/AdminProductEditorPage.js` (which renders `src/components/admin/AdminProductForm.js`), and the route table in `src/App.js`, exercised through Vitest + Testing Library with `createSampleCatalog()` and mocked `fetch`.

## Acceptance criteria

- The system must render the products page with `data-testid="admin-products"`, an `h1` `Ürünler`, and the filters `admin-product-search`, `admin-product-category-filter`, and `admin-product-stock-filter`.
- The system must render one row per product with `data-testid="admin-product-row-{slug}"`, showing `Stokta` or `Stokta yok` as appropriate.
- The products table's `Ürün` column header and column must take 35% of the table width (`w-[35%]`), and the product name cell must allow wrapping (`whitespace-normal`, `break-words`) so long names wrap and row height may vary.
- The system must render a `Yeni Ürün` link whose `href` is `/admin/urunler/yeni`.
- Each product row must render a `Düzenle` link whose `href` is `/admin/urunler/{id}`, a `Çoğalt` button (`aria-label="Çoğalt"`), and a `Sil` button (`aria-label="Sil"`).
- The system must register routes for `/admin/urunler/yeni` and `/admin/urunler/:id` in `src/App.js`, rendering `AdminProductEditorPage`.
- The editor page must render an `h1` `Yeni ürün` for create and `Ürünü düzenle` for edit, a `Listeye dön` link to `/admin/urunler`, and the form at `data-testid="admin-product-form"` as a page (no `role="dialog"`).
- The editor form must expose all current fields: `admin-product-name`, `admin-product-slug`, `Stok kodu`, the `Basit`/`Varyasyonlu` radios (`admin-product-variable`), `admin-product-price`, `admin-product-upload`, `admin-product-image-url`, `Öne çıkanlar`, `Açıklama`, `Teknik bilgiler`, `Nitelikler`, and the inline term-creation controls.
- The `URL ekle`, every `Sil`, the `Terim ekle`, and the `Ürünü kaydet` (`admin-product-save`) controls must each contain an icon (an `svg` element) while keeping their accessible names.
- Saving an edit must `PUT /api/admin/products/{id}` with the unchanged payload shape and show `Ürün kaydedildi.` at `admin-product-message` without navigating.
- Saving a create must `POST /api/admin/products`, then navigate to `/admin/urunler/{createdId}`; a second save there must `PUT` to that id instead of a second `POST`.
- Clicking `Çoğalt` must `POST` a copy whose name is `{name} kopya`, slug is `{slug}-kopya`, SKU is `{sku}-KOPYA` (or empty), with no `id`, then navigate to `/admin/urunler/{createdId}`.
- Clicking `Sil` must open a `role="alertdialog"` naming the product; `Vazgeç` must not delete, `Sil` must `DELETE /api/admin/products/{id}`, and `window.confirm` must not be called.
- Selecting `Varyasyonlu`, checking `Siyah`, `Beyaz`, and `Orta (M)`, then generating must render exactly two `admin-variant-row` elements.
- The `Yeni Nitelik` modal's `Terim ekle` control (`admin-add-term`) must contain an icon while keeping its accessible name.
- The Dashboard's `admin-metric-products` card must contain a simple pie at `data-testid="admin-stock-pie"` whose `aria-label` and legend show the rounded in-stock and out-of-stock percentages (`%67 Stokta`, `%33 Stokta yok` for the sample catalog).

## Edge cases and error handling

- When a create or edit save fails, the editor page must stay open and `admin-product-message` must show the API error string.
- When duplication fails, the products page must show the API error, stay on `/admin/urunler`, and open no dialog.
- When the requested product id does not exist, the editor page must show `Ürün bulunamadı.`.
- When `products` is empty, the products page must render no rows and must not throw; the `Yeni Ürün` link must remain.
- While the catalog query is pending, the pages must show `Yükleniyor...`; on failure they must show `role="alert"` with the error message.

## Out of scope

- A duplicate action on category or attribute rows.
- Dashboard metrics other than the stock pie, and the catalog-reset dialog.
- Ayarlar page content.
- Storefront pages.
- A chart library; the pie is a single styled element.

# Phase 5: Product Listing Page, Breadcrumbs, Product Card, Toolbar, Pagination, and Category SEO Block

## Summary

Replaces the temporary debug catalogue listing on `/urunlerimiz` and `/kategori/:slug` with the full Turkish product listing page (`ProductListingPage`), backed by a TRY currency formatter (`format-price.js`), hierarchical category `Breadcrumbs`, `ProductCard`, `ListingToolbar` (results count, sort selector, and per-page selector synced to URL search params), `Pagination`, and sanitized category SEO description blocks.

## Scope

Covers `src/utils/format-price.js`, `src/components/catalog/Breadcrumbs.js`, `src/components/catalog/ProductCard.js`, `src/components/catalog/ListingToolbar.js`, `src/components/catalog/Pagination.js`, `src/pages/ProductListingPage.js`, and wiring `/urunlerimiz` and `/kategori/:slug` in `src/App.js` (along with unit and component tests in `src/**/*.test.js`).

## Acceptance criteria

- `src/utils/format-price.js` must export `formatTryCurrency(amount)`:
  - Formats a positive finite numeric amount using `new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 })` (for example `1500` -> `"₺1.500"` and `800` -> `"₺800"`).
  - Returns `"₺0"` when `amount` is `null`, `undefined`, `NaN`, non-numeric, or `<= 0`.
- `src/utils/format-price.js` must export `formatProductPriceRange(priceMin, priceMax)`:
  - When `priceMin === priceMax` or `priceMax <= priceMin` (or `priceMax` is missing/invalid), returns `formatTryCurrency(priceMin)`.
  - When `priceMax > priceMin`, returns `${formatTryCurrency(priceMin)} – ${formatTryCurrency(priceMax)}` (using an en-dash surrounded by spaces).
- `Breadcrumbs` (`src/components/catalog/Breadcrumbs.js`) must render `<nav aria-label="Sayfa yolu" data-testid="catalog-breadcrumbs">`:
  - Always renders an `"Anasayfa"` link pointing to `"/"` as the first breadcrumb item.
  - When rendered for `/urunlerimiz` (no `categorySlug`), renders `"Anasayfa"` (`href="/"`) followed by the current page item `"Ürünlerimiz"` with `aria-current="page"`.
  - When rendered for `/kategori/:slug` and the category exists in `catalog.categoriesBySlug`, walks up the `parentId` chain via `catalog.categoriesById` from the active category to its root ancestor (using a visited-ID `Set` to guard against cycles), rendering each ancestor in root-to-leaf order as a link to `"/kategori/<ancestor.slug>"` and rendering the active category's Turkish `name` as the final item with `aria-current="page"` (for example, for `"led-avizeler"` whose ancestors are `Aydınlatma` -> `Avize`, renders `Anasayfa` -> `Aydınlatma` (`/kategori/aydinlatma`) -> `Avize` (`/kategori/avize`) -> `Led Avizeler`).
- `ProductCard` (`src/components/catalog/ProductCard.js`) must render a single `<li data-testid="product-card">` (without nested `<li>` elements inside it) for a `product`:
  - Renders a link (`data-testid="product-card-link"`) pointing to `/urun/${product.slug}`.
  - Renders the primary product `<img loading="lazy" src={resolveAssetUrl(product.images?.[0])} alt={product.name} onError={handleImageError} />`.
  - Renders the product title (`product.name`), SKU (`product.sku`), and formatted price (`data-testid="product-card-price"`) using `formatProductPriceRange(product.priceMin, product.priceMax)`.
  - When `product.inStock === true`, renders an in-stock badge (`data-testid="product-stock-badge"`) with exact text `"Stokta"`.
  - When `product.inStock === false`, does not render `data-testid="product-stock-badge"` or `"Stokta"`, and instead renders `data-testid="product-out-of-stock-badge"` with exact text `"Stokta Yok"`.
- `ListingToolbar` (`src/components/catalog/ListingToolbar.js`) must render:
  - The total results count in `<p data-testid="debug-result-count">{total} ürün bulundu</p>` and the filter summary element `<p data-testid="debug-filter-summary">` for compatibility with existing catalog route tests.
  - A sort `<select data-testid="sort-select" aria-label="Sıralama">` bound to the active `sort` value with 3 options:
    - value `"en-yeni"` with label `"En yeniye göre sırala"`
    - value `"fiyat-artan"` with label `"Fiyata göre sırala: Düşükten yükseğe"`
    - value `"fiyat-azalan"` with label `"Fiyata göre sırala: Yüksekten düşüğe"`
  - Changing `data-testid="sort-select"` must invoke `onSortChange(newSort)` (updating `sirala` in URL search params and resetting `page` to `1`).
  - A products-per-page selector container (`data-testid="per-page-selector"`, `aria-label="Sayfa başına ürün sayısı"`) containing buttons for `9`, `12`, `18`, and `24` (`data-testid="per-page-option-9"`, `data-testid="per-page-option-12"`, `data-testid="per-page-option-18"`, `data-testid="per-page-option-24"`), each with `aria-pressed={perPage === n}` (as `"true"` or `"false"`).
  - Clicking a per-page option button must invoke `onPerPageChange(n)` (updating `goster` in URL search params and resetting `page` to `1`).
- `Pagination` (`src/components/catalog/Pagination.js`) must handle page navigation:
  - When `totalPages <= 1`, renders nothing (`data-testid="catalog-pagination"` must not be in the DOM).
  - When `totalPages > 1`, renders `<nav aria-label="Sayfalama" data-testid="catalog-pagination">` containing:
    - Previous button (`data-testid="pagination-prev"`, text `"Önceki"`, `disabled` when `page <= 1`).
    - Numbered page buttons (`data-testid="pagination-page-${p}"` for each page `1..totalPages`, with `aria-current="page"` on the active `page` and no `aria-current` on inactive pages).
    - Next button (`data-testid="pagination-next"`, text `"Sonraki"`, `disabled` when `page >= totalPages`).
  - Clicking an enabled numbered page button, `"Önceki"`, or `"Sonraki"` must call `onPageChange(targetPage)` and update `sayfa` in URL search params.
- `ProductListingPage` (`src/pages/ProductListingPage.js`) must be wired into `src/App.js` for both `/urunlerimiz` and `/kategori/:slug`, replacing `DebugCatalogListing`:
  - Renders `"Yükleniyor..."` while the catalog/products query is pending without data, and renders a `role="alert"` error message if the query fails.
  - Renders `<Breadcrumbs />` and a top-level `<h1>` heading: `"Ürünlerimiz"` on `/urunlerimiz`, or the active category's Turkish `name` (e.g. `"Led Avizeler"`) when on `/kategori/:slug` for a known category.
  - Renders `<ListingToolbar />`, `<ul data-testid="debug-product-list">` containing `<ProductCard>` items when `items.length > 0`, and `<Pagination />`.
  - When `items.length === 0` (including when filters match no products or when `/kategori/:slug` has an unknown category slug), renders `<div data-testid="empty-catalog-results">` containing text matching `/kriterlere uygun ürün bulunamadı/i` while keeping `<ul data-testid="debug-product-list">` present (empty) in the DOM.
  - Below the product grid and pagination, when on `/kategori/:slug` and the active category has a `descriptionHtml` that contains visible text after stripping WordPress `[embed]...[/embed]` shortcodes, renders `<section data-testid="category-seo-content" aria-label="Kategori açıklaması">` containing the sanitized HTML (with `[embed]...[/embed]` blocks removed).

## Edge cases and error handling

- When `amount` passed to `formatTryCurrency` is `0`, `-500`, `NaN`, `Infinity`, `null`, `undefined`, or `""`, it must return `"₺0"` without throwing.
- When a category in `catalog.categoriesById` has a broken `parentId` reference (pointing to a non-existent ID) or a circular `parentId` chain (e.g. `A -> B -> A`), `Breadcrumbs` must terminate traversal cleanly without an infinite loop.
- When `/kategori/:slug` is visited with an unknown category slug not present in `catalog.categoriesBySlug`, `ProductListingPage` must not crash: it must render a fallback `<h1>` heading, `Breadcrumbs` with `"Anasayfa"` and the fallback label, `0 ürün bulundu`, `<ul data-testid="debug-product-list">` with 0 items, and `data-testid="empty-catalog-results"`.
- When a category's `descriptionHtml` is empty (`""`), whitespace-only, or contains only `[embed]...[/embed]` shortcodes and empty HTML wrapper tags with no remaining text content, `data-testid="category-seo-content"` must not be rendered.
- When on `/urunlerimiz` (all products view), `data-testid="category-seo-content"` must not be rendered.
- `ProductCard` and `ProductListingPage` must never render any e-commerce or omitted terms: no `"Sepete Ekle"`, `"Satın Al"`, `"Karşılaştır"`, `"İstek listesine ekle"`, `"Favoriler"`, or installment (`"taksit"`) text.

## Out of scope

- Home page hero banner, featured category cards, and showcase grids (Phase 6+ / separate phase).
- Category sidebar accordion and attribute/swatch/stock filter sidebar panel (covered in Phase 6).
- Product detail page gallery, variant selector, and quick view modal (covered in Phase 7).
- Live header search dropdown and `/arama` results page implementation (covered in Phase 8).

## Context / notes

- All source and test files use plain JavaScript (`.js`) with `@/` path alias imports.
- URL search parameters are managed through `useCatalogSearchParams` (`src/hooks/use-catalog-search-params.js`), which maps `sort` <-> `sirala`, `perPage` <-> `goster`, and `page` <-> `sayfa`, omitting default values (`sort: "en-yeni"`, `perPage: 12`, `page: 1`).
- Product and catalog data are read via `useProducts` and `useCatalog` (`src/hooks/use-products.js`).
- Image URLs and fallback handling use `resolveAssetUrl` and `handleImageError` from `src/utils/image-url.js`.
- Existing test suites (`src/App.test.js`, `src/data/catalog-query.test.js`, `src/hooks/phase-3-hooks-and-preview.test.js`, and `src/components/layout/layout-and-routes.test.js`) must continue to pass without modification under Vitest (`pnpm test`).

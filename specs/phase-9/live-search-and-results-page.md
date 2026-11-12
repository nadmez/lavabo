# Phase 9: Live Header Search and Search Results Page (`HeaderSearch` & `SearchResultsPage`)

## Summary

Adds a Turkish-aware live search form and dropdown in the site header (`HeaderSearch` integrated into `Header`) showing up to 6 matching products by title or SKU with thumbnail, SKU, title, formatted price, and a `"Tüm sonuçları gör"` link, alongside a full-featured `/arama` `SearchResultsPage` that reuses the catalogue filtering, sorting, pagination, and quick view pipeline.

## Scope

Covers `src/components/layout/HeaderSearch.js`, integration into `src/components/layout/Header.js`, `src/pages/SearchResultsPage.js` wired to `/arama` in `src/App.js` (replacing `SearchResultsPlaceholder`), optional `fallbackLabel` support in `src/components/catalog/Breadcrumbs.js` when `categorySlug` is empty, and unit/component tests in `src/**/*.test.js`.

## Acceptance criteria

- `HeaderSearch` (`src/components/layout/HeaderSearch.js`) integrated into `Header` (`src/components/layout/Header.js`) must render an accessible search form inside `<header data-testid="site-header">`:
  - Renders `<form role="search" data-testid="header-search-form">`.
  - Renders `<input type="search" data-testid="header-search-input" aria-label="Ürün veya stok kodu ara" placeholder="Aradığınız ürünleri görmek için yazmaya başlayın..." />`.
  - Renders a search submit/trigger control (`data-testid="header-search-trigger"`, `aria-label="Ürün ara"`) that navigates to `"/arama"` when the trimmed input value is empty, or to `"/arama?q=${encodeURIComponent(trimmedQuery)}"` when the trimmed input value is non-empty.
  - When the input value is non-empty (`value.length > 0`), renders a clear button (`type="button"`, `data-testid="header-search-clear"`, `aria-label="Aramayı temizle"`). Clicking `data-testid="header-search-clear"` resets the input value to `""` and closes the live dropdown.
- `HeaderSearch` must display a live results dropdown (`data-testid="header-search-dropdown"`) when the trimmed input value is non-empty and the dropdown is open:
  - Queries the cached catalog via `queryProducts(catalog, { search: trimmedQuery, perPage: 9 })` (which uses `normalizeTurkishSearch` for case- and diacritic-insensitive Turkish title and SKU matching, e.g. `"aplık"` matches `"Aplik"`, `"İSTANBUL"` matches `"İstanbul"`, and SKU substrings match) and takes the top 6 items (`items.slice(0, 6)`).
  - Renders `<div data-testid="header-search-dropdown" role="region" aria-label="Canlı arama sonuçları">`.
  - When `matches.length > 0`, renders `<ul data-testid="header-search-results-list">` containing up to 6 `<li data-testid="header-search-result-item">` elements.
  - Each `<li data-testid="header-search-result-item">` renders `<Link to={`/urun/${product.slug}`} data-testid={`header-search-result-link-${product.slug}`}>` containing:
    - The product thumbnail `<img src={resolveAssetUrl(product.images?.[0])} alt={product.name} onError={handleImageError} />`.
    - The product `name`.
    - The product `sku`.
    - The formatted price via `formatProductPriceRange(product.priceMin, product.priceMax)`.
  - When `total > 0`, renders a `"Tüm sonuçları gör (${total})"` link (`data-testid="header-search-view-all"`, `to={`/arama?q=${encodeURIComponent(trimmedQuery)}`}`).
  - When `matches.length === 0` (and the catalog is loaded), renders `<p data-testid="header-search-no-results">Sonuç bulunamadı</p>` and does not render `data-testid="header-search-results-list"` or `data-testid="header-search-view-all"`.
- `HeaderSearch` must support form submission and dropdown dismissal:
  - Submitting `data-testid="header-search-form"` (pressing `Enter` in `data-testid="header-search-input"` or clicking `data-testid="header-search-trigger"`) prevents full-page reload, navigates to `"/arama?q=${encodeURIComponent(trimmedQuery)}"` when `trimmedQuery` is non-empty or `"/arama"` when `trimmedQuery` is empty, and closes `data-testid="header-search-dropdown"`.
  - Clicking any result link (`data-testid="header-search-result-link-${product.slug}"`) or clicking `data-testid="header-search-view-all"` closes `data-testid="header-search-dropdown"`.
  - Pressing the `Escape` key or clicking outside `data-testid="header-search-form"` closes `data-testid="header-search-dropdown"`.
- `SearchResultsPage` (`src/pages/SearchResultsPage.js`) wired to `<Route path="/arama" element={<SearchResultsPage />} />` in `src/App.js` must render the search results view and preserve backward compatibility with existing route tests:
  - Renders an outer wrapper with `data-testid="search-results-placeholder"` across all states (loading, error, and loaded).
  - Reads `params` and `setParams` from `useCatalogSearchParams()`, where `params.search` is the trimmed `?q=` query parameter.
  - Renders `<Breadcrumbs catalog={catalog} fallbackLabel="Arama Sonuçları" />` displaying `"Anasayfa"` (`href="/"`) and current page `"Arama Sonuçları"` inside `data-testid="catalog-breadcrumbs"`.
  - Renders an `<h1>` heading: when `params.search` is non-empty, displays `"\"${params.search}\" için arama sonuçları"`; when `params.search` is empty, displays `"Arama Sonuçları"`.
  - Renders an inline search refinement form (`data-testid="search-page-form"`) containing `<input type="search" data-testid="search-page-input" aria-label="Arama terimi" />` (initialized and synced with `params.search`) and a submit button (`data-testid="search-page-submit"`). Submitting `data-testid="search-page-form"` updates `search` (`q`) in the URL search params to the trimmed input value and resets `page` to `1`.
- `SearchResultsPage` must reuse the full catalogue listing pipeline so search results support filtering, sorting, pagination, and quick view:
  - Queries products using `useCatalog()` and `useProducts(params)` / `queryProducts(catalog, params)`.
  - Renders `<aside data-testid="desktop-filter-sidebar" aria-label="Ürün filtreleri">` with `<FilterSidebar />` and `<MobileFilterDrawer />` for mobile filters.
  - Renders `<ListingToolbar />` supporting sort (`sirala`), per-page (`goster`), total count display, and mobile filter drawer trigger.
  - Renders `<ActiveFilterChips />` for active in-stock and attribute filters.
  - Renders `<ul data-testid="debug-product-list">` with `<ProductCard key={product.id} product={product} catalog={catalog} />` for each matching item (including quick view modal support).
  - When `items.length === 0`, renders `<div data-testid="empty-catalog-results">Aradığınız kriterlere uygun ürün bulunamadı.</div>`.
  - Renders `<Pagination />` for multi-page search results.
  - Clicking `"Filtreleri temizle"` (`onClearAll` on `ActiveFilterChips`) clears `inStockOnly` (`false`) and `attributes` (`{}`) and resets `page` to `1`, while preserving the active `search` (`q`), `sort` (`sirala`), and `perPage` (`goster`) parameters.

## Edge cases and error handling

- When `<Header />` or `<HeaderSearch />` is rendered inside `<MemoryRouter>` _without_ a `<QueryClientProvider>` (as in `src/components/layout/layout-and-routes.test.js`), it must not throw an error: `HeaderSearch` must access `QueryClientContext` via `useContext(QueryClientContext)` safely, returning `null` when no `QueryClientProvider` is mounted. When a `queryClient` is present, it can read/subscribe to `["catalog"]` and call `queryClient.ensureQueryData(catalogQueryOptions())` when the user focuses or types in the search input if the catalog is not yet cached.
- Clicking `data-testid="header-search-trigger"` when the search input is empty or contains only whitespace must navigate to `"/arama"` (without a `?q=` query string), preserving the existing Phase 4 test assertion in `src/components/layout/layout-and-routes.test.js`.
- When the search input is empty or whitespace-only, `data-testid="header-search-dropdown"` and `data-testid="header-search-clear"` must not be rendered in the DOM.
- On `/arama?q=sarkit`, `/arama`, and `/arama?q=   `, `SearchResultsPage` must render `data-testid="search-results-placeholder"` synchronously even while catalog data is still loading (`isPending && !data`), must include the trimmed `q` value (e.g. `"sarkit"`) in its text content when `q` is non-empty, and must never output `"undefined"` or `"null"` in `textContent`.
- When `useProducts` fails with an error (`isError === true`), `SearchResultsPage` must render `<div role="alert">` inside `data-testid="search-results-placeholder"` with the Turkish error message `"Katalog verileri yüklenemedi: ..."`.
- Turkish character normalization must work consistently in both `HeaderSearch` and `SearchResultsPage`: searching `"aplık"`, `"APLIK"`, or `"aplik"` matches products named `"Aplik"`, searching `"İSTANBUL"` or `"istanbul"` matches `"İstanbul"`, and searching partial SKU strings (case-insensitively) matches the corresponding products.
- `HeaderSearch` and `SearchResultsPage` must never render any omitted e-commerce elements (`"Sepete Ekle"`, `"Satın Al"`, `"Karşılaştır"`, `"Favoriler"`, `"taksit"`).

## Out of scope

- Search query autocomplete history or recent searches persistence in `localStorage`.
- Debounced network requests to a remote search backend (all search queries execute against the in-memory cached `catalog` via `queryProducts`).
- Homepage showcase sections (covered in Phase 10).

## Context / notes

- All source and test files are plain JavaScript (`.js`) using `@/` path alias imports.
- Reuse `queryProducts` and `normalizeTurkishSearch` from `src/data/catalog-query.js`.
- Reuse `catalogQueryOptions`, `useCatalog`, and `useProducts` from `src/hooks/use-products.js`.
- Reuse `useCatalogSearchParams` from `src/hooks/use-catalog-search-params.js`.
- Reuse `formatProductPriceRange` from `src/utils/format-price.js` and `resolveAssetUrl` / `handleImageError` from `src/utils/image-url.js`.
- Existing tests in `src/components/layout/layout-and-routes.test.js`, `src/pages/product-listing-page.test.js`, `src/pages/product-detail-page.test.js`, and `src/components/catalog/quick-view-modal.test.js` must continue to pass without breaking.

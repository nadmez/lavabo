# Phase 3b: React Query Hooks, URL Filter Sync, Image Resolver, and Debug Listing Route

## Summary

Connects the catalogue query engine to TanStack React Query v5 (`src/hooks/use-products.js`), synchronizes Turkish URL search parameters with React Router v7 (`src/hooks/use-catalog-search-params.js`), resolves product asset URLs with Picsum fallbacks (`src/utils/image-url.js`), and exposes temporary debug listing routes (`/urunlerimiz` and `/kategori/:slug` in `src/App.js`) so the full data pipeline can be inspected immediately.

## Scope

Covers `src/utils/image-url.js`, `src/hooks/use-catalog-search-params.js`, `src/hooks/use-products.js`, and the temporary `/urunlerimiz` and `/kategori/:slug` routes in `src/App.js` (along with unit/component tests in `src/**/*.test.js`). Split from Phase 3 after `specs/phase-3/catalog-query-engine.md`.

## Acceptance criteria

- `getPicsumFallbackUrl({ width, height })` in `src/utils/image-url.js` must return `"https://picsum.photos/<width>/<height>"` defaulting `width` and `height` to `600`.
- `resolveAssetUrl(relativePath, { width, height })` in `src/utils/image-url.js` must return `${import.meta.env.BASE_URL}assets/${cleanPath}` for a non-empty relative path string (stripping any leading `"/"` or leading `"assets/"` prefix so paths never produce `"assets/assets/..."` or double slashes).
- `handleImageError(event, { width, height })` in `src/utils/image-url.js` must set the target `<img>` element's `src` to `getPicsumFallbackUrl({ width, height })` and mark `dataset.fallbackApplied = "true"` on the element.
- `parseCatalogSearchParams(searchParams, knownAttributeSlugs)` in `src/hooks/use-catalog-search-params.js` must parse a `URLSearchParams` instance or query string into `{ inStockOnly, sort, page, perPage, search, attributes }`.
- `parseCatalogSearchParams` must map `stok=1` (or `stok=true`) to `inStockOnly: true` and default `inStockOnly` to `false` otherwise.
- `parseCatalogSearchParams` must parse `sirala` into `sort` supporting `"en-yeni"` (default), `"fiyat-artan"`, and `"fiyat-azalan"` (and normalizing `"newest"` to `"en-yeni"`, `"price-asc"` to `"fiyat-artan"`, and `"price-desc"` to `"fiyat-azalan"`).
- `parseCatalogSearchParams` must parse `sayfa` as a 1-indexed integer `page` (default `1`) and `goster` as `perPage` restricted to `9`, `12`, `18`, or `24` (default `12`).
- `parseCatalogSearchParams` must parse `q` as a trimmed `search` string (default `""`).
- `parseCatalogSearchParams` must parse attribute filter parameters for all known catalogue attribute slugs (`"lineer-urun-boyutu"`, `"lineer-kasa-rengi"`, `"lineer-aydinlatma-rengi"`, `"lineer-kasa-yuksekligi"`, `"urun-boyutu"`, `"avize-rengi"`, `"aydinlatma-rengi"`, `"sarkit-avize-rengi"`) as well as shorthand aliases (`renk` mapped to `"avize-rengi"`, `boyut` mapped to `"urun-boyutu"`, and `isik` mapped to `"aydinlatma-rengi"`), splitting comma-separated values into deduplicated arrays of non-empty term slugs in `attributes[attrSlug]`.
- `serializeCatalogSearchParams(params)` in `src/hooks/use-catalog-search-params.js` must return a `URLSearchParams` instance that includes only non-default values: `stok=1` when `inStockOnly` is `true`, `sirala` when `sort` is `"fiyat-artan"` or `"fiyat-azalan"`, `sayfa` when `page > 1`, `goster` when `perPage` is `9`, `18`, or `24`, `q` when `search` is non-empty after trim, and `<attrSlug>=<comma-joined-terms>` for each non-empty attribute selection.
- `useCatalogSearchParams()` in `src/hooks/use-catalog-search-params.js` must read the current router location search parameters via React Router's `useSearchParams` and return `{ params, setParams, searchParams }`, where `setParams(patchOrUpdater)` updates the URL search parameters with the serialized result.
- `catalogQueryOptions()` in `src/hooks/use-products.js` must return `{ queryKey: ["catalog"], staleTime: Infinity, queryFn }` where `queryFn` fetches `${import.meta.env.BASE_URL}data/catalog.json` and returns `indexCatalog(json)`.
- `useCatalog()` in `src/hooks/use-products.js` must call `useQuery(catalogQueryOptions())` so the static catalogue JSON is fetched once and cached indefinitely in memory.
- `useProducts(params)` in `src/hooks/use-products.js` must call `useQuery` with `queryKey: ["products", normalizedParams]`, `placeholderData: keepPreviousData`, and a `queryFn` that obtains the indexed catalogue via `queryClient.ensureQueryData(catalogQueryOptions())` and returns `queryProducts(indexedCatalog, normalizedParams)`.
- `src/App.js` must render a debug catalogue listing view on `/urunlerimiz` and `/kategori/:slug` that reads `useCatalogSearchParams()` and `:slug` (when on `/kategori/:slug`), queries `useProducts`, and renders the total count in `<p data-testid="debug-result-count">` formatted as `"<total> ürün bulundu"`, an active filter/page summary in `data-testid="debug-filter-summary"`, and the current page's products in `<ul data-testid="debug-product-list">`.
- Each item in `<ul data-testid="debug-product-list">` must display the product's `name`, `sku`, price range (`priceMin` / `priceMax`), and an `<img>` element whose `src` is resolved via `resolveAssetUrl(product.images[0])` with `onError={handleImageError}`.
- `src/App.js` must preserve the existing `/` placeholder route and heading (`Lavabo Aydınlatma Katalog` and `data-testid="scss-demo-box"`) so existing smoke tests in `src/App.test.js` continue to pass.

## Edge cases and error handling

- When `resolveAssetUrl` is called with `null`, `undefined`, a non-string, or an empty/whitespace-only string, it must return `getPicsumFallbackUrl({ width, height })`.
- When `getPicsumFallbackUrl` is called with invalid, negative, zero, or `NaN` dimensions, it must fall back to `600` for any invalid dimension.
- When `handleImageError` is invoked on an `<img>` element that already has `dataset.fallbackApplied === "true"`, it must not reassign `src` again, preventing infinite error loops when the fallback URL is also unreachable.
- When `parseCatalogSearchParams` encounters unknown query keys, empty attribute values (such as `?renk=,,,` or `?avize-rengi=`), invalid `sirala` values, `sayfa` values `<= 0` or `NaN`, or `goster` values outside `[9, 12, 18, 24]`, it must ignore the unknown/empty keys and fall back to default values (`sort: "en-yeni"`, `page: 1`, `perPage: 12`).
- When both a shorthand alias (such as `renk=siyah-renk`) and its canonical attribute key (`avize-rengi=beyaz-renk,siyah-renk`) appear in the same query string, `parseCatalogSearchParams` must merge and deduplicate their term slugs in order (`["siyah-renk", "beyaz-renk"]`).
- When `fetch` in `catalogQueryOptions().queryFn` returns a non-OK HTTP response (`!response.ok`), it must throw an `Error` containing the HTTP status so React Query transitions to an error state.
- When `/urunlerimiz` or `/kategori/:slug` is rendered and the query is still loading without placeholder data, the route must render a visible Turkish loading indicator (`"Yükleniyor..."`); if the query errors, it must render an error alert (`role="alert"`).

## Out of scope

- Production visual layout, header/footer navigation shell, category sidebar component, swatch filter controls, sort dropdown UI, and product card grid styling (covered in Phases 4–6).
- Product detail page (`/urun/:slug`), quick view modal, and live search dropdown UI (covered in later phases).

## Context / notes

- All files use plain JavaScript (`.js`), not TypeScript.
- React Router v7 is imported from `"react-router"` (`useSearchParams`, `useParams`, `Route`, `Routes`, `MemoryRouter`).
- TanStack React Query v5 is imported from `"@tanstack/react-query"` (`useQuery`, `useQueryClient`, `keepPreviousData`).
- Component and hook tests run under Vitest + jsdom + `@testing-library/react` (`pnpm test`). In tests, `globalThis.fetch` can be mocked with `vi.fn()` or seeded in `QueryClient` via `queryClient.setQueryData(["catalog"], indexCatalog(fixtureCatalog))`.

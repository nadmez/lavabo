# Phase 10: Home Page, Dynamic Page Meta, Loading Skeletons, Error Recovery, and Accessibility Polish

## Summary

Replaces the Phase 1 home placeholder at `/` with the full `HomePage` featuring the hero section and three Parbek-style category showcase sections (`Plafonyer Led Avize Modelleri`, `Sarkıt ve Sıva Üstü Lineer Led Armatürler`, `Led Aplik Lamba Ürünleri`), adds dynamic document title and meta description management via `usePageMeta`, introduces `LoadingSkeleton` and retryable error states across all catalogue pages, and completes the keyboard/landmark accessibility pass in `Layout`.

## Scope

Covers `src/pages/HomePage.js` (and `HOME_SHOWCASE_SECTIONS`), `src/hooks/use-page-meta.js`, `src/components/catalog/LoadingSkeleton.js`, updates to `src/App.js`, `src/components/layout/Layout.js`, `src/pages/ProductListingPage.js`, `src/pages/ProductDetailPage.js`, and `src/pages/SearchResultsPage.js`, and unit/component tests in `src/**/*.test.js`.

## Acceptance criteria

- **Home Page (`src/pages/HomePage.js` wired to `<Route index element={<HomePage />} />` in `src/App.js`)**:
  - Must render the hero section (`<section data-testid="home-hero">` or `<header data-testid="home-hero">`) synchronously across all states (loading, error, and loaded):
    - Renders `<h1>Lavabo Aydınlatma Katalog</h1>`.
    - Renders `<section data-testid="scss-demo-box" className="scss-demo-box ..." aria-label="Katalog önizleme kutusu">` containing `"Yerli Üretim LED Aydınlatma Kataloğu"` so existing smoke and layout route tests in `src/App.test.js` and `src/components/layout/layout-and-routes.test.js` continue to pass.
    - Renders a `"Tüm Ürünleri İncele"` call-to-action link (`<Link to="/urunlerimiz" data-testid="home-hero-cta">Tüm Ürünleri İncele</Link>`).
  - Must export `HOME_SHOWCASE_SECTIONS` from `src/pages/HomePage.js` with the three category showcase configurations in exact order:
    1. `{ key: "plafonyer", categorySlug: "plafonyer-led-avize", title: "Plafonyer Led Avize Modelleri", intro: "Plafonyer led avize modern sarkıt led avize modellerimiz sizin için sürekli güncellenmektedir.", ctaLabel: "Diğer Led Avize Ürünleri", limit: 8 }`
    2. `{ key: "lineer", categorySlug: "lineer-aydinlatma", title: "Sarkıt ve Sıva Üstü Lineer Led Armatürler", intro: "Modern ofis ve mimari aydınlatma projeleriniz için sarkıt ve sıva üstü lineer led armatür modellerimiz sizin için sürekli güncellenmektedir.", ctaLabel: "Diğer Lineer Ürünleri", limit: 8 }`
    3. `{ key: "aplik", categorySlug: "aplikler", title: "Led Aplik Lamba Ürünleri", intro: "Telefon tutucu özellikli başucu led aydınlatma aplik lamba modelleri sadece Lavabo Aydınlatma'da!", ctaLabel: "Diğer Aplik Ürünleri", limit: 4 }`
  - When `catalog` is loaded, `HomePage` must render each showcase section in `HOME_SHOWCASE_SECTIONS` as `<section data-testid={`home-section-${section.key}`} aria-label={section.title}>` containing:
    - An `<h2>` heading displaying `{section.title}` (maintaining a strict `h1` -> `h2` heading hierarchy on the home page).
    - A `<p>` element displaying `{section.intro}`.
    - A category link `<Link to={`/kategori/${section.categorySlug}`} data-testid={`home-section-link-${section.key}`}>{section.ctaLabel}</Link>`.
    - A product grid `<ul data-testid={`home-section-grid-${section.key}`}>` rendering up to `section.limit` products derived via `queryProducts(catalog, { categorySlug: section.categorySlug, perPage: 12 }).items.slice(0, section.limit)` using `<ProductCard key={product.id} product={product} catalog={catalog} />` (including quick view modal trigger and dialog support).
- **Dynamic Page Title and Meta Description (`src/hooks/use-page-meta.js`)**:
  - Must export `usePageMeta({ title, description } = {})`:
    - Sets `document.title` to `title ? (title.includes("Lavabo Aydınlatma") ? title : `${title} | Lavabo Aydınlatma`) : "Lavabo Aydınlatma Katalog"` (treating empty or whitespace-only `title` strings as omitted).
    - Finds `<meta name="description">` in `document.head` (or creates and appends `<meta name="description">` to `document.head` if none exists) and sets its `content` attribute to the trimmed `description` string when non-empty, or to `"Yerli üretim modern LED avize, plafonyer, lineer aydınlatma ve aplik kataloğu."` when `description` is omitted, non-string, or whitespace-only.
  - Must be called unconditionally at the top level of each page component (before any early loading or error returns) to obey React's Rules of Hooks:
    - `HomePage`: `title` is `"Lavabo Aydınlatma Katalog"` (`document.title === "Lavabo Aydınlatma Katalog"`), `description` is `"Yerli üretim modern LED avize, plafonyer, lineer aydınlatma ve aplik kataloğu."`.
    - `ProductListingPage`: `title` is the active category's Turkish `name` (e.g. `"Led Avizeler"`, resulting in `document.title === "Led Avizeler | Lavabo Aydınlatma"`) on `/kategori/:slug`, or `"Ürünlerimiz"` (`document.title === "Ürünlerimiz | Lavabo Aydınlatma"`) on `/urunlerimiz`; `description` includes the category plain-text summary or a Turkish listing description containing the heading title.
    - `ProductDetailPage`: `title` is `product.name` when the product is found (`document.title === "${product.name} | Lavabo Aydınlatma"`), or `"Ürün Bulunamadı"` when `catalog` is loaded and the product slug does not exist (`document.title === "Ürün Bulunamadı | Lavabo Aydınlatma"`); `description` uses the first non-empty highlight from `product.highlights` or a plain-text excerpt from `product.descriptionHtml` (stripped of `[embed]...[/embed]` shortcodes and HTML tags), falling back to the default catalogue description.
    - `SearchResultsPage`: `title` is `"\"${params.search}\" Arama Sonuçları"` when `params.search` is non-empty (`document.title === "\"${params.search}\" Arama Sonuçları | Lavabo Aydınlatma"`) or `"Arama Sonuçları"` when `params.search` is empty (`document.title === "Arama Sonuçları | Lavabo Aydınlatma"`).
    - `NotFoundPage` in `src/App.js`: `title` is `"Sayfa Bulunamadı"` (`document.title === "Sayfa Bulunamadı | Lavabo Aydınlatma"`).
- **Loading Skeletons and Error Recovery (`src/components/catalog/LoadingSkeleton.js` and pages)**:
  - Must export `LoadingSkeleton({ count = 6, variant = "grid" })` from `src/components/catalog/LoadingSkeleton.js`:
    - Renders `<div data-testid="catalog-loading-skeleton" aria-busy="true" data-variant={variant}>`.
    - Renders `<p>Yükleniyor...</p>` inside the skeleton container so existing tests asserting on `"Yükleniyor..."` text continue to pass.
    - Renders `count` placeholder elements with `data-testid="skeleton-card"` (clamping invalid or non-positive `count` values to at least `1`).
  - While catalog/products queries are pending without cached data (`isPending && !catalog` / `isPending && !data`), `HomePage`, `ProductListingPage`, `ProductDetailPage`, and `SearchResultsPage` must render `<LoadingSkeleton />` (preserving `data-testid="product-detail-placeholder"` + `<span className="sr-only">{normalizedSlug}</span>` on `ProductDetailPage`, `data-testid="search-results-placeholder"` + `<h1>{headingTitle}</h1>` on `SearchResultsPage`, and `data-testid="home-hero"` on `HomePage`).
  - When catalog/products queries fail (`isError === true`), `HomePage`, `ProductListingPage`, `ProductDetailPage`, and `SearchResultsPage` must render `<div role="alert" data-testid="catalog-error-state">` containing:
    - The Turkish error text `"Katalog verileri yüklenemedi: ${error?.message || "Bilinmeyen hata"}"`.
    - A retry button `<button type="button" data-testid="catalog-retry-button">Tekrar Dene</button>` that invokes `refetch()` on the failed query when clicked.
- **Accessibility Pass (`src/components/layout/Layout.js` and pages)**:
  - `Layout` (`src/components/layout/Layout.js`) must render a keyboard skip link `<a href="#layout-main" data-testid="skip-to-content">Ana içeriğe atla</a>` as the first focusable element before `<Header />`.
  - `Layout` must render `<main id="layout-main" data-testid="layout-main" tabIndex={-1} className="flex-1">` so activating the skip link moves focus directly to the main landmark.

## Edge cases and error handling

- When `HomePage` is rendered while `useCatalog()` is still pending (`isPending && !catalog`), `data-testid="home-hero"` (including `<h1>Lavabo Aydınlatma Katalog</h1>`, `data-testid="scss-demo-box"`, and `data-testid="home-hero-cta"`) must still be present in the DOM synchronously alongside `<LoadingSkeleton />`.
- When `HomePage` is rendered and `useCatalog()` fails (`isError === true`), `data-testid="home-hero"` must still be present in the DOM alongside `data-testid="catalog-error-state"`, and clicking `data-testid="catalog-retry-button"` must call `refetch()` to re-trigger the catalog fetch and recover into the showcase sections once resolved.
- When a showcase category on `HomePage` has fewer than `section.limit` matching products (or `0` matching products in a minimal test fixture catalog), `data-testid={`home-section-${section.key}`}` and `data-testid={`home-section-grid-${section.key}`}` must still render cleanly with the available `<ProductCard />` items without throwing.
- When `usePageMeta` is called multiple times across route transitions, it must update the existing `<meta name="description">` element in `document.head` rather than appending duplicate `<meta name="description">` tags.
- `HomePage` and all other pages must never render omitted sections or elements: no customer reference photos (`"Müşteri Referans Görsellerimiz"`), no Google reviews widget, no workshop video or `[embed]` shortcodes, no WhatsApp links (`wa.me` / `whatsapp`), and no e-commerce controls (`"Sepete Ekle"`, `"Satın Al"`, `"Karşılaştır"`, `"Favoriler"`, `"taksit"`).

## Out of scope

- Server-side rendering (SSR) or static head prerendering outside the client DOM.
- Customer reference photo galleries, Google reviews widgets, or embedded videos on the home page.
- Any e-commerce cart, checkout, wishlist, comparison, or WhatsApp CTA features.

## Context / notes

- All source and test files are plain JavaScript (`.js`) using `@/` path alias imports.
- Reuse `queryProducts` from `src/data/catalog-query.js`, `useCatalog` and `useProducts` from `src/hooks/use-products.js`, and `ProductCard` from `src/components/catalog/ProductCard.js`.
- All existing unit and component tests in `src/App.test.js`, `src/components/layout/layout-and-routes.test.js`, `src/hooks/phase-3-hooks-and-preview.test.js`, `src/pages/product-listing-page.test.js`, `src/pages/product-detail-page.test.js`, `src/pages/search-and-header-search.test.js`, `src/components/catalog/filter-sidebar-and-drawer.test.js`, `src/components/catalog/quick-view-modal.test.js`, `src/data/catalog-query.test.js`, and `src/data/catalog-integrity.test.js` must continue to pass without modification.

# Phase 8: Quick View Modal (`QuickViewModal` and `ProductCard` Trigger)

## Summary

Adds a `"Hızlı görünüm"` trigger button on every `ProductCard` and a `QuickViewModal` dialog displaying the product's image gallery with thumbnails, stock status, SKU, title, formatted price range, highlights, read-only variant option badges with colour swatches, keyboard focus trap, and a direct `"Ürün Detayına Git"` link to `/urun/:slug`.

## Scope

Covers `src/components/catalog/QuickViewModal.js`, updates to `src/components/catalog/ProductCard.js` (and optional `catalog` prop forwarding in `src/pages/ProductListingPage.js` and `src/pages/ProductDetailPage.js`), and unit/component tests in `src/**/*.test.js`. Live search (`SearchBar` and `SearchResultsPage`) is covered in a separate Phase 8 spec.

## Acceptance criteria

- `ProductCard` (`src/components/catalog/ProductCard.js`) must render a quick view trigger button on every card while preserving 100% backward compatibility with existing `ProductCard` tests:
  - Must continue to render a single `<li data-testid="product-card">` with no nested `<li>` elements inside it when the quick view modal is closed.
  - Must render a `"Hızlı görünüm"` trigger button (`type="button"`, `data-testid="quick-view-trigger-${product.slug}"`, `aria-label="${product.name} hızlı görünüm"`).
  - Clicking `data-testid="quick-view-trigger-${product.slug}"` must not navigate the router to `/urun/${product.slug}` (the trigger button must be outside `<Link data-testid="product-card-link">` or call `event.preventDefault()` and `event.stopPropagation()`).
  - When an `onQuickView` callback prop (`typeof onQuickView === "function"`) is provided to `ProductCard`, clicking `data-testid="quick-view-trigger-${product.slug}"` must invoke `onQuickView(product)`.
  - When `onQuickView` is not provided, `ProductCard` must manage its own `isQuickViewOpen` state internally, opening `<QuickViewModal isOpen={isQuickViewOpen} product={product} catalog={resolvedCatalog} onClose={() => setIsQuickViewOpen(false)} />` when `data-testid="quick-view-trigger-${product.slug}"` is clicked.
- `QuickViewModal` (`src/components/catalog/QuickViewModal.js`) must render an accessible modal dialog when `isOpen` is `true` and `product` is provided:
  - Renders `<div role="dialog" aria-modal="true" aria-label="${product.name} hızlı görünüm" data-testid="quick-view-modal">`.
  - Renders a backdrop element (`data-testid="quick-view-backdrop"`) and a close button (`type="button"`, `data-testid="quick-view-close"`, `aria-label="Hızlı görünümü kapat"`).
- `QuickViewModal` must render an interactive image gallery for the product:
  - Renders the main image (`<img data-testid="quick-view-main-image" src={resolveAssetUrl(activeImage)} alt={product.name} onError={handleImageError} />`), defaulting `activeImage` to `product.images?.[0] || ""`.
  - When `Array.isArray(product.images) && product.images.length > 1`, renders a thumbnail button (`type="button"`, `data-testid="quick-view-thumb-${index}"`, `aria-label="${product.name} görsel ${index + 1}"`, `aria-pressed={index === activeIndex}`) for each image in `product.images`.
  - Clicking `data-testid="quick-view-thumb-${index}"` sets `activeIndex` to `index`, updates `aria-pressed` on the thumbnail buttons, and updates `data-testid="quick-view-main-image"`'s `src` to `resolveAssetUrl(product.images[index])`.
- `QuickViewModal` must render the product summary details:
  - Renders the stock badge (`data-testid="quick-view-stock"`), displaying `"Stokta"` when `product.inStock === true` and `"Stokta Yok"` when `product.inStock !== true`.
  - Renders the product SKU (`data-testid="quick-view-sku"`) displaying `product.sku`.
  - Renders the product title (`data-testid="quick-view-title"`) displaying `product.name`.
  - Renders the formatted price (`data-testid="quick-view-price"`) displaying `formatProductPriceRange(product.priceMin, product.priceMax)`.
  - When `Array.isArray(product.highlights)` contains at least one non-empty string, renders `<ul data-testid="quick-view-highlights">` with an `<li>` for each highlight string.
- `QuickViewModal` must render a read-only summary of available variant options when the product has attributes:
  - Inspects `product.attributes` for entries `[attrSlug, termSlugs]` where `Array.isArray(termSlugs) && termSlugs.length > 0`.
  - When at least one non-empty attribute entry exists, renders `<div data-testid="quick-view-variants">` containing a group container (`data-testid="quick-view-variant-group-${attrSlug}"`) for each attribute.
  - Each attribute group displays the attribute's Turkish `name` from `catalog?.attributesBySlug?.get(attrSlug)?.name || attrSlug`.
  - For each `termSlug` in `termSlugs`, resolves the term via `resolveAttributeTerm(catalog, attrSlug, termSlug)` (supporting exact and `-renk` alias matching) and renders a read-only `<span>` badge (`data-testid="quick-view-variant-term-${attrSlug}-${termSlug}"`) displaying `term.name || termSlug` and, when `term.swatch` is a non-empty string, a swatch indicator element with `style={{ backgroundColor: term.swatch }}`.
- `QuickViewModal` must render a link to the full product detail page:
  - Renders `<Link to={`/urun/${product.slug}`} data-testid="quick-view-product-link">Ürün Detayına Git</Link>`.
  - Clicking `data-testid="quick-view-product-link"` invokes `onClose?.()` and navigates to `/urun/${product.slug}`.
- `QuickViewModal` must support dismissal and keyboard focus trapping while open:
  - Clicking `data-testid="quick-view-close"`, clicking `data-testid="quick-view-backdrop"`, or pressing the `Escape` key invokes `onClose?.()`.
  - When `QuickViewModal` opens (`isOpen === true` and `product` is truthy), keyboard focus moves inside the modal by focusing `data-testid="quick-view-close"`.
  - Pressing `Tab` while focus is on the last focusable element inside `data-testid="quick-view-modal"` prevents default (`event.preventDefault()`) and wraps focus to the first focusable element inside `data-testid="quick-view-modal"`.
  - Pressing `Shift+Tab` while focus is on the first focusable element inside `data-testid="quick-view-modal"` prevents default (`event.preventDefault()`) and wraps focus to the last focusable element inside `data-testid="quick-view-modal"`.

## Edge cases and error handling

- When `ProductCard` or `QuickViewModal` is rendered outside a `<QueryClientProvider>` (for example in unit tests that only wrap `ProductCard` in `<MemoryRouter>`), it must not throw an error when looking up catalog metadata: `ProductCard` and `QuickViewModal` must accept an optional `catalog` prop and safely guard any `useQueryClient()` / `queryClient.getQueryData(["catalog"])` lookup with a `try / catch` fallback to `null`.
- When `isOpen` is `false` or `product` is `null` / `undefined`, `QuickViewModal` must render nothing (`data-testid="quick-view-modal"` is not in the DOM), and pressing `Escape` or `Tab` must be a safe no-op without throwing or calling `onClose`.
- When `product.images` has 0 or 1 image, `QuickViewModal` must not render any `data-testid="quick-view-thumb-*"` buttons.
- When `product.highlights` is empty (`[]`) or missing, `data-testid="quick-view-highlights"` must not be rendered.
- When `product.attributes` is empty (`{}`) or missing, `data-testid="quick-view-variants"` must not be rendered.
- When `product` changes to a different product or `QuickViewModal` reopens, `activeIndex` must reset to `0` so `data-testid="quick-view-main-image"` displays the first image of the active product.
- `ProductCard` and `QuickViewModal` must never render any omitted e-commerce or interactive elements: no `"Sepete Ekle"`, `"Satın Al"`, `"Şimdi satın al"`, `"Karşılaştır"`, `"İstek listesine ekle"`, `"Favoriler"`, or `"taksit"`.

## Out of scope

- Interactive variant selection or dynamic price switching inside the quick view modal (variant options in `QuickViewModal` are read-only badges; interactive variant selection lives on `ProductDetailPage`).
- Header live search dropdown and `/arama` search results page (covered in the next Phase 8 spec).
- Homepage showcase sections (Phase 9).

## Context / notes

- All source and test files are plain JavaScript (`.js`) using `@/` path alias imports.
- Reuse `resolveAttributeTerm` from `src/components/catalog/VariantSelector.js` for resolving attribute term names and colour swatches with `-renk` alias matching.
- Reuse `formatProductPriceRange` from `src/utils/format-price.js` and `resolveAssetUrl` / `handleImageError` from `src/utils/image-url.js`.
- Existing unit and component tests in `src/pages/product-listing-page.test.js` and `src/pages/product-detail-page.test.js` must continue to pass without modification.

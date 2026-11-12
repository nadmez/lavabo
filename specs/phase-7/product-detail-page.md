# Phase 7: Product Detail Page, Image Gallery with Lightbox, Variant Selector, Tabs, and Similar Products

## Summary

Replaces `ProductDetailPlaceholder` on `/urun/:slug` with the full Turkish read-only `ProductDetailPage`, including category ancestor `Breadcrumbs`, previous/next product navigation, an interactive `ProductGallery` (thumbnails, hover zoom, and full-screen lightbox), a `VariantSelector` with cross-attribute compatibility and dynamic price/SKU/stock/image updates, highlights, `"Açıklama"` and `"Ek bilgi"` tabs, and a `"Benzer Ürünler"` section.

## Scope

Covers `src/pages/ProductDetailPage.js`, `src/components/catalog/ProductGallery.js`, `src/components/catalog/VariantSelector.js`, updates to `src/components/catalog/Breadcrumbs.js` and `src/App.js`, and unit/component tests in `src/**/*.test.js`.

## Acceptance criteria

- `ProductDetailPage` (`src/pages/ProductDetailPage.js`) must be wired into `src/App.js` on `/urun/:slug` and preserve Phase 4 route test compatibility:
  - Must always render its outer wrapper with `data-testid="product-detail-placeholder"` across all states (loading, error, not-found, and loaded).
  - Must always include the URL `:slug` parameter string in the rendered text content of `data-testid="product-detail-placeholder"` (for example via a `<span className="sr-only">{slug}</span>` when loading, errored, or not found) so synchronous route assertions on `/urun/:slug` pass even before `useCatalog()` resolves.
  - While `useCatalog()` is pending without data, renders `"Yükleniyor..."` inside `data-testid="product-detail-placeholder"`.
  - When `useCatalog()` fails (`isError === true`), renders an error message with `role="alert"` inside `data-testid="product-detail-placeholder"`.
- `Breadcrumbs` (`src/components/catalog/Breadcrumbs.js`) must support product detail breadcrumbs in addition to category listing breadcrumbs:
  - Renders `<nav aria-label="Sayfa yolu" data-testid="catalog-breadcrumbs">`.
  - When rendered for a `product` on `ProductDetailPage`, selects the product's primary category from `product.categoryIds` by picking the first category ID that exists in `catalog.categoriesById` whose slug is in `FLAT_MAIN_CATEGORIES` (from `src/data/navigation.js`), or falling back to the first category ID in `product.categoryIds` that exists in `catalog.categoriesById`.
  - Walks up the primary category's `parentId` chain via `catalog.categoriesById` (guarded against cycles with a visited-ID `Set`) and renders `"Anasayfa"` (`to="/"`), followed by each ancestor category and the primary category itself in root-to-leaf order as links to `"/kategori/${cat.slug}"`, and finally the product's `name` with `aria-current="page"`.
  - Preserves existing behavior when rendered with `categorySlug` and `fallbackLabel` on `ProductListingPage`.
- `ProductDetailPage` must render back / previous / next product navigation (`data-testid="product-prev-next-nav"`):
  - Renders an `"Ürünlere geri dön"` link (`data-testid="back-to-products-link"`) pointing to `"/urunlerimiz"`.
  - Locates the current product's index `index` in `catalog.products`:
    - When `index > 0` (`prevProduct = catalog.products[index - 1]`), renders a link (`data-testid="prev-product-link"`, `to="/urun/${prevProduct.slug}"`) containing `"Önceki Ürün"` and `prevProduct.name`.
    - When `index >= 0 && index < catalog.products.length - 1` (`nextProduct = catalog.products[index + 1]`), renders a link (`data-testid="next-product-link"`, `to="/urun/${nextProduct.slug}"`) containing `"Sonraki Ürün"` and `nextProduct.name`.
- `ProductGallery` (`src/components/catalog/ProductGallery.js`) must render the product image stage, thumbnail strip, hover zoom, and full-screen lightbox:
  - Renders the main image stage (`data-testid="gallery-main-stage"`) containing `<img data-testid="gallery-main-image" src={resolveAssetUrl(activeImage)} alt={product.name} onError={handleImageError} />`.
  - Supports zoom on hover over `data-testid="gallery-main-stage"`: `data-testid="gallery-main-image"` has `data-zoomed="false"` by default, switches to `data-zoomed="true"` on `mouseEnter` / `mouseMove` (updating transform origin from cursor coordinates), and resets to `data-zoomed="false"` on `mouseLeave`.
  - Renders a thumbnail button (`type="button"`, `data-testid="gallery-thumb-${index}"`, `aria-label="${product.name} görsel ${index + 1}"`, `aria-pressed={index === activeIndex}`) for each image in `images`. Clicking a thumbnail button sets that image as the displayed `activeImage`.
  - Renders a `"Büyütmek için tıklayın"` trigger button (`type="button"`, `data-testid="gallery-lightbox-open"`).
  - Clicking `data-testid="gallery-lightbox-open"` or clicking `data-testid="gallery-main-image"` opens a full-screen lightbox dialog (`role="dialog"`, `aria-modal="true"`, `aria-label="Ürün görseli tam ekran"`, `data-testid="gallery-lightbox"`).
  - Inside `data-testid="gallery-lightbox"`, renders:
    - A backdrop element (`data-testid="lightbox-backdrop"`).
    - The active full-screen image (`<img data-testid="lightbox-image" src={resolveAssetUrl(activeImage)} alt={product.name} onError={handleImageError} />`).
    - A close button (`type="button"`, `data-testid="lightbox-close"`, `aria-label="Tam ekranı kapat"`).
    - When `images.length > 1`, previous and next image buttons (`type="button"`, `data-testid="lightbox-prev"`, `data-testid="lightbox-next"`) that cycle the active image backward and forward (wrapping around at the ends).
  - Clicking `data-testid="lightbox-close"`, clicking `data-testid="lightbox-backdrop"`, or pressing the `Escape` key closes the lightbox (`data-testid="gallery-lightbox"` is removed from the DOM).
- `VariantSelector` (`src/components/catalog/VariantSelector.js`) must render variation attribute groups, enforce cross-attribute option availability, and support selection/deselection and clearing:
  - When `product.variants.length > 0` and `product.attributes` has at least one attribute entry, renders each attribute group (`data-testid="variant-attribute-group-${attrSlug}"`) with the attribute's Turkish `name` from `catalog.attributesBySlug` (falling back to `attrSlug`).
  - For each `termSlug` in `product.attributes[attrSlug]`:
    - Resolves `term` from `catalog.attributesBySlug.get(attrSlug)?.termsBySlug` using exact slug or bidirectional `-renk` suffix alias matching (falling back to `{ slug: termSlug, name: termSlug }`).
    - Determines `isAvailable`: `true` if at least one variant in `product.variants` matches `termSlug` on `attrSlug` (via exact or `-renk` alias match) AND matches all currently selected terms in `selectedTerms` for every other attribute (`otherAttrSlug !== attrSlug`); otherwise `false`.
    - Renders an option button (`type="button"`, `data-testid="variant-option-${attrSlug}-${termSlug}"`, `aria-pressed={selectedTerms[attrSlug] === termSlug}`, `disabled={!isAvailable}`) displaying `term.name` (and a colour swatch indicator with `style={{ backgroundColor: term.swatch }}` when `term.swatch` is a non-empty string).
    - Clicking an enabled option button selects `termSlug` for `attrSlug`, or deselects `attrSlug` (removing it from `selectedTerms`) when clicking an already-selected option.
  - When at least one attribute term is selected (`Object.keys(selectedTerms).length > 0`), renders a `"Temizle"` button (`type="button"`, `data-testid="variant-clear-button"`) that resets `selectedTerms` to `{}`.
- `ProductDetailPage` must dynamically update price, SKU, stock badge, and gallery image in response to `selectedTerms`:
  - Renders the product title (`<h1>{product.name}</h1>`), price (`data-testid="product-detail-price"`), SKU (`data-testid="product-detail-sku"`), and stock badge (`data-testid="product-detail-stock"`).
  - Filters `product.variants` to `matchingVariants` (variants matching every currently selected `[attrSlug, termSlug]` in `selectedTerms` via exact or `-renk` alias matching).
  - When all attribute keys in `product.attributes` have a selected term in `selectedTerms` and a single matching variant `matchedVariant` is resolved (`matchingVariants.length === 1`, or the first matching variant when all attributes are selected):
    - `data-testid="product-detail-price"` displays `formatTryCurrency(matchedVariant.price)`.
    - `data-testid="product-detail-sku"` displays `matchedVariant.sku || product.sku`.
    - `data-testid="product-detail-stock"` displays `"Stokta"` when `matchedVariant.inStock === true` and `"Stokta Yok"` when `matchedVariant.inStock === false`.
    - When `matchedVariant.image` is a non-empty string, `ProductGallery` updates its displayed main image to `matchedVariant.image`.
  - When no terms are selected or only a subset of attributes is selected:
    - Computes `minPrice` and `maxPrice` across `matchingVariants` (or uses `product.priceMin` and `product.priceMax` when no terms are selected or `matchingVariants` is empty) and displays `formatProductPriceRange(minPrice, maxPrice)` in `data-testid="product-detail-price"`.
    - Displays `product.sku` in `data-testid="product-detail-sku"`.
    - Displays `"Stokta"` when `product.inStock === true` and `"Stokta Yok"` when `product.inStock === false` in `data-testid="product-detail-stock"`.
- `ProductDetailPage` must render product highlights:
  - When `Array.isArray(product.highlights) && product.highlights.length > 0`, renders `<ul data-testid="product-highlights">` with an `<li>` for each highlight string.
- `ProductDetailPage` must render `"Açıklama"` and `"Ek bilgi"` tabs:
  - Renders `<div role="tablist" aria-label="Ürün detay sekmeleri" data-testid="product-detail-tabs">` containing:
    - `"Açıklama"` tab button (`type="button"`, `role="tab"`, `data-testid="tab-btn-description"`, `aria-selected={activeTab === "description"}`).
    - `"Ek bilgi"` tab button (`type="button"`, `role="tab"`, `data-testid="tab-btn-specs"`, `aria-selected={activeTab === "specs"}`).
  - Defaults `activeTab` to `"description"`, rendering `<div role="tabpanel" data-testid="tab-panel-description">` containing the product's `descriptionHtml` with any `[embed]...[/embed]` shortcodes stripped.
  - Clicking `data-testid="tab-btn-specs"` switches `activeTab` to `"specs"`, rendering `<div role="tabpanel" data-testid="tab-panel-specs">` with `<table data-testid="product-specs-table">` containing:
    - A table row (`<tr><th>{key}</th><td>{value}</td></tr>`) for each `[key, value]` entry in `product.specs` (such as `Marka`, `Barkod`, `Malzeme`).
    - A table row for each `[attrSlug, termSlugs]` entry in `product.attributes`, using the attribute's Turkish `name` from `catalog.attributesBySlug` as header and the human-readable term names joined by `", "` as cell text.
- `ProductDetailPage` must render a `"Benzer Ürünler"` section:
  - Selects up to 4 products from `catalog.products` excluding the current product (`p.id !== product.id`) that share at least one category ID with `product.categoryIds`, sorted by number of shared category IDs descending and then `p.id` ascending.
  - When at least 1 similar product exists, renders `<section data-testid="similar-products-section" aria-label="Benzer ürünler">` with a `"Benzer Ürünler"` heading and a `<ul className="...">` containing `<ProductCard>` items.

## Edge cases and error handling

- When `catalog` is loaded and `catalog.productsBySlug.get(slug)` is `undefined`, `ProductDetailPage` must render `<div data-testid="product-not-found">` inside `data-testid="product-detail-placeholder"` displaying `"Ürün Bulunamadı"` and a `"Tüm Ürünlere Dön"` link pointing to `"/urunlerimiz"` (while still keeping `slug` in the text content of `data-testid="product-detail-placeholder"`).
- When the current product is the first product in `catalog.products` (`index === 0`), `data-testid="prev-product-link"` must not be rendered; when the current product is the last product (`index === catalog.products.length - 1`), `data-testid="next-product-link"` must not be rendered.
- When navigating from one `/urun/:slug` route to another `/urun/:otherSlug`, `ProductDetailPage` must reset `selectedTerms`, `activeTab` (back to `"description"`), and the gallery's active image/lightbox state for the new product.
- When a product has `variants: []` or empty `product.attributes` (`{}`), `VariantSelector` must render nothing and `ProductDetailPage` must display `formatProductPriceRange(product.priceMin, product.priceMax)`, `product.sku`, and `product.inStock`.
- When `product.highlights` is empty (`[]`) or missing, `data-testid="product-highlights"` must not be rendered.
- When `product.images` has only 1 image, `data-testid="lightbox-prev"` and `data-testid="lightbox-next"` must not be rendered inside the open lightbox.
- When the lightbox is closed (`isOpen === false`), pressing `Escape` must be a safe no-op.
- `ProductDetailPage`, `ProductGallery`, and `VariantSelector` must never render any omitted e-commerce or interactive elements: no `"Sepete Ekle"`, `"Şimdi satın al"`, `"Satın Al"`, quantity selector (`+` / `-` adet), `"Bekleme listesi"`, WhatsApp CTA, `"Karşılaştır"`, `"İstek listesi"`, `"Favoriler"`, or `"Taksit Seçenekleri"` tab.

## Out of scope

- Quick view modal on product cards (covered in a separate phase/task).
- Live header search dropdown and `/arama` search results page (Phase 8).
- Homepage showcase sections (Phase 9).

## Context / notes

- All source and test files are plain JavaScript (`.js`) using `@/` path alias imports.
- Catalog data is accessed via `useCatalog()` from `src/hooks/use-products.js`.
- Price formatting uses `formatTryCurrency` and `formatProductPriceRange` from `src/utils/format-price.js`.
- Image URL resolution and fallback handling use `resolveAssetUrl` and `handleImageError` from `src/utils/image-url.js`.
- Category navigation priorities use `MAIN_NAV_CATEGORIES` / `FLAT_MAIN_CATEGORIES` from `src/data/navigation.js`.
- Existing unit and component test suites (`pnpm test`), including `src/components/layout/layout-and-routes.test.js`, must continue to pass without modification.

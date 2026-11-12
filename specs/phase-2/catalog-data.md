# Phase 2: Catalogue Builder and Static JSON

## Summary

Provides a pure catalogue builder/transformer and CLI generator (`scripts/build-catalog.js`) that transforms Parbek WooCommerce Store API responses and local product asset directories into `public/data/catalog.json`, and ensures full schema, referential, and local image integrity across the generated catalogue.

## Scope

Covers the pure transformation logic and generator script (`scripts/build-catalog.js`) and the generated static data file (`public/data/catalog.json`) verified against the local image files in `public/assets/<product-slug>/`.

## Acceptance criteria

- The generated `Catalog` object must have fields `{ version, categories, attributes, products }`.
- Each `Category` object must have fields `{ id, slug, name, parentId, count, descriptionHtml, image? }`.
- Each `Attribute` object must have fields `{ slug, name, terms }` where each `AttributeTerm` has `{ slug, name, swatch? }`.
- Each `Product` object must have fields `{ id, slug, name, sku, inStock, categoryIds, priceMin, priceMax, highlights, descriptionHtml, specs, images, attributes, variants, createdAt }`.
- Each `Variant` object must have fields `{ id, sku, price, regularPrice?, inStock, terms, image? }`.
- The builder must map WooCommerce root categories (`parent: 0`) to `parentId: null` and non-root categories to their numeric `parentId`.
- The builder must normalize variation-defining attribute display names by stripping any leading `"► "` prefix (for example, `"► Çerçeve Rengi"` becomes `"Çerçeve Rengi"`).
- The builder must normalize attribute slugs by stripping any `pa_` taxonomy prefix or deriving a kebab-case slug from the normalized attribute name.
- The builder must populate `AttributeTerm.swatch` with a hex colour code on recognized colour terms (such as `#18181b` for siyah, `#ffffff` for beyaz, `#4b5563` for antrasit gri, and `#d4af37` for gold).
- The builder must store non-variation product attributes (`has_variations: false`, such as `Marka`, `Barkod`, `Malzeme`) as plain key-value pairs in `product.specs`.
- The builder must store variation-defining product attributes (`has_variations: true`) in `product.attributes` (mapping each attribute slug to its array of term slugs) and aggregate them into top-level `catalog.attributes`.
- The builder must extract `product.highlights` as an array of plain-text strings from `short_description` lines with all HTML tags stripped, HTML entities decoded, and empty lines removed.
- The builder must compute numeric TRY values for `product.priceMin` and `product.priceMax` from the product's price range or variant prices such that `priceMin <= priceMax` and `priceMin > 0` for priced products.
- The builder must resolve `product.images` from files present on disk in `public/assets/<product-slug>/` as relative paths under `public/assets/` (for example, `"pablo-kare-plafonyer-led-avize/main.webp"`).
- Each product's `images` array must order `main.*` first, followed by lexicographically sorted `gallery-*` files, followed by any `variant-*` files.
- `public/data/catalog.json` must exist, parse as valid JSON, and contain a non-empty `version` string, a non-empty `categories` array, a non-empty `attributes` array, and all local products with assets in `public/assets/`.
- Every product in `public/data/catalog.json` must have a non-empty `images` array where every entry resolves to an existing file on disk under `public/assets/<image-path>`.
- Every `categoryId` in every product's `categoryIds` array in `public/data/catalog.json` must reference an existing `Category.id` in `catalog.categories`.
- Every non-null `parentId` in `catalog.categories` must reference an existing `Category.id` in `catalog.categories`.
- Every attribute slug and term slug referenced in `product.attributes` must exist in top-level `catalog.attributes`.
- Every attribute slug and term slug referenced in any `variant.terms` must exist in both the parent `product.attributes` and top-level `catalog.attributes`.

## Edge cases and error handling

- When `short_description` is empty or contains only whitespace and HTML tags, the builder must return `[]` for `product.highlights`.
- When a product has no variations (`variants: []`), the builder must set both `priceMin` and `priceMax` to the product's numeric price and set `product.attributes` to `{}`.
- When a variation in the API lists a term slug that was not initially listed on its parent product's attribute definition, the builder must register that term in both `product.attributes[attrSlug]` and top-level `catalog.attributes` so referential integrity holds.
- When a product references a category ID that is not present in `catalog.categories`, the builder must either include that category or strip the unknown ID so `product.categoryIds` never contains dangling category references.
- When a product directory in `public/assets/<product-slug>/` is missing or a referenced image file does not exist on disk, the builder must exclude nonexistent image paths and omit products that have zero existing local images in `public/assets/`.
- Every product `slug` in `catalog.products` and every category `slug` in `catalog.categories` must be unique across the catalogue.

## Out of scope

- React Query hooks (`useCatalog`), in-memory index hashmaps (`productsBySlug`, `categoriesBySlug`, descendant category sets), and catalogue filtering/sorting/pagination logic (covered in Phase 3).
- UI components, routes, and page rendering.
- Shopping cart, checkout, or write mutations against the catalogue.

## Context / notes

- WooCommerce Store API source endpoints used by `scripts/build-catalog.js`:
  - `https://parbek.com.tr/wp-json/wc/store/v1/products/categories?per_page=100`
  - `https://parbek.com.tr/wp-json/wc/store/v1/products?per_page=100&page=1..2`
  - `https://parbek.com.tr/wp-json/wc/store/v1/products?type=variation&per_page=100&page=1..19`
- Local product image directories already exist under `public/assets/<product-slug>/` (101 product folders containing `main.<ext>`, `gallery-NN.<ext>`, and optional `variant-*.<ext>` files).
- Unit tests run with Vitest (`pnpm test`) and must be placed under `src/**/*.test.js` as configured in `vite.config.mjs`.

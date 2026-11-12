# Phase 3a: In-Memory Catalogue Index and Query Engine

## Summary

Provides pure JavaScript functions (`indexCatalog` and `queryProducts` in `src/data/catalog-query.js`) that index the static catalogue JSON into in-memory `Map` and `Set` structures and derive filtered, Turkish-searched, sorted, paginated product views and disjunctive facet counts.

## Scope

Covers `src/data/catalog-query.js` (and unit tests in `src/data/catalog-query.test.js`), including hashmap indexing (`productsBySlug`, `productsById`, `categoriesBySlug`, `categoriesById`, `childrenByCategoryId`, `descendantCategoryIdsBySlug`, `attributesBySlug`), multi-attribute filtering, recursive category filtering, Turkish-insensitive search, sorting, pagination, and facet calculation. Split from Phase 3 (Data layer) so the pure query engine is verified independently of React Query and React Router hooks.

## Acceptance criteria

- `indexCatalog(rawCatalog)` must return an object preserving `{ version, categories, attributes, products }` from `rawCatalog` along with `productsBySlug`, `productsById`, `categoriesBySlug`, `categoriesById`, `childrenByCategoryId`, `descendantCategoryIdsBySlug`, and `attributesBySlug`.
- `indexCatalog(rawCatalog)` must populate `productsBySlug` as a `Map` mapping every `product.slug` to its `Product` object and `productsById` as a `Map` mapping every numeric `product.id` to its `Product` object.
- `indexCatalog(rawCatalog)` must populate `categoriesBySlug` as a `Map` mapping every `category.slug` to its `Category` object and `categoriesById` as a `Map` mapping every numeric `category.id` to its `Category` object.
- `indexCatalog(rawCatalog)` must populate `childrenByCategoryId` as a `Map` mapping each parent category ID (and `null` for root categories with `parentId: null`) to an array of its direct child `Category` objects.
- `indexCatalog(rawCatalog)` must populate `descendantCategoryIdsBySlug` as a `Map` mapping every category `slug` to a `Set` of numeric category IDs containing that category's own `id` and the `id`s of all its recursive descendants (children, grandchildren, and deeper levels).
- `indexCatalog(rawCatalog)` must populate `attributesBySlug` as a `Map` mapping every `attribute.slug` to an attribute object that includes `termsBySlug` (`Map` mapping each `term.slug` to its `AttributeTerm` object).
- `queryProducts(catalog, params)` must accept either an already-indexed catalogue (returned by `indexCatalog`) or a raw `Catalog` object (auto-indexing it when `productsBySlug` is not present).
- When `params.categorySlug` is provided, `queryProducts` must filter products to those whose `categoryIds` array contains at least one category ID in `descendantCategoryIdsBySlug.get(params.categorySlug)`.
- When `params.attributes` contains multiple term slugs for the same attribute slug (for example, `{ "avize-rengi": ["siyah-renk", "beyaz-renk"] }`), `queryProducts` must match products using OR logic within that attribute (the product has at least one of the selected terms in `product.attributes[attrSlug]`).
- When matching attribute term slugs in `queryProducts`, a filter term slug and a product term slug must match if they are strictly equal or if stripping a trailing `"-renk"` suffix from both slugs makes them equal (so `"siyah"` matches `"siyah-renk"` and `"siyah-renk"` matches `"siyah"` or `"siyah-renk"`).
- When `params.attributes` contains non-empty selections across multiple distinct attribute slugs, `queryProducts` must combine those attributes using AND logic (a product must match every active attribute filter).
- When `params.inStockOnly` is `true`, `queryProducts` must include only products with `product.inStock === true`.
- When `params.search` is a non-empty string after trimming, `queryProducts` must match products whose `name` or `sku` contains the trimmed query using Turkish case- and diacritic-insensitive matching (folding `İ`, `I`, `ı`, `i` to `i`, `Ş`/`ş` to `s`, `Ğ`/`ğ` to `g`, `Ü`/`ü` to `u`, `Ö`/`ö` to `o`, and `Ç`/`ç` to `c`).
- When `params.sort` is omitted, `"newest"`, or `"en-yeni"`, `queryProducts` must sort matching products by `createdAt` descending, breaking ties by `id` descending.
- When `params.sort` is `"price-asc"` or `"fiyat-artan"`, `queryProducts` must sort matching products by `priceMin` ascending, breaking ties by `id` ascending.
- When `params.sort` is `"price-desc"` or `"fiyat-azalan"`, `queryProducts` must sort matching products by `priceMin` descending, breaking ties by `priceMax` descending and then `id` descending.
- `queryProducts` must paginate the sorted matching products using 1-indexed `page` (default `1`) and `perPage` (default `12`, allowed values `9`, `12`, `18`, `24`), returning `{ items, total, page, perPage, totalPages, facets }` where `total` is the pre-pagination match count and `totalPages` is `Math.max(1, Math.ceil(total / perPage))`.
- `queryProducts` must return `facets.categories` as a plain object mapping every category `slug` in `catalog.categories` to the number of products in that category (including its descendants) that match all active non-category filters (`attributes`, `inStockOnly`, and `search`).
- `queryProducts` must return `facets.attributes` as a plain object mapping every `attrSlug` in `catalog.attributes` to an object of `{ [termSlug]: count }` for all terms of that attribute, computed disjunctively against products matching active `categorySlug`, `inStockOnly`, `search`, and all other active attributes (`otherAttrSlug !== attrSlug`).
- `queryProducts` must return `facets.availableAttributes` as an array of `Attribute` objects (preserving `catalog.attributes` order) whose terms appear on at least one product matching the active `categorySlug` and `search` scope (or that currently have a non-empty selection in `params.attributes`).
- `queryProducts` must return `facets.inStockCount` as the count of products with `inStock === true` that match the active `categorySlug`, `attributes`, and `search` filters (ignoring `inStockOnly`).

## Edge cases and error handling

- When `indexCatalog` is called with an already-indexed catalogue object, it must return a valid indexed catalogue without duplicating entries or throwing.
- When `indexCatalog` is called with `null`, `undefined`, or an object missing `categories`, `attributes`, or `products`, it must default missing collections to empty arrays and return empty `Map` instances without throwing.
- When `categories` contains a circular `parentId` reference (cycle), `indexCatalog` must guard its descendant traversal with a visited set so `descendantCategoryIdsBySlug` terminates without an infinite loop.
- When `params` is omitted in `queryProducts(catalog)`, it must default to `{}` and return the first page (`page: 1`, `perPage: 12`) sorted by `"newest"`.
- When `params.categorySlug` is an unknown slug not present in `categoriesBySlug`, `queryProducts` must return `items: []`, `total: 0`, and `totalPages: 1`.
- When `params.attributes` contains an empty array (such as `{ "avize-rengi": [] }`), `null`, or whitespace-only term strings, `queryProducts` must ignore that attribute entry as if no filter were set for it.
- When `params.attributes` references an unknown attribute slug that no product has, `queryProducts` must match 0 products (`items: []`, `total: 0`).
- When `params.page` is `0`, negative, `NaN`, or non-numeric, `queryProducts` must clamp `page` to `1`.
- When `params.page` exceeds `totalPages` (for example, `page: 5` when `totalPages` is `2`), `queryProducts` must preserve the requested positive integer `page` ( `5`), return `items: []`, and still return the full `total`, `totalPages`, and `facets`.
- When `params.perPage` is not one of `9`, `12`, `18`, or `24` (such as `0`, `-5`, `15`, `100`, or `NaN`), `queryProducts` must fall back to `perPage: 12`.
- When `params.sort` is an unrecognized string, `queryProducts` must fall back to the default `"newest"` (`"en-yeni"`) sort order.

## Out of scope

- Fetching `public/data/catalog.json` over HTTP or integrating with TanStack React Query (`src/hooks/use-products.js` is covered in `specs/phase-3/react-query-url-and-preview.md`).
- Reading or writing URL search parameters (`src/hooks/use-catalog-search-params.js` is covered in `specs/phase-3/react-query-url-and-preview.md`).
- Image asset path resolution and fallback handlers (`src/utils/image-url.js` is covered in `specs/phase-3/react-query-url-and-preview.md`).
- Final styled UI components for category sidebars, filter chips, product cards, or pagination controls (covered in later phases).

## Context / notes

- All source and test files use plain JavaScript (`.js`), not TypeScript.
- The static dataset generated in Phase 2 lives at `public/data/catalog.json` and contains 101 products, 59 categories (root category `"aydinlatma"` with `id: 316` and nested subcategories such as `"avize"` `id: 317` and `"led-avize"` `id: 185`), and 8 variation attributes (`"lineer-urun-boyutu"`, `"lineer-kasa-rengi"`, `"lineer-aydinlatma-rengi"`, `"lineer-kasa-yuksekligi"`, `"urun-boyutu"`, `"avize-rengi"`, `"aydinlatma-rengi"`, `"sarkit-avize-rengi"`).
- Unit tests run via Vitest (`pnpm test`) in `src/data/catalog-query.test.js` and can test against both small deterministic fixtures and the real `public/data/catalog.json` data.

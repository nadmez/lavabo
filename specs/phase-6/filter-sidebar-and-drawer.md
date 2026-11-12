# Phase 6: Filter Sidebar, Swatches, Checkboxes, Active Filter Chips, and Mobile Filter Drawer

## Summary

Adds faceted product filtering to the Turkish catalogue listing view (`ProductListingPage`), including a desktop sticky `FilterSidebar` (hierarchical category tree with dynamic counts, "Sadece stoktakiler" checkbox, colour swatch buttons, and attribute checkboxes), removable `ActiveFilterChips` with a "Filtreleri temizle" action, and a responsive `MobileFilterDrawer` triggered from `ListingToolbar`, all synchronized with URL search parameters.

## Scope

Covers `src/components/catalog/FilterSidebar.js`, `src/components/catalog/ActiveFilterChips.js`, `src/components/catalog/MobileFilterDrawer.js`, updates to `src/components/catalog/ListingToolbar.js` and `src/pages/ProductListingPage.js`, and unit/component tests in `src/**/*.test.js`.

## Acceptance criteria

- `FilterSidebar` (`src/components/catalog/FilterSidebar.js`) must render a category tree container (`data-testid="filter-category-tree"`):
  - Renders an `"Tüm Ürünler"` link pointing to `"/urunlerimiz"`, marked with `aria-current="page"` when no `categorySlug` is active.
  - Renders the hierarchical category tree from `catalog` starting at root categories (`parentId === null`) and recursively rendering child/descendant categories via `catalog.childrenByCategoryId` (guarded against circular `parentId` references with a visited-ID `Set`).
  - Each category item renders a link (`data-testid="filter-category-link-${cat.slug}"`) pointing to `"/kategori/${cat.slug}"` displaying the category `name` and its product count formatted as `(${facets?.categories?.[cat.slug] ?? cat.count ?? 0})`.
  - Marks the active category link (`cat.slug === categorySlug`) with `aria-current="page"` and omits `aria-current` on inactive category links.
- `FilterSidebar` must render an "In stock only" filter control:
  - Renders a checkbox input (`type="checkbox"`, `data-testid="filter-in-stock-checkbox"`, `checked={Boolean(inStockOnly)}`) inside or associated with a label displaying `"Sadece stoktakiler"` and the count `(${facets?.inStockCount ?? 0})`.
  - Disables the checkbox (`disabled={true}`) when `(facets?.inStockCount ?? 0) === 0` and `!inStockOnly`.
  - Toggling the checkbox calls `onToggleInStock(!inStockOnly)`.
- `FilterSidebar` must render attribute filter groups from `facets?.availableAttributes ?? []`:
  - For each attribute `attr` in `facets?.availableAttributes ?? []`, renders a group container (`data-testid="filter-attribute-group-${attr.slug}"`) with a heading displaying `attr.name` (such as `"Çerçeve Rengi"`, `"Ürün Boyutu"`, `"Aydınlatma Rengi"`).
  - For each `term` in `attr.terms ?? []`:
    - Computes `count = facets?.attributes?.[attr.slug]?.[term.slug] ?? 0`.
    - Computes `isSelected` as `true` when `attributes?.[attr.slug]` contains `term.slug` either by exact slug match or by bidirectional `-renk` suffix alias match (where stripping a trailing `"-renk"` suffix of length > 5 produces the same base slug, e.g. `"siyah"` matches `"siyah-renk"`).
    - Computes `isDisabled = count === 0 && !isSelected` so zero-result options are disabled unless currently selected.
    - When `typeof term.swatch === "string" && term.swatch.length > 0`, renders a colour swatch button (`type="button"`, `data-testid="filter-swatch-${attr.slug}-${term.slug}"`, `aria-pressed={isSelected}`, `disabled={isDisabled}`) containing a colour indicator element (`data-testid="swatch-color-${term.slug}"`, `style={{ backgroundColor: term.swatch }}`), the `term.name`, and `(${count})`. Clicking an enabled swatch button calls `onToggleAttributeTerm(attr.slug, term.slug)`.
    - When `term.swatch` is absent or empty, renders a checkbox input (`type="checkbox"`, `data-testid="filter-checkbox-${attr.slug}-${term.slug}"`, `checked={isSelected}`, `disabled={isDisabled}`) inside a `<label>` displaying `term.name` and `(${count})`. Changing an enabled checkbox calls `onToggleAttributeTerm(attr.slug, term.slug)`.
- `ActiveFilterChips` (`src/components/catalog/ActiveFilterChips.js`) must render active filter pills and a clear-all action:
  - When no filters are active (`!inStockOnly` and `attributes` has no key with a non-empty array of term slugs), renders nothing (`data-testid="active-filter-chips"` must not be in the DOM).
  - When at least one filter is active, renders `<div data-testid="active-filter-chips">` containing:
    - When `inStockOnly` is `true`, a removable chip button (`type="button"`, `data-testid="active-filter-chip-in-stock"`) displaying `"Sadece stoktakiler"` that calls `onRemoveInStock()` when clicked.
    - For each active `[attrSlug, termSlugs]` entry in `attributes` and each `termSlug` in `termSlugs`, a removable chip button (`type="button"`, `data-testid="active-filter-chip-${attrSlug}-${termSlug}"`) displaying the human-readable term `name` looked up from `catalog?.attributesBySlug` (matching exact slug or bidirectional `-renk` alias, and falling back to `termSlug` if not found) that calls `onRemoveAttributeTerm(attrSlug, termSlug)` when clicked.
    - A clear-all button (`type="button"`, `data-testid="clear-all-filters"`) displaying `"Filtreleri temizle"` that calls `onClearAll()` when clicked.
- `MobileFilterDrawer` (`src/components/catalog/MobileFilterDrawer.js`) must provide an accessible slide-over filter dialog:
  - When `isOpen` is `false`, renders nothing (`data-testid="mobile-filter-drawer"` must not be in the DOM).
  - When `isOpen` is `true`, renders a dialog container (`role="dialog"`, `aria-modal="true"`, `aria-label="Filtreler"`, `data-testid="mobile-filter-drawer"`), a backdrop element (`data-testid="mobile-filter-backdrop"`), a close button (`type="button"`, `data-testid="mobile-filter-close"`, `aria-label="Filtreleri kapat"`), and `<FilterSidebar />` with the current filter props and callbacks.
  - Clicking `data-testid="mobile-filter-close"`, clicking `data-testid="mobile-filter-backdrop"`, or pressing the `Escape` key on `document`/`window` while open must invoke `onClose()`.
- `ListingToolbar` (`src/components/catalog/ListingToolbar.js`) must render a mobile filter trigger button:
  - Renders `<button type="button" data-testid="mobile-filter-open" aria-label="Filtreler" aria-expanded={Boolean(isFilterDrawerOpen)}>` displaying `"Filtreler"` that calls `onOpenMobileFilters?.()` when clicked.
- `ProductListingPage` (`src/pages/ProductListingPage.js`) must integrate `FilterSidebar`, `ActiveFilterChips`, `MobileFilterDrawer`, and URL search param synchronization:
  - Renders `<aside data-testid="desktop-filter-sidebar" aria-label="Ürün filtreleri">` with sticky desktop positioning classes (`lg:sticky lg:top-6`) containing `<FilterSidebar />`.
  - Renders `<ActiveFilterChips />` above the product grid (`data-testid="debug-product-list"`).
  - Renders `<MobileFilterDrawer />` controlled by local `isFilterDrawerOpen` state, opened via `ListingToolbar`'s `onOpenMobileFilters` callback and closed via `MobileFilterDrawer`'s `onClose` callback.
  - Toggling or removing an attribute term updates the corresponding attribute key in URL search params (matching and removing any existing exact or `-renk` alias slug when deselecting a term, or appending the term slug when selecting it) and resets `page` to `1` (`sayfa` removed from URL search params).
  - Toggling or removing the in-stock filter updates `stok=1` in URL search params (or removes `stok` when set to `false`) and resets `page` to `1`.
  - Clicking `"Filtreleri temizle"` (`onClearAll`) resets `inStockOnly: false`, `attributes: {}`, and `page: 1` while preserving the active `sort` (`sirala`) and `perPage` (`goster`) parameters.

## Edge cases and error handling

- When `isOpen` is `false` on `MobileFilterDrawer`, pressing `Escape` must be a safe no-op and must not call `onClose`.
- When `catalog.childrenByCategoryId` contains a circular parent-child cycle, `FilterSidebar` must guard traversal with a visited `Set` and terminate without an infinite loop.
- When an attribute term has `count === 0` and is currently selected (`isSelected === true`), its swatch button or checkbox input must remain enabled (`disabled={false}`) so the user can deselect it.
- When URL search params contain a short alias term (e.g. `renk=siyah` parsed into `attributes: { "avize-rengi": ["siyah"] }`) and the catalog term slug is `"siyah-renk"`, `FilterSidebar` must recognize `"siyah-renk"` as selected (`isSelected === true`), and toggling or removing `"siyah-renk"` must remove `"siyah"` from `attributes["avize-rengi"]`.
- When `ActiveFilterChips` renders a chip for an unknown `attrSlug` or `termSlug` not present in `catalog.attributesBySlug`, it must fall back to displaying the raw `termSlug` string without crashing.
- When `facets` or `catalog` is `null` or `undefined` (or `facets.availableAttributes` is empty), `FilterSidebar` must render safely with fallback counts (`0`) and empty lists without throwing.
- None of `FilterSidebar`, `ActiveFilterChips`, `MobileFilterDrawer`, `ListingToolbar`, or `ProductListingPage` may render any omitted e-commerce or comparison terms (`"Sepete Ekle"`, `"Satın Al"`, `"Karşılaştır"`, `"İstek listesine ekle"`, `"Favoriler"`, `"taksit"`).

## Out of scope

- Product detail page gallery, variant selector, and quick view modal (Phase 7).
- Header live search dropdown and `/arama` search page UI (Phase 8).
- Price range slider filtering (not part of the catalogue scope).

## Context / notes

- All source and test files are plain JavaScript (`.js`) using `@/` imports.
- Disjunctive facet counts (`facets.categories`, `facets.attributes`, `facets.availableAttributes`, `facets.inStockCount`) are already computed and returned by `queryProducts` in `src/data/catalog-query.js`.
- URL search parameter parsing and serialization (`stok`, `sirala`, `sayfa`, `goster`, `q`, attribute slugs, and aliases `renk`/`boyut`/`isik`) are handled by `useCatalogSearchParams` in `src/hooks/use-catalog-search-params.js`.
- Existing unit and component test suites (`pnpm test`) must continue to pass.

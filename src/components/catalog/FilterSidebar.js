import { Link } from "react-router";

function stripRenkSuffix(slug) {
  return slug.endsWith("-renk") && slug.length > 5 ? slug.slice(0, -5) : slug;
}

export function termsMatch(slugA, slugB) {
  if (typeof slugA !== "string" || typeof slugB !== "string") return false;
  const a = slugA.trim();
  const b = slugB.trim();
  if (!a || !b) return false;
  return a === b || stripRenkSuffix(a) === stripRenkSuffix(b);
}

function renderCategoryBranch({
  parentId,
  childrenByCategoryId,
  facets,
  categorySlug,
  visited,
  depth = 0,
}) {
  if (!(childrenByCategoryId instanceof Map)) {
    return null;
  }

  const children = childrenByCategoryId.get(parentId) || [];
  const unvisitedChildren = children.filter(
    (cat) => cat && !visited.has(cat.id)
  );

  if (unvisitedChildren.length === 0) {
    return null;
  }

  return (
    <ul className={depth > 0 ? "mt-1 space-y-1 pl-3" : "space-y-1"}>
      {unvisitedChildren.map((cat) => {
        if (visited.has(cat.id)) {
          return null;
        }
        visited.add(cat.id);

        const isActive = Boolean(categorySlug) && cat.slug === categorySlug;
        const count = facets?.categories?.[cat.slug] ?? cat.count ?? 0;

        return (
          <li key={cat.id ?? cat.slug}>
            <Link
              to={`/kategori/${cat.slug}`}
              data-testid={`filter-category-link-${cat.slug}`}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center justify-between rounded px-2 py-1 text-sm transition ${
                isActive
                  ? "bg-stone-900 font-semibold text-white"
                  : "text-stone-700 hover:bg-stone-100"
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-xs ${
                  isActive ? "text-stone-200" : "text-stone-500"
                }`}
              >
                ({count})
              </span>
            </Link>
            {renderCategoryBranch({
              parentId: cat.id,
              childrenByCategoryId,
              facets,
              categorySlug,
              visited,
              depth: depth + 1,
            })}
          </li>
        );
      })}
    </ul>
  );
}

export default function FilterSidebar({
  catalog,
  facets,
  categorySlug = "",
  inStockOnly = false,
  attributes = {},
  onToggleInStock,
  onToggleAttributeTerm,
}) {
  const visitedCategories = new Set();
  const isAllProductsActive = !categorySlug;
  const inStockCount = facets?.inStockCount ?? 0;
  const isInStockDisabled = inStockCount === 0 && !inStockOnly;
  const availableAttributes = Array.isArray(facets?.availableAttributes)
    ? facets.availableAttributes
    : [];

  return (
    <div className="space-y-6 rounded-lg border border-stone-200 bg-white p-4">
      <div data-testid="filter-category-tree">
        <h2 className="mb-2 text-xs font-semibold tracking-wider text-stone-500 uppercase">
          Kategoriler
        </h2>
        <div className="mb-1">
          <Link
            to="/urunlerimiz"
            aria-current={isAllProductsActive ? "page" : undefined}
            className={`flex items-center justify-between rounded px-2 py-1 text-sm transition ${
              isAllProductsActive
                ? "bg-stone-900 font-semibold text-white"
                : "text-stone-700 hover:bg-stone-100"
            }`}
          >
            <span>Tüm Ürünler</span>
          </Link>
        </div>
        {renderCategoryBranch({
          parentId: null,
          childrenByCategoryId: catalog?.childrenByCategoryId,
          facets,
          categorySlug,
          visited: visitedCategories,
          depth: 0,
        })}
      </div>

      <div className="border-t border-stone-200 pt-4">
        <label
          className={`flex items-center justify-between gap-2 text-sm ${
            isInStockDisabled
              ? "cursor-not-allowed text-stone-400"
              : "cursor-pointer text-stone-800"
          }`}
        >
          <span className="flex items-center gap-2">
            <input
              type="checkbox"
              data-testid="filter-in-stock-checkbox"
              checked={Boolean(inStockOnly)}
              disabled={isInStockDisabled}
              onChange={() => onToggleInStock?.(!inStockOnly)}
              className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
            />
            <span>Sadece stoktakiler</span>
          </span>
          <span className="text-xs text-stone-500">({inStockCount})</span>
        </label>
      </div>

      {availableAttributes.map((attr) => {
        if (!attr?.slug) return null;
        const terms = Array.isArray(attr.terms) ? attr.terms : [];
        const selectedTerms = Array.isArray(attributes?.[attr.slug])
          ? attributes[attr.slug]
          : [];

        return (
          <div
            key={attr.slug}
            data-testid={`filter-attribute-group-${attr.slug}`}
            className="border-t border-stone-200 pt-4"
          >
            <h3 className="mb-2 text-xs font-semibold tracking-wider text-stone-500 uppercase">
              {attr.name}
            </h3>
            <div className="space-y-1.5">
              {terms.map((term) => {
                if (!term?.slug) return null;
                const count = facets?.attributes?.[attr.slug]?.[term.slug] ?? 0;
                const isSelected = selectedTerms.some((sel) =>
                  termsMatch(sel, term.slug)
                );
                const isDisabled = count === 0 && !isSelected;
                const hasSwatch =
                  typeof term.swatch === "string" && term.swatch.length > 0;

                if (hasSwatch) {
                  return (
                    <button
                      key={term.slug}
                      type="button"
                      data-testid={`filter-swatch-${attr.slug}-${term.slug}`}
                      aria-pressed={isSelected}
                      disabled={isDisabled}
                      onClick={() =>
                        onToggleAttributeTerm?.(attr.slug, term.slug)
                      }
                      className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm transition ${
                        isSelected
                          ? "bg-stone-900 font-medium text-white"
                          : isDisabled
                            ? "cursor-not-allowed opacity-45"
                            : "text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          data-testid={`swatch-color-${term.slug}`}
                          style={{ backgroundColor: term.swatch }}
                          className="inline-block h-4 w-4 shrink-0 rounded-full border border-stone-300"
                        />
                        <span>{term.name}</span>
                      </span>
                      <span
                        className={`text-xs ${
                          isSelected ? "text-stone-200" : "text-stone-500"
                        }`}
                      >
                        ({count})
                      </span>
                    </button>
                  );
                }

                return (
                  <label
                    key={term.slug}
                    className={`flex items-center justify-between gap-2 rounded px-1 py-0.5 text-sm ${
                      isDisabled
                        ? "cursor-not-allowed text-stone-400"
                        : "cursor-pointer text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        data-testid={`filter-checkbox-${attr.slug}-${term.slug}`}
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() =>
                          onToggleAttributeTerm?.(attr.slug, term.slug)
                        }
                        className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                      />
                      <span>{term.name}</span>
                    </span>
                    <span className="text-xs text-stone-500">({count})</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

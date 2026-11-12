import { termsMatch } from "@/components/catalog/FilterSidebar";

function resolveTermLabel(catalog, attrSlug, termSlug) {
  if (!(catalog?.attributesBySlug instanceof Map)) {
    return termSlug;
  }

  const attr = catalog.attributesBySlug.get(attrSlug);
  if (!attr) {
    return termSlug;
  }

  if (attr.termsBySlug instanceof Map && attr.termsBySlug.has(termSlug)) {
    return attr.termsBySlug.get(termSlug)?.name || termSlug;
  }

  if (Array.isArray(attr.terms)) {
    const matched = attr.terms.find((term) => termsMatch(term?.slug, termSlug));
    if (matched?.name) {
      return matched.name;
    }
  }

  return termSlug;
}

export default function ActiveFilterChips({
  catalog,
  inStockOnly = false,
  attributes = {},
  onRemoveInStock,
  onRemoveAttributeTerm,
  onClearAll,
}) {
  const activeAttributeChips = [];

  if (attributes && typeof attributes === "object") {
    for (const [attrSlug, termSlugs] of Object.entries(attributes)) {
      if (!Array.isArray(termSlugs)) continue;
      for (const termSlug of termSlugs) {
        if (typeof termSlug === "string" && termSlug.trim().length > 0) {
          activeAttributeChips.push({
            attrSlug,
            termSlug,
            label: resolveTermLabel(catalog, attrSlug, termSlug),
          });
        }
      }
    }
  }

  const hasActiveFilters =
    Boolean(inStockOnly) || activeAttributeChips.length > 0;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div
      data-testid="active-filter-chips"
      className="mb-4 flex flex-wrap items-center gap-2"
    >
      {inStockOnly ? (
        <button
          type="button"
          data-testid="active-filter-chip-in-stock"
          onClick={() => onRemoveInStock?.()}
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-xs font-medium text-stone-800 transition hover:bg-stone-200"
        >
          <span>Sadece stoktakiler</span>
          <span aria-hidden="true">×</span>
        </button>
      ) : null}

      {activeAttributeChips.map(({ attrSlug, termSlug, label }) => (
        <button
          key={`${attrSlug}:${termSlug}`}
          type="button"
          data-testid={`active-filter-chip-${attrSlug}-${termSlug}`}
          onClick={() => onRemoveAttributeTerm?.(attrSlug, termSlug)}
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-xs font-medium text-stone-800 transition hover:bg-stone-200"
        >
          <span>{label}</span>
          <span aria-hidden="true">×</span>
        </button>
      ))}

      <button
        type="button"
        data-testid="clear-all-filters"
        onClick={() => onClearAll?.()}
        className="text-xs font-medium text-stone-600 underline hover:text-stone-900"
      >
        Filtreleri temizle
      </button>
    </div>
  );
}

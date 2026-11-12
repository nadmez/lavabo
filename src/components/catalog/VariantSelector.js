import { termsMatch } from "@/components/catalog/FilterSidebar";

export function resolveAttributeTerm(catalog, attrSlug, termSlug) {
  const attr =
    catalog?.attributesBySlug instanceof Map
      ? catalog.attributesBySlug.get(attrSlug)
      : null;

  if (attr?.termsBySlug instanceof Map) {
    if (attr.termsBySlug.has(termSlug)) {
      return attr.termsBySlug.get(termSlug);
    }
    for (const term of attr.termsBySlug.values()) {
      if (term && termsMatch(term.slug, termSlug)) {
        return term;
      }
    }
  }

  if (Array.isArray(attr?.terms)) {
    const matched = attr.terms.find(
      (term) => term && termsMatch(term.slug, termSlug)
    );
    if (matched) {
      return matched;
    }
  }

  return { slug: termSlug, name: termSlug };
}

export default function VariantSelector({
  product,
  catalog,
  selectedTerms = {},
  onSelectTerm,
  onToggleTerm,
  onChange,
  onSelectedTermsChange,
  setSelectedTerms,
  onClear,
}) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const rawAttributes =
    product?.attributes && typeof product.attributes === "object"
      ? product.attributes
      : {};

  const attributeEntries = Object.entries(rawAttributes).filter(
    ([, termSlugs]) => Array.isArray(termSlugs) && termSlugs.length > 0
  );

  if (variants.length === 0 || attributeEntries.length === 0) {
    return null;
  }

  const safeSelectedTerms =
    selectedTerms && typeof selectedTerms === "object" ? selectedTerms : {};

  const selectCallback =
    onSelectTerm ||
    onToggleTerm ||
    onChange ||
    onSelectedTermsChange ||
    setSelectedTerms;

  function handleOptionClick(attrSlug, termSlug) {
    if (typeof onSelectTerm === "function") {
      onSelectTerm(attrSlug, termSlug);
      return;
    }
    if (typeof onToggleTerm === "function") {
      onToggleTerm(attrSlug, termSlug);
      return;
    }
    if (typeof selectCallback === "function") {
      selectCallback(attrSlug, termSlug);
    }
  }

  function handleClearClick() {
    if (typeof onClear === "function") {
      onClear();
      return;
    }
    if (typeof selectCallback === "function") {
      selectCallback({});
    }
  }

  const hasSelectedTerms = Object.values(safeSelectedTerms).some(
    (val) => typeof val === "string" && val.trim().length > 0
  );

  return (
    <div className="space-y-4">
      {attributeEntries.map(([attrSlug, termSlugs]) => {
        const attrMeta =
          catalog?.attributesBySlug instanceof Map
            ? catalog.attributesBySlug.get(attrSlug)
            : null;
        const attrLabel = attrMeta?.name || attrSlug;
        const currentSelected = safeSelectedTerms[attrSlug];

        return (
          <div
            key={attrSlug}
            data-testid={`variant-attribute-group-${attrSlug}`}
            className="space-y-2"
          >
            <div className="text-sm font-semibold text-stone-800">
              {attrLabel}
            </div>
            <div className="flex flex-wrap gap-2">
              {termSlugs.map((termSlug) => {
                const term = resolveAttributeTerm(catalog, attrSlug, termSlug);
                const isSelected = Boolean(
                  currentSelected && termsMatch(currentSelected, termSlug)
                );

                const isAvailable = variants.some((variant) => {
                  const vTerms = variant?.terms;
                  if (!vTerms || typeof vTerms !== "object") return false;
                  if (!termsMatch(vTerms[attrSlug], termSlug)) return false;

                  for (const [otherAttr, otherSelectedTerm] of Object.entries(
                    safeSelectedTerms
                  )) {
                    if (otherAttr === attrSlug || !otherSelectedTerm) continue;
                    if (!termsMatch(vTerms[otherAttr], otherSelectedTerm)) {
                      return false;
                    }
                  }
                  return true;
                });

                const hasSwatch =
                  typeof term?.swatch === "string" &&
                  term.swatch.trim().length > 0;

                return (
                  <button
                    key={termSlug}
                    type="button"
                    data-testid={`variant-option-${attrSlug}-${termSlug}`}
                    aria-pressed={isSelected}
                    disabled={!isAvailable}
                    onClick={() => handleOptionClick(attrSlug, termSlug)}
                    className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                      isSelected
                        ? "border-stone-900 bg-stone-900 text-white"
                        : isAvailable
                          ? "border-stone-300 bg-white text-stone-800 hover:border-stone-500"
                          : "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 opacity-50"
                    }`}
                  >
                    {hasSwatch ? (
                      <span
                        style={{ backgroundColor: term.swatch }}
                        className="inline-block h-4 w-4 shrink-0 rounded-full border border-stone-300"
                      />
                    ) : null}
                    <span>{term?.name || termSlug}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {hasSelectedTerms ? (
        <div>
          <button
            type="button"
            data-testid="variant-clear-button"
            onClick={handleClearClick}
            className="text-xs font-medium text-stone-600 underline hover:text-stone-900"
          >
            Temizle
          </button>
        </div>
      ) : null}
    </div>
  );
}

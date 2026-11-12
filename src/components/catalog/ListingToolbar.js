const SORT_OPTIONS = [
  { value: "en-yeni", label: "En yeniye göre sırala" },
  { value: "fiyat-artan", label: "Fiyata göre sırala: Düşükten yükseğe" },
  { value: "fiyat-azalan", label: "Fiyata göre sırala: Yüksekten düşüğe" },
];

const PER_PAGE_OPTIONS = [9, 12, 18, 24];

export default function ListingToolbar({
  total = 0,
  page = 1,
  totalPages = 1,
  sort = "en-yeni",
  perPage = 12,
  inStockOnly = false,
  isFilterDrawerOpen = false,
  onOpenMobileFilters,
  onSortChange,
  onPerPageChange,
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-lg border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p
          data-testid="debug-result-count"
          className="text-sm font-medium text-stone-800"
        >
          {total} ürün bulundu
        </p>
        <p
          data-testid="debug-filter-summary"
          className="mt-0.5 text-xs text-stone-500"
        >
          Sayfa {page}/{totalPages} • Sıralama: {sort}
          {inStockOnly ? " • Sadece stoktakiler" : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          data-testid="mobile-filter-open"
          aria-label="Filtreler"
          aria-expanded={Boolean(isFilterDrawerOpen)}
          onClick={() => onOpenMobileFilters?.()}
          className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-50 lg:hidden"
        >
          Filtreler
        </button>

        <div
          data-testid="per-page-selector"
          aria-label="Sayfa başına ürün sayısı"
          role="group"
          className="flex items-center gap-1 text-sm"
        >
          <span className="mr-1 text-xs text-stone-500">Göster:</span>
          {PER_PAGE_OPTIONS.map((option) => {
            const isActive = Number(perPage) === option;
            return (
              <button
                key={option}
                type="button"
                data-testid={`per-page-option-${option}`}
                aria-pressed={isActive}
                onClick={() => onPerPageChange?.(option)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                  isActive
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>

        <select
          data-testid="sort-select"
          aria-label="Sıralama"
          value={sort}
          onChange={(event) => onSortChange?.(event.target.value)}
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 focus:border-stone-500 focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

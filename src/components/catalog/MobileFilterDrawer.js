import { useEffect } from "react";
import FilterSidebar from "@/components/catalog/FilterSidebar";

export default function MobileFilterDrawer({
  isOpen = false,
  onClose,
  catalog,
  facets,
  categorySlug = "",
  inStockOnly = false,
  attributes = {},
  onToggleInStock,
  onToggleAttributeTerm,
}) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Filtreler"
      data-testid="mobile-filter-drawer"
      className="fixed inset-0 z-50 flex lg:hidden"
    >
      <div
        data-testid="mobile-filter-backdrop"
        onClick={() => onClose?.()}
        className="fixed inset-0 bg-black/40"
      />
      <div className="relative z-10 flex h-full w-80 max-w-full flex-col overflow-y-auto bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b border-stone-200 pb-3">
          <h2 className="text-base font-semibold text-stone-900">Filtreler</h2>
          <button
            type="button"
            data-testid="mobile-filter-close"
            aria-label="Filtreleri kapat"
            onClick={() => onClose?.()}
            className="rounded p-1 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
          >
            ✕
          </button>
        </div>
        <FilterSidebar
          catalog={catalog}
          facets={facets}
          categorySlug={categorySlug}
          inStockOnly={inStockOnly}
          attributes={attributes}
          onToggleInStock={onToggleInStock}
          onToggleAttributeTerm={onToggleAttributeTerm}
        />
      </div>
    </div>
  );
}

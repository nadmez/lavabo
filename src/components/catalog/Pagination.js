export default function Pagination({ page = 1, totalPages = 1, onPageChange }) {
  if (!Number.isFinite(totalPages) || totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, idx) => idx + 1);
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <nav
      aria-label="Sayfalama"
      data-testid="catalog-pagination"
      className="mt-8 flex items-center justify-center gap-1.5"
    >
      <button
        type="button"
        data-testid="pagination-prev"
        disabled={!canGoPrev}
        onClick={() => {
          if (canGoPrev) {
            onPageChange?.(page - 1);
          }
        }}
        className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Önceki
      </button>

      {pages.map((p) => {
        const isCurrent = p === page;
        return (
          <button
            key={p}
            type="button"
            data-testid={`pagination-page-${p}`}
            aria-current={isCurrent ? "page" : undefined}
            onClick={() => onPageChange?.(p)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              isCurrent
                ? "bg-stone-900 text-white"
                : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
            }`}
          >
            {p}
          </button>
        );
      })}

      <button
        type="button"
        data-testid="pagination-next"
        disabled={!canGoNext}
        onClick={() => {
          if (canGoNext) {
            onPageChange?.(page + 1);
          }
        }}
        className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Sonraki
      </button>
    </nav>
  );
}

export function LoadingSkeleton({ count = 6, variant = "grid" }) {
  const parsedCount = Number(count);
  const safeCount =
    Number.isFinite(parsedCount) && Math.floor(parsedCount) >= 1
      ? Math.floor(parsedCount)
      : 1;

  return (
    <div
      data-testid="catalog-loading-skeleton"
      aria-busy="true"
      data-variant={variant}
      className="space-y-4"
    >
      <p className="text-sm text-stone-600">Yükleniyor...</p>
      <div
        className={
          variant === "detail"
            ? "grid grid-cols-1 gap-6 lg:grid-cols-2"
            : "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {Array.from({ length: safeCount }, (_, index) => (
          <div
            key={index}
            data-testid="skeleton-card"
            className="h-64 animate-pulse rounded-lg border border-stone-200 bg-stone-200/70"
          />
        ))}
      </div>
    </div>
  );
}

export default LoadingSkeleton;

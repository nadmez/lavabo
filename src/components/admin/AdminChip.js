export default function AdminChip({
  children,
  swatch,
  swatchTestId,
  onRemove,
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-2 py-1 text-xs">
      {swatch ? (
        <span
          {...(swatchTestId ? { "data-testid": swatchTestId } : {})}
          className="inline-block h-3 w-3 rounded-full border border-stone-300"
          style={{ backgroundColor: swatch }}
        />
      ) : null}
      {children}
      {onRemove ? (
        <button type="button" aria-label="Kaldır" onClick={onRemove}>
          ×
        </button>
      ) : null}
    </span>
  );
}

export function StockBadge({ inStock }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${inStock ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-700"}`}
    >
      {inStock ? "Stokta" : "Stokta yok"}
    </span>
  );
}

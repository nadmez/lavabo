const tryFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

export function formatTryCurrency(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return "₺0";
  }
  return tryFormatter.format(amount);
}

export function formatProductPriceRange(priceMin, priceMax) {
  if (
    typeof priceMin === "number" &&
    typeof priceMax === "number" &&
    Number.isFinite(priceMin) &&
    Number.isFinite(priceMax) &&
    priceMax > priceMin
  ) {
    return `${formatTryCurrency(priceMin)} – ${formatTryCurrency(priceMax)}`;
  }
  return formatTryCurrency(priceMin);
}

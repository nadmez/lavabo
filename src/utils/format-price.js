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

const ALLOWED_CURRENCIES = new Set(["TRY", "USD", "EUR", "GBP"]);
const formatterCache = new Map();

function currencyFormatter(locale, currency) {
  const key = `${locale}:${currency}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

export function formatCurrency(amount, options = {}) {
  const currency = ALLOWED_CURRENCIES.has(options.currency)
    ? options.currency
    : "TRY";
  const locale =
    typeof options.locale === "string" && options.locale.trim()
      ? options.locale.trim()
      : "tr-TR";
  let formatter;
  try {
    formatter = currencyFormatter(locale, currency);
  } catch {
    formatter = currencyFormatter("tr-TR", "TRY");
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return formatter.format(0);
  }
  return formatter.format(amount);
}

export function formatPriceRange(priceMin, priceMax, options = {}) {
  if (
    typeof priceMin === "number" &&
    typeof priceMax === "number" &&
    Number.isFinite(priceMin) &&
    Number.isFinite(priceMax) &&
    priceMax > priceMin
  ) {
    return `${formatCurrency(priceMin, options)} – ${formatCurrency(priceMax, options)}`;
  }
  return formatCurrency(priceMin, options);
}

export function formatCatalogPriceRange(priceMin, priceMax, catalog) {
  const currency = catalog?.siteSettings?.currency;
  if (!currency) {
    return formatProductPriceRange(priceMin, priceMax);
  }
  return formatPriceRange(priceMin, priceMax, {
    currency,
    locale: catalog.siteSettings.locale || "tr-TR",
  });
}

export function formatCatalogPrice(amount, catalog) {
  const currency = catalog?.siteSettings?.currency;
  if (!currency) {
    return formatTryCurrency(amount);
  }
  return formatCurrency(amount, {
    currency,
    locale: catalog.siteSettings.locale || "tr-TR",
  });
}

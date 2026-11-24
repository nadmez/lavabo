function normalizeDimension(value, fallback = 600) {
  const num = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(num) && num > 0 ? Math.round(num) : fallback;
}

export function getPicsumFallbackUrl(options = {}) {
  const { width, height } = options || {};
  const validWidth = normalizeDimension(width, 600);
  const validHeight = normalizeDimension(height, 600);
  return `https://picsum.photos/${validWidth}/${validHeight}`;
}

export function resolveAssetUrl(relativePath, options = {}) {
  if (typeof relativePath !== "string") {
    return getPicsumFallbackUrl(options);
  }

  const trimmed = relativePath.trim();
  if (!trimmed) {
    return getPicsumFallbackUrl(options);
  }

  if (/^(https?:\/\/|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  const cleanPath = trimmed.replace(/^\/+/, "").replace(/^assets\/+/, "");
  if (!cleanPath) {
    return getPicsumFallbackUrl(options);
  }

  return `${import.meta.env.BASE_URL}assets/${cleanPath}`;
}

export function handleImageError(event, options = {}) {
  const img = event?.currentTarget || event?.target;
  if (!img) return;

  if (img.dataset?.fallbackApplied === "true") {
    return;
  }

  if (img.dataset) {
    img.dataset.fallbackApplied = "true";
  }
  img.src = getPicsumFallbackUrl(options);
}

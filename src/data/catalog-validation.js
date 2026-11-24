import { toKebabSlug } from "../utils/slugify.js";

export const ALLOWED_CURRENCIES = ["TRY", "USD", "EUR", "GBP"];

export function defaultSiteSettings() {
  return {
    siteName: "Katalog Sitesi",
    tagline: "Ürünlerinizi sergilemek için hazır katalog şablonu.",
    metaTitle: "Katalog Sitesi",
    metaDescription: "Ürün kataloğu.",
    currency: "TRY",
    locale: "tr-TR",
    contact: {
      address: "",
      phones: [],
      mapUrl: "",
      mapLabel: "",
    },
    navCategoryIds: [],
    showcaseSections: [],
  };
}

export function createEmptyCatalog() {
  return {
    version: new Date().toISOString(),
    siteSettings: defaultSiteSettings(),
    categories: [],
    attributes: [],
    products: [],
  };
}

export function isUninitializedCatalogText(raw) {
  if (typeof raw !== "string") return true;
  const trimmed = raw.trim();
  if (!trimmed) return true;
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return true;
    }
    return Object.keys(parsed).length === 0;
  } catch {
    return true;
  }
}

function clone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSwatch(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed) || /^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return undefined;
}

function nextNumericId(items, readId) {
  let max = 0;
  for (const item of items) {
    const id = Number(readId(item));
    if (Number.isFinite(id) && id > max) max = id;
  }
  return max + 1;
}

export function collectDescendantIds(categories, rootId) {
  const childrenByParent = new Map();
  for (const category of categories) {
    const key = category?.parentId ?? null;
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key).push(category);
  }
  const ids = new Set();
  const stack = [...(childrenByParent.get(rootId) || [])];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || ids.has(current.id)) continue;
    ids.add(current.id);
    for (const child of childrenByParent.get(current.id) || []) {
      stack.push(child);
    }
  }
  return ids;
}

function createsCycle(categories, id, parentId) {
  let current = parentId;
  const seen = new Set();
  while (current != null) {
    if (current === id || seen.has(current)) return true;
    seen.add(current);
    const parent = categories.find((category) => category.id === current);
    if (!parent) return false;
    current = parent.parentId ?? null;
  }
  return false;
}

function normalizeSiteSettings(raw, categories) {
  const defaults = defaultSiteSettings();
  const source = raw && typeof raw === "object" ? raw : {};
  const currency = ALLOWED_CURRENCIES.includes(source.currency)
    ? source.currency
    : defaults.currency;
  const phones = asArray(source.contact?.phones)
    .map((phone) => ({
      display: cleanText(phone?.display),
      href: cleanText(phone?.href),
    }))
    .filter((phone) => phone.display || phone.href);
  const categoryIds = new Set(categories.map((category) => category.id));
  const navCategoryIds = asArray(source.navCategoryIds)
    .map((id) => Number(id))
    .filter((id) => categoryIds.has(id));
  const showcaseSections = asArray(source.showcaseSections)
    .map((section, index) => {
      const limit = Number(section?.limit);
      return {
        key: cleanText(section?.key) || `vitrin-${index + 1}`,
        categorySlug: cleanText(section?.categorySlug),
        title: cleanText(section?.title) || "Ürünler",
        intro: typeof section?.intro === "string" ? section.intro : "",
        ctaLabel: cleanText(section?.ctaLabel) || "Tümünü gör",
        limit: Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 8,
      };
    })
    .filter((section) => section.categorySlug || section.title);

  return {
    siteName: cleanText(source.siteName) || defaults.siteName,
    tagline:
      typeof source.tagline === "string" ? source.tagline : defaults.tagline,
    metaTitle:
      cleanText(source.metaTitle) ||
      cleanText(source.siteName) ||
      defaults.metaTitle,
    metaDescription:
      typeof source.metaDescription === "string"
        ? source.metaDescription
        : defaults.metaDescription,
    currency,
    locale: cleanText(source.locale) || defaults.locale,
    contact: {
      address:
        typeof source.contact?.address === "string"
          ? source.contact.address
          : "",
      phones,
      mapUrl: cleanText(source.contact?.mapUrl),
      mapLabel: cleanText(source.contact?.mapLabel),
    },
    navCategoryIds,
    showcaseSections,
  };
}

function normalizeCategories(rawCategories, errors) {
  const categories = [];
  const seenIds = new Set();
  const seenSlugs = new Set();
  for (const raw of asArray(rawCategories)) {
    if (!raw || typeof raw !== "object") continue;
    const name = cleanText(raw.name);
    const slug = toKebabSlug(raw.slug || name);
    if (!name || !slug) {
      errors.push("Kategori adı gerekli.");
      continue;
    }
    if (seenSlugs.has(slug)) {
      errors.push(`Kategori kısa adı benzersiz olmalı: ${slug}`);
      continue;
    }
    let id = Number(raw.id);
    if (!Number.isFinite(id) || seenIds.has(id)) {
      id = nextNumericId(categories, (item) => item.id);
      while (seenIds.has(id)) id += 1;
    }
    seenIds.add(id);
    seenSlugs.add(slug);
    const parentId =
      raw.parentId == null || raw.parentId === "" ? null : Number(raw.parentId);
    categories.push({
      id,
      slug,
      name,
      parentId: Number.isFinite(parentId) ? parentId : null,
      count: 0,
      descriptionHtml:
        typeof raw.descriptionHtml === "string" ? raw.descriptionHtml : "",
      ...(cleanText(raw.image) ? { image: cleanText(raw.image) } : {}),
    });
  }
  const ids = new Set(categories.map((category) => category.id));
  for (const category of categories) {
    if (category.parentId != null && !ids.has(category.parentId)) {
      category.parentId = null;
    }
    if (
      category.parentId != null &&
      createsCycle(categories, category.id, category.parentId)
    ) {
      errors.push(`Kategori döngüsü: ${category.slug}`);
      category.parentId = null;
    }
  }
  return categories;
}

function normalizeAttributes(rawAttributes, errors) {
  const attributes = [];
  const seenSlugs = new Set();
  for (const raw of asArray(rawAttributes)) {
    if (!raw || typeof raw !== "object") continue;
    const name = cleanText(raw.name);
    const slug = toKebabSlug(raw.slug || name);
    if (!name || !slug) {
      errors.push("Nitelik adı gerekli.");
      continue;
    }
    if (seenSlugs.has(slug)) {
      errors.push(`Nitelik kısa adı benzersiz olmalı: ${slug}`);
      continue;
    }
    seenSlugs.add(slug);
    const terms = [];
    const seenTerms = new Set();
    for (const rawTerm of asArray(raw.terms)) {
      if (!rawTerm || typeof rawTerm !== "object") continue;
      const termName = cleanText(rawTerm.name);
      const termSlug = toKebabSlug(rawTerm.slug || termName);
      if (!termName || !termSlug || seenTerms.has(termSlug)) {
        if (termSlug && seenTerms.has(termSlug)) {
          errors.push(`Terim kısa adı benzersiz olmalı: ${slug}/${termSlug}`);
        }
        continue;
      }
      seenTerms.add(termSlug);
      const term = { slug: termSlug, name: termName };
      const swatch = normalizeSwatch(rawTerm.swatch);
      if (swatch) term.swatch = swatch;
      terms.push(term);
    }
    attributes.push({ slug, name, terms });
  }
  return attributes;
}

function ensureAttributeTerm(attributes, attrSlug, termSlug) {
  if (!attrSlug || !termSlug) return;
  let attribute = attributes.find((item) => item.slug === attrSlug);
  if (!attribute) {
    attribute = { slug: attrSlug, name: attrSlug, terms: [] };
    attributes.push(attribute);
  }
  if (!attribute.terms.some((term) => term.slug === termSlug)) {
    attribute.terms.push({ slug: termSlug, name: termSlug });
  }
}

function normalizeProducts(rawProducts, categories, attributes, errors) {
  const categoryIds = new Set(categories.map((category) => category.id));
  const products = [];
  const seenSlugs = new Set();
  const seenIds = new Set();
  for (const raw of asArray(rawProducts)) {
    if (!raw || typeof raw !== "object") continue;
    const name = cleanText(raw.name);
    const slug = toKebabSlug(raw.slug || name);
    if (!name || !slug) {
      errors.push("Ürün adı gerekli.");
      continue;
    }
    if (seenSlugs.has(slug)) {
      errors.push(`Ürün kısa adı benzersiz olmalı: ${slug}`);
      continue;
    }
    let id = Number(raw.id);
    if (!Number.isFinite(id) || seenIds.has(id)) {
      id = nextNumericId(products, (item) => item.id);
      while (seenIds.has(id)) id += 1;
    }
    seenIds.add(id);
    seenSlugs.add(slug);
    const productAttributes = {};
    if (raw.attributes && typeof raw.attributes === "object") {
      for (const [attrSlug, termSlugs] of Object.entries(raw.attributes)) {
        const normalizedAttr = toKebabSlug(attrSlug);
        const list = asArray(termSlugs)
          .map((term) => toKebabSlug(term))
          .filter(Boolean);
        if (normalizedAttr && list.length > 0) {
          productAttributes[normalizedAttr] = [...new Set(list)];
        }
      }
    }
    const variants = [];
    for (const rawVariant of asArray(raw.variants)) {
      if (!rawVariant || typeof rawVariant !== "object") continue;
      const terms = {};
      if (rawVariant.terms && typeof rawVariant.terms === "object") {
        for (const [attrSlug, termSlug] of Object.entries(rawVariant.terms)) {
          const normalizedAttr = toKebabSlug(attrSlug);
          const normalizedTerm = toKebabSlug(termSlug);
          if (!normalizedAttr || !normalizedTerm) continue;
          terms[normalizedAttr] = normalizedTerm;
          ensureAttributeTerm(attributes, normalizedAttr, normalizedTerm);
          const current = productAttributes[normalizedAttr] || [];
          if (!current.includes(normalizedTerm)) {
            productAttributes[normalizedAttr] = [...current, normalizedTerm];
          }
        }
      }
      const price = Number(rawVariant.price);
      const regularPrice = Number(rawVariant.regularPrice);
      variants.push({
        id: Number(rawVariant.id) || 0,
        sku: cleanText(rawVariant.sku),
        price: Number.isFinite(price) ? price : 0,
        ...(Number.isFinite(regularPrice) ? { regularPrice } : {}),
        inStock: rawVariant.inStock === true,
        terms,
        ...(cleanText(rawVariant.image)
          ? { image: cleanText(rawVariant.image) }
          : {}),
      });
    }
    let priceMin = Number(raw.priceMin);
    let priceMax = Number(raw.priceMax);
    let inStock = raw.inStock === true;
    if (variants.length > 0) {
      const prices = variants
        .map((variant) => variant.price)
        .filter((price) => Number.isFinite(price) && price > 0);
      if (prices.length > 0) {
        priceMin = Math.min(...prices);
        priceMax = Math.max(...prices);
      }
      inStock = variants.some((variant) => variant.inStock === true);
    }
    if (!Number.isFinite(priceMin) || priceMin < 0) priceMin = 0;
    if (!Number.isFinite(priceMax) || priceMax < priceMin) priceMax = priceMin;
    const specs = {};
    if (
      raw.specs &&
      typeof raw.specs === "object" &&
      !Array.isArray(raw.specs)
    ) {
      for (const [key, value] of Object.entries(raw.specs)) {
        const specKey = cleanText(key);
        if (!specKey) continue;
        specs[specKey] = value == null ? "" : String(value);
      }
    }
    products.push({
      id,
      slug,
      name,
      sku: cleanText(raw.sku),
      inStock,
      categoryIds: asArray(raw.categoryIds)
        .map((categoryId) => Number(categoryId))
        .filter((categoryId) => categoryIds.has(categoryId)),
      priceMin,
      priceMax,
      highlights: asArray(raw.highlights)
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean),
      descriptionHtml:
        typeof raw.descriptionHtml === "string" ? raw.descriptionHtml : "",
      specs,
      images: asArray(raw.images)
        .map((image) => (typeof image === "string" ? image.trim() : ""))
        .filter(Boolean),
      attributes: productAttributes,
      variants,
      createdAt: cleanText(raw.createdAt) || new Date().toISOString(),
    });
  }
  let variantSeed = nextNumericId(products, (product) => {
    const variantMax = asArray(product.variants).reduce(
      (max, variant) => Math.max(max, Number(variant.id) || 0),
      0
    );
    return Math.max(Number(product.id) || 0, variantMax);
  });
  for (const product of products) {
    for (const variant of product.variants) {
      if (!variant.id) {
        variant.id = variantSeed;
        variantSeed += 1;
      }
    }
  }
  return products;
}

function recomputeCategoryCounts(categories, products) {
  for (const category of categories) {
    const ids = collectDescendantIds(categories, category.id);
    ids.add(category.id);
    category.count = products.filter((product) =>
      product.categoryIds.some((categoryId) => ids.has(categoryId))
    ).length;
  }
}

export function validateAndNormalizeCatalog(raw) {
  const errors = [];
  const source = raw && typeof raw === "object" ? raw : {};
  const categories = normalizeCategories(source.categories, errors);
  const attributes = normalizeAttributes(source.attributes, errors);
  const products = normalizeProducts(
    source.products,
    categories,
    attributes,
    errors
  );
  recomputeCategoryCounts(categories, products);
  const catalog = {
    version: cleanText(source.version) || new Date().toISOString().slice(0, 10),
    categories,
    attributes,
    products,
  };
  if (source.siteSettings && typeof source.siteSettings === "object") {
    catalog.siteSettings = normalizeSiteSettings(
      source.siteSettings,
      categories
    );
  }
  return {
    ok: errors.length === 0,
    errors,
    catalog,
  };
}

function fail(errors) {
  return { ok: false, errors, catalog: null };
}

export function addCategory(catalog, input) {
  const next = clone(catalog);
  const name = cleanText(input?.name);
  const slug = toKebabSlug(input?.slug || name);
  if (!name || !slug) return fail(["Kategori adı gerekli."]);
  if (next.categories.some((category) => category.slug === slug)) {
    return fail([`Kategori kısa adı benzersiz olmalı: ${slug}`]);
  }
  const id = nextNumericId(next.categories, (category) => category.id);
  const parentId =
    input?.parentId == null || input.parentId === ""
      ? null
      : Number(input.parentId);
  if (
    parentId != null &&
    !next.categories.some((category) => category.id === parentId)
  ) {
    return fail(["Üst kategori bulunamadı."]);
  }
  next.categories.push({
    id,
    slug,
    name,
    parentId: Number.isFinite(parentId) ? parentId : null,
    count: 0,
    descriptionHtml:
      typeof input?.descriptionHtml === "string" ? input.descriptionHtml : "",
    ...(cleanText(input?.image) ? { image: cleanText(input.image) } : {}),
  });
  return validateAndNormalizeCatalog(next);
}

export function updateCategory(catalog, categoryId, input) {
  const next = clone(catalog);
  const id = Number(categoryId);
  const category = next.categories.find((item) => item.id === id);
  if (!category) return fail(["Kategori bulunamadı."]);
  const name = cleanText(input?.name || category.name);
  const slug = toKebabSlug(input?.slug || name);
  if (!name || !slug) return fail(["Kategori adı gerekli."]);
  if (next.categories.some((item) => item.id !== id && item.slug === slug)) {
    return fail([`Kategori kısa adı benzersiz olmalı: ${slug}`]);
  }
  const parentId =
    input?.parentId === undefined
      ? category.parentId
      : input.parentId == null || input.parentId === ""
        ? null
        : Number(input.parentId);
  if (
    parentId != null &&
    !next.categories.some((item) => item.id === parentId)
  ) {
    return fail(["Üst kategori bulunamadı."]);
  }
  if (parentId != null && createsCycle(next.categories, id, parentId)) {
    return fail(["Kategori kendi alt kategorisinin altına taşınamaz."]);
  }
  const previousSlug = category.slug;
  category.name = name;
  category.slug = slug;
  category.parentId = Number.isFinite(parentId) ? parentId : null;
  category.descriptionHtml =
    typeof input?.descriptionHtml === "string"
      ? input.descriptionHtml
      : category.descriptionHtml;
  if (cleanText(input?.image)) category.image = cleanText(input.image);
  if (input?.image === "") delete category.image;
  if (previousSlug !== slug && next.siteSettings?.showcaseSections) {
    for (const section of next.siteSettings.showcaseSections) {
      if (section.categorySlug === previousSlug) section.categorySlug = slug;
    }
  }
  return validateAndNormalizeCatalog(next);
}

export function removeCategory(catalog, categoryId) {
  const next = clone(catalog);
  const id = Number(categoryId);
  const category = next.categories.find((item) => item.id === id);
  if (!category) return fail(["Kategori bulunamadı."]);
  for (const child of next.categories) {
    if (child.parentId === id) child.parentId = category.parentId ?? null;
  }
  next.categories = next.categories.filter((item) => item.id !== id);
  for (const product of next.products) {
    product.categoryIds = asArray(product.categoryIds).filter(
      (item) => Number(item) !== id
    );
  }
  if (next.siteSettings) {
    next.siteSettings.navCategoryIds = asArray(
      next.siteSettings.navCategoryIds
    ).filter((item) => Number(item) !== id);
  }
  return validateAndNormalizeCatalog(next);
}

function rewriteAttributeOnProduct(
  product,
  oldSlug,
  newSlug,
  termSlugMap,
  deleted
) {
  const attributes =
    product.attributes && typeof product.attributes === "object"
      ? product.attributes
      : {};
  if (Array.isArray(attributes[oldSlug])) {
    const mapped = attributes[oldSlug]
      .map((termSlug) => termSlugMap.get(termSlug) || termSlug)
      .filter(
        (termSlug) =>
          !deleted.has(termSlug) && !deleted.has(termSlugMap.get(termSlug))
      );
    const unique = [...new Set(mapped)];
    delete attributes[oldSlug];
    if (unique.length > 0) attributes[newSlug] = unique;
  } else if (oldSlug !== newSlug && Array.isArray(attributes[newSlug])) {
    attributes[newSlug] = attributes[newSlug].map(
      (termSlug) => termSlugMap.get(termSlug) || termSlug
    );
  }
  product.attributes = attributes;
  for (const variant of asArray(product.variants)) {
    if (!variant.terms || typeof variant.terms !== "object") continue;
    if (!(oldSlug in variant.terms) && !(newSlug in variant.terms)) continue;
    const current = variant.terms[oldSlug] ?? variant.terms[newSlug];
    const mapped = termSlugMap.get(current) || current;
    delete variant.terms[oldSlug];
    if (deleted.has(current) || deleted.has(mapped)) continue;
    variant.terms[newSlug] = mapped;
  }
}

export function addAttribute(catalog, input) {
  const next = clone(catalog);
  const name = cleanText(input?.name);
  const slug = toKebabSlug(input?.slug || name);
  if (!name || !slug) return fail(["Nitelik adı gerekli."]);
  if (next.attributes.some((attribute) => attribute.slug === slug)) {
    return fail([`Nitelik kısa adı benzersiz olmalı: ${slug}`]);
  }
  next.attributes.push({ slug, name, terms: [] });
  return updateAttribute(next, slug, { ...input, slug, name });
}

export function updateAttribute(catalog, currentSlug, input) {
  const next = clone(catalog);
  const attribute = next.attributes.find((item) => item.slug === currentSlug);
  if (!attribute) return fail(["Nitelik bulunamadı."]);
  const name = cleanText(input?.name || attribute.name);
  const slug = toKebabSlug(input?.slug || name);
  if (!name || !slug) return fail(["Nitelik adı gerekli."]);
  if (
    next.attributes.some((item) => item.slug === slug && item !== attribute)
  ) {
    return fail([`Nitelik kısa adı benzersiz olmalı: ${slug}`]);
  }
  const oldTermSlugs = new Set(attribute.terms.map((term) => term.slug));
  const termSlugMap = new Map();
  const terms = [];
  const seen = new Set();
  for (const rawTerm of asArray(input?.terms ?? attribute.terms)) {
    const termName = cleanText(rawTerm?.name);
    let termSlug = toKebabSlug(rawTerm?.slug || termName);
    if (!termName || !termSlug) continue;
    if (seen.has(termSlug)) {
      return fail([`Terim kısa adı benzersiz olmalı: ${slug}/${termSlug}`]);
    }
    seen.add(termSlug);
    const previousSlug = toKebabSlug(rawTerm?.previousSlug || "");
    if (previousSlug) termSlugMap.set(previousSlug, termSlug);
    const term = { slug: termSlug, name: termName };
    const swatch = normalizeSwatch(rawTerm?.swatch);
    if (swatch) term.swatch = swatch;
    terms.push(term);
  }
  const kept = new Set([
    ...termSlugMap.keys(),
    ...terms.map((term) => term.slug),
  ]);
  const deleted = new Set(
    [...oldTermSlugs].filter((termSlug) => !kept.has(termSlug))
  );
  attribute.slug = slug;
  attribute.name = name;
  attribute.terms = terms;
  if (currentSlug !== slug || termSlugMap.size > 0 || deleted.size > 0) {
    for (const product of next.products) {
      rewriteAttributeOnProduct(
        product,
        currentSlug,
        slug,
        termSlugMap,
        deleted
      );
    }
  }
  return validateAndNormalizeCatalog(next);
}

export function removeAttribute(catalog, attributeSlug) {
  const next = clone(catalog);
  const slug = toKebabSlug(attributeSlug);
  if (!next.attributes.some((attribute) => attribute.slug === slug)) {
    return fail(["Nitelik bulunamadı."]);
  }
  next.attributes = next.attributes.filter(
    (attribute) => attribute.slug !== slug
  );
  for (const product of next.products) {
    if (product.attributes) delete product.attributes[slug];
    for (const variant of asArray(product.variants)) {
      if (variant.terms) delete variant.terms[slug];
    }
  }
  return validateAndNormalizeCatalog(next);
}

function prepareProductInput(catalog, input, ignoreId = null) {
  const name = cleanText(input?.name);
  const slug = toKebabSlug(input?.slug || name);
  if (!name || !slug) return fail(["Ürün adı gerekli."]);
  if (
    catalog.products.some(
      (product) => product.slug === slug && product.id !== ignoreId
    )
  ) {
    return fail([`Ürün kısa adı benzersiz olmalı: ${slug}`]);
  }
  return { ok: true, name, slug };
}

export function addProduct(catalog, input) {
  const next = clone(catalog);
  const prepared = prepareProductInput(next, input);
  if (!prepared.ok) return prepared;
  const id = nextNumericId(next.products, (product) => product.id);
  next.products.push({
    ...input,
    id,
    slug: prepared.slug,
    name: prepared.name,
    createdAt: cleanText(input?.createdAt) || new Date().toISOString(),
  });
  return validateAndNormalizeCatalog(next);
}

export function updateProduct(catalog, productId, input) {
  const next = clone(catalog);
  const id = Number(productId);
  const index = next.products.findIndex((product) => product.id === id);
  if (index === -1) return fail(["Ürün bulunamadı."]);
  const prepared = prepareProductInput(next, input, id);
  if (!prepared.ok) return prepared;
  next.products[index] = {
    ...next.products[index],
    ...input,
    id,
    slug: prepared.slug,
    name: prepared.name,
    createdAt: next.products[index].createdAt || new Date().toISOString(),
  };
  return validateAndNormalizeCatalog(next);
}

export function removeProduct(catalog, productId) {
  const next = clone(catalog);
  const id = Number(productId);
  const product = next.products.find((item) => item.id === id);
  if (!product) return fail(["Ürün bulunamadı."]);
  next.products = next.products.filter((item) => item.id !== id);
  const result = validateAndNormalizeCatalog(next);
  if (result.ok) result.removedSlug = product.slug;
  return result;
}

export function replaceSiteSettings(catalog, settings) {
  const next = clone(catalog);
  next.siteSettings = settings;
  return validateAndNormalizeCatalog(next);
}

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SWATCH_BY_SLUG = {
  siyah: "#18181b",
  "siyah-renk": "#18181b",
  beyaz: "#ffffff",
  "beyaz-renk": "#ffffff",
  "antrasit-gri": "#4b5563",
  "antrasit-gri-renk": "#4b5563",
  antrasit: "#4b5563",
  gold: "#d4af37",
  "gold-renk": "#d4af37",
  altin: "#d4af37",
  "altin-renk": "#d4af37",
  bronz: "#92400e",
  "bronz-renk": "#92400e",
  eskitme: "#92400e",
  "eskitme-renk": "#92400e",
  krom: "#9ca3af",
  "krom-renk": "#9ca3af",
  gumus: "#9ca3af",
  "gumus-renk": "#9ca3af",
  gri: "#9ca3af",
  "gri-renk": "#9ca3af",
};

const NAMED_ENTITIES = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&quot;": '"',
  "&apos;": "'",
  "&#039;": "'",
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&ndash;": "–",
  "&mdash;": "—",
  "&lsquo;": "‘",
  "&rsquo;": "’",
  "&ldquo;": "“",
  "&rdquo;": "”",
  "&hellip;": "…",
  "&trade;": "™",
  "&reg;": "®",
  "&copy;": "©",
  "&deg;": "°",
};

export function decodeHtmlEntities(input) {
  if (!input) return "";
  let decoded = input;

  for (const [entity, char] of Object.entries(NAMED_ENTITIES)) {
    if (decoded.includes(entity)) {
      decoded = decoded.split(entity).join(char);
    }
  }

  decoded = decoded.replace(/&#(\d+);/g, (_, dec) => {
    const code = Number.parseInt(dec, 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : "";
  });

  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    const code = Number.parseInt(hex, 16);
    return Number.isFinite(code) ? String.fromCodePoint(code) : "";
  });

  return decoded;
}

const TURKISH_CHAR_MAP = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  I: "i",
  İ: "i",
  i: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

export function toKebabSlug(value) {
  const decoded = decodeHtmlEntities(value);
  let transliterated = "";
  for (const ch of decoded) {
    transliterated += TURKISH_CHAR_MAP[ch] ?? ch;
  }
  return transliterated
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeAttributeName(rawName) {
  return decodeHtmlEntities(rawName)
    .replace(/^[►▸▶\s]+/u, "")
    .trim();
}

export function normalizeAttributeSlug(taxonomy, rawName) {
  if (taxonomy && taxonomy.trim().length > 0) {
    const stripped = taxonomy.trim().replace(/^pa_/i, "");
    try {
      return toKebabSlug(decodeURIComponent(stripped));
    } catch {
      return toKebabSlug(stripped);
    }
  }
  return toKebabSlug(normalizeAttributeName(rawName));
}

function normalizeTermSlug(rawSlugOrValue) {
  try {
    return toKebabSlug(decodeURIComponent(rawSlugOrValue));
  } catch {
    return toKebabSlug(rawSlugOrValue);
  }
}

function formatFallbackTermName(rawValue) {
  const cleaned = decodeHtmlEntities(rawValue).trim();
  if (!cleaned) return "";
  if (cleaned.includes("-") && cleaned === cleaned.toLowerCase()) {
    return cleaned
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function resolveSwatch(termSlug, termName) {
  const bySlug = SWATCH_BY_SLUG[termSlug];
  if (bySlug) return bySlug;
  const nameSlug = toKebabSlug(termName);
  return SWATCH_BY_SLUG[nameSlug];
}

export function extractHighlights(shortDescription) {
  if (!shortDescription) return [];

  const withLineBreaks = shortDescription
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|li|div|h[1-6]|tr)\s*>/gi, "\n");

  const withoutTags = withLineBreaks.replace(/<[^>]+>/g, "");
  const decoded = decodeHtmlEntities(withoutTags);

  return decoded
    .split(/\r?\n/)
    .map((line) => line.replace(/[\t\u00a0 ]+/g, " ").trim())
    .filter((line) => line.length > 0);
}

function parseStorePrice(raw, minorUnit = 0) {
  if (raw === undefined || raw === null || raw === "") return 0;
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return 0;
  return numeric / Math.pow(10, minorUnit);
}

function imageSortRank(fileName) {
  if (/^main\.[^.]+$/i.test(fileName)) return 0;
  if (/^gallery-/i.test(fileName)) return 1;
  if (/^variant-/i.test(fileName)) return 2;
  return 3;
}

export function resolveProductImages(assetsDir, productSlug) {
  const productDir = path.join(assetsDir, productSlug);
  if (!fs.existsSync(productDir)) return [];

  let stat;
  try {
    stat = fs.statSync(productDir);
  } catch {
    return [];
  }
  if (!stat.isDirectory()) return [];

  const entries = fs.readdirSync(productDir);
  const imageFiles = entries.filter((fileName) => {
    if (fileName.startsWith(".")) return false;
    if (!/\.(webp|jpg|jpeg|png|avif|gif|svg)$/i.test(fileName)) return false;
    const fullPath = path.join(productDir, fileName);
    try {
      return fs.statSync(fullPath).isFile();
    } catch {
      return false;
    }
  });

  imageFiles.sort((a, b) => {
    const rankDiff = imageSortRank(a) - imageSortRank(b);
    if (rankDiff !== 0) return rankDiff;
    return a.localeCompare(b, "en");
  });

  return imageFiles.map((fileName) => `${productSlug}/${fileName}`);
}

export function buildCatalogFromStoreApi(input) {
  const {
    categories: rawCategories,
    products: rawProducts,
    variations: rawVariations,
    assetsDir,
    version = new Date().toISOString().slice(0, 10),
  } = input;

  // 1. Deduplicate and build categories
  const seenCategoryIds = new Set();
  const seenCategorySlugs = new Set();
  const uniqueRawCategories = [];

  for (const cat of rawCategories) {
    if (!cat || typeof cat.id !== "number" || !cat.slug) continue;
    if (seenCategoryIds.has(cat.id) || seenCategorySlugs.has(cat.slug)) {
      continue;
    }
    seenCategoryIds.add(cat.id);
    seenCategorySlugs.add(cat.slug);
    uniqueRawCategories.push(cat);
  }

  const categories = uniqueRawCategories.map((cat) => {
    const parentId =
      cat.parent && cat.parent !== 0 && seenCategoryIds.has(cat.parent)
        ? cat.parent
        : null;
    const category = {
      id: cat.id,
      slug: cat.slug,
      name: decodeHtmlEntities(cat.name).trim(),
      parentId,
      count: typeof cat.count === "number" ? cat.count : 0,
      descriptionHtml: cat.description ?? "",
    };
    if (cat.image?.src) {
      category.image = cat.image.src;
    }
    return category;
  });

  // 2. Index variations by parent product ID
  const variationsByParent = new Map();
  for (const variation of rawVariations) {
    if (!variation || typeof variation.parent !== "number") continue;
    const list = variationsByParent.get(variation.parent) ?? [];
    list.push(variation);
    variationsByParent.set(variation.parent, list);
  }

  // Global catalog attributes registry: attrSlug -> { name, terms: Map<termSlug, AttributeTerm> }
  const globalAttributes = new Map();

  function ensureGlobalTerm(attrSlug, attrName, termSlug, termName) {
    let attrEntry = globalAttributes.get(attrSlug);
    if (!attrEntry) {
      attrEntry = { name: attrName, terms: new Map() };
      globalAttributes.set(attrSlug, attrEntry);
    }
    if (!attrEntry.terms.has(termSlug)) {
      const term = {
        slug: termSlug,
        name: termName,
      };
      const swatch = resolveSwatch(termSlug, termName);
      if (swatch) {
        term.swatch = swatch;
      }
      attrEntry.terms.set(termSlug, term);
    }
  }

  // 3. Transform products
  const seenProductSlugs = new Set();
  const products = [];

  for (const rawProduct of rawProducts) {
    if (!rawProduct || !rawProduct.slug) continue;
    if (seenProductSlugs.has(rawProduct.slug)) continue;

    const images = resolveProductImages(assetsDir, rawProduct.slug);
    if (images.length === 0) {
      continue;
    }

    seenProductSlugs.add(rawProduct.slug);

    const specs = {};
    const productAttrMeta = new Map();
    const attrMetaByNormalizedName = new Map();
    const attrMetaByTaxonomy = new Map();

    for (const rawAttr of rawProduct.attributes ?? []) {
      const normalizedName = normalizeAttributeName(rawAttr.name);
      if (!normalizedName) continue;

      if (!rawAttr.has_variations) {
        const value = (rawAttr.terms ?? [])
          .map((t) => decodeHtmlEntities(t.name).trim())
          .filter((v) => v.length > 0)
          .join(", ");
        if (value.length > 0) {
          specs[normalizedName] = value;
        }
        continue;
      }

      const attrSlug = normalizeAttributeSlug(rawAttr.taxonomy, rawAttr.name);
      if (!attrSlug) continue;

      let meta = productAttrMeta.get(attrSlug);
      if (!meta) {
        meta = {
          slug: attrSlug,
          name: normalizedName,
          termsBySlug: new Map(),
          termsByLowerName: new Map(),
        };
        productAttrMeta.set(attrSlug, meta);
      }

      attrMetaByNormalizedName.set(normalizedName.toLowerCase(), attrSlug);
      if (rawAttr.taxonomy) {
        attrMetaByTaxonomy.set(rawAttr.taxonomy.toLowerCase(), attrSlug);
      }

      for (const rawTerm of rawAttr.terms ?? []) {
        const termSlug = normalizeTermSlug(rawTerm.slug || rawTerm.name);
        const termName =
          decodeHtmlEntities(rawTerm.name).trim() ||
          formatFallbackTermName(termSlug);
        if (!termSlug) continue;
        const termObj = { slug: termSlug, name: termName };
        meta.termsBySlug.set(termSlug, termObj);
        meta.termsByLowerName.set(termName.toLowerCase(), termObj);
      }
    }

    // Index parent variation attribute stubs if present
    const stubAttrsByVariationId = new Map();
    for (const stub of rawProduct.variations ?? []) {
      if (
        stub &&
        typeof stub.id === "number" &&
        Array.isArray(stub.attributes)
      ) {
        stubAttrsByVariationId.set(stub.id, stub.attributes);
      }
    }

    const parentMinorUnit = Number(rawProduct.prices?.currency_minor_unit ?? 0);
    const parentBasePrice = parseStorePrice(
      rawProduct.prices?.price,
      parentMinorUnit
    );
    const parentRangeMin = parseStorePrice(
      rawProduct.prices?.price_range?.min_amount,
      parentMinorUnit
    );
    const parentRangeMax = parseStorePrice(
      rawProduct.prices?.price_range?.max_amount,
      parentMinorUnit
    );

    const matchingVariations = variationsByParent.get(rawProduct.id) ?? [];
    const seenVariantIds = new Set();
    const variants = [];

    for (const rawVar of matchingVariations) {
      if (seenVariantIds.has(rawVar.id)) continue;
      seenVariantIds.add(rawVar.id);

      const varMinorUnit = Number(
        rawVar.prices?.currency_minor_unit ?? parentMinorUnit
      );
      let varPrice = parseStorePrice(rawVar.prices?.price, varMinorUnit);
      if (varPrice <= 0) {
        varPrice = parentBasePrice > 0 ? parentBasePrice : parentRangeMin;
      }
      const varRegularPrice = parseStorePrice(
        rawVar.prices?.regular_price,
        varMinorUnit
      );

      const rawVarAttrs =
        rawVar.attributes && rawVar.attributes.length > 0
          ? rawVar.attributes
          : (stubAttrsByVariationId.get(rawVar.id) ?? []);

      const variantTerms = {};

      for (const vAttr of rawVarAttrs) {
        if (!vAttr.value || vAttr.value.trim().length === 0) continue;

        const normAttrName = normalizeAttributeName(vAttr.name);
        const attrSlug =
          (vAttr.taxonomy
            ? attrMetaByTaxonomy.get(vAttr.taxonomy.toLowerCase())
            : undefined) ??
          attrMetaByNormalizedName.get(normAttrName.toLowerCase()) ??
          normalizeAttributeSlug(vAttr.taxonomy, vAttr.name);

        if (!attrSlug) continue;

        let meta = productAttrMeta.get(attrSlug);
        if (!meta) {
          meta = {
            slug: attrSlug,
            name: normAttrName || formatFallbackTermName(attrSlug),
            termsBySlug: new Map(),
            termsByLowerName: new Map(),
          };
          productAttrMeta.set(attrSlug, meta);
          if (normAttrName) {
            attrMetaByNormalizedName.set(normAttrName.toLowerCase(), attrSlug);
          }
        }

        const rawVal = vAttr.value.trim();
        const candidateSlug = normalizeTermSlug(rawVal);
        const existingTerm =
          meta.termsBySlug.get(rawVal) ??
          meta.termsBySlug.get(candidateSlug) ??
          meta.termsByLowerName.get(decodeHtmlEntities(rawVal).toLowerCase());

        let termSlug;
        if (existingTerm) {
          termSlug = existingTerm.slug;
        } else {
          termSlug = candidateSlug;
          const termName = formatFallbackTermName(rawVal);
          const newTerm = { slug: termSlug, name: termName };
          meta.termsBySlug.set(termSlug, newTerm);
          meta.termsByLowerName.set(termName.toLowerCase(), newTerm);
        }

        if (termSlug) {
          variantTerms[attrSlug] = termSlug;
        }
      }

      const variant = {
        id: rawVar.id,
        sku: rawVar.sku ?? "",
        price: varPrice,
        inStock: Boolean(rawVar.is_in_stock),
        terms: variantTerms,
      };

      if (varRegularPrice > 0) {
        variant.regularPrice = varRegularPrice;
      }

      variants.push(variant);
    }

    const productAttributes = {};
    if (variants.length > 0) {
      for (const [attrSlug, meta] of productAttrMeta.entries()) {
        const termSlugs = Array.from(meta.termsBySlug.keys());
        if (termSlugs.length === 0) continue;
        productAttributes[attrSlug] = termSlugs;
        for (const termObj of meta.termsBySlug.values()) {
          ensureGlobalTerm(attrSlug, meta.name, termObj.slug, termObj.name);
        }
      }
    }

    let priceMin = 0;
    let priceMax = 0;
    if (variants.length === 0) {
      const singlePrice =
        parentBasePrice > 0 ? parentBasePrice : parentRangeMin;
      priceMin = singlePrice;
      priceMax = singlePrice;
    } else {
      const positivePrices = variants.map((v) => v.price).filter((p) => p > 0);
      if (positivePrices.length > 0) {
        priceMin = Math.min(...positivePrices);
        priceMax = Math.max(...positivePrices);
      } else {
        priceMin = parentRangeMin > 0 ? parentRangeMin : parentBasePrice;
        priceMax = parentRangeMax >= priceMin ? parentRangeMax : priceMin;
      }
    }

    const categoryIds = [];
    const seenProdCatIds = new Set();
    for (const c of rawProduct.categories ?? []) {
      if (
        c &&
        typeof c.id === "number" &&
        seenCategoryIds.has(c.id) &&
        !seenProdCatIds.has(c.id)
      ) {
        seenProdCatIds.add(c.id);
        categoryIds.push(c.id);
      }
    }

    const createdAt =
      rawProduct.createdAt ??
      rawProduct.date_created ??
      `${version}T00:00:00.000Z`;

    products.push({
      id: rawProduct.id,
      slug: rawProduct.slug,
      name: decodeHtmlEntities(rawProduct.name).trim(),
      sku: rawProduct.sku ?? "",
      inStock: Boolean(rawProduct.is_in_stock),
      categoryIds,
      priceMin,
      priceMax,
      highlights: extractHighlights(rawProduct.short_description),
      descriptionHtml: rawProduct.description ?? "",
      specs,
      images,
      attributes: productAttributes,
      variants,
      createdAt,
    });
  }

  const attributes = Array.from(globalAttributes.entries()).map(
    ([slug, entry]) => ({
      slug,
      name: entry.name,
      terms: Array.from(entry.terms.values()),
    })
  );

  return {
    version,
    categories,
    attributes,
    products,
  };
}

const STORE_API_BASE = "https://parbek.com.tr/wp-json/wc/store/v1";

async function fetchPaginatedEndpoint(urlBase) {
  const firstUrl = `${urlBase}${urlBase.includes("?") ? "&" : "?"}per_page=100&page=1`;
  const firstRes = await fetch(firstUrl);
  if (!firstRes.ok) {
    throw new Error(`Failed to fetch ${firstUrl}: HTTP ${firstRes.status}`);
  }
  const firstPageData = await firstRes.json();
  const totalPagesHeader = firstRes.headers.get("x-wp-totalpages");
  const totalPages = totalPagesHeader
    ? Number.parseInt(totalPagesHeader, 10)
    : 1;

  const allItems = [...firstPageData];
  const batchSize = 5;

  for (let startPage = 2; startPage <= totalPages; startPage += batchSize) {
    const pages = [];
    for (
      let p = startPage;
      p < startPage + batchSize && p <= totalPages;
      p += 1
    ) {
      pages.push(p);
    }

    const batchResults = await Promise.all(
      pages.map(async (page) => {
        const pageUrl = `${urlBase}${urlBase.includes("?") ? "&" : "?"}per_page=100&page=${page}`;
        const res = await fetch(pageUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch ${pageUrl}: HTTP ${res.status}`);
        }
        return await res.json();
      })
    );

    for (const items of batchResults) {
      allItems.push(...items);
    }
  }

  return allItems;
}

async function runCli() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(__dirname, "..");
  const assetsDir = path.join(repoRoot, "public", "assets");
  const outputFile = path.join(repoRoot, "public", "data", "catalog.json");

  const [categories, products, variations] = await Promise.all([
    fetchPaginatedEndpoint(`${STORE_API_BASE}/products/categories`),
    fetchPaginatedEndpoint(`${STORE_API_BASE}/products`),
    fetchPaginatedEndpoint(`${STORE_API_BASE}/products?type=variation`),
  ]);

  const catalog = buildCatalogFromStoreApi({
    categories,
    products,
    variations,
    assetsDir,
  });

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(
    outputFile,
    `${JSON.stringify(catalog, null, 2)}\n`,
    "utf-8"
  );

  console.log(
    `Built catalog.json: ${catalog.categories.length} categories, ${catalog.attributes.length} attributes, ${catalog.products.length} products.`
  );
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  runCli().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

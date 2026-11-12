const ALLOWED_PER_PAGE = new Set([9, 12, 18, 24]);

const TURKISH_CHAR_MAP = {
  İ: "i",
  I: "i",
  ı: "i",
  i: "i",
  Ş: "s",
  ş: "s",
  Ğ: "g",
  ğ: "g",
  Ü: "u",
  ü: "u",
  Ö: "o",
  ö: "o",
  Ç: "c",
  ç: "c",
  Â: "a",
  â: "a",
  Î: "i",
  î: "i",
  Û: "u",
  û: "u",
};

export function normalizeTurkishSearch(value) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[İIıiŞşĞğÜüÖöÇçÂâÎîÛû]/g, (ch) => TURKISH_CHAR_MAP[ch] || ch)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function stripRenkSuffix(slug) {
  return slug.endsWith("-renk") && slug.length > 5 ? slug.slice(0, -5) : slug;
}

function termsMatch(slugA, slugB) {
  if (typeof slugA !== "string" || typeof slugB !== "string") return false;
  const a = slugA.trim();
  const b = slugB.trim();
  if (!a || !b) return false;
  return a === b || stripRenkSuffix(a) === stripRenkSuffix(b);
}

function isIndexedCatalog(catalog) {
  return Boolean(
    catalog &&
    catalog.productsBySlug instanceof Map &&
    catalog.productsById instanceof Map &&
    catalog.categoriesBySlug instanceof Map &&
    catalog.categoriesById instanceof Map &&
    catalog.childrenByCategoryId instanceof Map &&
    catalog.descendantCategoryIdsBySlug instanceof Map &&
    catalog.attributesBySlug instanceof Map
  );
}

export function indexCatalog(rawCatalog) {
  if (isIndexedCatalog(rawCatalog)) {
    return rawCatalog;
  }

  const version = rawCatalog?.version;
  const categories = Array.isArray(rawCatalog?.categories)
    ? rawCatalog.categories
    : [];
  const attributes = Array.isArray(rawCatalog?.attributes)
    ? rawCatalog.attributes
    : [];
  const products = Array.isArray(rawCatalog?.products)
    ? rawCatalog.products
    : [];

  const productsBySlug = new Map();
  const productsById = new Map();
  for (const product of products) {
    if (!product) continue;
    productsBySlug.set(product.slug, product);
    productsById.set(product.id, product);
  }

  const categoriesBySlug = new Map();
  const categoriesById = new Map();
  const childrenByCategoryId = new Map();
  for (const category of categories) {
    if (!category) continue;
    categoriesBySlug.set(category.slug, category);
    categoriesById.set(category.id, category);

    const parentKey = category.parentId ?? null;
    if (!childrenByCategoryId.has(parentKey)) {
      childrenByCategoryId.set(parentKey, []);
    }
    childrenByCategoryId.get(parentKey).push(category);
  }

  const descendantCategoryIdsBySlug = new Map();
  for (const category of categories) {
    if (!category) continue;
    const descendantIds = new Set();
    const stack = [category.id];
    while (stack.length > 0) {
      const currentId = stack.pop();
      if (descendantIds.has(currentId)) continue;
      descendantIds.add(currentId);
      const children = childrenByCategoryId.get(currentId) || [];
      for (const child of children) {
        if (!descendantIds.has(child.id)) {
          stack.push(child.id);
        }
      }
    }
    descendantCategoryIdsBySlug.set(category.slug, descendantIds);
  }

  const attributesBySlug = new Map();
  for (const attribute of attributes) {
    if (!attribute) continue;
    const terms = Array.isArray(attribute.terms) ? attribute.terms : [];
    const termsBySlug = new Map();
    for (const term of terms) {
      if (!term) continue;
      termsBySlug.set(term.slug, term);
    }
    attributesBySlug.set(attribute.slug, {
      ...attribute,
      termsBySlug,
    });
  }

  return {
    version,
    categories,
    attributes,
    products,
    productsBySlug,
    productsById,
    categoriesBySlug,
    categoriesById,
    childrenByCategoryId,
    descendantCategoryIdsBySlug,
    attributesBySlug,
  };
}

function parseActiveAttributes(attributesParam) {
  const active = new Map();
  if (!attributesParam || typeof attributesParam !== "object") {
    return active;
  }
  for (const [attrSlug, rawTerms] of Object.entries(attributesParam)) {
    const list = Array.isArray(rawTerms)
      ? rawTerms
      : typeof rawTerms === "string"
        ? [rawTerms]
        : [];
    const cleaned = list
      .filter((t) => typeof t === "string")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (cleaned.length > 0) {
      active.set(attrSlug, cleaned);
    }
  }
  return active;
}

function productMatchesCategory(product, allowedCategoryIds) {
  if (!allowedCategoryIds) return false;
  if (!Array.isArray(product?.categoryIds)) return false;
  return product.categoryIds.some((id) => allowedCategoryIds.has(id));
}

function productMatchesAttribute(product, attrSlug, selectedTerms) {
  const productTerms = product?.attributes?.[attrSlug];
  if (!Array.isArray(productTerms) || productTerms.length === 0) {
    return false;
  }
  return selectedTerms.some((selected) =>
    productTerms.some((prodTerm) => termsMatch(selected, prodTerm))
  );
}

function productMatchesAllAttributes(
  product,
  activeAttributes,
  ignoredAttrSlug = null
) {
  for (const [attrSlug, selectedTerms] of activeAttributes.entries()) {
    if (attrSlug === ignoredAttrSlug) continue;
    if (!productMatchesAttribute(product, attrSlug, selectedTerms)) {
      return false;
    }
  }
  return true;
}

function productMatchesSearch(product, normalizedSearch) {
  if (!normalizedSearch) return true;
  if (normalizeTurkishSearch(product?.name ?? "").includes(normalizedSearch)) {
    return true;
  }
  return normalizeTurkishSearch(product?.sku ?? "").includes(normalizedSearch);
}

function compareCreatedAtDesc(a, b) {
  const timeA = a?.createdAt ? Date.parse(a.createdAt) : 0;
  const timeB = b?.createdAt ? Date.parse(b.createdAt) : 0;
  if (!Number.isNaN(timeA) && !Number.isNaN(timeB) && timeA !== timeB) {
    return timeB - timeA;
  }
  const strA = String(a?.createdAt ?? "");
  const strB = String(b?.createdAt ?? "");
  if (strA !== strB) {
    return strB.localeCompare(strA);
  }
  return (b?.id ?? 0) - (a?.id ?? 0);
}

function comparePriceAsc(a, b) {
  const minDiff = (a?.priceMin ?? 0) - (b?.priceMin ?? 0);
  if (minDiff !== 0) return minDiff;
  return (a?.id ?? 0) - (b?.id ?? 0);
}

function comparePriceDesc(a, b) {
  const minDiff = (b?.priceMin ?? 0) - (a?.priceMin ?? 0);
  if (minDiff !== 0) return minDiff;
  const maxDiff = (b?.priceMax ?? 0) - (a?.priceMax ?? 0);
  if (maxDiff !== 0) return maxDiff;
  return (b?.id ?? 0) - (a?.id ?? 0);
}

function getComparator(sort) {
  if (sort === "price-asc" || sort === "fiyat-artan") {
    return comparePriceAsc;
  }
  if (sort === "price-desc" || sort === "fiyat-azalan") {
    return comparePriceDesc;
  }
  return compareCreatedAtDesc;
}

export function queryProducts(catalog, params = {}) {
  const indexed = indexCatalog(catalog);
  const safeParams = params && typeof params === "object" ? params : {};

  const categorySlug =
    typeof safeParams.categorySlug === "string"
      ? safeParams.categorySlug.trim()
      : "";
  const hasCategoryFilter = categorySlug.length > 0;
  const allowedCategoryIds = hasCategoryFilter
    ? indexed.descendantCategoryIdsBySlug.get(categorySlug)
    : null;

  const activeAttributes = parseActiveAttributes(safeParams.attributes);
  const inStockOnly = safeParams.inStockOnly === true;
  const normalizedSearch = normalizeTurkishSearch(
    safeParams.search ?? ""
  ).trim();

  // Pre-compute per-product filter flags once for query and disjunctive facets
  const productFlags = indexed.products.map((product) => {
    const matchesCategory = hasCategoryFilter
      ? productMatchesCategory(product, allowedCategoryIds)
      : true;
    const matchesSearch = productMatchesSearch(product, normalizedSearch);
    const matchesStock = !inStockOnly || product.inStock === true;
    const matchesAllAttrs = productMatchesAllAttributes(
      product,
      activeAttributes
    );

    return {
      product,
      matchesCategory,
      matchesSearch,
      matchesStock,
      matchesAllAttrs,
    };
  });

  // 1. Products matching all active filters
  const matchingProducts = [];
  // 2. Products matching non-category filters (attributes + inStockOnly + search)
  const nonCategoryProducts = [];
  // 3. Products matching category + search (for availableAttributes)
  const categoryAndSearchProducts = [];
  // 4. Products matching category + attributes + search, ignoring inStockOnly (for inStockCount)
  let inStockCount = 0;

  for (const entry of productFlags) {
    const {
      product,
      matchesCategory,
      matchesSearch,
      matchesStock,
      matchesAllAttrs,
    } = entry;

    if (matchesCategory && matchesSearch) {
      categoryAndSearchProducts.push(product);
    }

    if (matchesSearch && matchesStock && matchesAllAttrs) {
      nonCategoryProducts.push(product);
    }

    if (matchesCategory && matchesSearch && matchesAllAttrs) {
      if (product.inStock === true) {
        inStockCount += 1;
      }
      if (matchesStock) {
        matchingProducts.push(product);
      }
    }
  }

  // Facets: categories
  const categoryFacets = {};
  for (const category of indexed.categories) {
    const descendantIds = indexed.descendantCategoryIdsBySlug.get(
      category.slug
    );
    let count = 0;
    for (const product of nonCategoryProducts) {
      if (productMatchesCategory(product, descendantIds)) {
        count += 1;
      }
    }
    categoryFacets[category.slug] = count;
  }

  // Facets: disjunctive attributes
  const attributeFacets = {};
  for (const attribute of indexed.attributes) {
    const attrSlug = attribute.slug;
    const termCounts = {};
    const terms = Array.isArray(attribute.terms) ? attribute.terms : [];

    const disjunctivePool = [];
    for (const entry of productFlags) {
      if (
        entry.matchesCategory &&
        entry.matchesSearch &&
        entry.matchesStock &&
        productMatchesAllAttributes(entry.product, activeAttributes, attrSlug)
      ) {
        disjunctivePool.push(entry.product);
      }
    }

    for (const term of terms) {
      let count = 0;
      for (const product of disjunctivePool) {
        if (productMatchesAttribute(product, attrSlug, [term.slug])) {
          count += 1;
        }
      }
      termCounts[term.slug] = count;
    }

    attributeFacets[attrSlug] = termCounts;
  }

  // Facets: availableAttributes (preserving catalog.attributes order)
  const availableAttributes = indexed.attributes.filter((attribute) => {
    if (activeAttributes.has(attribute.slug)) {
      return true;
    }
    return categoryAndSearchProducts.some((product) => {
      const productTerms = product?.attributes?.[attribute.slug];
      return Array.isArray(productTerms) && productTerms.length > 0;
    });
  });

  // Sort matching products
  const sortedProducts = [...matchingProducts].sort(
    getComparator(safeParams.sort)
  );

  // Pagination
  const numericPerPage = Number(safeParams.perPage);
  const perPage = ALLOWED_PER_PAGE.has(numericPerPage) ? numericPerPage : 12;

  const rawPage = Number(safeParams.page);
  const page =
    Number.isFinite(rawPage) && Math.floor(rawPage) >= 1
      ? Math.floor(rawPage)
      : 1;

  const total = sortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const startIndex = (page - 1) * perPage;
  const items = sortedProducts.slice(startIndex, startIndex + perPage);

  return {
    items,
    total,
    page,
    perPage,
    totalPages,
    facets: {
      categories: categoryFacets,
      attributes: attributeFacets,
      availableAttributes,
      inStockCount,
    },
  };
}

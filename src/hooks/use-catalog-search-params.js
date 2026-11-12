import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

const DEFAULT_KNOWN_ATTRIBUTE_SLUGS = [
  "lineer-urun-boyutu",
  "lineer-kasa-rengi",
  "lineer-aydinlatma-rengi",
  "lineer-kasa-yuksekligi",
  "urun-boyutu",
  "avize-rengi",
  "aydinlatma-rengi",
  "sarkit-avize-rengi",
];

const ATTRIBUTE_ALIASES = {
  renk: "avize-rengi",
  boyut: "urun-boyutu",
  isik: "aydinlatma-rengi",
};

const ALLOWED_PER_PAGE = new Set([9, 12, 18, 24]);

function normalizeSortParam(rawSort) {
  if (rawSort === "fiyat-artan" || rawSort === "price-asc") {
    return "fiyat-artan";
  }
  if (rawSort === "fiyat-azalan" || rawSort === "price-desc") {
    return "fiyat-azalan";
  }
  return "en-yeni";
}

export function parseCatalogSearchParams(
  searchParams,
  knownAttributeSlugs = DEFAULT_KNOWN_ATTRIBUTE_SLUGS
) {
  const sp =
    searchParams instanceof URLSearchParams
      ? searchParams
      : new URLSearchParams(
          typeof searchParams === "string" ? searchParams : ""
        );

  const rawStok = sp.get("stok");
  const inStockOnly = rawStok === "1" || rawStok === "true";

  const sort = normalizeSortParam(sp.get("sirala"));

  const rawPage = Number(sp.get("sayfa"));
  const page =
    Number.isFinite(rawPage) && Math.floor(rawPage) >= 1
      ? Math.floor(rawPage)
      : 1;

  const rawPerPage = Number(sp.get("goster"));
  const perPage = ALLOWED_PER_PAGE.has(rawPerPage) ? rawPerPage : 12;

  const rawSearch = sp.get("q");
  const search = typeof rawSearch === "string" ? rawSearch.trim() : "";

  const knownSet = new Set(
    Array.isArray(knownAttributeSlugs)
      ? knownAttributeSlugs
      : DEFAULT_KNOWN_ATTRIBUTE_SLUGS
  );
  const attributeTermSets = new Map();

  for (const [key, rawValue] of sp.entries()) {
    const mappedAlias = ATTRIBUTE_ALIASES[key];
    const canonicalSlug =
      mappedAlias && knownSet.has(mappedAlias)
        ? mappedAlias
        : knownSet.has(key)
          ? key
          : null;

    if (!canonicalSlug || typeof rawValue !== "string") {
      continue;
    }

    const terms = rawValue
      .split(",")
      .map((term) => term.trim())
      .filter((term) => term.length > 0);

    if (terms.length === 0) {
      continue;
    }

    if (!attributeTermSets.has(canonicalSlug)) {
      attributeTermSets.set(canonicalSlug, new Set());
    }
    const termSet = attributeTermSets.get(canonicalSlug);
    for (const term of terms) {
      termSet.add(term);
    }
  }

  const attributes = {};
  for (const [attrSlug, termSet] of attributeTermSets.entries()) {
    if (termSet.size > 0) {
      attributes[attrSlug] = Array.from(termSet);
    }
  }

  return {
    inStockOnly,
    sort,
    page,
    perPage,
    search,
    attributes,
  };
}

export function serializeCatalogSearchParams(params = {}) {
  const safe = params && typeof params === "object" ? params : {};
  const sp = new URLSearchParams();

  if (safe.inStockOnly === true) {
    sp.set("stok", "1");
  }

  const sort = normalizeSortParam(safe.sort);
  if (sort === "fiyat-artan" || sort === "fiyat-azalan") {
    sp.set("sirala", sort);
  }

  const rawPage = Number(safe.page);
  if (Number.isFinite(rawPage) && Math.floor(rawPage) > 1) {
    sp.set("sayfa", String(Math.floor(rawPage)));
  }

  const rawPerPage = Number(safe.perPage);
  if (ALLOWED_PER_PAGE.has(rawPerPage) && rawPerPage !== 12) {
    sp.set("goster", String(rawPerPage));
  }

  const search = typeof safe.search === "string" ? safe.search.trim() : "";
  if (search.length > 0) {
    sp.set("q", search);
  }

  if (safe.attributes && typeof safe.attributes === "object") {
    for (const [attrSlug, rawTerms] of Object.entries(safe.attributes)) {
      if (!Array.isArray(rawTerms)) continue;
      const deduplicated = Array.from(
        new Set(
          rawTerms
            .filter((term) => typeof term === "string")
            .map((term) => term.trim())
            .filter((term) => term.length > 0)
        )
      );
      if (deduplicated.length > 0) {
        sp.set(attrSlug, deduplicated.join(","));
      }
    }
  }

  return sp;
}

export function useCatalogSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(
    () => parseCatalogSearchParams(searchParams),
    [searchParams]
  );

  const setParams = useCallback(
    (patchOrUpdater) => {
      setSearchParams((prevSearchParams) => {
        const currentParams = parseCatalogSearchParams(prevSearchParams);
        const nextPatch =
          typeof patchOrUpdater === "function"
            ? patchOrUpdater(currentParams)
            : patchOrUpdater;
        const mergedParams = {
          ...currentParams,
          ...(nextPatch && typeof nextPatch === "object" ? nextPatch : {}),
        };
        return serializeCatalogSearchParams(mergedParams);
      });
    },
    [setSearchParams]
  );

  return {
    params,
    setParams,
    searchParams,
  };
}

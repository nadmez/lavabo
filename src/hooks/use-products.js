import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { indexCatalog, queryProducts } from "@/data/catalog-query";

export function catalogQueryOptions() {
  return {
    queryKey: ["catalog"],
    staleTime: Infinity,
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.BASE_URL}data/catalog.json`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch catalog.json: HTTP ${response.status} ${response.statusText || ""}`.trim()
        );
      }
      const json = await response.json();
      return indexCatalog(json);
    },
  };
}

export function useCatalog() {
  return useQuery(catalogQueryOptions());
}

function normalizeProductQueryParams(params = {}) {
  const safe = params && typeof params === "object" ? params : {};
  const rawPage = Number(safe.page);
  const rawPerPage = Number(safe.perPage);

  return {
    categorySlug:
      typeof safe.categorySlug === "string" ? safe.categorySlug.trim() : "",
    inStockOnly: safe.inStockOnly === true,
    sort:
      typeof safe.sort === "string" && safe.sort.trim().length > 0
        ? safe.sort.trim()
        : "en-yeni",
    page:
      Number.isFinite(rawPage) && Math.floor(rawPage) >= 1
        ? Math.floor(rawPage)
        : 1,
    perPage: Number.isFinite(rawPerPage) && rawPerPage > 0 ? rawPerPage : 12,
    search: typeof safe.search === "string" ? safe.search.trim() : "",
    attributes:
      safe.attributes && typeof safe.attributes === "object"
        ? safe.attributes
        : {},
  };
}

export function useProducts(params = {}) {
  const queryClient = useQueryClient();
  const normalizedParams = normalizeProductQueryParams(params);

  return useQuery({
    queryKey: ["products", normalizedParams],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const indexedCatalog = await queryClient.ensureQueryData(
        catalogQueryOptions()
      );
      return queryProducts(indexedCatalog, normalizedParams);
    },
  });
}

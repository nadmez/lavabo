import { useEffect, useMemo, useState } from "react";
import ActiveFilterChips from "@/components/catalog/ActiveFilterChips";
import Breadcrumbs from "@/components/catalog/Breadcrumbs";
import FilterSidebar, { termsMatch } from "@/components/catalog/FilterSidebar";
import ListingToolbar from "@/components/catalog/ListingToolbar";
import LoadingSkeleton from "@/components/catalog/LoadingSkeleton";
import MobileFilterDrawer from "@/components/catalog/MobileFilterDrawer";
import Pagination from "@/components/catalog/Pagination";
import ProductCard from "@/components/catalog/ProductCard";
import { queryProducts } from "@/data/catalog-query";
import { useCatalogSearchParams } from "@/hooks/use-catalog-search-params";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useCatalog, useProducts } from "@/hooks/use-products";

export default function SearchResultsPage() {
  const { params, setParams } = useCatalogSearchParams();
  const [searchInput, setSearchInput] = useState(params.search);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  useEffect(() => {
    setSearchInput(params.search);
  }, [params.search]);

  const {
    data: catalog,
    isError: isCatalogError,
    error: catalogError,
    refetch: refetchCatalog,
  } = useCatalog();
  const {
    data: productsData,
    isPending,
    isError,
    error,
    refetch: refetchProducts,
  } = useProducts(params);

  const data = useMemo(() => {
    if (catalog) {
      return queryProducts(catalog, params);
    }
    return productsData;
  }, [catalog, productsData, params]);

  const headingTitle = params.search
    ? `"${params.search}" için arama sonuçları`
    : "Arama Sonuçları";

  const metaTitle = params.search
    ? `"${params.search}" Arama Sonuçları`
    : "Arama Sonuçları";

  usePageMeta({
    title: metaTitle,
  });

  if (isPending && !data) {
    return (
      <div
        data-testid="search-results-placeholder"
        className="mx-auto max-w-6xl space-y-6 px-6 py-12"
      >
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          {headingTitle}
        </h1>
        <LoadingSkeleton count={6} variant="grid" />
      </div>
    );
  }

  if ((isError || isCatalogError) && !data) {
    const resolvedError = error || catalogError;
    return (
      <div
        data-testid="search-results-placeholder"
        className="mx-auto max-w-6xl px-6 py-12"
      >
        <div
          role="alert"
          data-testid="catalog-error-state"
          className="rounded border border-red-300 bg-red-50 p-4 text-red-800"
        >
          <p>
            Katalog verileri yüklenemedi:{" "}
            {resolvedError?.message || "Bilinmeyen hata"}
          </p>
          <button
            type="button"
            data-testid="catalog-retry-button"
            onClick={() => {
              refetchCatalog();
              refetchProducts();
            }}
            className="mt-3 inline-flex items-center rounded-md bg-red-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  const items = Array.isArray(data?.items) ? data.items : [];

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setParams({
      search: searchInput.trim(),
      page: 1,
    });
  };

  const handleToggleInStock = (nextInStock) => {
    setParams({
      inStockOnly: Boolean(nextInStock),
      page: 1,
    });
  };

  const handleRemoveInStock = () => {
    setParams({
      inStockOnly: false,
      page: 1,
    });
  };

  const handleToggleAttributeTerm = (attrSlug, termSlug) => {
    setParams((currentParams) => {
      const currentAttributes = currentParams.attributes || {};
      const existingTerms = Array.isArray(currentAttributes[attrSlug])
        ? currentAttributes[attrSlug]
        : [];
      const isSelected = existingTerms.some((t) => termsMatch(t, termSlug));
      const nextTerms = isSelected
        ? existingTerms.filter((t) => !termsMatch(t, termSlug))
        : [...existingTerms, termSlug];

      const nextAttributes = { ...currentAttributes };
      if (nextTerms.length > 0) {
        nextAttributes[attrSlug] = nextTerms;
      } else {
        delete nextAttributes[attrSlug];
      }

      return {
        attributes: nextAttributes,
        page: 1,
      };
    });
  };

  const handleRemoveAttributeTerm = (attrSlug, termSlug) => {
    setParams((currentParams) => {
      const currentAttributes = currentParams.attributes || {};
      const existingTerms = Array.isArray(currentAttributes[attrSlug])
        ? currentAttributes[attrSlug]
        : [];
      const nextTerms = existingTerms.filter((t) => !termsMatch(t, termSlug));

      const nextAttributes = { ...currentAttributes };
      if (nextTerms.length > 0) {
        nextAttributes[attrSlug] = nextTerms;
      } else {
        delete nextAttributes[attrSlug];
      }

      return {
        attributes: nextAttributes,
        page: 1,
      };
    });
  };

  const handleClearAllFilters = () => {
    setParams({
      inStockOnly: false,
      attributes: {},
      page: 1,
    });
  };

  return (
    <div
      data-testid="search-results-placeholder"
      className="mx-auto max-w-6xl px-6 py-8"
    >
      <Breadcrumbs catalog={catalog} fallbackLabel="Arama Sonuçları" />

      <header className="mb-6 space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          {headingTitle}
        </h1>

        <form
          data-testid="search-page-form"
          onSubmit={handleSearchSubmit}
          className="flex max-w-xl items-center gap-2"
        >
          <input
            type="search"
            data-testid="search-page-input"
            aria-label="Arama terimi"
            placeholder="Ürün adı veya stok kodu..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none"
          />
          <button
            type="submit"
            data-testid="search-page-submit"
            className="inline-flex items-center justify-center rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800"
          >
            Ara
          </button>
        </form>
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside
          data-testid="desktop-filter-sidebar"
          aria-label="Ürün filtreleri"
          className="hidden w-64 shrink-0 lg:sticky lg:top-6 lg:block"
        >
          <FilterSidebar
            catalog={catalog}
            facets={data?.facets}
            categorySlug=""
            inStockOnly={params.inStockOnly}
            attributes={params.attributes}
            onToggleInStock={handleToggleInStock}
            onToggleAttributeTerm={handleToggleAttributeTerm}
          />
        </aside>

        <div className="min-w-0 flex-1">
          <ListingToolbar
            total={data?.total ?? 0}
            page={data?.page ?? params.page}
            totalPages={data?.totalPages ?? 1}
            sort={params.sort}
            perPage={params.perPage}
            inStockOnly={params.inStockOnly}
            isFilterDrawerOpen={isFilterDrawerOpen}
            onOpenMobileFilters={() => setIsFilterDrawerOpen(true)}
            onSortChange={(nextSort) => setParams({ sort: nextSort, page: 1 })}
            onPerPageChange={(nextPerPage) =>
              setParams({ perPage: nextPerPage, page: 1 })
            }
          />

          <ActiveFilterChips
            catalog={catalog}
            inStockOnly={params.inStockOnly}
            attributes={params.attributes}
            onRemoveInStock={handleRemoveInStock}
            onRemoveAttributeTerm={handleRemoveAttributeTerm}
            onClearAll={handleClearAllFilters}
          />

          <ul
            data-testid="debug-product-list"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                catalog={catalog}
              />
            ))}
          </ul>

          {items.length === 0 ? (
            <div
              data-testid="empty-catalog-results"
              className="mt-6 rounded-lg border border-stone-200 bg-stone-50 p-8 text-center text-stone-600"
            >
              Aradığınız kriterlere uygun ürün bulunamadı.
            </div>
          ) : null}

          <Pagination
            page={data?.page ?? params.page}
            totalPages={data?.totalPages ?? 1}
            onPageChange={(nextPage) => setParams({ page: nextPage })}
          />
        </div>
      </div>

      <MobileFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        catalog={catalog}
        facets={data?.facets}
        categorySlug=""
        inStockOnly={params.inStockOnly}
        attributes={params.attributes}
        onToggleInStock={handleToggleInStock}
        onToggleAttributeTerm={handleToggleAttributeTerm}
      />
    </div>
  );
}

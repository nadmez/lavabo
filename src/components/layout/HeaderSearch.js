import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { QueryClientContext } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { queryProducts } from "@/data/catalog-query";
import { catalogQueryOptions } from "@/hooks/use-products";
import { formatProductPriceRange } from "@/utils/format-price";
import { handleImageError, resolveAssetUrl } from "@/utils/image-url";

export default function HeaderSearch() {
  const navigate = useNavigate();
  const queryClient = useContext(QueryClientContext);
  const formRef = useRef(null);

  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [, setCacheVersion] = useState(0);

  useEffect(() => {
    if (!queryClient) return undefined;
    const cache = queryClient.getQueryCache();
    return cache.subscribe((event) => {
      if (
        event?.type === "updated" &&
        event?.query?.queryKey?.[0] === "catalog"
      ) {
        setCacheVersion((v) => v + 1);
      }
    });
  }, [queryClient]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handlePointerOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerOutside);
    document.addEventListener("click", handlePointerOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerOutside);
      document.removeEventListener("click", handlePointerOutside);
    };
  }, [isOpen]);

  const ensureCatalogLoaded = () => {
    if (queryClient && !queryClient.getQueryData(["catalog"])) {
      queryClient.ensureQueryData(catalogQueryOptions()).catch(() => {});
    }
  };

  const trimmedQuery = value.trim();
  const catalog = queryClient ? queryClient.getQueryData(["catalog"]) : null;

  const searchResult = useMemo(() => {
    if (!catalog || !trimmedQuery) {
      return null;
    }
    return queryProducts(catalog, {
      search: trimmedQuery,
      perPage: 9,
    });
  }, [catalog, trimmedQuery]);

  const matches = useMemo(
    () => (searchResult ? searchResult.items.slice(0, 6) : []),
    [searchResult]
  );
  const total = searchResult ? searchResult.total : 0;

  const handleChange = (event) => {
    const nextValue = event.target.value;
    setValue(nextValue);
    ensureCatalogLoaded();
    if (nextValue.trim().length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleFocus = () => {
    ensureCatalogLoaded();
    if (trimmedQuery.length > 0) {
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    setValue("");
    setIsOpen(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsOpen(false);
    if (trimmedQuery.length > 0) {
      navigate(`/arama?q=${encodeURIComponent(trimmedQuery)}`);
    } else {
      navigate("/arama");
    }
  };

  const showDropdown = isOpen && trimmedQuery.length > 0 && Boolean(catalog);

  return (
    <form
      ref={formRef}
      role="search"
      data-testid="header-search-form"
      onSubmit={handleSubmit}
      className="relative flex items-center"
    >
      <div className="relative flex items-center">
        <input
          type="search"
          data-testid="header-search-input"
          aria-label="Ürün veya stok kodu ara"
          placeholder="Aradığınız ürünleri görmek için yazmaya başlayın..."
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          className="w-44 rounded-l-full border border-r-0 border-stone-200 bg-stone-50 py-1.5 pr-7 pl-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none sm:w-64"
        />

        {trimmedQuery.length > 0 ? (
          <button
            type="button"
            data-testid="header-search-clear"
            aria-label="Aramayı temizle"
            onClick={handleClear}
            className="absolute right-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs text-stone-400 hover:bg-stone-200 hover:text-stone-700"
          >
            ✕
          </button>
        ) : null}
      </div>

      <button
        type="submit"
        data-testid="header-search-trigger"
        aria-label="Ürün ara"
        className="inline-flex items-center gap-1.5 rounded-r-full border border-stone-200 bg-white px-3.5 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-100"
      >
        <span aria-hidden="true">⌕</span>
        <span className="hidden sm:inline">Ara</span>
      </button>

      {showDropdown ? (
        <div
          data-testid="header-search-dropdown"
          role="region"
          aria-label="Canlı arama sonuçları"
          className="absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl sm:w-96"
        >
          {matches.length > 0 ? (
            <>
              <ul
                data-testid="header-search-results-list"
                className="divide-y divide-stone-100"
              >
                {matches.map((product) => (
                  <li key={product.id} data-testid="header-search-result-item">
                    <Link
                      to={`/urun/${product.slug}`}
                      data-testid={`header-search-result-link-${product.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 p-3 transition-colors hover:bg-stone-50"
                    >
                      <img
                        src={resolveAssetUrl(product.images?.[0])}
                        alt={product.name}
                        onError={handleImageError}
                        className="h-12 w-12 shrink-0 rounded-md border border-stone-200 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-stone-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-stone-500">{product.sku}</p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-stone-900">
                        {formatProductPriceRange(
                          product.priceMin,
                          product.priceMax
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              {total > 0 ? (
                <div className="border-t border-stone-200 bg-stone-50 p-2.5 text-center">
                  <Link
                    to={`/arama?q=${encodeURIComponent(trimmedQuery)}`}
                    data-testid="header-search-view-all"
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-semibold text-amber-800 hover:underline"
                  >
                    Tüm sonuçları gör ({total})
                  </Link>
                </div>
              ) : null}
            </>
          ) : (
            <p
              data-testid="header-search-no-results"
              className="p-4 text-center text-sm text-stone-500"
            >
              Sonuç bulunamadı
            </p>
          )}
        </div>
      ) : null}
    </form>
  );
}

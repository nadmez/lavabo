import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { QueryClientContext } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { queryProducts } from "@/data/catalog-query";
import { catalogQueryOptions } from "@/hooks/use-products";
import { formatCatalogPriceRange } from "@/utils/format-price";
import { handleImageError, resolveAssetUrl } from "@/utils/image-url";

export default function HeaderSearch() {
  const navigate = useNavigate();
  const queryClient = useContext(QueryClientContext);
  const formRef = useRef(null);
  const inputRef = useRef(null);

  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFieldOpen, setIsFieldOpen] = useState(false);
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
    if (!isFieldOpen) return undefined;
    inputRef.current?.focus();
  }, [isFieldOpen]);

  useEffect(() => {
    if (!isOpen && !isFieldOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setIsFieldOpen(false);
      }
    };

    const handlePointerOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsFieldOpen(false);
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
  }, [isOpen, isFieldOpen]);

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
      setIsFieldOpen(true);
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

  const closeField = () => {
    setIsOpen(false);
    setIsFieldOpen(false);
  };

  const handleOpenField = () => {
    setIsFieldOpen(true);
    ensureCatalogLoaded();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    closeField();
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
      <div
        data-testid="header-search-panel"
        hidden={!isFieldOpen}
        className="absolute top-0 right-full z-10 mr-2"
      >
        <input
          ref={inputRef}
          type="search"
          data-testid="header-search-input"
          aria-label="Ürün veya stok kodu ara"
          placeholder="Aradığınız ürünleri görmek için yazmaya başlayın..."
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          className="hide-search-cancel h-[42px] w-72 rounded-full border border-[rgba(0,0,0,0.106)] bg-white pr-9 pl-4 text-sm text-[#333] outline-none placeholder:text-[#767676]"
        />

        {trimmedQuery.length > 0 ? (
          <button
            type="button"
            data-testid="header-search-clear"
            aria-label="Aramayı temizle"
            onClick={handleClear}
            className="absolute top-1/2 right-2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-xs text-[#767676] hover:bg-stone-100 hover:text-[#333]"
          >
            ✕
          </button>
        ) : null}
      </div>

      <button
        type="button"
        data-testid="header-search-trigger"
        aria-label="Ürün ara"
        aria-expanded={isFieldOpen}
        onClick={handleOpenField}
        className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-[rgba(0,0,0,0.106)] bg-white text-[#333] hover:bg-stone-50"
      >
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
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
                      onClick={closeField}
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
                        {formatCatalogPriceRange(
                          product.priceMin,
                          product.priceMax,
                          catalog
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
                    onClick={closeField}
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

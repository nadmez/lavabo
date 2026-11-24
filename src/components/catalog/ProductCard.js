import { QueryClientContext } from "@tanstack/react-query";
import { useContext, useState } from "react";
import { Link } from "react-router";
import QuickViewModal from "@/components/catalog/QuickViewModal";
import { formatCatalogPriceRange } from "@/utils/format-price";
import { handleImageError, resolveAssetUrl } from "@/utils/image-url";

export default function ProductCard({ product, catalog = null, onQuickView }) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const queryClient = useContext(QueryClientContext);
  const resolvedCatalog =
    catalog || queryClient?.getQueryData?.(["catalog"]) || null;

  if (!product) return null;

  const isInStock = product.inStock === true;
  const productUrl = `/urun/${product.slug}`;

  function handleQuickViewClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (typeof onQuickView === "function") {
      onQuickView(product);
      return;
    }
    setIsQuickViewOpen(true);
  }

  return (
    <li
      data-testid="product-card"
      className="group relative flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xs transition hover:shadow-md"
    >
      <Link
        to={productUrl}
        data-testid="product-card-link"
        className="flex flex-1 flex-col"
      >
        <div className="relative aspect-square w-full overflow-hidden bg-stone-100">
          <img
            loading="lazy"
            src={resolveAssetUrl(product.images?.[0])}
            alt={product.name}
            onError={handleImageError}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <div className="absolute top-2.5 left-2.5">
            {isInStock ? (
              <span
                data-testid="product-stock-badge"
                className="inline-block rounded bg-emerald-700 px-2 py-0.5 text-xs font-medium text-white"
              >
                Stokta
              </span>
            ) : (
              <span
                data-testid="product-out-of-stock-badge"
                className="inline-block rounded bg-stone-600 px-2 py-0.5 text-xs font-medium text-white"
              >
                Stokta Yok
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <p className="text-xs text-stone-500">{product.sku}</p>
            <h3 className="mt-1 text-base font-semibold text-stone-900 group-hover:text-amber-700">
              {product.name}
            </h3>
          </div>

          <p
            data-testid="product-card-price"
            className="mt-3 text-base font-bold text-stone-900"
          >
            {formatCatalogPriceRange(
              product.priceMin,
              product.priceMax,
              catalog
            )}
          </p>
        </div>
      </Link>

      <div className="px-4 pb-4">
        <button
          type="button"
          data-testid={`quick-view-trigger-${product.slug}`}
          aria-label={`${product.name} hızlı görünüm`}
          onClick={handleQuickViewClick}
          className="w-full rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100 hover:text-stone-900"
        >
          Hızlı görünüm
        </button>
      </div>

      {typeof onQuickView !== "function" ? (
        <QuickViewModal
          isOpen={isQuickViewOpen}
          product={product}
          catalog={resolvedCatalog}
          onClose={() => setIsQuickViewOpen(false)}
        />
      ) : null}
    </li>
  );
}

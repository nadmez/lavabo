import { Link } from "react-router";
import { formatProductPriceRange } from "@/utils/format-price";
import { handleImageError, resolveAssetUrl } from "@/utils/image-url";

export default function ProductCard({ product }) {
  if (!product) return null;

  const isInStock = product.inStock === true;
  const productUrl = `/urun/${product.slug}`;

  return (
    <li
      data-testid="product-card"
      className="group flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xs transition hover:shadow-md"
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
            <h2 className="mt-1 text-base font-semibold text-stone-900 group-hover:text-amber-700">
              {product.name}
            </h2>
          </div>

          <p
            data-testid="product-card-price"
            className="mt-3 text-base font-bold text-stone-900"
          >
            {formatProductPriceRange(product.priceMin, product.priceMax)}
          </p>
        </div>
      </Link>
    </li>
  );
}

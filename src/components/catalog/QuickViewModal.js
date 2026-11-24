import { QueryClientContext } from "@tanstack/react-query";
import { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { resolveAttributeTerm } from "@/components/catalog/VariantSelector";
import { formatCatalogPriceRange } from "@/utils/format-price";
import { handleImageError, resolveAssetUrl } from "@/utils/image-url";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function QuickViewModal({
  isOpen = false,
  product = null,
  catalog = null,
  onClose,
}) {
  const queryClient = useContext(QueryClientContext);
  const resolvedCatalog =
    catalog || queryClient?.getQueryData?.(["catalog"]) || null;

  const [activeIndex, setActiveIndex] = useState(0);
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);

  const productSlug = product?.slug || "";
  const productId = product?.id ?? "";

  useEffect(() => {
    setActiveIndex(0);
  }, [isOpen, productSlug, productId]);

  useEffect(() => {
    if (!isOpen || !product) {
      return undefined;
    }

    closeBtnRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
        return;
      }

      if (event.key === "Tab" && modalRef.current) {
        const focusables = Array.from(
          modalRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
        );
        if (focusables.length === 0) {
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey) {
          if (
            document.activeElement === first ||
            !modalRef.current.contains(document.activeElement)
          ) {
            event.preventDefault();
            last.focus();
          }
        } else if (
          document.activeElement === last ||
          !modalRef.current.contains(document.activeElement)
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, product, onClose]);

  if (!isOpen || !product) {
    return null;
  }

  const images = Array.isArray(product.images) ? product.images : [];
  const activeImage = images[activeIndex] || images[0] || "";
  const isInStock = product.inStock === true;

  const highlights = Array.isArray(product.highlights)
    ? product.highlights.filter(
        (item) => typeof item === "string" && item.trim().length > 0
      )
    : [];

  const rawAttributes =
    product.attributes && typeof product.attributes === "object"
      ? product.attributes
      : {};
  const attributeEntries = Object.entries(rawAttributes).filter(
    ([, termSlugs]) => Array.isArray(termSlugs) && termSlugs.length > 0
  );

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} hızlı görünüm`}
      data-testid="quick-view-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        data-testid="quick-view-backdrop"
        onClick={() => onClose?.()}
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs"
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-end">
          <button
            ref={closeBtnRef}
            type="button"
            data-testid="quick-view-close"
            aria-label="Hızlı görünümü kapat"
            onClick={() => onClose?.()}
            className="rounded-md p-1.5 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="aspect-square w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
              <img
                data-testid="quick-view-main-image"
                src={resolveAssetUrl(activeImage)}
                alt={product.name}
                onError={handleImageError}
                className="h-full w-full object-cover"
              />
            </div>

            {images.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {images.map((imgPath, index) => {
                  const isSelected = index === activeIndex;
                  return (
                    <button
                      key={`${imgPath}-${index}`}
                      type="button"
                      data-testid={`quick-view-thumb-${index}`}
                      aria-label={`${product.name} görsel ${index + 1}`}
                      aria-pressed={isSelected}
                      onClick={() => setActiveIndex(index)}
                      className={`h-14 w-14 overflow-hidden rounded-md border-2 transition ${
                        isSelected
                          ? "border-stone-900 ring-1 ring-stone-900"
                          : "border-stone-200 opacity-75 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={resolveAssetUrl(imgPath)}
                        alt=""
                        onError={handleImageError}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2.5">
                  <span
                    data-testid="quick-view-stock"
                    className={`inline-block rounded px-2.5 py-0.5 text-xs font-semibold text-white ${
                      isInStock ? "bg-emerald-700" : "bg-stone-600"
                    }`}
                  >
                    {isInStock ? "Stokta" : "Stokta Yok"}
                  </span>
                  <span
                    data-testid="quick-view-sku"
                    className="text-xs text-stone-500"
                  >
                    {product.sku}
                  </span>
                </div>

                <h2
                  data-testid="quick-view-title"
                  className="text-xl font-bold text-stone-900"
                >
                  {product.name}
                </h2>

                <p
                  data-testid="quick-view-price"
                  className="mt-2 text-xl font-bold text-stone-900"
                >
                  {formatCatalogPriceRange(
                    product.priceMin,
                    product.priceMax,
                    resolvedCatalog
                  )}
                </p>
              </div>

              {highlights.length > 0 ? (
                <ul
                  data-testid="quick-view-highlights"
                  className="list-inside list-disc space-y-1 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700"
                >
                  {highlights.map((highlight, idx) => (
                    <li key={idx}>{highlight}</li>
                  ))}
                </ul>
              ) : null}

              {attributeEntries.length > 0 ? (
                <div data-testid="quick-view-variants" className="space-y-3">
                  {attributeEntries.map(([attrSlug, termSlugs]) => {
                    const attrMeta =
                      resolvedCatalog?.attributesBySlug instanceof Map
                        ? resolvedCatalog.attributesBySlug.get(attrSlug)
                        : null;
                    const attrName = attrMeta?.name || attrSlug;

                    return (
                      <div
                        key={attrSlug}
                        data-testid={`quick-view-variant-group-${attrSlug}`}
                        className="space-y-1.5"
                      >
                        <div className="text-xs font-semibold text-stone-700">
                          {attrName}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {termSlugs.map((termSlug) => {
                            const term = resolveAttributeTerm(
                              resolvedCatalog,
                              attrSlug,
                              termSlug
                            );
                            const hasSwatch =
                              typeof term?.swatch === "string" &&
                              term.swatch.trim().length > 0;

                            return (
                              <span
                                key={termSlug}
                                data-testid={`quick-view-variant-term-${attrSlug}-${termSlug}`}
                                className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-800"
                              >
                                {hasSwatch ? (
                                  <span
                                    style={{ backgroundColor: term.swatch }}
                                    className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-stone-300"
                                  />
                                ) : null}
                                <span>{term?.name || termSlug}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="pt-2">
              <Link
                to={`/urun/${product.slug}`}
                data-testid="quick-view-product-link"
                onClick={() => onClose?.()}
                className="inline-flex w-full items-center justify-center rounded-md bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                Ürün Detayına Git
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useParams } from "react-router";
import Breadcrumbs from "@/components/catalog/Breadcrumbs";
import { termsMatch } from "@/components/catalog/FilterSidebar";
import ProductCard from "@/components/catalog/ProductCard";
import ProductGallery from "@/components/catalog/ProductGallery";
import VariantSelector, {
  resolveAttributeTerm,
} from "@/components/catalog/VariantSelector";
import { useCatalog } from "@/hooks/use-products";
import {
  formatProductPriceRange,
  formatTryCurrency,
} from "@/utils/format-price";

function stripEmbedShortcodes(rawHtml) {
  if (typeof rawHtml !== "string" || !rawHtml.trim()) {
    return "";
  }
  return rawHtml.replace(/\[embed\][\s\S]*?\[\/embed\]/gi, "").trim();
}

function getSimilarProducts(catalog, product) {
  const allProducts = Array.isArray(catalog?.products) ? catalog.products : [];
  const productCatIds = new Set(
    Array.isArray(product?.categoryIds) ? product.categoryIds : []
  );

  if (productCatIds.size === 0) {
    return [];
  }

  return allProducts
    .filter((p) => p && p.id !== product.id && Array.isArray(p.categoryIds))
    .map((p) => {
      let sharedCount = 0;
      for (const catId of p.categoryIds) {
        if (productCatIds.has(catId)) {
          sharedCount += 1;
        }
      }
      return { product: p, sharedCount };
    })
    .filter((entry) => entry.sharedCount > 0)
    .sort((a, b) => {
      if (b.sharedCount !== a.sharedCount) {
        return b.sharedCount - a.sharedCount;
      }
      return (a.product.id ?? 0) - (b.product.id ?? 0);
    })
    .slice(0, 4)
    .map((entry) => entry.product);
}

function ProductDetailContent({ product, catalog }) {
  const [selectedTerms, setSelectedTerms] = useState({});
  const [activeTab, setActiveTab] = useState("description");

  const products = Array.isArray(catalog?.products) ? catalog.products : [];
  const productIndex = products.findIndex(
    (p) => p && (p.id === product.id || p.slug === product.slug)
  );
  const prevProduct = productIndex > 0 ? products[productIndex - 1] : null;
  const nextProduct =
    productIndex >= 0 && productIndex < products.length - 1
      ? products[productIndex + 1]
      : null;

  const rawAttributes =
    product.attributes && typeof product.attributes === "object"
      ? product.attributes
      : {};
  const attributeEntries = Object.entries(rawAttributes).filter(
    ([, termSlugs]) => Array.isArray(termSlugs) && termSlugs.length > 0
  );
  const attributeKeys = attributeEntries.map(([attrSlug]) => attrSlug);

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const activeSelectedEntries = Object.entries(selectedTerms).filter(
    ([, termSlug]) => typeof termSlug === "string" && termSlug.trim().length > 0
  );

  const matchingVariants = variants.filter((variant) => {
    const vTerms = variant?.terms;
    if (!vTerms || typeof vTerms !== "object") return false;
    return activeSelectedEntries.every(([attrSlug, termSlug]) =>
      termsMatch(vTerms[attrSlug], termSlug)
    );
  });

  const allAttributesSelected =
    attributeKeys.length > 0 &&
    attributeKeys.every(
      (attrSlug) =>
        typeof selectedTerms[attrSlug] === "string" &&
        selectedTerms[attrSlug].trim().length > 0
    );

  const matchedVariant =
    allAttributesSelected && matchingVariants.length > 0
      ? matchingVariants[0]
      : null;

  let formattedPrice = "";
  if (matchedVariant) {
    formattedPrice = formatTryCurrency(matchedVariant.price);
  } else if (activeSelectedEntries.length > 0 && matchingVariants.length > 0) {
    const prices = matchingVariants
      .map((v) => v.price)
      .filter((p) => typeof p === "number" && Number.isFinite(p));
    const minPrice = prices.length > 0 ? Math.min(...prices) : product.priceMin;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : product.priceMax;
    formattedPrice = formatProductPriceRange(minPrice, maxPrice);
  } else {
    formattedPrice = formatProductPriceRange(
      product.priceMin,
      product.priceMax
    );
  }

  const displayedSku = matchedVariant
    ? matchedVariant.sku || product.sku
    : product.sku;

  const isInStock = matchedVariant
    ? matchedVariant.inStock === true
    : product.inStock === true;

  const variantImage =
    matchedVariant &&
    typeof matchedVariant.image === "string" &&
    matchedVariant.image.trim().length > 0
      ? matchedVariant.image.trim()
      : null;

  const highlights = Array.isArray(product.highlights)
    ? product.highlights.filter(
        (item) => typeof item === "string" && item.trim().length > 0
      )
    : [];

  const sanitizedDescriptionHtml = stripEmbedShortcodes(
    product.descriptionHtml
  );

  const specEntries =
    product.specs && typeof product.specs === "object"
      ? Object.entries(product.specs)
      : [];

  const similarProducts = getSimilarProducts(catalog, product);

  function handleSelectTerm(attrSlug, termSlug) {
    setSelectedTerms((prev) => {
      const next = { ...prev };
      if (next[attrSlug] && termsMatch(next[attrSlug], termSlug)) {
        delete next[attrSlug];
      } else {
        next[attrSlug] = termSlug;
      }
      return next;
    });
  }

  function handleClearTerms() {
    setSelectedTerms({});
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Breadcrumbs catalog={catalog} product={product} />

        <nav
          data-testid="product-prev-next-nav"
          aria-label="Ürün gezinme"
          className="flex flex-wrap items-center gap-3 text-xs font-medium text-stone-600"
        >
          <Link
            to="/urunlerimiz"
            data-testid="back-to-products-link"
            className="rounded border border-stone-200 bg-white px-2.5 py-1 hover:border-stone-400 hover:text-stone-900"
          >
            Ürünlere geri dön
          </Link>

          {prevProduct ? (
            <Link
              to={`/urun/${prevProduct.slug}`}
              data-testid="prev-product-link"
              className="rounded border border-stone-200 bg-white px-2.5 py-1 hover:border-stone-400 hover:text-stone-900"
            >
              <span>Önceki Ürün: </span>
              <span className="font-semibold">{prevProduct.name}</span>
            </Link>
          ) : null}

          {nextProduct ? (
            <Link
              to={`/urun/${nextProduct.slug}`}
              data-testid="next-product-link"
              className="rounded border border-stone-200 bg-white px-2.5 py-1 hover:border-stone-400 hover:text-stone-900"
            >
              <span>Sonraki Ürün: </span>
              <span className="font-semibold">{nextProduct.name}</span>
            </Link>
          ) : null}
        </nav>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ProductGallery
          key={product.slug}
          product={product}
          images={product.images}
          variantImage={variantImage}
        />

        <div className="space-y-6">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <span
                data-testid="product-detail-stock"
                className={`inline-block rounded px-2.5 py-0.5 text-xs font-semibold text-white ${
                  isInStock ? "bg-emerald-700" : "bg-stone-600"
                }`}
              >
                {isInStock ? "Stokta" : "Stokta Yok"}
              </span>
              <span
                data-testid="product-detail-sku"
                className="text-xs text-stone-500"
              >
                {displayedSku}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              {product.name}
            </h1>

            <p
              data-testid="product-detail-price"
              className="mt-3 text-2xl font-bold text-stone-900"
            >
              {formattedPrice}
            </p>
          </div>

          <VariantSelector
            product={product}
            catalog={catalog}
            selectedTerms={selectedTerms}
            onSelectTerm={handleSelectTerm}
            onClear={handleClearTerms}
          />

          {highlights.length > 0 ? (
            <ul
              data-testid="product-highlights"
              className="list-inside list-disc space-y-1.5 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700"
            >
              {highlights.map((highlight, idx) => (
                <li key={idx}>{highlight}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="mt-12 border-t border-stone-200 pt-8">
        <div
          role="tablist"
          aria-label="Ürün detay sekmeleri"
          data-testid="product-detail-tabs"
          className="flex gap-4 border-b border-stone-200"
        >
          <button
            type="button"
            role="tab"
            data-testid="tab-btn-description"
            aria-selected={activeTab === "description"}
            onClick={() => setActiveTab("description")}
            className={`border-b-2 pb-3 text-sm font-semibold transition ${
              activeTab === "description"
                ? "border-stone-900 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Açıklama
          </button>
          <button
            type="button"
            role="tab"
            data-testid="tab-btn-specs"
            aria-selected={activeTab === "specs"}
            onClick={() => setActiveTab("specs")}
            className={`border-b-2 pb-3 text-sm font-semibold transition ${
              activeTab === "specs"
                ? "border-stone-900 text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            Ek bilgi
          </button>
        </div>

        <div className="mt-6">
          {activeTab === "description" ? (
            <div
              role="tabpanel"
              data-testid="tab-panel-description"
              className="prose prose-stone max-w-none text-sm leading-relaxed text-stone-700"
              dangerouslySetInnerHTML={{ __html: sanitizedDescriptionHtml }}
            />
          ) : (
            <div role="tabpanel" data-testid="tab-panel-specs">
              <table
                data-testid="product-specs-table"
                className="w-full border-collapse text-left text-sm"
              >
                <tbody className="divide-y divide-stone-200 border-y border-stone-200">
                  {specEntries.map(([key, value]) => (
                    <tr key={`spec-${key}`}>
                      <th className="w-1/3 bg-stone-50 px-4 py-3 font-semibold text-stone-800">
                        {key}
                      </th>
                      <td className="px-4 py-3 text-stone-700">
                        {String(value)}
                      </td>
                    </tr>
                  ))}
                  {attributeEntries.map(([attrSlug, termSlugs]) => {
                    const attrMeta =
                      catalog?.attributesBySlug instanceof Map
                        ? catalog.attributesBySlug.get(attrSlug)
                        : null;
                    const attrName = attrMeta?.name || attrSlug;
                    const termNames = termSlugs
                      .map(
                        (termSlug) =>
                          resolveAttributeTerm(catalog, attrSlug, termSlug)
                            ?.name || termSlug
                      )
                      .join(", ");

                    return (
                      <tr key={`attr-${attrSlug}`}>
                        <th className="w-1/3 bg-stone-50 px-4 py-3 font-semibold text-stone-800">
                          {attrName}
                        </th>
                        <td className="px-4 py-3 text-stone-700">
                          {termNames}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {similarProducts.length > 0 ? (
        <section
          data-testid="similar-products-section"
          aria-label="Benzer ürünler"
          className="mt-12 border-t border-stone-200 pt-10"
        >
          <h2 className="mb-6 text-xl font-bold text-stone-900">
            Benzer Ürünler
          </h2>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {similarProducts.map((simProduct) => (
              <ProductCard key={simProduct.id} product={simProduct} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const normalizedSlug = typeof slug === "string" ? slug.trim() : "";
  const { data: catalog, isPending, isError, error } = useCatalog();

  if (isPending && !catalog) {
    return (
      <section
        data-testid="product-detail-placeholder"
        className="mx-auto max-w-6xl px-6 py-12"
      >
        <p>Yükleniyor...</p>
        <span className="sr-only">{normalizedSlug}</span>
      </section>
    );
  }

  if (isError) {
    return (
      <section
        data-testid="product-detail-placeholder"
        className="mx-auto max-w-6xl px-6 py-12"
      >
        <div
          role="alert"
          className="rounded border border-red-300 bg-red-50 p-4 text-red-800"
        >
          Katalog verileri yüklenemedi: {error?.message || "Bilinmeyen hata"}
        </div>
        <span className="sr-only">{normalizedSlug}</span>
      </section>
    );
  }

  const product =
    normalizedSlug && catalog?.productsBySlug instanceof Map
      ? catalog.productsBySlug.get(normalizedSlug)
      : null;

  if (!product) {
    return (
      <section
        data-testid="product-detail-placeholder"
        className="mx-auto max-w-6xl px-6 py-12"
      >
        <div
          data-testid="product-not-found"
          className="rounded-lg border border-stone-200 bg-stone-50 p-8 text-center"
        >
          <h1 className="text-2xl font-bold text-stone-900">Ürün Bulunamadı</h1>
          <p className="mt-2 text-stone-600">
            Aradığınız ürün katalogda mevcut değil.
          </p>
          <div className="mt-6">
            <Link
              to="/urunlerimiz"
              className="inline-flex items-center rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
            >
              Tüm Ürünlere Dön
            </Link>
          </div>
        </div>
        <span className="sr-only">{normalizedSlug}</span>
      </section>
    );
  }

  return (
    <section
      data-testid="product-detail-placeholder"
      className="mx-auto max-w-6xl px-6 py-8"
    >
      <span className="sr-only">{normalizedSlug}</span>
      <ProductDetailContent
        key={product.slug}
        product={product}
        catalog={catalog}
      />
    </section>
  );
}

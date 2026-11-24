import { Link } from "react-router";
import LoadingSkeleton from "@/components/catalog/LoadingSkeleton";
import ProductCard from "@/components/catalog/ProductCard";
import { getHomeShowcaseSections, queryProducts } from "@/data/catalog-query";
import { HOME_SHOWCASE_SECTIONS } from "@/data/home-sections";
import {
  DEFAULT_META_DESCRIPTION,
  DEFAULT_PAGE_TITLE,
  brandMetaProps,
  usePageMeta,
} from "@/hooks/use-page-meta";
import { useCatalog } from "@/hooks/use-products";

export { HOME_SHOWCASE_SECTIONS };

function productsForSection(catalog, section) {
  if (section.uncategorized) {
    return (catalog.products || [])
      .filter(
        (product) =>
          !Array.isArray(product?.categoryIds) ||
          product.categoryIds.length === 0
      )
      .slice(0, section.limit);
  }
  const allowed = [9, 12, 18, 24];
  const perPage = allowed.find((size) => size >= section.limit) || 24;
  const result = queryProducts(catalog, {
    categorySlug: section.categorySlug,
    perPage,
  });
  return Array.isArray(result?.items)
    ? result.items.slice(0, section.limit)
    : [];
}

export default function HomePage() {
  const { data: catalog, isPending, isError, error, refetch } = useCatalog();
  const settings = catalog?.siteSettings;

  usePageMeta({
    title: settings?.metaTitle || DEFAULT_PAGE_TITLE,
    description: settings?.metaDescription || DEFAULT_META_DESCRIPTION,
    ...brandMetaProps(catalog),
  });

  const categories = Array.isArray(catalog?.categories)
    ? catalog.categories
    : [];
  const products = Array.isArray(catalog?.products) ? catalog.products : [];
  const isEmptyCatalog = categories.length === 0 && products.length === 0;
  const sections = catalog ? getHomeShowcaseSections(catalog) : [];

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-6 py-10">
      {isPending && !catalog ? (
        <LoadingSkeleton count={8} variant="grid" />
      ) : isError ? (
        <div
          role="alert"
          data-testid="catalog-error-state"
          className="rounded border border-red-300 bg-red-50 p-4 text-red-800"
        >
          <p>
            Katalog verileri yüklenemedi: {error?.message || "Bilinmeyen hata"}
          </p>
          <button
            type="button"
            data-testid="catalog-retry-button"
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center rounded-md bg-red-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Tekrar Dene
          </button>
        </div>
      ) : isEmptyCatalog ? (
        <section
          data-testid="empty-catalog-state"
          className="rounded-lg border border-stone-200 bg-white p-10 text-center"
        >
          <h1 className="text-2xl font-bold text-stone-900">
            Katalog henüz boş
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-stone-600">
            Kategori, nitelik ve ürün ekleyerek bu vitrini doldurabilirsiniz.
          </p>
          <Link
            to="/admin"
            className="mt-6 inline-flex items-center rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
          >
            Yönetim paneline git
          </Link>
        </section>
      ) : (
        <div className="space-y-14">
          {sections.map((section) => {
            const items = productsForSection(catalog, section);
            const href =
              section.uncategorized || !section.categorySlug
                ? "/arama"
                : `/kategori/${section.categorySlug}`;

            return (
              <section
                key={section.key}
                data-testid={`home-section-${section.key}`}
                aria-label={section.title}
                className="space-y-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                      {section.title}
                    </h2>
                    {section.intro ? (
                      <p className="mt-2 max-w-3xl text-sm text-stone-600">
                        {section.intro}
                      </p>
                    ) : null}
                  </div>
                  <Link
                    to={href}
                    data-testid={`home-section-link-${section.key}`}
                    className="inline-flex shrink-0 items-center rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:border-stone-400 hover:bg-stone-100"
                  >
                    {section.ctaLabel}
                  </Link>
                </div>

                <ul
                  data-testid={`home-section-grid-${section.key}`}
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
                >
                  {items.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      catalog={catalog}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

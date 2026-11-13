import { Link } from "react-router";
import LoadingSkeleton from "@/components/catalog/LoadingSkeleton";
import ProductCard from "@/components/catalog/ProductCard";
import { queryProducts } from "@/data/catalog-query";
import {
  DEFAULT_META_DESCRIPTION,
  DEFAULT_PAGE_TITLE,
  usePageMeta,
} from "@/hooks/use-page-meta";
import { useCatalog } from "@/hooks/use-products";

export const HOME_SHOWCASE_SECTIONS = [
  {
    key: "plafonyer",
    categorySlug: "plafonyer-led-avize",
    title: "Plafonyer Led Avize Modelleri",
    intro:
      "Plafonyer led avize modern sarkıt led avize modellerimiz sizin için sürekli güncellenmektedir.",
    ctaLabel: "Diğer Led Avize Ürünleri",
    limit: 8,
  },
  {
    key: "lineer",
    categorySlug: "lineer-aydinlatma",
    title: "Sarkıt ve Sıva Üstü Lineer Led Armatürler",
    intro:
      "Modern ofis ve mimari aydınlatma projeleriniz için sarkıt ve sıva üstü lineer led armatür modellerimiz sizin için sürekli güncellenmektedir.",
    ctaLabel: "Diğer Lineer Ürünleri",
    limit: 8,
  },
  {
    key: "aplik",
    categorySlug: "aplikler",
    title: "Led Aplik Lamba Ürünleri",
    intro:
      "Telefon tutucu özellikli başucu led aydınlatma aplik lamba modelleri sadece Lavabo Aydınlatma'da!",
    ctaLabel: "Diğer Aplik Ürünleri",
    limit: 4,
  },
];

export default function HomePage() {
  usePageMeta({
    title: DEFAULT_PAGE_TITLE,
    description: DEFAULT_META_DESCRIPTION,
  });

  const { data: catalog, isPending, isError, error, refetch } = useCatalog();

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
      ) : (
        <div className="space-y-14">
          {HOME_SHOWCASE_SECTIONS.map((section) => {
            const result = catalog
              ? queryProducts(catalog, {
                  categorySlug: section.categorySlug,
                  perPage: 12,
                })
              : null;
            const items = Array.isArray(result?.items)
              ? result.items.slice(0, section.limit)
              : [];

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
                    <p className="mt-2 max-w-3xl text-sm text-stone-600">
                      {section.intro}
                    </p>
                  </div>
                  <Link
                    to={`/kategori/${section.categorySlug}`}
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

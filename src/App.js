import { Link, Route, Routes, useSearchParams } from "react-router";
import Layout from "@/components/layout/Layout";
import ProductDetailPage from "@/pages/ProductDetailPage";
import ProductListingPage from "@/pages/ProductListingPage";
import "./styles/placeholder.scss";

function HomePlaceholder() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">
          Lavabo Aydınlatma Katalog
        </h1>
        <p className="mt-2 text-stone-600">
          Faz 1 kurulum doğrulaması: React 18, React Router 7, TanStack Query 5,
          Tailwind CSS 4 ve yerel SCSS.
        </p>
      </header>

      <section
        data-testid="scss-demo-box"
        className="scss-demo-box shadow-sm"
        aria-label="Katalog önizleme kutusu"
      >
        <span className="scss-demo-box__badge">Katalog Önizleme</span>
        <p className="mt-1 text-sm text-stone-800">
          Yerli Üretim LED Aydınlatma Kataloğu — 101 ürün fotoğrafı{" "}
          <code className="rounded bg-stone-200/70 px-1.5 py-0.5 text-xs">
            assets/
          </code>{" "}
          klasöründe hazır.
        </p>
      </section>
    </div>
  );
}

function SearchResultsPlaceholder() {
  const [searchParams] = useSearchParams();
  const rawQuery = searchParams.get("q");
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";

  return (
    <section
      data-testid="search-results-placeholder"
      className="mx-auto max-w-4xl px-6 py-12"
    >
      <h1 className="text-2xl font-bold text-stone-900">Arama Sonuçları</h1>
      <p className="mt-2 text-stone-600">
        {query ? `"${query}" için arama sonuçları` : "Arama terimi giriniz."}
      </p>
    </section>
  );
}

function NotFoundPage() {
  return (
    <section
      data-testid="not-found-page"
      className="mx-auto max-w-2xl px-6 py-16 text-center"
    >
      <h1 className="text-3xl font-bold text-stone-900">Sayfa Bulunamadı</h1>
      <p className="mt-2 text-stone-600">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex items-center rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
        >
          Anasayfaya Dön
        </Link>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePlaceholder />} />
        <Route path="/urunlerimiz" element={<ProductListingPage />} />
        <Route path="/kategori/:slug" element={<ProductListingPage />} />
        <Route path="/urun/:slug" element={<ProductDetailPage />} />
        <Route path="/arama" element={<SearchResultsPlaceholder />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

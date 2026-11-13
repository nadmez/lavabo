import { Link, Route, Routes } from "react-router";
import Layout from "@/components/layout/Layout";
import { usePageMeta } from "@/hooks/use-page-meta";
import HomePage from "@/pages/HomePage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import ProductListingPage from "@/pages/ProductListingPage";
import SearchResultsPage from "@/pages/SearchResultsPage";
import "./styles/placeholder.scss";

function NotFoundPage() {
  usePageMeta({
    title: "Sayfa Bulunamadı",
  });

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
        <Route index element={<HomePage />} />
        <Route path="/kategori/:slug" element={<ProductListingPage />} />
        <Route path="/urun/:slug" element={<ProductDetailPage />} />
        <Route path="/arama" element={<SearchResultsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

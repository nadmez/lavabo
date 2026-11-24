import { Link, Route, Routes } from "react-router";
import AdminAuthGate from "@/components/admin/AdminAuthGate";
import AdminLayout from "@/components/admin/AdminLayout";
import Layout from "@/components/layout/Layout";
import { brandMetaProps, usePageMeta } from "@/hooks/use-page-meta";
import { useCachedCatalog } from "@/hooks/use-cached-catalog";
import AdminAttributesPage from "@/pages/admin/AdminAttributesPage";
import AdminCategoriesPage from "@/pages/admin/AdminCategoriesPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminProductEditorPage from "@/pages/admin/AdminProductEditorPage";
import AdminProductsPage from "@/pages/admin/AdminProductsPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import HomePage from "@/pages/HomePage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import ProductListingPage from "@/pages/ProductListingPage";
import SearchResultsPage from "@/pages/SearchResultsPage";
import "./styles/placeholder.scss";

function NotFoundPage() {
  const catalog = useCachedCatalog();
  usePageMeta({
    title: "Sayfa Bulunamadı",
    ...brandMetaProps(catalog),
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

function AdminShell() {
  return (
    <AdminAuthGate>
      <AdminLayout />
    </AdminAuthGate>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminShell />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="kategoriler" element={<AdminCategoriesPage />} />
        <Route path="nitelikler" element={<AdminAttributesPage />} />
        <Route path="urunler" element={<AdminProductsPage />} />
        <Route path="urunler/yeni" element={<AdminProductEditorPage />} />
        <Route path="urunler/:id" element={<AdminProductEditorPage />} />
        <Route path="ayarlar" element={<AdminSettingsPage />} />
      </Route>
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

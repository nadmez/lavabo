import { useState } from "react";
import { Link } from "react-router";
import { adminFetch } from "@/admin/api";
import { useAdminCatalog } from "@/admin/use-admin-catalog";

export default function AdminDashboardPage() {
  const {
    data: catalog,
    isPending,
    isError,
    error,
    invalidate,
  } = useAdminCatalog();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const products = catalog?.products || [];
  const inStock = products.filter((product) => product.inStock === true).length;

  async function run(task) {
    setBusy(true);
    setMessage("");
    try {
      await task();
      await invalidate();
    } catch (err) {
      setMessage(err.message || "İşlem başarısız.");
    } finally {
      setBusy(false);
    }
  }

  function exportCatalog() {
    const blob = new Blob([JSON.stringify(catalog, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "catalog.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importCatalog(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const text = await file.text();
    const json = JSON.parse(text);
    await adminFetch("/api/admin/catalog", { method: "PUT", body: json });
    setMessage("Katalog içe aktarıldı.");
  }

  if (isPending) return <p>Yükleniyor...</p>;
  if (isError) {
    return (
      <p role="alert" className="text-red-700">
        {error.message}
      </p>
    );
  }

  return (
    <div data-testid="admin-dashboard" className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Özet</h1>
        <p className="mt-1 text-sm text-stone-600">
          {catalog.siteSettings?.siteName || "Katalog"} verilerini buradan
          yönetin.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article
          data-testid="admin-metric-products"
          className="rounded-lg border border-stone-200 bg-white p-4"
        >
          <p className="text-xs uppercase text-stone-500">Ürün</p>
          <p className="mt-2 text-2xl font-bold">{products.length}</p>
          <p className="text-xs text-stone-500">
            {inStock} stokta / {products.length - inStock} stokta yok
          </p>
        </article>
        <article
          data-testid="admin-metric-categories"
          className="rounded-lg border border-stone-200 bg-white p-4"
        >
          <p className="text-xs uppercase text-stone-500">Kategori</p>
          <p className="mt-2 text-2xl font-bold">
            {catalog.categories?.length || 0}
          </p>
        </article>
        <article
          data-testid="admin-metric-attributes"
          className="rounded-lg border border-stone-200 bg-white p-4"
        >
          <p className="text-xs uppercase text-stone-500">Nitelik</p>
          <p className="mt-2 text-2xl font-bold">
            {catalog.attributes?.length || 0}
          </p>
        </article>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          to="/admin/urunler/yeni"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Yeni Ürün Ekle
        </Link>
        <Link
          to="/admin/kategoriler"
          className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium"
        >
          Yeni Kategori Ekle
        </Link>
        <button
          type="button"
          data-testid="admin-export-json"
          onClick={exportCatalog}
          className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium"
        >
          JSON Dışa Aktar
        </button>
        <label className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium">
          JSON İçe Aktar
          <input
            data-testid="admin-import-json"
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => run(() => importCatalog(event))}
          />
        </label>
        <button
          type="button"
          data-testid="admin-load-sample"
          disabled={busy}
          onClick={() =>
            run(async () => {
              await adminFetch("/api/admin/reset", {
                method: "POST",
                body: { mode: "sample" },
              });
              setMessage("Örnek veriler yüklendi.");
            })
          }
          className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium"
        >
          Örnek Verileri Yükle
        </button>
        <button
          type="button"
          data-testid="admin-reset-empty"
          disabled={busy}
          onClick={() =>
            run(async () => {
              if (
                !window.confirm(
                  "Katalog boşaltılsın mı? Bu işlem ürün, kategori ve nitelikleri siler."
                )
              ) {
                return;
              }
              await adminFetch("/api/admin/reset", {
                method: "POST",
                body: { mode: "empty" },
              });
              setMessage("Katalog sıfırlandı.");
            })
          }
          className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800"
        >
          Kataloğu Sıfırla (Boş Katalog)
        </button>
      </div>
      {message ? (
        <p
          data-testid="admin-dashboard-message"
          className="text-sm text-stone-700"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

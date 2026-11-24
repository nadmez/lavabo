import { useState } from "react";
import { Download, Sparkles, Trash2, Upload } from "lucide-react";
import { adminFetch } from "@/admin/api";
import { useAdminCatalog } from "@/admin/use-admin-catalog";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";

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
  const [resetOpen, setResetOpen] = useState(false);

  const products = catalog?.products || [];
  const inStock = products.filter((product) => product.inStock === true).length;
  const outStock = products.length - inStock;
  const inStockPercent = products.length
    ? Math.round((inStock / products.length) * 100)
    : 0;
  const outStockPercent = products.length ? 100 - inStockPercent : 0;

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
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await adminFetch("/api/admin/catalog", { method: "PUT", body: json });
      setMessage("Katalog içe aktarıldı.");
    } catch (err) {
      setMessage(err.message || "İşlem başarısız.");
    }
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
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-stone-600">
          {catalog.siteSettings?.siteName || "Katalog"} verilerini buradan
          yönetin.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[15fr_11fr_11fr_11fr]">
        <article
          data-testid="admin-metric-products"
          className="rounded-lg border border-stone-200 bg-white p-4"
        >
          <p className="text-xs uppercase text-stone-500">Ürün</p>
          <p className="mt-2 text-2xl font-bold">{products.length}</p>
          <p className="text-xs text-stone-500">
            {inStock} stokta / {products.length - inStock} stokta yok
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div
              data-testid="admin-stock-pie"
              role="img"
              aria-label={`Stok durumu: %${inStockPercent} stokta, %${outStockPercent} stokta yok`}
              className="h-20 w-20 shrink-0 rounded-full"
              style={{
                background: `conic-gradient(#047857 0% ${inStockPercent}%, #a8a29e ${inStockPercent}% 100%)`,
              }}
            />
            <ul className="space-y-1 text-xs text-stone-600">
              <li className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" />%
                {inStockPercent} Stokta ({inStock})
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-stone-400" />%
                {outStockPercent} Stokta yok ({outStock})
              </li>
            </ul>
          </div>
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
        <button
          type="button"
          data-testid="admin-export-json"
          onClick={exportCatalog}
          className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium"
        >
          <Download className="h-4 w-4" />
          JSON Dışa Aktar
        </button>
        <label className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium">
          <Upload className="h-4 w-4" />
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
          className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium"
        >
          <Sparkles className="h-4 w-4" />
          Örnek Verileri Yükle
        </button>
        <button
          type="button"
          data-testid="admin-reset-empty"
          disabled={busy}
          onClick={() => setResetOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800"
        >
          <Trash2 className="h-4 w-4" />
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
      <AdminConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Kataloğu Sıfırla"
        description="Katalog boşaltılsın mı? Bu işlem ürün, kategori ve nitelikleri siler."
        confirmLabel="Sıfırla"
        onConfirm={() =>
          run(async () => {
            await adminFetch("/api/admin/reset", {
              method: "POST",
              body: { mode: "empty" },
            });
            setMessage("Katalog sıfırlandı.");
          })
        }
      />
    </div>
  );
}

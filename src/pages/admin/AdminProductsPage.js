import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Copy, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/admin/api";
import { useAdminCatalog } from "@/admin/use-admin-catalog";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import IconButton from "@/components/admin/IconButton";
import { StockBadge } from "@/components/admin/AdminChip";

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const {
    data: catalog,
    isPending,
    isError,
    error,
    invalidate,
  } = useAdminCatalog();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stock, setStock] = useState("");
  const [variant, setVariant] = useState("");
  const [message, setMessage] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const products = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr");
    return (catalog?.products || []).filter((product) => {
      if (categoryId && !product.categoryIds?.includes(Number(categoryId)))
        return false;
      if (stock === "in" && product.inStock !== true) return false;
      if (stock === "out" && product.inStock === true) return false;
      const isVariant = product.variants?.length > 0;
      if (variant === "variant" && !isVariant) return false;
      if (variant === "simple" && isVariant) return false;
      if (!query) return true;
      return (
        product.name.toLocaleLowerCase("tr").includes(query) ||
        String(product.sku || "")
          .toLocaleLowerCase("tr")
          .includes(query)
      );
    });
  }, [catalog, search, categoryId, stock, variant]);

  async function duplicateProduct(product) {
    const copy = {
      ...product,
      name: `${product.name} kopya`,
      slug: `${product.slug}-kopya`,
      sku: product.sku ? `${product.sku}-KOPYA` : "",
    };
    delete copy.id;
    try {
      const saved = await adminFetch("/api/admin/products", {
        method: "POST",
        body: copy,
      });
      await invalidate();
      const created = saved.products.find((item) => item.slug === copy.slug);
      if (created) navigate(`/admin/urunler/${created.id}`);
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function deleteProduct() {
    if (!pendingDelete) return;
    try {
      await adminFetch(`/api/admin/products/${pendingDelete.id}`, {
        method: "DELETE",
      });
      await invalidate();
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (isPending) return <p>Yükleniyor...</p>;
  if (isError) return <p role="alert">{error.message}</p>;

  return (
    <div data-testid="admin-products" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Ürünler</h1>
        <Link
          to="/admin/urunler/yeni"
          className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          Yeni Ürün
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          data-testid="admin-product-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Ad veya stok kodu"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <select
          data-testid="admin-product-category-filter"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="">Tüm kategoriler</option>
          {(catalog.categories || []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          data-testid="admin-product-stock-filter"
          value={stock}
          onChange={(event) => setStock(event.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="">Tüm stok</option>
          <option value="in">Stokta</option>
          <option value="out">Stokta yok</option>
        </select>
        <select
          data-testid="admin-product-variant-filter"
          aria-label="Ürün Tipi"
          value={variant}
          onChange={(event) => setVariant(event.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          <option value="">Tüm ürünler</option>
          <option value="variant">Varyasyonlu</option>
          <option value="simple">Basit</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="min-w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[35%]" />
            <col />
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead className="bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="w-[35%] px-3 py-2">Ürün</th>
              <th className="px-3 py-2">Stok kodu</th>
              <th className="px-3 py-2">Fiyat</th>
              <th className="px-3 py-2">Stok</th>
              <th className="px-3 py-2">Ürün Tipi</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                data-testid={`admin-product-row-${product.slug}`}
                className="border-t border-stone-100"
              >
                <td className="px-3 py-2 align-top font-medium break-words whitespace-normal">
                  {product.name}
                </td>
                <td className="px-3 py-2 align-top">{product.sku}</td>
                <td className="px-3 py-2 align-top">
                  {product.priceMin === product.priceMax
                    ? product.priceMin
                    : `${product.priceMin} – ${product.priceMax}`}
                </td>
                <td className="px-3 py-2 align-top">
                  <StockBadge inStock={product.inStock === true} />
                </td>
                <td className="px-3 py-2 align-top">
                  {product.variants?.length > 0 ? (
                    <span
                      role="img"
                      aria-label="Varyasyonlu ürün"
                      title="Varyasyonlu ürün"
                      className="inline-flex text-stone-700"
                    >
                      <Layers className="h-4 w-4" aria-hidden="true" />
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-right align-top">
                  <div className="flex justify-end gap-1">
                    <Link
                      to={`/admin/urunler/${product.id}`}
                      aria-label="Düzenle"
                      title="Düzenle"
                      className="rounded-md p-2 text-stone-700 hover:bg-stone-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <IconButton
                      label="Çoğalt"
                      onClick={() => duplicateProduct(product)}
                    >
                      <Copy className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label="Sil"
                      danger
                      onClick={() => setPendingDelete(product)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {message ? <p className="text-sm text-red-700">{message}</p> : null}

      <AdminConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Ürünü Sil"
        description={
          pendingDelete ? `"${pendingDelete.name}" silinsin mi?` : ""
        }
        confirmLabel="Sil"
        onConfirm={deleteProduct}
      />
    </div>
  );
}

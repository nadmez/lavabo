import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { adminFetch } from "@/admin/api";
import { useAdminCatalog } from "@/admin/use-admin-catalog";

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
  const [message, setMessage] = useState("");

  const products = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr");
    return (catalog?.products || []).filter((product) => {
      if (categoryId && !product.categoryIds?.includes(Number(categoryId)))
        return false;
      if (stock === "in" && product.inStock !== true) return false;
      if (stock === "out" && product.inStock === true) return false;
      if (!query) return true;
      return (
        product.name.toLocaleLowerCase("tr").includes(query) ||
        String(product.sku || "")
          .toLocaleLowerCase("tr")
          .includes(query)
      );
    });
  }, [catalog, search, categoryId, stock]);

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

  async function deleteProduct(product) {
    if (!window.confirm(`"${product.name}" silinsin mi?`)) return;
    try {
      await adminFetch(`/api/admin/products/${product.id}`, {
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
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Yeni Ürün Ekle
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
      </div>
      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-3 py-2">Ürün</th>
              <th className="px-3 py-2">Stok kodu</th>
              <th className="px-3 py-2">Fiyat</th>
              <th className="px-3 py-2">Stok</th>
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
                <td className="px-3 py-2 font-medium">{product.name}</td>
                <td className="px-3 py-2">{product.sku}</td>
                <td className="px-3 py-2">
                  {product.priceMin === product.priceMax
                    ? product.priceMin
                    : `${product.priceMin} – ${product.priceMax}`}
                </td>
                <td className="px-3 py-2">
                  {product.inStock ? "Stokta" : "Stokta yok"}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    to={`/admin/urunler/${product.id}`}
                    className="mr-3 underline"
                  >
                    Düzenle
                  </Link>
                  <button
                    type="button"
                    onClick={() => duplicateProduct(product)}
                    className="mr-3 underline"
                  >
                    Çoğalt
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProduct(product)}
                    className="text-red-700 underline"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {message ? <p className="text-sm text-red-700">{message}</p> : null}
    </div>
  );
}

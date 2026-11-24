import { Link, useNavigate, useParams } from "react-router";
import AdminProductForm from "@/components/admin/AdminProductForm";
import { useAdminCatalog } from "@/admin/use-admin-catalog";

export default function AdminProductEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "yeni";
  const {
    data: catalog,
    isPending,
    isError,
    error,
    invalidate,
  } = useAdminCatalog();

  if (isPending) return <p>Yükleniyor...</p>;
  if (isError) return <p role="alert">{error.message}</p>;

  const product = isNew
    ? null
    : (catalog?.products || []).find((item) => item.id === Number(id)) || null;

  if (!isNew && !product) {
    return (
      <div className="space-y-4">
        <p>Ürün bulunamadı.</p>
        <Link to="/admin/urunler" className="text-sm underline">
          Listeye dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          {isNew ? "Yeni ürün" : "Ürünü düzenle"}
        </h1>
        <Link to="/admin/urunler" className="text-sm underline">
          Listeye dön
        </Link>
      </div>
      <AdminProductForm
        key={isNew ? "yeni" : id}
        productId={isNew ? null : Number(id)}
        catalog={catalog}
        invalidate={invalidate}
        onCreated={(createdId) => navigate(`/admin/urunler/${createdId}`)}
      />
    </div>
  );
}

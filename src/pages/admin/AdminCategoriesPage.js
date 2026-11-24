import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/admin/api";
import { useAdminCatalog } from "@/admin/use-admin-catalog";
import { collectDescendantIds } from "@/data/catalog-validation";
import { toKebabSlug } from "@/utils/slugify";
import AdminDialog from "@/components/admin/AdminDialog";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import AdminChip from "@/components/admin/AdminChip";
import IconButton from "@/components/admin/IconButton";

function flattenCategories(categories) {
  const byParent = new Map();
  for (const category of categories) {
    const key = category.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(category);
  }
  const rows = [];
  const walk = (parentId, depth) => {
    for (const category of byParent.get(parentId) || []) {
      rows.push({ category, depth });
      walk(category.id, depth + 1);
    }
  };
  walk(null, 0);
  return rows;
}

const emptyForm = {
  id: null,
  name: "",
  slug: "",
  parentId: "",
  descriptionHtml: "",
};

export default function AdminCategoriesPage() {
  const {
    data: catalog,
    isPending,
    isError,
    error,
    invalidate,
  } = useAdminCatalog();
  const [form, setForm] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [message, setMessage] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const rows = useMemo(
    () => flattenCategories(catalog?.categories || []),
    [catalog]
  );
  const excludedParents = useMemo(() => {
    if (!form.id) return new Set();
    return new Set([
      form.id,
      ...collectDescendantIds(catalog?.categories || [], form.id),
    ]);
  }, [catalog, form.id]);

  function closeDialog() {
    setDialogOpen(false);
    setForm(emptyForm);
    setSlugTouched(false);
    setDialogError("");
  }

  function handleDialogChange(open) {
    if (open) setDialogOpen(true);
    else closeDialog();
  }

  function openNew() {
    setForm(emptyForm);
    setSlugTouched(false);
    setDialogError("");
    setDialogOpen(true);
  }

  function editCategory(category) {
    setForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId ?? "",
      descriptionHtml: category.descriptionHtml || "",
    });
    setSlugTouched(true);
    setDialogError("");
    setDialogOpen(true);
  }

  async function saveCategory(event) {
    event.preventDefault();
    setDialogError("");
    const payload = {
      name: form.name,
      slug: form.slug || toKebabSlug(form.name),
      parentId: form.parentId === "" ? null : Number(form.parentId),
      descriptionHtml: form.descriptionHtml,
    };
    try {
      if (form.id) {
        await adminFetch(`/api/admin/categories/${form.id}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        await adminFetch("/api/admin/categories", {
          method: "POST",
          body: payload,
        });
      }
      closeDialog();
      await invalidate();
      setMessage("Kategori kaydedildi.");
    } catch (err) {
      setDialogError(err.message);
    }
  }

  async function deleteCategory() {
    if (!pendingDelete) return;
    const category = pendingDelete;
    try {
      await adminFetch(`/api/admin/categories/${category.id}`, {
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
    <div data-testid="admin-categories" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Kategoriler</h1>
          <AdminChip>{`${catalog?.categories?.length || 0} kategori`}</AdminChip>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          Yeni Kategori
        </button>
      </div>
      {message ? <p className="text-sm text-stone-700">{message}</p> : null}
      <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
        {rows.length === 0 ? (
          <li className="p-4 text-sm text-stone-500">Henüz kategori yok.</li>
        ) : null}
        {rows.map(({ category, depth }) => (
          <li
            key={category.id}
            className="flex items-center justify-between gap-3 px-4 py-3"
            style={{ paddingLeft: `${16 + depth * 20}px` }}
          >
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="text-xs text-stone-500">{category.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <AdminChip>{`${category.count} ürün`}</AdminChip>
              <IconButton
                label="Düzenle"
                onClick={() => editCategory(category)}
              >
                <Pencil className="h-4 w-4" />
              </IconButton>
              <IconButton
                label="Sil"
                danger
                onClick={() => setPendingDelete(category)}
              >
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
          </li>
        ))}
      </ul>

      <AdminDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        title={form.id ? "Kategoriyi düzenle" : "Yeni Kategori"}
        size="md"
      >
        <form
          data-testid="admin-category-form"
          onSubmit={saveCategory}
          className="space-y-3"
        >
          <label className="block text-sm">
            Ad
            <input
              data-testid="admin-category-name"
              value={form.name}
              onChange={(event) => {
                const name = event.target.value;
                setForm((current) => ({
                  ...current,
                  name,
                  slug: slugTouched ? current.slug : toKebabSlug(name),
                }));
              }}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Kısa ad
            <input
              data-testid="admin-category-slug"
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true);
                setForm((current) => ({
                  ...current,
                  slug: event.target.value,
                }));
              }}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Üst kategori
            <select
              data-testid="admin-category-parent"
              value={form.parentId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  parentId: event.target.value,
                }))
              }
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
            >
              <option value="">Yok</option>
              {(catalog.categories || [])
                .filter((category) => !excludedParents.has(category.id))
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-sm">
            Açıklama
            <textarea
              value={form.descriptionHtml}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  descriptionHtml: event.target.value,
                }))
              }
              rows={5}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
          >
            Kaydet
          </button>
          {dialogError ? (
            <p className="text-sm text-red-700">{dialogError}</p>
          ) : null}
        </form>
      </AdminDialog>

      <AdminConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Kategoriyi Sil"
        description={
          pendingDelete ? `"${pendingDelete.name}" silinsin mi?` : ""
        }
        confirmLabel="Sil"
        onConfirm={deleteCategory}
      />
    </div>
  );
}

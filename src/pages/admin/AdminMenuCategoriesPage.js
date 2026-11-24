import CategoryCheckboxList from "@/components/admin/CategoryCheckboxList";
import { useAdminSettingsForm } from "@/pages/admin/use-admin-settings-form";

export default function AdminMenuCategoriesPage() {
  const { catalog, isPending, isError, error, form, setForm, message, save } =
    useAdminSettingsForm();

  if (isPending || !form) return <p>Yükleniyor...</p>;
  if (isError) return <p role="alert">{error.message}</p>;

  return (
    <form
      data-testid="admin-menu-categories"
      onSubmit={save}
      className="max-w-3xl space-y-4"
    >
      <h1 className="text-2xl font-bold">Menü Kategorileri</h1>
      <CategoryCheckboxList
        categories={catalog.categories || []}
        selectedIds={form.navCategoryIds}
        onChange={(navCategoryIds) =>
          setForm((current) => ({ ...current, navCategoryIds }))
        }
        legend="Menüde gösterilecek kategoriler"
        hint="Hiçbiri seçilmezse kök kategoriler menüde görünür."
      />
      <button
        type="submit"
        className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
      >
        Ayarları kaydet
      </button>
      {message ? (
        <p data-testid="admin-settings-message" className="text-sm">
          {message}
        </p>
      ) : null}
    </form>
  );
}

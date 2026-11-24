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
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          Menüde gösterilecek kategoriler
        </legend>
        <p className="text-xs text-stone-500">
          Hiçbiri seçilmezse kök kategoriler menüde görünür.
        </p>
        {(catalog.categories || []).map((category) => (
          <label key={category.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.navCategoryIds.includes(category.id)}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  navCategoryIds: event.target.checked
                    ? [...current.navCategoryIds, category.id]
                    : current.navCategoryIds.filter((id) => id !== category.id),
                }));
              }}
            />
            {category.name}
          </label>
        ))}
      </fieldset>
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

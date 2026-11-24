import { Plus, Trash2 } from "lucide-react";
import { useAdminSettingsForm } from "@/pages/admin/use-admin-settings-form";

function updateSection(form, index, patch) {
  return form.showcaseSections.map((item, itemIndex) =>
    itemIndex === index ? { ...item, ...patch } : item
  );
}

export default function AdminShowcasePage() {
  const { catalog, isPending, isError, error, form, setForm, message, save } =
    useAdminSettingsForm();

  if (isPending || !form) return <p>Yükleniyor...</p>;
  if (isError) return <p role="alert">{error.message}</p>;

  return (
    <form
      data-testid="admin-showcase"
      onSubmit={save}
      className="max-w-3xl space-y-4"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vitrin</h1>
        <button
          type="button"
          onClick={() =>
            setForm((current) => ({
              ...current,
              showcaseSections: [
                ...current.showcaseSections,
                {
                  key: `vitrin-${current.showcaseSections.length + 1}`,
                  categorySlug: catalog.categories?.[0]?.slug || "",
                  title: "",
                  intro: "",
                  ctaLabel: "Tümünü gör",
                  limit: 8,
                },
              ],
            }))
          }
          className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          Vitrin ekle
        </button>
      </div>
      {form.showcaseSections.map((section, index) => (
        <div
          key={index}
          className="grid gap-2 rounded-md border border-stone-200 bg-white p-3 sm:grid-cols-2"
        >
          <input
            aria-label="Vitrin başlığı"
            value={section.title}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                showcaseSections: updateSection(current, index, {
                  title: event.target.value,
                }),
              }))
            }
            placeholder="Başlık"
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
          <input
            aria-label="Vitrin kategori kısa adı"
            value={section.categorySlug}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                showcaseSections: updateSection(current, index, {
                  categorySlug: event.target.value,
                }),
              }))
            }
            placeholder="kategori-kisa-adi"
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
          <input
            aria-label="Vitrin düğme yazısı"
            value={section.ctaLabel}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                showcaseSections: updateSection(current, index, {
                  ctaLabel: event.target.value,
                }),
              }))
            }
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
          <input
            aria-label="Vitrin limiti"
            type="number"
            value={section.limit}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                showcaseSections: updateSection(current, index, {
                  limit: Number(event.target.value),
                }),
              }))
            }
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
          <textarea
            aria-label="Vitrin giriş metni"
            value={section.intro || ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                showcaseSections: updateSection(current, index, {
                  intro: event.target.value,
                }),
              }))
            }
            className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <button
            type="button"
            onClick={() =>
              setForm((current) => ({
                ...current,
                showcaseSections: current.showcaseSections.filter(
                  (_, itemIndex) => itemIndex !== index
                ),
              }))
            }
            className="inline-flex w-max items-center gap-2 justify-self-start rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Vitrini sil
          </button>
        </div>
      ))}
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

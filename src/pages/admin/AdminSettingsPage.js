import { useEffect, useState } from "react";
import { adminFetch } from "@/admin/api";
import { useAdminCatalog } from "@/admin/use-admin-catalog";
import { HOME_SHOWCASE_SECTIONS } from "@/data/home-sections";
import { MAIN_NAV_CATEGORIES, SHOWROOM_CONTACT } from "@/data/navigation";
import {
  DEFAULT_META_DESCRIPTION,
  DEFAULT_PAGE_TITLE,
} from "@/hooks/use-page-meta";

const CURRENCIES = ["TRY", "USD", "EUR", "GBP"];

function legacySettings(catalog) {
  const bySlug = new Map(
    (catalog?.categories || []).map((category) => [category.slug, category])
  );
  return {
    siteName: "Lavabo Aydınlatma",
    tagline:
      "Yerli üretim modern LED avize, plafonyer, lineer aydınlatma, aplik ve masa lambası koleksiyonları.",
    metaTitle: DEFAULT_PAGE_TITLE,
    metaDescription: DEFAULT_META_DESCRIPTION,
    currency: "TRY",
    locale: "tr-TR",
    contact: {
      address: SHOWROOM_CONTACT.address,
      phones: SHOWROOM_CONTACT.phones.map((phone) => ({ ...phone })),
      mapUrl: SHOWROOM_CONTACT.mapUrl,
      mapLabel: SHOWROOM_CONTACT.mapLabel,
    },
    navCategoryIds: MAIN_NAV_CATEGORIES.map(
      (item) => bySlug.get(item.slug)?.id
    ).filter((id) => id != null),
    showcaseSections: HOME_SHOWCASE_SECTIONS.map((section) => ({ ...section })),
  };
}

function fromCatalog(catalog) {
  if (!catalog?.siteSettings) return legacySettings(catalog);
  const settings = catalog.siteSettings;
  return {
    siteName: settings.siteName || "",
    tagline: settings.tagline || "",
    metaTitle: settings.metaTitle || "",
    metaDescription: settings.metaDescription || "",
    currency: settings.currency || "TRY",
    locale: settings.locale || "tr-TR",
    contact: {
      address: settings.contact?.address || "",
      phones: (settings.contact?.phones || []).map((phone) => ({ ...phone })),
      mapUrl: settings.contact?.mapUrl || "",
      mapLabel: settings.contact?.mapLabel || "",
    },
    navCategoryIds: [...(settings.navCategoryIds || [])],
    showcaseSections: (settings.showcaseSections || []).map((section) => ({
      ...section,
    })),
  };
}

export default function AdminSettingsPage() {
  const {
    data: catalog,
    isPending,
    isError,
    error,
    invalidate,
  } = useAdminCatalog();
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (catalog) setForm(fromCatalog(catalog));
  }, [catalog]);

  function updateContact(patch) {
    setForm((current) => ({
      ...current,
      contact: { ...current.contact, ...patch },
    }));
  }

  async function save(event) {
    event.preventDefault();
    try {
      await adminFetch("/api/admin/site-settings", {
        method: "PUT",
        body: form,
      });
      await invalidate();
      setMessage("Ayarlar kaydedildi.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (isPending || !form) return <p>Yükleniyor...</p>;
  if (isError) return <p role="alert">{error.message}</p>;

  return (
    <form
      data-testid="admin-settings-form"
      onSubmit={save}
      className="max-w-3xl space-y-4"
    >
      <h1 className="text-2xl font-bold">Site ayarları</h1>
      {[
        ["siteName", "Site adı"],
        ["tagline", "Kısa tanım"],
        ["metaTitle", "Sayfa başlığı"],
        ["metaDescription", "Açıklama"],
        ["locale", "Yerel ayar"],
      ].map(([key, label]) => (
        <label key={key} className="block text-sm">
          {label}
          <input
            data-testid={`admin-setting-${key}`}
            value={form[key]}
            onChange={(event) =>
              setForm((current) => ({ ...current, [key]: event.target.value }))
            }
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
      ))}
      <label className="block text-sm">
        Para birimi
        <select
          data-testid="admin-setting-currency"
          value={form.currency}
          onChange={(event) =>
            setForm((current) => ({ ...current, currency: event.target.value }))
          }
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
        >
          {CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Adres
        <textarea
          value={form.contact.address}
          onChange={(event) => updateContact({ address: event.target.value })}
          rows={3}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
        />
      </label>
      <div className="space-y-2">
        <p className="text-sm font-medium">Telefonlar</p>
        {form.contact.phones.map((phone, index) => (
          <div key={index} className="grid grid-cols-2 gap-2">
            <input
              aria-label="Telefon görünen"
              value={phone.display}
              onChange={(event) => {
                const phones = form.contact.phones.map((item, itemIndex) =>
                  itemIndex === index
                    ? { ...item, display: event.target.value }
                    : item
                );
                updateContact({ phones });
              }}
              className="rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
            <input
              aria-label="Telefon bağlantısı"
              value={phone.href}
              onChange={(event) => {
                const phones = form.contact.phones.map((item, itemIndex) =>
                  itemIndex === index
                    ? { ...item, href: event.target.value }
                    : item
                );
                updateContact({ phones });
              }}
              className="rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            updateContact({
              phones: [...form.contact.phones, { display: "", href: "" }],
            })
          }
          className="text-sm underline"
        >
          Telefon ekle
        </button>
      </div>
      <label className="block text-sm">
        Harita bağlantısı
        <input
          value={form.contact.mapUrl}
          onChange={(event) => updateContact({ mapUrl: event.target.value })}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Harita etiketi
        <input
          value={form.contact.mapLabel}
          onChange={(event) => updateContact({ mapLabel: event.target.value })}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
        />
      </label>
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Anasayfa vitrinleri</p>
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
            className="text-sm underline"
          >
            Vitrin ekle
          </button>
        </div>
        {form.showcaseSections.map((section, index) => (
          <div
            key={index}
            className="grid gap-2 rounded-md border border-stone-200 p-3 sm:grid-cols-2"
          >
            <input
              aria-label="Vitrin başlığı"
              value={section.title}
              onChange={(event) => {
                const showcaseSections = form.showcaseSections.map(
                  (item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, title: event.target.value }
                      : item
                );
                setForm((current) => ({ ...current, showcaseSections }));
              }}
              placeholder="Başlık"
              className="rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
            <input
              aria-label="Vitrin kategori kısa adı"
              value={section.categorySlug}
              onChange={(event) => {
                const showcaseSections = form.showcaseSections.map(
                  (item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, categorySlug: event.target.value }
                      : item
                );
                setForm((current) => ({ ...current, showcaseSections }));
              }}
              placeholder="kategori-kisa-adi"
              className="rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
            <input
              aria-label="Vitrin düğme yazısı"
              value={section.ctaLabel}
              onChange={(event) => {
                const showcaseSections = form.showcaseSections.map(
                  (item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, ctaLabel: event.target.value }
                      : item
                );
                setForm((current) => ({ ...current, showcaseSections }));
              }}
              className="rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
            <input
              aria-label="Vitrin limiti"
              type="number"
              value={section.limit}
              onChange={(event) => {
                const showcaseSections = form.showcaseSections.map(
                  (item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, limit: Number(event.target.value) }
                      : item
                );
                setForm((current) => ({ ...current, showcaseSections }));
              }}
              className="rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
            <textarea
              aria-label="Vitrin giriş metni"
              value={section.intro || ""}
              onChange={(event) => {
                const showcaseSections = form.showcaseSections.map(
                  (item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, intro: event.target.value }
                      : item
                );
                setForm((current) => ({ ...current, showcaseSections }));
              }}
              className="sm:col-span-2 rounded-md border border-stone-300 px-3 py-2 text-sm"
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
              className="text-left text-sm text-red-700 underline"
            >
              Vitrini sil
            </button>
          </div>
        ))}
      </div>
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

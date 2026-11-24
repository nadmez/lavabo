import {
  SETTINGS_CURRENCIES,
  useAdminSettingsForm,
} from "@/pages/admin/use-admin-settings-form";

const fieldClass = "mt-1 w-full rounded-md border border-stone-300 px-3 py-2";

export default function AdminSettingsPage() {
  const {
    isPending,
    isError,
    error,
    form,
    setForm,
    message,
    updateContact,
    save,
  } = useAdminSettingsForm();

  if (isPending || !form) return <p>Yükleniyor...</p>;
  if (isError) return <p role="alert">{error.message}</p>;

  return (
    <form
      data-testid="admin-site-settings"
      onSubmit={save}
      className="max-w-3xl space-y-4"
    >
      <h1 className="text-2xl font-bold">Site Ayarları</h1>
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
            className={fieldClass}
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
          className={fieldClass}
        >
          {SETTINGS_CURRENCIES.map((currency) => (
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
          className={fieldClass}
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
          className={fieldClass}
        />
      </label>
      <label className="block text-sm">
        Harita etiketi
        <input
          value={form.contact.mapLabel}
          onChange={(event) => updateContact({ mapLabel: event.target.value })}
          className={fieldClass}
        />
      </label>
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

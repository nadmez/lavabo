import { useEffect, useState } from "react";
import { adminFetch } from "@/admin/api";
import { useAdminCatalog } from "@/admin/use-admin-catalog";
import { HOME_SHOWCASE_SECTIONS } from "@/data/home-sections";
import { MAIN_NAV_CATEGORIES, SHOWROOM_CONTACT } from "@/data/navigation";
import {
  DEFAULT_META_DESCRIPTION,
  DEFAULT_PAGE_TITLE,
} from "@/hooks/use-page-meta";

export const SETTINGS_CURRENCIES = ["TRY", "USD", "EUR", "GBP"];

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

function settingsFromCatalog(catalog) {
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

export function useAdminSettingsForm() {
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
    if (catalog) setForm(settingsFromCatalog(catalog));
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

  return {
    catalog,
    isPending,
    isError,
    error,
    form,
    setForm,
    message,
    updateContact,
    save,
  };
}

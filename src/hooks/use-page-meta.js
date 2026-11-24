import { useEffect } from "react";

export const DEFAULT_PAGE_TITLE = "Lavabo Aydınlatma Katalog";
export const DEFAULT_META_DESCRIPTION =
  "Yerli üretim modern LED avize, plafonyer, lineer aydınlatma ve aplik kataloğu.";

export function brandMetaProps(catalog) {
  const name = catalog?.siteSettings?.siteName;
  if (typeof name !== "string" || !name.trim()) return {};
  return { brandName: name.trim() };
}

export function usePageMeta({
  title,
  description,
  brandName,
  defaultTitle,
  defaultDescription,
} = {}) {
  useEffect(() => {
    const brand =
      typeof brandName === "string" && brandName.trim()
        ? brandName.trim()
        : "Lavabo Aydınlatma";
    const fallbackTitle =
      typeof defaultTitle === "string" && defaultTitle.trim()
        ? defaultTitle.trim()
        : DEFAULT_PAGE_TITLE;
    const fallbackDescription =
      typeof defaultDescription === "string" && defaultDescription.trim()
        ? defaultDescription.trim()
        : DEFAULT_META_DESCRIPTION;
    const trimmedTitle = typeof title === "string" ? title.trim() : "";
    const nextTitle = trimmedTitle
      ? trimmedTitle.includes(brand)
        ? trimmedTitle
        : `${trimmedTitle} | ${brand}`
      : fallbackTitle;

    document.title = nextTitle;

    const trimmedDescription =
      typeof description === "string" ? description.trim() : "";
    const nextDescription = trimmedDescription || fallbackDescription;

    let metaEl = document.head.querySelector('meta[name="description"]');
    if (!metaEl) {
      metaEl = document.createElement("meta");
      metaEl.setAttribute("name", "description");
      document.head.appendChild(metaEl);
    }
    metaEl.setAttribute("content", nextDescription);
  }, [title, description, brandName, defaultTitle, defaultDescription]);
}

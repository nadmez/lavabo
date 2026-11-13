import { useEffect } from "react";

export const DEFAULT_PAGE_TITLE = "Lavabo Aydınlatma Katalog";
export const DEFAULT_META_DESCRIPTION =
  "Yerli üretim modern LED avize, plafonyer, lineer aydınlatma ve aplik kataloğu.";

export function usePageMeta({ title, description } = {}) {
  useEffect(() => {
    const trimmedTitle = typeof title === "string" ? title.trim() : "";
    const nextTitle = trimmedTitle
      ? trimmedTitle.includes("Lavabo Aydınlatma")
        ? trimmedTitle
        : `${trimmedTitle} | Lavabo Aydınlatma`
      : DEFAULT_PAGE_TITLE;

    document.title = nextTitle;

    const trimmedDescription =
      typeof description === "string" ? description.trim() : "";
    const nextDescription = trimmedDescription || DEFAULT_META_DESCRIPTION;

    let metaEl = document.head.querySelector('meta[name="description"]');
    if (!metaEl) {
      metaEl = document.createElement("meta");
      metaEl.setAttribute("name", "description");
      document.head.appendChild(metaEl);
    }
    metaEl.setAttribute("content", nextDescription);
  }, [title, description]);
}

import { Link } from "react-router";
import { getNavigationTree } from "@/data/catalog-query";
import { useCachedCatalog } from "@/hooks/use-cached-catalog";

export default function Footer() {
  const catalog = useCachedCatalog();
  const navCategories = catalog ? getNavigationTree(catalog) : [];
  const brandName = catalog?.siteSettings?.siteName || "";
  const tagline = catalog?.siteSettings?.tagline || "";
  const contact = catalog?.siteSettings?.contact || {};
  const phones = Array.isArray(contact.phones) ? contact.phones : [];
  const hasContact = Boolean(
    contact.address || phones.length > 0 || contact.mapUrl
  );
  return (
    <footer
      data-testid="site-footer"
      className="border-t border-stone-200 bg-stone-900 text-stone-300"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            {brandName}
          </h2>
          {tagline ? (
            <p className="mt-3 text-sm leading-relaxed text-stone-400">
              {tagline}
            </p>
          ) : null}
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-wider text-white uppercase">
            Kategoriler
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {navCategories.map((category) => (
              <li key={category.slug}>
                <Link
                  to={category.href}
                  className="transition-colors hover:text-white"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {hasContact ? (
          <div>
            <h2 className="text-sm font-semibold tracking-wider text-white uppercase">
              Showroom & İmalat
            </h2>
            <address className="mt-4 space-y-3 text-sm not-italic">
              {contact.address ? (
                <p className="leading-relaxed text-stone-300">
                  {contact.address}
                </p>
              ) : null}
              {phones.length > 0 ? (
                <ul className="space-y-1.5">
                  {phones.map((phone) => (
                    <li key={phone.href || phone.display}>
                      <a
                        href={phone.href || undefined}
                        className="transition-colors hover:text-white"
                      >
                        {phone.display}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
              {contact.mapUrl ? (
                <p className="pt-1">
                  <a
                    href={contact.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center font-medium text-amber-400 transition-colors hover:text-amber-300"
                  >
                    {contact.mapLabel || contact.mapUrl}
                  </a>
                </p>
              ) : null}
            </address>
          </div>
        ) : (
          <div />
        )}
      </div>

      <div className="border-t border-stone-800 py-6 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} {brandName}. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}

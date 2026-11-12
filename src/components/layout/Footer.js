import { Link } from "react-router";
import { MAIN_NAV_CATEGORIES, SHOWROOM_CONTACT } from "@/data/navigation";

export default function Footer() {
  return (
    <footer
      data-testid="site-footer"
      className="border-t border-stone-200 bg-stone-900 text-stone-300"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            Lavabo Aydınlatma
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">
            Yerli üretim modern LED avize, plafonyer, lineer aydınlatma, aplik
            ve masa lambası koleksiyonları.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold tracking-wider text-white uppercase">
            Kategoriler
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                to="/urunlerimiz"
                className="transition-colors hover:text-white"
              >
                Ürünlerimiz
              </Link>
            </li>
            {MAIN_NAV_CATEGORIES.map((category) => (
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

        <div>
          <h2 className="text-sm font-semibold tracking-wider text-white uppercase">
            Showroom & İmalat
          </h2>
          <address className="mt-4 space-y-3 text-sm not-italic">
            <p className="leading-relaxed text-stone-300">
              {SHOWROOM_CONTACT.address}
            </p>
            <ul className="space-y-1.5">
              {SHOWROOM_CONTACT.phones.map((phone) => (
                <li key={phone.href}>
                  <a
                    href={phone.href}
                    className="transition-colors hover:text-white"
                  >
                    {phone.display}
                  </a>
                </li>
              ))}
            </ul>
            <p className="pt-1">
              <a
                href={SHOWROOM_CONTACT.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center font-medium text-amber-400 transition-colors hover:text-amber-300"
              >
                {SHOWROOM_CONTACT.mapLabel}
              </a>
            </p>
          </address>
        </div>
      </div>

      <div className="border-t border-stone-800 py-6 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} Lavabo Aydınlatma. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}

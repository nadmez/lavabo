import { useState } from "react";
import { Link, NavLink } from "react-router";
import { MAIN_NAV_CATEGORIES } from "@/data/navigation";
import HeaderSearch from "@/components/layout/HeaderSearch";
import MobileDrawer from "@/components/layout/MobileDrawer";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header
      data-testid="site-header"
      className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur-xs"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="mobile-menu-open"
            aria-label="Menüyü aç"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-md border border-stone-200 p-2 text-stone-700 hover:bg-stone-100 lg:hidden"
          >
            <span aria-hidden="true">☰</span>
          </button>

          <Link
            to="/"
            data-testid="brand-logo"
            className="text-xl font-bold tracking-tight text-stone-900"
          >
            Lavabo Aydınlatma
          </Link>
        </div>

        <nav
          aria-label="Ana navigasyon"
          data-testid="desktop-mega-menu"
          className="hidden items-center gap-6 lg:flex"
        >
          <NavLink
            to="/urunlerimiz"
            className="text-sm font-medium text-stone-700 transition-colors hover:text-amber-700"
          >
            Tüm Ürünler
          </NavLink>

          {MAIN_NAV_CATEGORIES.map((category) => (
            <div key={category.slug} className="group relative py-2">
              <NavLink
                to={category.href}
                className="text-sm font-medium text-stone-700 transition-colors hover:text-amber-700"
              >
                {category.name}
              </NavLink>

              {category.children.length > 0 && (
                <div className="pointer-events-none absolute top-full left-0 z-50 w-64 rounded-lg border border-stone-200 bg-white p-3 opacity-0 shadow-lg transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100">
                  <ul className="space-y-1.5">
                    {category.children.map((child) => (
                      <li key={child.slug}>
                        <Link
                          to={child.href}
                          className="block rounded-md px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <HeaderSearch />
        </div>
      </div>

      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </header>
  );
}

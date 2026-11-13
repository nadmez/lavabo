import { Fragment, useState } from "react";
import { Link, NavLink } from "react-router";
import { MAIN_NAV_CATEGORIES } from "@/data/navigation";
import HeaderSearch from "@/components/layout/HeaderSearch";
import MobileDrawer from "@/components/layout/MobileDrawer";

const menuLinkClass =
  "flex h-[42px] items-center whitespace-nowrap rounded-[5px] font-[Lato,Arial,Helvetica,sans-serif] text-[13px] leading-[18.2px] font-bold text-[#333] uppercase hover:text-black";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header
      data-testid="site-header"
      className="relative z-40 border-b border-[rgba(129,129,129,0.2)] bg-white"
    >
      <div
        data-testid="header-top-row"
        className="relative flex h-[120px] items-center pr-5 pl-[15px]"
      >
        <button
          type="button"
          data-testid="mobile-menu-open"
          aria-label="Menüyü aç"
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="mr-3 inline-flex items-center justify-center rounded-md border border-stone-200 p-2 text-stone-700 hover:bg-stone-100 lg:hidden"
        >
          <span aria-hidden="true">☰</span>
        </button>

        <Link
          to="/"
          data-testid="brand-logo"
          className="text-[22px] font-bold tracking-tight text-[#333] lg:absolute lg:left-1/2 lg:-translate-x-1/2"
        >
          Lavabo Aydınlatma
        </Link>

        <div className="ml-auto flex items-center">
          <HeaderSearch />
        </div>
      </div>

      <div
        data-testid="header-menu-row"
        className="hidden h-[70px] items-center justify-center lg:flex"
      >
        <nav
          aria-label="Ana navigasyon"
          data-testid="desktop-mega-menu"
          className="flex h-[42px] flex-nowrap items-center"
        >
          {MAIN_NAV_CATEGORIES.map((category, index) => (
            <Fragment key={category.slug}>
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="mx-[15px] h-[18px] w-px shrink-0 bg-[rgba(0,0,0,0.106)]"
                />
              ) : null}
              <div className="group relative flex h-[42px] items-center">
                <NavLink to={category.href} className={menuLinkClass}>
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
            </Fragment>
          ))}
        </nav>
      </div>

      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </header>
  );
}

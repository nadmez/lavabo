import { useEffect } from "react";
import { Link } from "react-router";
import { MAIN_NAV_CATEGORIES } from "@/data/navigation";

export default function MobileDrawer({ isOpen = false, onClose }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        data-testid="mobile-menu-backdrop"
        onClick={() => onClose?.()}
        className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mobil menü"
        data-testid="mobile-menu-drawer"
        className="relative z-10 flex h-full w-80 max-w-full flex-col overflow-y-auto bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <span className="text-lg font-bold tracking-tight text-stone-900">
            Lavabo Aydınlatma
          </span>
          <button
            type="button"
            data-testid="mobile-menu-close"
            aria-label="Menüyü kapat"
            onClick={() => onClose?.()}
            className="rounded-md p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
          >
            ✕
          </button>
        </div>

        <nav aria-label="Mobil navigasyon" className="mt-6">
          <ul className="space-y-3">
            <li>
              <Link
                to="/"
                onClick={() => onClose?.()}
                className="block rounded-md px-2 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-100"
              >
                Anasayfa
              </Link>
            </li>
            <li>
              <Link
                to="/urunlerimiz"
                onClick={() => onClose?.()}
                className="block rounded-md px-2 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-100"
              >
                Tüm Ürünler
              </Link>
            </li>
            {MAIN_NAV_CATEGORIES.map((category) => (
              <li key={category.slug} className="pt-1">
                <Link
                  to={category.href}
                  onClick={() => onClose?.()}
                  className="block rounded-md px-2 py-1.5 text-sm font-semibold text-stone-900 hover:bg-stone-100"
                >
                  {category.name}
                </Link>
                {category.children.length > 0 && (
                  <ul className="mt-1 ml-3 space-y-1 border-l border-stone-200 pl-3">
                    {category.children.map((child) => (
                      <li key={child.slug}>
                        <Link
                          to={child.href}
                          onClick={() => onClose?.()}
                          className="block rounded-md px-2 py-1 text-xs text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

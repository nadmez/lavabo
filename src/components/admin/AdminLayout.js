import { NavLink, Outlet } from "react-router";
import { useAdminAuth } from "@/components/admin/AdminAuthGate";

const links = [
  { to: "/admin", label: "Özet", end: true },
  { to: "/admin/kategoriler", label: "Kategoriler" },
  { to: "/admin/nitelikler", label: "Nitelikler" },
  { to: "/admin/urunler", label: "Ürünler" },
  { to: "/admin/ayarlar", label: "Ayarlar" },
];

export default function AdminLayout() {
  const { logout } = useAdminAuth();

  return (
    <div
      className="min-h-screen bg-stone-100 text-stone-900"
      data-testid="admin-shell"
    >
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="w-56 shrink-0 border-r border-stone-200 bg-white p-4">
          <p className="px-2 text-xs font-semibold tracking-wider text-stone-500 uppercase">
            Yönetim
          </p>
          <nav className="mt-4 space-y-1" aria-label="Yönetim menüsü">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-stone-900 text-white"
                      : "text-stone-700 hover:bg-stone-100"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-end gap-3 border-b border-stone-200 bg-white px-6 py-3">
            <a
              href="/"
              className="text-sm font-medium text-stone-700 hover:text-stone-900"
            >
              Mağazayı Görüntüle
            </a>
            <button
              type="button"
              data-testid="admin-logout"
              onClick={() => logout()}
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              Çıkış
            </button>
          </header>
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

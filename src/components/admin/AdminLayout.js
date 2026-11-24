import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import {
  ChevronDown,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  SlidersHorizontal,
  Store,
} from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminAuthGate";

const links = [
  { to: "/admin", label: "Dashboard", end: true, Icon: LayoutDashboard },
  { to: "/admin/kategoriler", label: "Kategoriler", Icon: FolderTree },
  { to: "/admin/nitelikler", label: "Nitelikler", Icon: SlidersHorizontal },
  { to: "/admin/urunler", label: "Ürünler", Icon: Package },
];

const settingsLinks = [
  { to: "/admin/ayarlar", label: "Site Ayarları", end: true },
  { to: "/admin/ayarlar/menu-kategorileri", label: "Menü Kategorileri" },
  { to: "/admin/ayarlar/vitrin", label: "Vitrin" },
];

function SettingsNav() {
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const sectionActive = location.pathname.startsWith("/admin/ayarlar");

  return (
    <div className="flex shrink-0 gap-1 sm:block">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="admin-settings-submenu"
        onClick={() => setOpen((current) => !current)}
        className={`flex w-max shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium sm:w-full ${
          sectionActive
            ? "bg-stone-200 text-stone-900"
            : "text-stone-700 hover:bg-stone-100"
        }`}
      >
        <Settings className="h-4 w-4 shrink-0" />
        Ayarlar
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div
          id="admin-settings-submenu"
          data-testid="admin-settings-submenu"
          className="flex gap-1 sm:mt-1 sm:ml-4 sm:block sm:space-y-1"
        >
          {settingsLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-stone-900 text-white"
                    : "text-stone-700 hover:bg-stone-100"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminLayout() {
  const { logout } = useAdminAuth();

  return (
    <div
      className="min-h-screen bg-stone-100 text-stone-900"
      data-testid="admin-shell"
    >
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col sm:flex-row">
        <aside className="w-full shrink-0 border-r border-stone-200 bg-white p-4 sm:w-56">
          <p className="px-2 text-xs font-semibold tracking-wider text-stone-500 uppercase">
            Yönetim
          </p>
          <nav
            className="mt-4 flex gap-1 overflow-x-auto sm:block sm:space-y-1 sm:overflow-visible"
            aria-label="Yönetim menüsü"
          >
            {links.map(({ Icon, ...link }) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-stone-900 text-white"
                      : "text-stone-700 hover:bg-stone-100"
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {link.label}
              </NavLink>
            ))}
            <SettingsNav />
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-end gap-3 border-b border-stone-200 bg-white px-6 py-3">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-stone-900"
            >
              <Store className="h-4 w-4" />
              Mağazayı Görüntüle
            </a>
            <button
              type="button"
              data-testid="admin-logout"
              onClick={() => logout()}
              className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              <LogOut className="h-4 w-4" />
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

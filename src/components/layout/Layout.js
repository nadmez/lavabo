import { Outlet } from "react-router";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900">
      <a
        href="#layout-main"
        data-testid="skip-to-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-stone-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Ana içeriğe atla
      </a>
      <Header />
      <main
        id="layout-main"
        data-testid="layout-main"
        tabIndex={-1}
        className="flex-1"
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

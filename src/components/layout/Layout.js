import { Outlet } from "react-router";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900">
      <Header />
      <main data-testid="layout-main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

import { createContext, useContext, useEffect, useState } from "react";
import { adminFetch } from "@/admin/api";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";

const AdminAuthContext = createContext({
  logout: async () => {},
});

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export default function AdminAuthGate({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;
    adminFetch("/api/admin/session")
      .then((data) => {
        if (active) setStatus(data?.authenticated ? "in" : "out");
      })
      .catch(() => {
        if (active) setStatus("out");
      });
    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    await adminFetch("/api/admin/logout", { method: "POST", body: {} });
    setStatus("out");
  }

  if (status === "loading") {
    return (
      <p
        data-testid="admin-auth-loading"
        className="p-8 text-sm text-stone-600"
      >
        Yükleniyor...
      </p>
    );
  }

  if (status === "out") {
    return <AdminLoginPage onSuccess={() => setStatus("in")} />;
  }

  return (
    <AdminAuthContext.Provider value={{ logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

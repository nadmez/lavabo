import { useState } from "react";
import { adminFetch } from "@/admin/api";

export default function AdminLoginPage({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await adminFetch("/api/admin/login", {
        method: "POST",
        body: { password },
      });
      onSuccess?.();
    } catch (err) {
      setError(err.message || "Giriş yapılamadı.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <form
        data-testid="admin-login-form"
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-bold text-stone-900">Yönetim girişi</h1>
        <p className="mt-2 text-sm text-stone-600">
          Katalog verilerini düzenlemek için parolanızı girin.
        </p>
        <label className="mt-5 block text-sm font-medium text-stone-800">
          Parola
          <input
            type="password"
            data-testid="admin-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
            autoComplete="current-password"
          />
        </label>
        {error ? (
          <p
            data-testid="admin-login-error"
            className="mt-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          data-testid="admin-login-submit"
          disabled={pending}
          className="mt-5 w-full rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
        >
          {pending ? "Giriş yapılıyor..." : "Giriş yap"}
        </button>
      </form>
    </div>
  );
}

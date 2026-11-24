import { useState } from "react";
import { adminFetch } from "@/admin/api";
import { useAdminCatalog } from "@/admin/use-admin-catalog";
import { toKebabSlug } from "@/utils/slugify";

function emptyTerm() {
  return { slug: "", name: "", swatch: "", previousSlug: "", useSwatch: false };
}

export default function AdminAttributesPage() {
  const {
    data: catalog,
    isPending,
    isError,
    error,
    invalidate,
  } = useAdminCatalog();
  const [editingSlug, setEditingSlug] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [terms, setTerms] = useState([]);
  const [message, setMessage] = useState("");

  function startNew() {
    setEditingSlug("");
    setName("");
    setSlug("");
    setSlugTouched(false);
    setTerms([]);
  }

  function editAttribute(attribute) {
    setEditingSlug(attribute.slug);
    setName(attribute.name);
    setSlug(attribute.slug);
    setSlugTouched(true);
    setTerms(
      (attribute.terms || []).map((term) => ({
        slug: term.slug,
        name: term.name,
        swatch: term.swatch || "",
        previousSlug: term.slug,
        useSwatch: Boolean(term.swatch),
      }))
    );
  }

  function updateTerm(index, patch) {
    setTerms((current) =>
      current.map((term, termIndex) => {
        if (termIndex !== index) return term;
        const next = { ...term, ...patch };
        if (patch.name != null && !term.previousSlug) {
          next.slug = toKebabSlug(patch.name);
        }
        return next;
      })
    );
  }

  async function saveAttribute(event) {
    event.preventDefault();
    const payload = {
      name,
      slug: slug || toKebabSlug(name),
      terms: terms
        .filter((term) => term.name.trim())
        .map((term) => ({
          name: term.name,
          slug: term.slug || toKebabSlug(term.name),
          previousSlug: term.previousSlug,
          ...(term.useSwatch && term.swatch ? { swatch: term.swatch } : {}),
        })),
    };
    try {
      if (editingSlug) {
        await adminFetch(
          `/api/admin/attributes/${encodeURIComponent(editingSlug)}`,
          {
            method: "PUT",
            body: payload,
          }
        );
      } else {
        await adminFetch("/api/admin/attributes", {
          method: "POST",
          body: payload,
        });
      }
      startNew();
      await invalidate();
      setMessage("Nitelik kaydedildi.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function deleteAttribute(attributeSlug) {
    if (!window.confirm("Bu nitelik silinsin mi?")) return;
    try {
      await adminFetch(
        `/api/admin/attributes/${encodeURIComponent(attributeSlug)}`,
        {
          method: "DELETE",
        }
      );
      if (editingSlug === attributeSlug) startNew();
      await invalidate();
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (isPending) return <p>Yükleniyor...</p>;
  if (isError) return <p role="alert">{error.message}</p>;

  return (
    <div
      data-testid="admin-attributes"
      className="grid gap-8 lg:grid-cols-[1fr_380px]"
    >
      <div>
        <h1 className="text-2xl font-bold">Nitelikler</h1>
        <ul className="mt-4 space-y-3">
          {(catalog.attributes || []).map((attribute) => (
            <li
              key={attribute.slug}
              className="rounded-lg border border-stone-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{attribute.name}</p>
                  <p className="text-xs text-stone-500">
                    {attribute.slug} · {attribute.terms?.length || 0} terim
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => editAttribute(attribute)}
                    className="text-sm underline"
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAttribute(attribute.slug)}
                    className="text-sm text-red-700 underline"
                  >
                    Sil
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(attribute.terms || []).map((term) => (
                  <span
                    key={term.slug}
                    className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-2 py-1 text-xs"
                  >
                    {term.swatch ? (
                      <span
                        data-testid={`admin-swatch-${term.slug}`}
                        className="h-3 w-3 rounded-full border border-stone-300"
                        style={{ backgroundColor: term.swatch }}
                      />
                    ) : null}
                    {term.name}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <form
        data-testid="admin-attribute-form"
        onSubmit={saveAttribute}
        className="h-fit space-y-3 rounded-lg border border-stone-200 bg-white p-4"
      >
        <h2 className="font-semibold">
          {editingSlug ? "Niteliği düzenle" : "Yeni nitelik"}
        </h2>
        <label className="block text-sm">
          Ad
          <input
            data-testid="admin-attribute-name"
            value={name}
            onChange={(event) => {
              const nextName = event.target.value;
              setName(nextName);
              if (!slugTouched) setSlug(toKebabSlug(nextName));
            }}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Kısa ad
          <input
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
        <div className="space-y-2">
          {terms.map((term, index) => (
            <div
              key={`${term.previousSlug}-${index}`}
              className="rounded-md border border-stone-200 p-2"
            >
              <input
                aria-label="Terim adı"
                value={term.name}
                onChange={(event) =>
                  updateTerm(index, { name: event.target.value })
                }
                className="w-full rounded-md border border-stone-300 px-2 py-1 text-sm"
              />
              <label className="mt-2 flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={term.useSwatch}
                  onChange={(event) =>
                    updateTerm(index, { useSwatch: event.target.checked })
                  }
                />
                Renk örneği
              </label>
              {term.useSwatch ? (
                <div className="mt-2 flex gap-2">
                  <input
                    type="color"
                    aria-label="Renk seçici"
                    value={
                      /^#[0-9a-fA-F]{6}$/.test(term.swatch)
                        ? term.swatch
                        : "#18181b"
                    }
                    onChange={(event) =>
                      updateTerm(index, { swatch: event.target.value })
                    }
                  />
                  <input
                    aria-label="Renk kodu"
                    value={term.swatch}
                    onChange={(event) =>
                      updateTerm(index, { swatch: event.target.value })
                    }
                    className="w-full rounded-md border border-stone-300 px-2 py-1 text-sm"
                  />
                </div>
              ) : null}
              <button
                type="button"
                onClick={() =>
                  setTerms((current) =>
                    current.filter((_, termIndex) => termIndex !== index)
                  )
                }
                className="mt-2 text-xs text-red-700 underline"
              >
                Terimi sil
              </button>
            </div>
          ))}
          <button
            type="button"
            data-testid="admin-add-term"
            onClick={() => setTerms((current) => [...current, emptyTerm()])}
            className="text-sm underline"
          >
            Terim ekle
          </button>
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Kaydet
        </button>
        {editingSlug ? (
          <button
            type="button"
            onClick={startNew}
            className="w-full text-sm underline"
          >
            Yeni nitelik
          </button>
        ) : null}
        {message ? <p className="text-sm">{message}</p> : null}
      </form>
    </div>
  );
}

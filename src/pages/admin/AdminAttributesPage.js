import { useState } from "react";
import { ListPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { adminFetch } from "@/admin/api";
import { useAdminCatalog } from "@/admin/use-admin-catalog";
import { normalizeTurkishSearch } from "@/data/catalog-query";
import { toKebabSlug } from "@/utils/slugify";
import AdminDialog from "@/components/admin/AdminDialog";
import AdminConfirmDialog from "@/components/admin/AdminConfirmDialog";
import AdminChip from "@/components/admin/AdminChip";
import IconButton from "@/components/admin/IconButton";

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
  const [dialogError, setDialogError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [query, setQuery] = useState("");

  function resetDraft() {
    setEditingSlug("");
    setName("");
    setSlug("");
    setSlugTouched(false);
    setTerms([]);
    setDialogError("");
  }

  function closeDialog() {
    setDialogOpen(false);
    resetDraft();
  }

  function handleDialogChange(open) {
    if (open) setDialogOpen(true);
    else closeDialog();
  }

  function startNew() {
    resetDraft();
    setDialogOpen(true);
  }

  function editAttribute(attribute) {
    setEditingSlug(attribute.slug);
    setName(attribute.name);
    setSlug(attribute.slug);
    setSlugTouched(true);
    setDialogError("");
    setTerms(
      (attribute.terms || []).map((term) => ({
        slug: term.slug,
        name: term.name,
        swatch: term.swatch || "",
        previousSlug: term.slug,
        useSwatch: Boolean(term.swatch),
      }))
    );
    setDialogOpen(true);
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
    setDialogError("");
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
      closeDialog();
      await invalidate();
      setMessage("Nitelik kaydedildi.");
    } catch (err) {
      setDialogError(err.message);
    }
  }

  async function deleteAttribute() {
    if (!pendingDelete) return;
    try {
      await adminFetch(
        `/api/admin/attributes/${encodeURIComponent(pendingDelete.slug)}`,
        { method: "DELETE" }
      );
      await invalidate();
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (isPending) return <p>Yükleniyor...</p>;
  if (isError) return <p role="alert">{error.message}</p>;

  const attributes = catalog.attributes || [];
  const foldedQuery = normalizeTurkishSearch(query.trim());
  const visibleAttributes = foldedQuery
    ? attributes.filter((attribute) =>
        normalizeTurkishSearch(attribute.name).includes(foldedQuery)
      )
    : attributes;

  return (
    <div data-testid="admin-attributes" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Nitelikler</h1>
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          Yeni Nitelik
        </button>
      </div>
      {message ? <p className="text-sm text-stone-700">{message}</p> : null}
      <input
        type="search"
        aria-label="Nitelik ara"
        placeholder="Nitelik ara"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
      />
      {attributes.length > 0 && visibleAttributes.length === 0 ? (
        <p className="text-sm text-stone-500">Nitelik bulunamadı.</p>
      ) : null}
      <ul className="space-y-3">
        {visibleAttributes.map((attribute) => (
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
                <IconButton
                  label="Düzenle"
                  onClick={() => editAttribute(attribute)}
                >
                  <Pencil className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label="Sil"
                  danger
                  onClick={() => setPendingDelete(attribute)}
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(attribute.terms || []).map((term) => (
                <AdminChip
                  key={term.slug}
                  swatch={term.swatch}
                  swatchTestId={`admin-swatch-${term.slug}`}
                >
                  {term.name}
                </AdminChip>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <AdminDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        title={editingSlug ? "Niteliği düzenle" : "Yeni Nitelik"}
        size="lg"
      >
        <form
          data-testid="admin-attribute-form"
          onSubmit={saveAttribute}
          className="space-y-3"
        >
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
              className="inline-flex items-center gap-1 text-sm underline"
            >
              <ListPlus className="h-4 w-4" />
              Terim ekle
            </button>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
          >
            Kaydet
          </button>
          {dialogError ? (
            <p className="text-sm text-red-700">{dialogError}</p>
          ) : null}
        </form>
      </AdminDialog>

      <AdminConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Niteliği Sil"
        description={
          pendingDelete ? `"${pendingDelete.name}" silinsin mi?` : ""
        }
        confirmLabel="Sil"
        onConfirm={deleteAttribute}
      />
    </div>
  );
}

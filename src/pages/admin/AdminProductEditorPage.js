import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { adminFetch } from "@/admin/api";
import { useAdminCatalog } from "@/admin/use-admin-catalog";
import { generateVariantRows } from "@/admin/variants";
import { toKebabSlug } from "@/utils/slugify";
import { resolveAssetUrl } from "@/utils/image-url";

function categoryRows(categories) {
  const byParent = new Map();
  for (const category of categories) {
    const key = category.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(category);
  }
  const rows = [];
  const walk = (parentId, depth) => {
    for (const category of byParent.get(parentId) || []) {
      rows.push({ category, depth });
      walk(category.id, depth + 1);
    }
  };
  walk(null, 0);
  return rows;
}

function emptyState() {
  return {
    name: "",
    slug: "",
    sku: "",
    mode: "simple",
    price: "",
    inStock: true,
    categoryIds: [],
    images: [],
    imageUrl: "",
    highlights: [""],
    descriptionHtml: "",
    showPreview: false,
    specs: [{ key: "", value: "" }],
    selections: [],
    variants: [],
    bulkPrice: "",
    bulkStock: true,
    newTermAttribute: "",
    newTermName: "",
    newTermSwatch: "",
  };
}

function stateFromProduct(product, attributes) {
  const selections = (attributes || []).map((attribute) => ({
    slug: attribute.slug,
    termSlugs: product.attributes?.[attribute.slug] || [],
  }));
  return {
    ...emptyState(),
    name: product.name || "",
    slug: product.slug || "",
    sku: product.sku || "",
    mode: product.variants?.length ? "variable" : "simple",
    price: product.priceMin ?? "",
    inStock: product.inStock === true,
    categoryIds: product.categoryIds || [],
    images: product.images || [],
    highlights: product.highlights?.length ? product.highlights : [""],
    descriptionHtml: product.descriptionHtml || "",
    specs: Object.keys(product.specs || {}).length
      ? Object.entries(product.specs).map(([key, value]) => ({ key, value }))
      : [{ key: "", value: "" }],
    selections,
    variants: (product.variants || []).map((variant) => ({
      ...variant,
      terms: { ...variant.terms },
    })),
  };
}

export default function AdminProductEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "yeni";
  const {
    data: catalog,
    isPending,
    isError,
    error,
    invalidate,
  } = useAdminCatalog();
  const [form, setForm] = useState(emptyState);
  const [slugTouched, setSlugTouched] = useState(false);
  const [message, setMessage] = useState("");
  const descriptionRef = useRef(null);
  const unset = useRef(Symbol("unset")).current;
  const [readyId, setReadyId] = useState(unset);

  const product = useMemo(() => {
    if (isNew) return null;
    return (
      (catalog?.products || []).find((item) => item.id === Number(id)) || null
    );
  }, [catalog, id, isNew]);

  useEffect(() => {
    if (!catalog || readyId === id) return;
    if (isNew) {
      setForm({
        ...emptyState(),
        selections: (catalog.attributes || []).map((attribute) => ({
          slug: attribute.slug,
          termSlugs: [],
        })),
        newTermAttribute: catalog.attributes?.[0]?.slug || "",
      });
      setSlugTouched(false);
    } else if (product) {
      setForm(stateFromProduct(product, catalog.attributes));
      setSlugTouched(true);
    }
    setReadyId(id);
  }, [catalog, id, isNew, product, readyId]);

  function patch(partial) {
    setForm((current) => ({ ...current, ...partial }));
  }

  function wrapDescription(before, after) {
    const textarea = descriptionRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? form.descriptionHtml.length;
    const end = textarea.selectionEnd ?? start;
    const selected = form.descriptionHtml.slice(start, end);
    const next = `${form.descriptionHtml.slice(0, start)}${before}${selected}${after}${form.descriptionHtml.slice(end)}`;
    patch({ descriptionHtml: next });
  }

  function toggleTerm(attributeSlug, termSlug) {
    patch({
      selections: form.selections.map((selection) => {
        if (selection.slug !== attributeSlug) return selection;
        const exists = selection.termSlugs.includes(termSlug);
        return {
          ...selection,
          termSlugs: exists
            ? selection.termSlugs.filter((slug) => slug !== termSlug)
            : [...selection.termSlugs, termSlug],
        };
      }),
    });
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    body.append("productSlug", form.slug || toKebabSlug(form.name) || "urun");
    try {
      const result = await adminFetch("/api/admin/upload", {
        method: "POST",
        body,
      });
      patch({ images: [...form.images, result.path] });
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function createTerm(event) {
    event.preventDefault();
    const attribute = (catalog.attributes || []).find(
      (item) => item.slug === form.newTermAttribute
    );
    if (!attribute || !form.newTermName.trim()) return;
    const termSlug = toKebabSlug(form.newTermName);
    try {
      await adminFetch(
        `/api/admin/attributes/${encodeURIComponent(attribute.slug)}`,
        {
          method: "PUT",
          body: {
            name: attribute.name,
            slug: attribute.slug,
            terms: [
              ...attribute.terms.map((term) => ({
                name: term.name,
                slug: term.slug,
                previousSlug: term.slug,
                ...(term.swatch ? { swatch: term.swatch } : {}),
              })),
              {
                name: form.newTermName,
                slug: termSlug,
                ...(form.newTermSwatch ? { swatch: form.newTermSwatch } : {}),
              },
            ],
          },
        }
      );
      await invalidate();
      toggleTerm(attribute.slug, termSlug);
      patch({ newTermName: "", newTermSwatch: "" });
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    const attributes = {};
    for (const selection of form.selections) {
      if (selection.termSlugs.length > 0)
        attributes[selection.slug] = selection.termSlugs;
    }
    const specs = {};
    for (const row of form.specs) {
      if (row.key.trim()) specs[row.key.trim()] = row.value;
    }
    const payload = {
      name: form.name,
      slug: form.slug || toKebabSlug(form.name),
      sku: form.sku,
      categoryIds: form.categoryIds,
      images: form.images,
      highlights: form.highlights.map((item) => item.trim()).filter(Boolean),
      descriptionHtml: form.descriptionHtml,
      specs,
      attributes,
      variants:
        form.mode === "variable"
          ? form.variants.map((variant) => ({
              ...(variant.id ? { id: variant.id } : {}),
              sku: variant.sku,
              price: Number(variant.price),
              ...(variant.regularPrice !== "" && variant.regularPrice != null
                ? { regularPrice: Number(variant.regularPrice) }
                : {}),
              inStock: variant.inStock === true,
              terms: variant.terms,
              ...(variant.image ? { image: variant.image } : {}),
            }))
          : [],
      priceMin: Number(form.price) || 0,
      priceMax: Number(form.price) || 0,
      inStock: form.inStock === true,
    };
    try {
      const saved = isNew
        ? await adminFetch("/api/admin/products", {
            method: "POST",
            body: payload,
          })
        : await adminFetch(`/api/admin/products/${id}`, {
            method: "PUT",
            body: payload,
          });
      await invalidate();
      setMessage("Ürün kaydedildi.");
      if (isNew) {
        const created = saved.products.find(
          (item) => item.slug === payload.slug
        );
        if (created) navigate(`/admin/urunler/${created.id}`);
      }
    } catch (err) {
      setMessage(err.message);
    }
  }

  if (isPending || readyId !== id) return <p>Yükleniyor...</p>;
  if (isError) return <p role="alert">{error.message}</p>;
  if (!isNew && !product) return <p>Ürün bulunamadı.</p>;

  const rows = categoryRows(catalog.categories || []);

  return (
    <form
      data-testid="admin-product-form"
      onSubmit={saveProduct}
      className="max-w-5xl space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isNew ? "Yeni ürün" : "Ürünü düzenle"}
        </h1>
        <Link to="/admin/urunler" className="text-sm underline">
          Listeye dön
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Ad
          <input
            data-testid="admin-product-name"
            value={form.name}
            onChange={(event) => {
              const name = event.target.value;
              patch({
                name,
                slug: slugTouched ? form.slug : toKebabSlug(name),
              });
            }}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Kısa ad
          <input
            data-testid="admin-product-slug"
            value={form.slug}
            onChange={(event) => {
              setSlugTouched(true);
              patch({ slug: event.target.value });
            }}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Stok kodu
          <input
            value={form.sku}
            onChange={(event) => patch({ sku: event.target.value })}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </label>
        <fieldset className="text-sm">
          <legend>Ürün tipi</legend>
          <label className="mr-4">
            <input
              type="radio"
              name="product-mode"
              checked={form.mode === "simple"}
              onChange={() => patch({ mode: "simple" })}
            />{" "}
            Basit
          </label>
          <label>
            <input
              type="radio"
              name="product-mode"
              data-testid="admin-product-variable"
              checked={form.mode === "variable"}
              onChange={() => patch({ mode: "variable" })}
            />{" "}
            Varyasyonlu
          </label>
        </fieldset>
      </div>
      {form.mode === "simple" ? (
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm">
            Fiyat
            <input
              data-testid="admin-product-price"
              type="number"
              min="0"
              value={form.price}
              onChange={(event) => patch({ price: event.target.value })}
              className="mt-1 block rounded-md border border-stone-300 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.inStock}
              onChange={(event) => patch({ inStock: event.target.checked })}
            />
            Stokta
          </label>
        </div>
      ) : null}
      <fieldset>
        <legend className="text-sm font-medium">Kategoriler</legend>
        <div className="mt-2 space-y-1">
          {rows.map(({ category, depth }) => (
            <label
              key={category.id}
              className="flex items-center gap-2 text-sm"
              style={{ marginLeft: depth * 16 }}
            >
              <input
                type="checkbox"
                checked={form.categoryIds.includes(category.id)}
                onChange={(event) =>
                  patch({
                    categoryIds: event.target.checked
                      ? [...form.categoryIds, category.id]
                      : form.categoryIds.filter((item) => item !== category.id),
                  })
                }
              />
              {category.name}
            </label>
          ))}
        </div>
      </fieldset>
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Görseller</h2>
        <div className="flex flex-wrap gap-3">
          {form.images.map((image, index) => (
            <div key={`${image}-${index}`} className="w-28">
              <img
                src={resolveAssetUrl(image)}
                alt=""
                className="h-28 w-28 rounded-md border border-stone-200 object-cover"
              />
              <div className="mt-1 flex flex-col text-xs">
                <button
                  type="button"
                  onClick={() =>
                    patch({
                      images: [
                        image,
                        ...form.images.filter((item) => item !== image),
                      ],
                    })
                  }
                >
                  Ana Görsel Yap
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (index === 0) return;
                    const images = [...form.images];
                    [images[index - 1], images[index]] = [
                      images[index],
                      images[index - 1],
                    ];
                    patch({ images });
                  }}
                >
                  Yukarı
                </button>
                <button
                  type="button"
                  onClick={() =>
                    patch({
                      images: form.images.filter(
                        (_, imageIndex) => imageIndex !== index
                      ),
                    })
                  }
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
        <input
          data-testid="admin-product-upload"
          type="file"
          accept="image/*"
          onChange={uploadImage}
        />
        <div className="flex gap-2">
          <input
            data-testid="admin-product-image-url"
            value={form.imageUrl}
            onChange={(event) => patch({ imageUrl: event.target.value })}
            placeholder="https://picsum.photos/seed/ornek/800/800"
            className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              if (!form.imageUrl.trim()) return;
              patch({
                images: [...form.images, form.imageUrl.trim()],
                imageUrl: "",
              });
            }}
            className="rounded-md border border-stone-300 px-3 py-2 text-sm"
          >
            URL ekle
          </button>
        </div>
      </section>
      <section className="space-y-2">
        <h2 className="text-sm font-medium">Öne çıkanlar</h2>
        {form.highlights.map((highlight, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={highlight}
              onChange={(event) =>
                patch({
                  highlights: form.highlights.map((item, itemIndex) =>
                    itemIndex === index ? event.target.value : item
                  ),
                })
              }
              className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() =>
                patch({
                  highlights: form.highlights.filter(
                    (_, itemIndex) => itemIndex !== index
                  ),
                })
              }
              className="text-sm text-red-700"
            >
              Sil
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => patch({ highlights: [...form.highlights, ""] })}
          className="text-sm underline"
        >
          Madde ekle
        </button>
      </section>
      <section className="space-y-2">
        <div className="flex flex-wrap gap-2 text-sm">
          <h2 className="mr-2 font-medium">Açıklama</h2>
          <button
            type="button"
            onClick={() => wrapDescription("<h2>", "</h2>")}
          >
            Başlık
          </button>
          <button
            type="button"
            onClick={() => wrapDescription("<strong>", "</strong>")}
          >
            Kalın
          </button>
          <button
            type="button"
            onClick={() => wrapDescription("<ul><li>", "</li></ul>")}
          >
            Liste
          </button>
          <button type="button" onClick={() => wrapDescription("<p>", "</p>")}>
            Paragraf
          </button>
          <button
            type="button"
            data-testid="admin-description-preview"
            onClick={() => patch({ showPreview: !form.showPreview })}
          >
            {form.showPreview ? "Düzenle" : "Önizleme"}
          </button>
        </div>
        {form.showPreview ? (
          <div
            className="rounded-md border border-stone-200 bg-white p-4 text-sm"
            dangerouslySetInnerHTML={{ __html: form.descriptionHtml }}
          />
        ) : (
          <textarea
            ref={descriptionRef}
            value={form.descriptionHtml}
            onChange={(event) => patch({ descriptionHtml: event.target.value })}
            rows={8}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        )}
      </section>
      <section className="space-y-2">
        <h2 className="text-sm font-medium">Teknik bilgiler</h2>
        {form.specs.map((row, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input
              aria-label="Özellik adı"
              value={row.key}
              onChange={(event) =>
                patch({
                  specs: form.specs.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, key: event.target.value }
                      : item
                  ),
                })
              }
              className="rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
            <input
              aria-label="Özellik değeri"
              value={row.value}
              onChange={(event) =>
                patch({
                  specs: form.specs.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, value: event.target.value }
                      : item
                  ),
                })
              }
              className="rounded-md border border-stone-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() =>
                patch({
                  specs: form.specs.filter(
                    (_, itemIndex) => itemIndex !== index
                  ),
                })
              }
              className="text-sm text-red-700"
            >
              Sil
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            patch({ specs: [...form.specs, { key: "", value: "" }] })
          }
          className="text-sm underline"
        >
          Satır ekle
        </button>
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Nitelikler</h2>
        {(catalog.attributes || []).map((attribute) => (
          <div key={attribute.slug}>
            <p className="text-sm font-medium">{attribute.name}</p>
            <div className="mt-1 flex flex-wrap gap-3">
              {(attribute.terms || []).map((term) => {
                const selected = form.selections.find(
                  (item) => item.slug === attribute.slug
                );
                return (
                  <label
                    key={term.slug}
                    className="flex items-center gap-1 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selected?.termSlugs.includes(term.slug) || false}
                      onChange={() => toggleTerm(attribute.slug, term.slug)}
                    />
                    {term.swatch ? (
                      <span
                        className="inline-block h-3 w-3 rounded-full border border-stone-300"
                        style={{ backgroundColor: term.swatch }}
                      />
                    ) : null}
                    {term.name}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-stone-300 p-3">
          <label className="text-sm">
            Nitelik
            <select
              value={form.newTermAttribute}
              onChange={(event) =>
                patch({ newTermAttribute: event.target.value })
              }
              className="mt-1 block rounded-md border border-stone-300 px-2 py-1"
            >
              {(catalog.attributes || []).map((attribute) => (
                <option key={attribute.slug} value={attribute.slug}>
                  {attribute.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Yeni terim
            <input
              value={form.newTermName}
              onChange={(event) => patch({ newTermName: event.target.value })}
              className="mt-1 block rounded-md border border-stone-300 px-2 py-1"
            />
          </label>
          <label className="text-sm">
            Renk
            <input
              value={form.newTermSwatch}
              onChange={(event) => patch({ newTermSwatch: event.target.value })}
              placeholder="#18181b"
              className="mt-1 block w-28 rounded-md border border-stone-300 px-2 py-1"
            />
          </label>
          <button
            type="button"
            onClick={createTerm}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm"
          >
            Terim ekle
          </button>
        </div>
      </section>
      {form.mode === "variable" ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <button
              type="button"
              data-testid="admin-generate-variants"
              onClick={() =>
                patch({
                  variants: generateVariantRows(form.selections, form.variants),
                })
              }
              className="rounded-md bg-stone-800 px-3 py-2 text-sm font-medium text-white"
            >
              Varyasyonları Oluştur
            </button>
            <label className="text-sm">
              Toplu fiyat
              <input
                value={form.bulkPrice}
                onChange={(event) => patch({ bulkPrice: event.target.value })}
                className="mt-1 block w-28 rounded-md border border-stone-300 px-2 py-1"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.bulkStock}
                onChange={(event) => patch({ bulkStock: event.target.checked })}
              />
              Toplu stok
            </label>
            <button
              type="button"
              onClick={() =>
                patch({
                  variants: form.variants.map((variant) => ({
                    ...variant,
                    ...(form.bulkPrice !== "" ? { price: form.bulkPrice } : {}),
                    inStock: form.bulkStock,
                  })),
                })
              }
              className="rounded-md border border-stone-300 px-3 py-2 text-sm"
            >
              Toplu uygula
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-stone-500">
                  <th className="px-2 py-1">Terimler</th>
                  <th className="px-2 py-1">SKU</th>
                  <th className="px-2 py-1">Fiyat</th>
                  <th className="px-2 py-1">Liste fiyatı</th>
                  <th className="px-2 py-1">Stok</th>
                  <th className="px-2 py-1">Görsel</th>
                </tr>
              </thead>
              <tbody>
                {form.variants.map((variant, index) => (
                  <tr key={index} data-testid="admin-variant-row">
                    <td className="px-2 py-1">
                      {Object.values(variant.terms || {}).join(" / ")}
                    </td>
                    <td className="px-2 py-1">
                      <input
                        aria-label="Varyant stok kodu"
                        value={variant.sku || ""}
                        onChange={(event) =>
                          patch({
                            variants: form.variants.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, sku: event.target.value }
                                : item
                            ),
                          })
                        }
                        className="w-32 rounded border border-stone-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        aria-label="Varyant fiyatı"
                        value={variant.price}
                        onChange={(event) =>
                          patch({
                            variants: form.variants.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, price: event.target.value }
                                : item
                            ),
                          })
                        }
                        className="w-24 rounded border border-stone-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        aria-label="Varyant liste fiyatı"
                        value={variant.regularPrice ?? ""}
                        onChange={(event) =>
                          patch({
                            variants: form.variants.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, regularPrice: event.target.value }
                                : item
                            ),
                          })
                        }
                        className="w-24 rounded border border-stone-300 px-2 py-1"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="checkbox"
                        aria-label="Varyant stokta"
                        checked={variant.inStock === true}
                        onChange={(event) =>
                          patch({
                            variants: form.variants.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, inStock: event.target.checked }
                                : item
                            ),
                          })
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        aria-label="Varyant görseli"
                        value={variant.image || ""}
                        onChange={(event) =>
                          patch({
                            variants: form.variants.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, image: event.target.value }
                                : item
                            ),
                          })
                        }
                        className="w-40 rounded border border-stone-300 px-2 py-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      <button
        type="submit"
        data-testid="admin-product-save"
        className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white"
      >
        Ürünü kaydet
      </button>
      {message ? (
        <p data-testid="admin-product-message" className="text-sm">
          {message}
        </p>
      ) : null}
    </form>
  );
}

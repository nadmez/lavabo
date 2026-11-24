# Admin Category and Attribute Modals

## Summary

Turns the Kategoriler and Nitelikler admin pages into list-only pages where creating and editing happen in a centered modal dialog over the still-visible list, and deleting happens through an accessible alert dialog instead of a native confirm.

## Scope

Covers `src/pages/admin/AdminCategoriesPage.js` and `src/pages/admin/AdminAttributesPage.js`, exercised through the existing Vitest + Testing Library setup in `src/pages/admin/admin-panel.test.js` using `createSampleCatalog()` from `src/data/sample-catalog.js` and mocked `fetch` calls. Split from the Phase 11 admin redesign: the dashboard is in `specs/phase-11/admin-dashboard.md` and the product drawer is in `specs/phase-11/admin-product-drawer.md`.

## Acceptance criteria

- The system must render the categories page container with `data-testid="admin-categories"` and an `h1` with the text `Kategoriler`.
- The system must render the attributes page container with `data-testid="admin-attributes"` and an `h1` with the text `Nitelikler`.
- The system must initially render the category list with no element at `data-testid="admin-category-form"` in the document.
- The system must initially render the attribute list with no element at `data-testid="admin-attribute-form"` in the document.
- The system must initially render no element with `role="dialog"` on either the categories page or the attributes page.
- The system must render a button with the visible text `Yeni Kategori` on the categories page.
- The system must render a button with the visible text `Yeni Nitelik` on the attributes page.
- When `Yeni Kategori` is clicked, the system must open an element with `role="dialog"` containing the form at `data-testid="admin-category-form"`.
- When `Yeni Nitelik` is clicked, the system must open an element with `role="dialog"` containing the form at `data-testid="admin-attribute-form"`.
- When a create or edit dialog is open, the system must keep the underlying list mounted, so existing category or attribute names remain queryable in the document alongside the `role="dialog"` element.
- The system must render each category row with its name, its slug, and the text `{count} ürün` (for example `3 ürün`).
- The system must render each attribute with its name, its slug, and the text `{n} terim` (for example `4 terim`).
- The system must render each attribute term name as visible text.
- The system must render a swatch element with `data-testid="admin-swatch-{termSlug}"` for each attribute term that has a swatch (for example `data-testid="admin-swatch-siyah"` for the sample term `Siyah`).
- The system must render a button with `aria-label="Düzenle"` for each category row.
- The system must render a button with `aria-label="Düzenle"` for each attribute.
- The system must render a button with `aria-label="Sil"` for each category row.
- The system must render a button with `aria-label="Sil"` for each attribute.
- The system must not render any button or link with the accessible name `Çoğalt` on the categories page.
- The system must not render any button or link with the accessible name `Çoğalt` on the attributes page.
- When a category `Düzenle` button is clicked, the system must open a `role="dialog"` containing `data-testid="admin-category-form"` prefilled with that category's name in `data-testid="admin-category-name"`, its slug in `data-testid="admin-category-slug"`, its parent in `data-testid="admin-category-parent"`, and its description in the `Açıklama` field.
- When an attribute `Düzenle` button is clicked, the system must open a `role="dialog"` containing `data-testid="admin-attribute-form"` prefilled with that attribute's name in `data-testid="admin-attribute-name"`, its slug in the `Kısa ad` field, and one `Terim adı` input per existing term prefilled with the term names.
- When the category name is typed into `data-testid="admin-category-name"` before the slug has been manually edited, the system must update `data-testid="admin-category-slug"` to the kebab-case slug of the typed name.
- When the category slug has been manually edited through `data-testid="admin-category-slug"`, the system must not overwrite that slug when the name in `data-testid="admin-category-name"` changes afterwards.
- When the attribute name is typed into `data-testid="admin-attribute-name"` before the slug has been manually edited, the system must update the `Kısa ad` field to the kebab-case slug of the typed name.
- When the attribute slug in the `Kısa ad` field has been manually edited, the system must not overwrite that slug when the name in `data-testid="admin-attribute-name"` changes afterwards.
- When a category is being edited, the system must exclude that category itself from the options of `data-testid="admin-category-parent"`.
- When a category is being edited, the system must exclude all descendants of that category from the options of `data-testid="admin-category-parent"`.
- When a new category is being created, the system must include all existing categories as options of `data-testid="admin-category-parent"` in addition to the `Yok` option.
- When a new category is saved from the dialog, the system must call `fetch` with `/api/admin/categories` and method `POST` with a JSON body of `{ name, slug, parentId, descriptionHtml }`, where an empty parent selection is sent as `parentId: null` and a chosen parent is sent as a number.
- When an edited category is saved from the dialog, the system must call `fetch` with `/api/admin/categories/{id}` and method `PUT` with the same `{ name, slug, parentId, descriptionHtml }` payload shape.
- When the category slug field is left empty on save, the system must send the kebab-case slug derived from the category name.
- When `Terim ekle` (`data-testid="admin-add-term"`) is clicked in the attribute dialog, the system must add one more input with `aria-label="Terim adı"`.
- When a term row's `Terimi sil` control is clicked, the system must remove that term row's `Terim adı` input from the dialog.
- When a term's `Renk örneği` checkbox is checked, the system must show a colour input with `aria-label="Renk seçici"` and a text input with `aria-label="Renk kodu"` for that term.
- When a new attribute is saved from the dialog, the system must call `fetch` with `/api/admin/attributes` and method `POST` with a JSON body of `{ name, slug, terms }`.
- When an edited attribute is saved from the dialog, the system must call `fetch` with `/api/admin/attributes/{slug}` (URL-encoded slug) and method `PUT` with the same `{ name, slug, terms }` payload shape.
- The system must send each saved term as `{ name, slug, previousSlug }`, adding `swatch` only when that term's `Renk örneği` is checked and a swatch value is present.
- The system must send `previousSlug` equal to the term's original slug for terms that already existed when the edit dialog was opened.
- The system must send `previousSlug` as an empty string for terms added during editing.
- The system must derive a new term's `slug` as the kebab-case of its typed `Terim adı` while that term has no `previousSlug`.
- The system must omit terms whose `Terim adı` is empty or whitespace-only from the saved `terms` payload.
- When a category save succeeds, the system must close the dialog so no `role="dialog"` remains in the document.
- When a category save succeeds, the system must show the text `Kategori kaydedildi.` on the page outside any dialog.
- When an attribute save succeeds, the system must close the dialog so no `role="dialog"` remains in the document.
- When an attribute save succeeds, the system must show the text `Nitelik kaydedildi.` on the page outside any dialog.
- When a category `Sil` button is clicked, the system must open a confirmation with `role="alertdialog"` whose text names that category.
- When an attribute `Sil` button is clicked, the system must open a confirmation with `role="alertdialog"` whose text names that attribute.
- The system must show a confirm control with the visible text `Sil` inside the `role="alertdialog"` confirmation.
- The system must show a cancel control with the visible text `Vazgeç` inside the `role="alertdialog"` confirmation.
- When `Vazgeç` is clicked in a delete confirmation, the system must close the `role="alertdialog"` and must not call `fetch` with method `DELETE`.
- When `Sil` is confirmed for a category, the system must call `fetch` with `/api/admin/categories/{id}` and method `DELETE`.
- When `Sil` is confirmed for an attribute, the system must call `fetch` with `/api/admin/attributes/{slug}` (URL-encoded slug) and method `DELETE`.
- The system must never call `window.confirm` for category or attribute deletion.

## Edge cases and error handling

- When the categories or attributes catalog query is pending, the system must show the text `Yükleniyor...`.
- When the categories or attributes catalog query fails, the system must render an element with `role="alert"` containing the error message text.
- When the sample catalog is replaced with an empty catalog, the categories page must show the text `Henüz kategori yok.` and must keep the `Yeni Kategori` button rendered.
- When a dialog is open and its close control with `aria-label="Kapat"` is clicked, the system must close the dialog so no `role="dialog"` remains and must not call `fetch` with method `POST` or `PUT`.
- When a dialog is open and the Escape key is pressed, the system must close the dialog so no `role="dialog"` remains and must not call `fetch` with method `POST` or `PUT`.
- When a category save fails, the system must keep the `role="dialog"` open and must show the error message text inside the dialog.
- When an attribute save fails, the system must keep the `role="dialog"` open and must show the error message text inside the dialog.
- When a delete confirmation is open but neither `Sil` nor `Vazgeç` has been clicked, the system must not call `fetch` with method `DELETE`.

## Out of scope

- A duplicate (`Çoğalt`) action for categories or attributes — duplication exists only for products.
- The product list, product drawer, and product variant editing.
- The dashboard rename, metrics, and utilities.
- The `Ayarlar` page form, the login page, and all storefront pages.
- Any change to the category or attribute API endpoints, payload shapes, or slug derivation rules.

## Context / notes

- Relevant existing files: `src/pages/admin/AdminCategoriesPage.js`, `src/pages/admin/AdminAttributesPage.js`, `src/pages/admin/admin-panel.test.js`, `src/data/sample-catalog.js`, `src/admin/api.js` (`adminFetch`), `src/admin/use-admin-catalog.js`, `src/data/catalog-validation.js` (`collectDescendantIds`), and `src/utils/slugify.js` (`toKebabSlug`).
- Existing testids that move into the dialogs unchanged: `admin-category-form`, `admin-category-name`, `admin-category-slug`, `admin-category-parent`, `admin-attribute-form`, `admin-attribute-name`, `admin-add-term`, and `admin-swatch-{termSlug}`; the attribute `Kısa ad` input, term inputs (`Terim adı`), `Renk örneği`, `Renk seçici`, `Renk kodu`, and `Terimi sil` keep their current labels.
- The save button in both forms keeps the visible text `Kaydet`.
- Icon and overlay stack for the redesign: `lucide-react` icons, `@radix-ui/react-dialog` for the centered modals, `@radix-ui/react-alert-dialog` for delete confirmations, Tailwind CSS, and in-repo chip components for term pills (swatch testids preserved). Tests assert on visible text, roles, `aria-label` values, `data-testid` values, and mocked `fetch` calls — not on icon or overlay internals.
- Sample fixture reference points: category `Örnek Koleksiyon` (id `1`, slug `ornek-koleksiyon`, `3 ürün`, children `Klasik Seri`, `Minimalist Seri`, `Premium Seri`); attribute `Renk` (slug `renk`, `4 terim`, swatched terms including `admin-swatch-siyah`); attribute `Boyut` terms have no swatches.
- All criteria are observable with Vitest + Testing Library (`src/**/*.test.js`): rendered text, roles, `aria-label` values, `data-testid` values, form field values, select options, and mocked `fetch` calls.

import { Link } from "react-router";
import { FLAT_MAIN_CATEGORIES } from "@/data/navigation";
import { getNavigationTree } from "@/data/catalog-query";

function preferredCategorySlugs(catalog) {
  if (catalog?.siteSettings) {
    const slugs = new Set();
    for (const category of getNavigationTree(catalog)) {
      if (category?.slug) slugs.add(category.slug);
      for (const child of category.children || []) {
        if (child?.slug) slugs.add(child.slug);
      }
    }
    return slugs;
  }
  return new Set(FLAT_MAIN_CATEGORIES.map((cat) => cat.slug));
}

function buildAncestorChain(category, categoriesById) {
  const chain = [];
  if (!category || !(categoriesById instanceof Map)) {
    return chain;
  }

  const visitedIds = new Set([category.id]);
  let currentParentId = category.parentId;

  while (currentParentId != null && !visitedIds.has(currentParentId)) {
    visitedIds.add(currentParentId);
    const parentCategory = categoriesById.get(currentParentId);
    if (!parentCategory) {
      break;
    }
    chain.unshift(parentCategory);
    currentParentId = parentCategory.parentId;
  }

  return chain;
}

function selectPrimaryProductCategory(product, categoriesById, preferredSlugs) {
  if (!product || !(categoriesById instanceof Map)) {
    return null;
  }

  const categoryIds = Array.isArray(product.categoryIds)
    ? product.categoryIds
    : [];

  for (const id of categoryIds) {
    const cat = categoriesById.get(id);
    if (cat && preferredSlugs.has(cat.slug)) {
      return cat;
    }
  }

  for (const id of categoryIds) {
    const cat = categoriesById.get(id);
    if (cat) {
      return cat;
    }
  }

  return null;
}

export default function Breadcrumbs({
  catalog,
  categorySlug,
  fallbackLabel,
  product,
}) {
  const normalizedSlug =
    typeof categorySlug === "string" ? categorySlug.trim() : "";
  const categoriesBySlug = catalog?.categoriesBySlug;
  const categoriesById = catalog?.categoriesById;

  let ancestors = [];
  let currentLabel = "";

  if (product) {
    const primaryCategory = selectPrimaryProductCategory(
      product,
      categoriesById,
      preferredCategorySlugs(catalog)
    );
    if (primaryCategory) {
      ancestors = [
        ...buildAncestorChain(primaryCategory, categoriesById),
        primaryCategory,
      ];
    }
    currentLabel = product.name || fallbackLabel || "";
  } else {
    const activeCategory =
      normalizedSlug && categoriesBySlug instanceof Map
        ? categoriesBySlug.get(normalizedSlug)
        : null;

    if (activeCategory) {
      ancestors = buildAncestorChain(activeCategory, categoriesById);
    }

    currentLabel = activeCategory
      ? activeCategory.name
      : normalizedSlug
        ? fallbackLabel || normalizedSlug
        : fallbackLabel || "Ürünlerimiz";
  }

  return (
    <nav
      aria-label="Sayfa yolu"
      data-testid="catalog-breadcrumbs"
      className="mb-4 text-sm text-stone-600"
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        <li className="inline-flex items-center gap-1.5">
          <Link to="/" className="hover:text-stone-900 hover:underline">
            Anasayfa
          </Link>
        </li>
        {ancestors.map((ancestor) => (
          <li key={ancestor.id} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="text-stone-400">
              /
            </span>
            <Link
              to={`/kategori/${ancestor.slug}`}
              className="hover:text-stone-900 hover:underline"
            >
              {ancestor.name}
            </Link>
          </li>
        ))}
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="text-stone-400">
            /
          </span>
          <span aria-current="page" className="font-medium text-stone-900">
            {currentLabel}
          </span>
        </li>
      </ol>
    </nav>
  );
}

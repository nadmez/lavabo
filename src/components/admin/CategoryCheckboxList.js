import { useMemo, useState } from "react";
import { normalizeTurkishSearch } from "@/data/catalog-query";

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

export default function CategoryCheckboxList({
  categories,
  selectedIds,
  onChange,
  legend,
  hint,
}) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => categoryRows(categories || []), [categories]);
  const folded = normalizeTurkishSearch(query.trim());
  const visible = folded
    ? rows.filter(({ category }) =>
        normalizeTurkishSearch(category.name).includes(folded)
      )
    : rows;

  function toggle(id, checked) {
    onChange(
      checked
        ? selectedIds.includes(id)
          ? selectedIds
          : [...selectedIds, id]
        : selectedIds.filter((item) => item !== id)
    );
  }

  return (
    <fieldset className="space-y-2">
      {legend ? (
        <legend className="text-sm font-medium">{legend}</legend>
      ) : null}
      <input
        type="search"
        aria-label="Kategori ara"
        placeholder="Kategori ara"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
      />
      {hint ? <p className="text-xs text-stone-500">{hint}</p> : null}
      {visible.map(({ category, depth }) => (
        <label
          key={category.id}
          className="flex items-center gap-2 text-sm"
          style={depth ? { marginLeft: depth * 16 } : undefined}
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(category.id)}
            onChange={(event) => toggle(category.id, event.target.checked)}
          />
          {category.name}
        </label>
      ))}
    </fieldset>
  );
}

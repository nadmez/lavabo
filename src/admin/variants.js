export function variantSignature(terms, attributeSlugs) {
  return attributeSlugs
    .map((slug) => `${slug}:${terms?.[slug] || ""}`)
    .join("|");
}

export function generateVariantRows(
  attributeSelections,
  existingVariants = []
) {
  const active = (attributeSelections || []).filter(
    (selection) =>
      selection?.slug &&
      Array.isArray(selection.termSlugs) &&
      selection.termSlugs.length > 0
  );
  if (active.length === 0) return [];
  const attributeSlugs = active.map((selection) => selection.slug);
  const combinations = active.reduce(
    (rows, selection) =>
      rows.flatMap((row) =>
        selection.termSlugs.map((termSlug) => ({
          ...row,
          [selection.slug]: termSlug,
        }))
      ),
    [{}]
  );

  return combinations.map((terms) => {
    const signature = variantSignature(terms, attributeSlugs);
    const existing = existingVariants.find(
      (variant) =>
        variantSignature(variant?.terms, attributeSlugs) === signature
    );
    if (existing) {
      return {
        ...existing,
        terms: { ...terms },
        inStock: existing.inStock === true,
      };
    }
    return {
      id: 0,
      sku: "",
      price: "",
      regularPrice: "",
      inStock: true,
      terms,
      image: "",
    };
  });
}
